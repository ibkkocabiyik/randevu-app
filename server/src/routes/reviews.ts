import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/reviews — herkese açık, opsiyonel ?serviceId= veya ?employeeId=
router.get('/', async (req, res) => {
  let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
  if (req.query.serviceId)  query = query.eq('service_id', req.query.serviceId as string);
  if (req.query.employeeId) query = query.eq('employee_id', req.query.employeeId as string);

  const { data, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// POST /api/reviews — giriş yapmış kullanıcı
router.post('/', requireAuth, async (req, res) => {
  const { appointmentId, serviceId, employeeId, customerName, rating, comment } = req.body;

  // Daha önce değerlendirme yapılmış mı?
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('appointment_id', appointmentId)
    .single();
  if (existing) {
    res.status(409).json({ error: 'Bu randevu için zaten değerlendirme yapıldı' });
    return;
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      appointment_id: appointmentId,
      service_id:     serviceId,
      employee_id:    employeeId,
      customer_name:  customerName,
      rating,
      comment: comment ?? '',
    })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

export default router;
