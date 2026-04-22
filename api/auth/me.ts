import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { requireAuth, cors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('users').select('*').eq('id', user.userId).single();
    if (error || !data) return res.status(404).json({ error: 'Kullanici bulunamadi' });
    return res.json(data);
  }

  if (req.method === 'PATCH') {
    const { name, email, phone, notif_booking_confirmed, notif_booking_cancelled,
      notif_booking_reminder, notif_review_request } = req.body;
    const patch: Record<string, unknown> = {};
    if (name !== undefined) patch.name = name;
    if (email !== undefined) patch.email = email;
    if (phone !== undefined) patch.phone = phone;
    if (notif_booking_confirmed !== undefined) patch.notif_booking_confirmed = notif_booking_confirmed;
    if (notif_booking_cancelled !== undefined) patch.notif_booking_cancelled = notif_booking_cancelled;
    if (notif_booking_reminder !== undefined) patch.notif_booking_reminder = notif_booking_reminder;
    if (notif_review_request !== undefined) patch.notif_review_request = notif_review_request;

    const { data, error } = await supabase
      .from('users').update(patch).eq('id', user.userId).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  return res.status(405).end();
}
