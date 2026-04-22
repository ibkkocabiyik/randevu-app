import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/services — herkese açık
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at');
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// POST /api/services — admin
router.post('/', requireAdmin, async (req, res) => {
  const { name, duration_minutes, price, category } = req.body;
  const { data, error } = await supabase
    .from('services')
    .insert({ name, duration_minutes, price, category })
    .select()
    .single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

// PATCH /api/services/:id — admin
router.patch('/:id', requireAdmin, async (req, res) => {
  const { name, duration_minutes, price, category } = req.body;
  const { data, error } = await supabase
    .from('services')
    .update({ name, duration_minutes, price, category })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// DELETE /api/services/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('services').delete().eq('id', req.params.id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).end();
});

export default router;
