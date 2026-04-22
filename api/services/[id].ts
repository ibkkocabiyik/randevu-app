import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase.js';
import { requireAdmin, cors } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query as { id: string };

  if (req.method === 'PATCH') {
    if (!requireAdmin(req, res)) return;
    const { name, duration_minutes, price, category } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
    if (price !== undefined) updates.price = price;
    if (category !== undefined) updates.category = category;
    const { data, error } = await supabase
      .from('services').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).end();
}
