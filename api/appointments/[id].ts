import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase.js';
import { requireAuth, cors } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  const { id } = req.query as { id: string };

  if (req.method === 'PATCH') {
    if (user.role !== 'admin') {
      const { data: appt } = await supabase
        .from('appointments').select('customer_id').eq('id', id).single();
      if (!appt || appt.customer_id !== user.userId)
        return res.status(403).json({ error: 'Bu randevuyu düzenleme yetkiniz yok' });
    }

    const { status, notes, date, start_time, end_time, employee_id } = req.body;
    const patch: Record<string, unknown> = {};
    if (status !== undefined)     patch.status      = status;
    if (notes !== undefined)      patch.notes       = notes;
    if (date !== undefined)       patch.date        = date;
    if (start_time !== undefined) patch.start_time  = start_time;
    if (end_time !== undefined)   patch.end_time    = end_time;
    if (employee_id !== undefined) patch.employee_id = employee_id;

    const { data, error } = await supabase
      .from('appointments').update(patch).eq('id', id).select().single();
    if (error) {
      const s = error.code === '23P01' ? 409 : 500;
      return res.status(s).json({ error: error.code === '23P01' ? 'Bu saat dilimi dolu' : error.message });
    }

    if (status === 'completed' && data.customer_id) {
      const { data: svc } = await supabase
        .from('services').select('price').eq('id', data.service_id).single();
      if (svc) {
        const points = Math.round(svc.price / 10);
        await supabase.rpc('add_loyalty_points', { uid: data.customer_id, pts: points });
      }
    }

    return res.json(data);
  }

  if (req.method === 'DELETE') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin yetkisi gerekli' });
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).end();
}
