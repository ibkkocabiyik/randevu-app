import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase.js';
import { verifyToken, cors } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const user = verifyToken(req);
    if (user?.role === 'user') {
      const { data, error } = await supabase
        .from('appointments').select('*')
        .eq('customer_id', user.userId)
        .order('date', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    const { data, error } = await supabase
      .from('appointments').select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { customerName, customerPhone, serviceId, employeeId,
      date, startTime, endTime, notes, customerId } = req.body;
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        customer_id: customerId ?? null,
        customer_name: customerName,
        customer_phone: customerPhone,
        service_id: serviceId,
        employee_id: employeeId,
        date, start_time: startTime, end_time: endTime,
        status: 'pending',
        notes: notes ?? null,
      }).select().single();
    if (error) {
      const status = error.code === '23P01' ? 409 : 500;
      const msg = error.code === '23P01'
        ? 'Bu saat dilimi dolu, lütfen başka bir saat seçin'
        : error.message;
      return res.status(status).json({ error: msg });
    }
    return res.status(201).json(data);
  }

  return res.status(405).end();
}
