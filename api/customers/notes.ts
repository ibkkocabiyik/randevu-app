import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase.js';
import { requireAdmin, cors } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    const phone = req.query.phone as string | undefined;
    let query = supabase.from('customer_notes').select('*').order('created_at', { ascending: false });
    if (phone) query = query.eq('customer_phone', phone);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { customerPhone, text } = req.body;
    const { data, error } = await supabase
      .from('customer_notes').insert({ customer_phone: customerPhone, text }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).end();
}
