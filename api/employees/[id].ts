import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase.js';
import { requireAdmin, cors } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!requireAdmin(req, res)) return;

  const { id } = req.query as { id: string };

  if (req.method === 'PATCH') {
    const { name, workingHours, serviceIds } = req.body as {
      name?: string; workingHours?: { start: string; end: string }; serviceIds?: string[];
    };
    const patch: Record<string, unknown> = {};
    if (name) patch.name = name;
    if (workingHours) {
      patch.working_hours_start = workingHours.start;
      patch.working_hours_end = workingHours.end;
    }
    if (Object.keys(patch).length) {
      const { error } = await supabase.from('employees').update(patch).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
    }
    if (serviceIds !== undefined) {
      await supabase.from('employee_services').delete().eq('employee_id', id);
      if (serviceIds.length) {
        await supabase.from('employee_services').insert(
          serviceIds.map(sid => ({ employee_id: id, service_id: sid }))
        );
      }
    }
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).end();
}
