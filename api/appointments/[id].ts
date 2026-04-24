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

    const { status, notes, date, start_time, end_time } = req.body;
    const updates: Record<string, unknown> = {};

    if (caller.role === 'admin') {
      // Admin: her alanı güncelleyebilir
      if (status    !== undefined) updates.status     = status;
      if (notes     !== undefined) updates.notes      = notes;
      if (date      !== undefined) updates.date       = date;
      if (start_time !== undefined) updates.start_time = start_time;
      if (end_time  !== undefined) updates.end_time   = end_time;
    } else {
      // Müşteri: sadece kendi randevusunu iptal edebilir veya yeniden planlayabilir
      const { data: appt } = await supabase
        .from('appointments').select('customer_id, status').eq('id', id).single();
      if (!appt) return res.status(404).json({ error: 'Randevu bulunamadı' });
      if (appt.customer_id !== caller.userId)
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
