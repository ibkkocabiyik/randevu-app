import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { supabase } from '../_lib/supabase';
import { signToken, verifyToken, requireAuth, cors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action as string;

  // POST /api/auth?action=register
  if (action === 'register' && req.method === 'POST') {
    const { name, email, phone, password } = req.body as {
      name: string; email: string; phone: string; password: string;
    };
    if (!name || !email || !phone || !password)
      return res.status(400).json({ error: 'Tum alanlar zorunlu' });

    const { data: existing } = await supabase
      .from('users').select('id').or(`email.eq.${email},phone.eq.${phone}`).single();
    if (existing)
      return res.status(409).json({ error: 'Bu e-posta veya telefon zaten kayitli' });

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase
      .from('users').insert({ name, email, phone, password_hash: passwordHash }).select().single();
    if (error || !user) return res.status(500).json({ error: error?.message });

    const token = signToken({ userId: user.id, role: 'user' });
    return res.status(201).json({ token, user });
  }

  // POST /api/auth?action=login
  if (action === 'login' && req.method === 'POST') {
    const { emailOrPhone, password } = req.body as { emailOrPhone: string; password: string };
    if (!emailOrPhone || !password)
      return res.status(400).json({ error: 'E-posta/telefon ve sifre zorunlu' });

    const { data: user } = await supabase
      .from('users').select('*')
      .or(`email.eq.${emailOrPhone},phone.eq.${emailOrPhone}`)
      .single();
    if (!user) return res.status(401).json({ error: 'Kullanici bulunamadi' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Sifre hatali' });

    const token = signToken({ userId: user.id, role: 'user' });
    return res.json({ token, user });
  }

  // POST /api/auth?action=admin-login
  if (action === 'admin-login' && req.method === 'POST') {
    const { password } = req.body as { password: string };
    const adminPass = process.env.ADMIN_PASSWORD ?? 'admin123';
    if (password !== adminPass)
      return res.status(401).json({ error: 'Sifre hatali' });

    const token = signToken({ userId: 'admin', role: 'admin' });
    return res.json({ token });
  }

  // GET /api/auth?action=me  or  PATCH /api/auth?action=me
  if (action === 'me') {
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

  return res.status(404).json({ error: 'Unknown action' });
}
