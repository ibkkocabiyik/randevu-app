import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/appointments
// Token varsa: admin → tümü, user → kendi randevuları
// Token yoksa → tümü (public, admin paneli için)
router.get('/', async (req, res) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const jwt = await import('jsonwebtoken');
      const payload = jwt.default.verify(header.slice(7), process.env.JWT_SECRET!) as { userId: string; role: string };
      if (payload.role === 'user') {
        const { data, error } = await supabase
          .from('appointments').select('*')
          .eq('customer_id', payload.userId)
          .order('date', { ascending: false });
        if (error) { res.status(500).json({ error: error.message }); return; }
        res.json(data); return;
      }
    } catch {}
  }
  // admin veya token yok → tümünü döndür
  const { data, error } = await supabase
    .from('appointments').select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// GET /api/appointments/slots?employeeId=&date=&duration=
// Müsait slotları döner — herkese açık
router.get('/slots', async (req, res) => {
  const { employeeId, date, duration } = req.query as {
    employeeId: string; date: string; duration: string;
  };
  if (!employeeId || !date || !duration) {
    res.status(400).json({ error: 'employeeId, date ve duration zorunlu' });
    return;
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('working_hours_start, working_hours_end')
    .eq('id', employeeId)
    .single();
  if (!employee) { res.status(404).json({ error: 'Çalışan bulunamadı' }); return; }

  const { data: busyAppts } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .not('status', 'in', '("cancelled","noshow")');

  const durationMin = parseInt(duration);
  const timeToMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const minToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;

  const start = timeToMin(employee.working_hours_start);
  const end   = timeToMin(employee.working_hours_end);
  const busy  = (busyAppts ?? []).map(a => ({ s: timeToMin(a.start_time), e: timeToMin(a.end_time) }));

  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const slots = [];
  for (let t = start; t + durationMin <= end; t += 15) {
    const slotEnd  = t + durationMin;
    const overlaps = busy.some(b => t < b.e && slotEnd > b.s);
    const isPast   = date === todayIso && t <= nowMin;
    slots.push({ time: minToTime(t), available: !overlaps && !isPast });
  }

  res.json(slots);
});

// POST /api/appointments — token opsiyonel
router.post('/', async (req, res) => {
  const {
    customerName, customerPhone, serviceId, employeeId,
    date, startTime, endTime, notes, customerId,
  } = req.body;

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      customer_id:    customerId ?? null,
      customer_name:  customerName,
      customer_phone: customerPhone,
      service_id:     serviceId,
      employee_id:    employeeId,
      date,
      start_time:     startTime,
      end_time:       endTime,
      status:         'pending',
      notes:          notes ?? null,
    })
    .select()
    .single();

  if (error) {
    // Çakışma kısıtı ihlali
    if (error.code === '23P01') {
      res.status(409).json({ error: 'Bu saat dilimi dolu, lütfen başka bir saat seçin' });
    } else {
      res.status(500).json({ error: error.message });
    }
    return;
  }

  res.status(201).json(data);
});

// PATCH /api/appointments/:id — admin veya randevunun sahibi
router.patch('/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  const { status, notes, date, startTime, endTime, employeeId } = req.body;

  // Yetki kontrolü: admin değilse sadece kendi randevusu
  if (req.user!.role !== 'admin') {
    const { data: appt } = await supabase
      .from('appointments')
      .select('customer_id')
      .eq('id', id)
      .single();
    if (!appt || appt.customer_id !== req.user!.userId) {
      res.status(403).json({ error: 'Bu randevuyu düzenleme yetkiniz yok' });
      return;
    }
  }

  const patch: Record<string, unknown> = {};
  if (status)    patch.status     = status;
  if (notes)     patch.notes      = notes;
  if (date)      patch.date       = date;
  if (startTime) patch.start_time = startTime;
  if (endTime)   patch.end_time   = endTime;
  if (employeeId) patch.employee_id = employeeId;

  const { data, error } = await supabase
    .from('appointments')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23P01') {
      res.status(409).json({ error: 'Bu saat dilimi dolu' });
    } else {
      res.status(500).json({ error: error.message });
    }
    return;
  }

  // Tamamlandı → sadakat puanı ekle
  if (status === 'completed' && data.customer_id) {
    const { data: svc } = await supabase
      .from('services')
      .select('price')
      .eq('id', data.service_id)
      .single();
    if (svc) {
      const points = Math.round(svc.price / 10);
      await supabase.rpc('add_loyalty_points', { uid: data.customer_id, pts: points });
    }
  }

  res.json(data);
});

// DELETE /api/appointments/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('appointments').delete().eq('id', req.params.id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).end();
});

export default router;
