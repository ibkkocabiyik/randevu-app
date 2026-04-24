import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase.js';
import { verifyToken, cors } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const user = verifyToken(req);
    if (user?.role === 'user') {
      // customer_id ile filtrele, eşleşen yoksa phone ile fallback yap
      const { data: byId, error: e1 } = await supabase
        .from('appointments').select('*')
        .eq('customer_id', user.userId)
        .order('date', { ascending: false });
      if (e1) return res.status(500).json({ error: e1.message });

      if (byId && byId.length > 0) return res.json(byId);

      // customer_id eşleşmedi — kullanıcının phone numarasıyla fallback
      const { data: userRow } = await supabase
        .from('users').select('phone').eq('id', user.userId).single();
      if (!userRow) return res.json([]);

      const { data: byPhone, error: e2 } = await supabase
        .from('appointments').select('*')
        .eq('customer_phone', (userRow as { phone: string }).phone)
        .order('date', { ascending: false });
      if (e2) return res.status(500).json({ error: e2.message });
      return res.json(byPhone ?? []);
    }

    // Admin veya anonim: tüm randevular (admin token yoksa boş dön — güvenlik)
    if (!user) return res.json([]);
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
