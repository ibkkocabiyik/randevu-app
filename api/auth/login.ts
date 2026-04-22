import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { supabase } from '../_lib/supabase.js';
import { signToken, cors } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { emailOrPhone, password } = req.body as { emailOrPhone: string; password: string };
  if (!emailOrPhone || !password)
    return res.status(400).json({ error: 'E-posta/telefon ve şifre zorunlu' });

  const { data: user } = await supabase
    .from('users').select('*')
    .or(`email.eq.${emailOrPhone},phone.eq.${emailOrPhone}`)
    .single();

  if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Şifre hatalı' });

  const token = signToken({ userId: user.id, role: 'user' });
  return res.json({ token, user });
}
