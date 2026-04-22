import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/customers — admin; müşteri listesi + özet
router.get('/', requireAdmin, async (_req, res) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, phone, loyalty_points, created_at');
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(users);
});

// GET /api/customers/notes?phone=
router.get('/notes', requireAdmin, async (req, res) => {
  const phone = req.query.phone as string;
  const query = supabase.from('customer_notes').select('*').order('created_at', { ascending: false });
  const { data, error } = phone ? await query.eq('customer_phone', phone) : await query;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// POST /api/customers/notes
router.post('/notes', requireAdmin, async (req, res) => {
  const { customerPhone, text } = req.body;
  const { data, error } = await supabase
    .from('customer_notes')
    .insert({ customer_phone: customerPhone, text })
    .select()
    .single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

// DELETE /api/customers/notes/:id
router.delete('/notes/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('customer_notes').delete().eq('id', req.params.id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).end();
});

export default router;
