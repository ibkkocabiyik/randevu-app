import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase.js';
import { requireAdmin, cors } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('services').select('*').order('created_at');
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const { name, duration_minutes, price, category } = req.body;
    const { data, error } = await supabase
      .from('services').insert({ name, duration_minutes, price, category }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).end();
}
