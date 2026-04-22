import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter        from './routes/auth.js';
import servicesRouter    from './routes/services.js';
import employeesRouter   from './routes/employees.js';
import appointmentsRouter from './routes/appointments.js';
import reviewsRouter     from './routes/reviews.js';
import customersRouter   from './routes/customers.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? '*', credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth',         authRouter);
app.use('/api/services',     servicesRouter);
app.use('/api/employees',    employeesRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/reviews',      reviewsRouter);
app.use('/api/customers',    customersRouter);

const PORT = parseInt(process.env.PORT ?? '4000');
app.listen(PORT, () => {
  console.log(`🚀 Randevu API → http://localhost:${PORT}`);
});
