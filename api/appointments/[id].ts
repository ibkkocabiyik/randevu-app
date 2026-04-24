import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase.js';
import { verifyToken, requireAdmin, cors } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query as { id: string };

  if (req.method === 'PATCH') {
    const caller = verifyToken(req);
    if (!caller) return res.status(401).json({ error: 'Token gerekli' });

    const { status, notes, date, start_time, end_time, employee_id } = req.body;
    const updates: Record<string, unknown> = {};

    if (caller.role === 'admin') {
      // Admin: her alanı güncelleyebilir
      if (status      !== undefined) updates.status      = status;
      if (notes       !== undefined) updates.notes       = notes;
      if (date        !== undefined) updates.date        = date;
      if (start_time  !== undefined) updates.start_time  = start_time;
      if (end_time    !== undefined) updates.end_time    = end_time;
      if (employee_id !== undefined) updates.employee_id = employee_id;
    } else {
      // Müşteri: sadece kendi randevusunu iptal edebilir veya yeniden planlayabilir
      const { data: appt } = await supabase
        .from('appointments').select('customer_id, customer_phone, status').eq('id', id).single();
      if (!appt) return res.status(404).json({ error: 'Randevu bulunamadı' });

      // customer_id eşleşiyorsa izin ver; eşleşmiyorsa phone ile kontrol et
      const ownedById = appt.customer_id === caller.userId;
      let ownedByPhone = false;
      if (!ownedById) {
        const { data: caller_user } = await supabase
          .from('users').select('phone').eq('id', caller.userId).single();
        ownedByPhone = !!(caller_user && appt.customer_phone === (caller_user as { phone: string }).phone);
      }
      if (!ownedById && !ownedByPhone)
        return res.status(403).json({ error: 'Bu randevuya erişim yetkiniz yok' });

      if (appt.status === 'cancelled' || appt.status === 'completed')
        return res.status(400).json({ error: 'Bu randevu güncellenemez' });

      if (status === 'cancelled') updates.status = 'cancelled';
      if (date       !== undefined) updates.date       = date;
      if (start_time !== undefined) updates.start_time = start_time;
      if (end_time   !== undefined) updates.end_time   = end_time;
    }

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ error: 'Güncellenecek alan yok' });

    const { data, error } = await supabase
      .from('appointments').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });

    // Tamamlandı → sadakat puanı ekle
    if (updates.status === 'completed' && data.customer_id) {
      const { data: svc } = await supabase
        .from('services').select('price').eq('id', data.service_id).single();
      if (svc) {
        const points = Math.round((svc as { price: number }).price / 10);
        await supabase.rpc('add_loyalty_points', { uid: data.customer_id, pts: points });
      }
    }

    return res.json(data);
  }

  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).end();
}
