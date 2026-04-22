import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { supabase } from '../_lib/supabase';
import { signToken, cors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, password } = req.body as {
    name: string; email: string; phone: string; password: string;
  };
  if (!name || !email || !phone || !password)
    return res.status(400).json({ error: 'Tum alanlar zorunlu' });

  const { data: existing } = await supabase
    .from('users').select('id').or(`email.eq.${email},phone.eq.${phone}`).single();
  if (existing)
    return res.status(409).json({ error: 'Bu e-posta veya telefon zaten kayitli' });

  const password_hash = await bcrypt.hash(password, 10);
  const { data: user, error } = await supabase
    .from('users').insert({ name, email, phone, password_hash }).select().single();
  if (error) return res.status(500).json({ error: error.message });

  const token = signToken({ userId: user.id, role: 'user' });
  return res.status(201).json({ token, user });
}
