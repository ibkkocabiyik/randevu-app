import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { requireAdmin, cors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query as { id: string };

  if (req.method === 'PATCH') {
    if (!requireAdmin(req, res)) return;
    const { name, workingHours, serviceIds } = req.body as {
      name?: string;
      workingHours?: { start: string; end: string };
      serviceIds?: string[];
    };
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (workingHours) {
      updates.working_hours_start = workingHours.start;
      updates.working_hours_end = workingHours.end;
    }
    const { data: emp, error } = await supabase
      .from('employees').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });

    if (serviceIds !== undefined) {
      await supabase.from('employee_services').delete().eq('employee_id', id);
      if (serviceIds.length) {
        await supabase.from('employee_services').insert(
          serviceIds.map(sid => ({ employee_id: id, service_id: sid }))
        );
      }
    }
    return res.json({ ...emp, serviceIds: serviceIds ?? [], workingHours });
  }

  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).end();
}
