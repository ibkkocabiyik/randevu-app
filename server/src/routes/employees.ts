import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/employees — herkese açık
router.get('/', async (_req, res) => {
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*, employee_services(service_id)')
    .order('created_at');
  if (error) { res.status(500).json({ error: error.message }); return; }

  // employee_services'i flat serviceIds dizisine çevir
  const result = employees.map(e => ({
    ...e,
    serviceIds: (e.employee_services as { service_id: string }[]).map(es => es.service_id),
    employee_services: undefined,
    workingHours: { start: e.working_hours_start, end: e.working_hours_end },
  }));
  res.json(result);
});

// POST /api/employees — admin
router.post('/', requireAdmin, async (req, res) => {
  const { name, workingHours, serviceIds } = req.body as {
    name: string;
    workingHours: { start: string; end: string };
    serviceIds: string[];
  };

  const { data: emp, error } = await supabase
    .from('employees')
    .insert({ name, working_hours_start: workingHours.start, working_hours_end: workingHours.end })
    .select()
    .single();
  if (error || !emp) { res.status(500).json({ error: error?.message }); return; }

  if (serviceIds.length) {
    await supabase.from('employee_services').insert(
      serviceIds.map(sid => ({ employee_id: emp.id, service_id: sid }))
    );
  }

  res.status(201).json({ ...emp, serviceIds, workingHours });
});

// PATCH /api/employees/:id — admin
router.patch('/:id', requireAdmin, async (req, res) => {
  const { name, workingHours, serviceIds } = req.body as {
    name?: string;
    workingHours?: { start: string; end: string };
    serviceIds?: string[];
  };
  const id = req.params.id;

  const patch: Record<string, unknown> = {};
  if (name) patch.name = name;
  if (workingHours) {
    patch.working_hours_start = workingHours.start;
    patch.working_hours_end   = workingHours.end;
  }

  if (Object.keys(patch).length) {
    const { error } = await supabase.from('employees').update(patch).eq('id', id);
    if (error) { res.status(500).json({ error: error.message }); return; }
  }

  if (serviceIds !== undefined) {
    await supabase.from('employee_services').delete().eq('employee_id', id);
    if (serviceIds.length) {
      await supabase.from('employee_services').insert(
        serviceIds.map(sid => ({ employee_id: id, service_id: sid }))
      );
    }
  }

  res.json({ ok: true });
});

// DELETE /api/employees/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('employees').delete().eq('id', req.params.id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).end();
});

export default router;
