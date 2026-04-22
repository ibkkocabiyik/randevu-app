import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../db/supabase.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body as {
    name: string; email: string; phone: string; password: string;
  };

  if (!name || !email || !phone || !password) {
    res.status(400).json({ error: 'Tüm alanlar zorunlu' });
    return;
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .or(`email.eq.${email},phone.eq.${phone}`)
    .single();

  if (existing) {
    res.status(409).json({ error: 'Bu e-posta veya telefon zaten kayıtlı' });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const { data: user, error } = await supabase
    .from('users')
    .insert({ name, email, phone, password_hash })
    .select('id, name, email, phone, loyalty_points, created_at')
    .single();

  if (error || !user) {
    res.status(500).json({ error: 'Kayıt oluşturulamadı' });
    return;
  }

  const token = signToken({ userId: user.id, role: 'user' });
  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { emailOrPhone, password } = req.body as { emailOrPhone: string; password: string };

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${emailOrPhone},phone.eq.${emailOrPhone}`)
    .single();

  if (!user) {
    res.status(401).json({ error: 'E-posta/telefon veya şifre hatalı' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'E-posta/telefon veya şifre hatalı' });
    return;
  }

  const { password_hash: _, ...safeUser } = user;
  const token = signToken({ userId: user.id, role: 'user' });
  res.json({ token, user: safeUser });
});

// POST /api/auth/admin-login
router.post('/admin-login', (req, res) => {
  const { password } = req.body as { password: string };
  const adminPass = process.env.ADMIN_PASSWORD ?? 'admin123';
  if (password !== adminPass) {
    res.status(401).json({ error: 'Şifre hatalı' });
    return;
  }
  const token = signToken({ userId: 'admin', role: 'admin' });
  res.json({ token });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  if (req.user?.role === 'admin') {
    res.json({ role: 'admin' });
    return;
  }
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, phone, loyalty_points, notif_booking_confirmed, notif_booking_cancelled, notif_booking_reminder, notif_review_request, created_at')
    .eq('id', req.user!.userId)
    .single();

  if (!user) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return; }
  res.json(user);
});

// PATCH /api/auth/me
router.patch('/me', requireAuth, async (req, res) => {
  const { name, email, phone, notif_booking_confirmed, notif_booking_cancelled, notif_booking_reminder, notif_review_request } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ name, email, phone, notif_booking_confirmed, notif_booking_cancelled, notif_booking_reminder, notif_review_request })
    .eq('id', req.user!.userId)
    .select('id, name, email, phone, loyalty_points, notif_booking_confirmed, notif_booking_cancelled, notif_booking_reminder, notif_review_request')
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
