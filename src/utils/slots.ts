import type { Appointment, Employee } from '../types';

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, '0');
  const min = (m % 60).toString().padStart(2, '0');
  return `${h}:${min}`;
}

export function getAvailableSlots(
  employee: Employee,
  date: string,
  durationMinutes: number,
  appointments: Appointment[]
): string[] {
  return getAllSlots(employee, date, durationMinutes, appointments)
    .filter(s => s.available)
    .map(s => s.time);
}

export function getAllSlots(
  employee: Employee,
  date: string,
  durationMinutes: number,
  appointments: Appointment[]
): { time: string; available: boolean }[] {
  const start = timeToMinutes(employee.workingHours.start);
  const end   = timeToMinutes(employee.workingHours.end);

  const busy = appointments
    .filter(a => a.employeeId === employee.id && a.date === date && a.status !== 'cancelled')
    .map(a => ({ s: timeToMinutes(a.startTime), e: timeToMinutes(a.endTime) }));

  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: { time: string; available: boolean }[] = [];
  for (let t = start; t + durationMinutes <= end; t += 15) {
    const slotEnd  = t + durationMinutes;
    const overlaps = busy.some(b => t < b.e && slotEnd > b.s);
    const isPast   = date === todayIso && t <= nowMinutes;
    slots.push({ time: minutesToTime(t), available: !overlaps && !isPast });
  }
  return slots;
}
