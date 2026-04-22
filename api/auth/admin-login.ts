import type { VercelRequest, VercelResponse } from '@vercel/node';
import { signToken, cors } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body as { password: string };
  const adminPass = process.env.ADMIN_PASSWORD ?? 'admin123';
  if (password !== adminPass)
    return res.status(401).json({ error: 'Şifre hatalı' });

  const token = signToken({ userId: 'admin', role: 'admin' });
  return res.json({ token });
}
