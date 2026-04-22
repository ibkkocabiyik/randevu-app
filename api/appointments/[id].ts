import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase.js';
import { requireAdmin, cors } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query as { id: string };

  if (req.method === 'PATCH') {
    if (!requireAdmin(req, res)) return;
    const { status, notes } = req.body;
    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
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
