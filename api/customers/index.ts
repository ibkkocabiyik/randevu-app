import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { requireAdmin, cors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('users').select('id, name, email, phone, loyalty_points, created_at');
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  return res.status(405).end();
}
