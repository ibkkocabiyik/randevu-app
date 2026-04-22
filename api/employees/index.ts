import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { requireAdmin, cors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*, employee_services(service_id)')
      .order('created_at');
    if (error) return res.status(500).json({ error: error.message });
    const result = employees.map(e => ({
      ...e,
      serviceIds: (e.employee_services as { service_id: string }[]).map(es => es.service_id),
      employee_services: undefined,
      workingHours: { start: e.working_hours_start, end: e.working_hours_end },
    }));
    return res.json(result);
  }

  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const { name, workingHours, serviceIds } = req.body as {
      name: string; workingHours: { start: string; end: string }; serviceIds: string[];
    };
    const { data: emp, error } = await supabase
      .from('employees')
      .insert({ name, working_hours_start: workingHours.start, working_hours_end: workingHours.end })
      .select().single();
    if (error || !emp) return res.status(500).json({ error: error?.message });
    if (serviceIds?.length) {
      await supabase.from('employee_services').insert(
        serviceIds.map(sid => ({ employee_id: emp.id, service_id: sid }))
      );
    }
    return res.status(201).json({ ...emp, serviceIds: serviceIds ?? [], workingHours });
  }

  return res.status(405).end();
}
