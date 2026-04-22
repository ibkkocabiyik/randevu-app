import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { cors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const { employeeId, date, duration } = req.query as {
    employeeId: string; date: string; duration: string;
  };
  if (!employeeId || !date || !duration)
    return res.status(400).json({ error: 'employeeId, date ve duration zorunlu' });

  const { data: employee } = await supabase
    .from('employees')
    .select('working_hours_start, working_hours_end')
    .eq('id', employeeId).single();
  if (!employee) return res.status(404).json({ error: 'Çalışan bulunamadı' });

  const { data: busyAppts } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('employee_id', employeeId).eq('date', date)
    .not('status', 'in', '("cancelled","noshow")');

  const durationMin = parseInt(duration);
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toTime = (m: number) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;

  const start = toMin(employee.working_hours_start);
  const end = toMin(employee.working_hours_end);
  const busy = (busyAppts ?? []).map(a => ({ s: toMin(a.start_time), e: toMin(a.end_time) }));

  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const slots = [];
  for (let t = start; t + durationMin <= end; t += 15) {
    const slotEnd = t + durationMin;
    const overlaps = busy.some(b => t < b.e && slotEnd > b.s);
    const isPast = date === todayIso && t <= nowMin;
    slots.push({ time: toTime(t), available: !overlaps && !isPast });
  }
  return res.json(slots);
}
