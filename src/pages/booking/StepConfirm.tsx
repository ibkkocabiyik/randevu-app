import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store';
import { useData, toAppointment } from '../../lib/data';
import { useUserAuth } from '../../store/userAuth';
import { useNavigate } from 'react-router-dom';
import { appointmentsApi } from '../../lib/api';
import {
  ArrowLeft, Scissors, User, CalendarDays, Clock,
  Phone, Mail, ChevronRight, Star,
} from 'lucide-react';

function calcEndTime(start: string, durationMinutes: number) {
  const [h, m] = start.split(':').map(Number);
  const total = h * 60 + m + durationMinutes;
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

function SummaryRow({ icon, label, sub, accent }: {
  icon: React.ReactNode; label: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 shrink-0">{icon}</div>
      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 leading-snug">{label}</span>
      {sub && <span className={`text-sm font-bold shrink-0 ${accent ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>{sub}</span>}
    </div>
  );
}

export default function StepConfirm() {
  const { booking, resetBooking, addNotification } = useStore();
  const { services, employees, upsertAppointment } = useData();
  const { currentUser } = useUserAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState({ serviceName: '', date: '', startTime: '' });

  const service  = services.find(s => s.id === booking.serviceId);
  const employee = employees.find(e => e.id === booking.employeeId);

  if (!success) {
    if (!service || !employee || !booking.date || !booking.startTime) { navigate('/book'); return null; }
    if (!currentUser) { navigate('/login?next=/book/confirm'); return null; }
  }

  const endTime = service && booking.startTime ? calcEndTime(booking.startTime, service.durationMinutes) : '';

  async function handleConfirm() {
    if (!service || !employee || !booking.date || !booking.startTime || !currentUser) return;
    setLoading(true);
    try {
      const api = await appointmentsApi.create({
        customerName:  currentUser.name,
        customerPhone: currentUser.phone,
        customerId:    currentUser.id,
        serviceId:     booking.serviceId!,
        employeeId:    booking.employeeId!,
        date:          booking.date,
        startTime:     booking.startTime,
        endTime,
      });
      upsertAppointment(toAppointment(api));
    } catch {
      // offline fallback — will sync via realtime
    }

    const prefs = currentUser.notificationPrefs;
    const dateStr = new Date(booking.date!).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    if (prefs?.bookingConfirmed !== false) {
      addNotification({ type: 'booking_confirmed', title: 'Randevunuz onaylandı!', body: `${service!.name} · ${dateStr} ${booking.startTime}` });
    }
    const daysUntil = Math.ceil((new Date(booking.date!).getTime() - new Date().setHours(0,0,0,0)) / 86400000);
    if (prefs?.bookingReminder !== false && daysUntil <= 1 && daysUntil >= 0) {
      addNotification({ type: 'booking_reminder', title: daysUntil === 0 ? 'Bugün randevunuz var!' : 'Yarın randevunuz var!', body: `${service!.name} · ${employee!.name} · ${booking.startTime}` });
    }

    setSuccessData({ serviceName: service!.name, date: booking.date!, startTime: booking.startTime! });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => resetBooking(), 100);
  }

  if (success) {
    const dateStr = new Date(successData.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#0f1117] px-6" style={{ animation: 'sc-bg 0.35s ease both' }}>
        <style>{`
          @keyframes sc-bg    { from{opacity:0} to{opacity:1} }
          @keyframes sc-ring  { 0%{transform:scale(0.2);opacity:0.8} 100%{transform:scale(2.2);opacity:0} }
          @keyframes sc-ring2 { 0%{transform:scale(0.2);opacity:0.5} 100%{transform:scale(2.8);opacity:0} }
          @keyframes sc-icon  { 0%{transform:scale(0) rotate(-20deg);opacity:0} 55%{transform:scale(1.18) rotate(4deg);opacity:1} 75%{transform:scale(0.93) rotate(-1deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
          @keyframes sc-check { from{stroke-dashoffset:60} to{stroke-dashoffset:0} }
          @keyframes sc-up    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
        <div className="relative flex items-center justify-center mb-12">
          <span className="absolute w-36 h-36 rounded-full bg-emerald-400/25 pointer-events-none" style={{ animation: 'sc-ring 0.9s cubic-bezier(0.2,0.8,0.4,1) 0.25s both' }} />
          <span className="absolute w-36 h-36 rounded-full bg-emerald-400/15 pointer-events-none" style={{ animation: 'sc-ring2 1.1s cubic-bezier(0.2,0.8,0.4,1) 0.15s both' }} />
          <div className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40" style={{ animation: 'sc-icon 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.05s both' }}>
            <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
              <polyline points="16,34 27,45 48,22" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset="60" style={{ animation: 'sc-check 0.38s ease 0.48s both' }} />
            </svg>
          </div>
        </div>
        <div className="text-center space-y-2" style={{ animation: 'sc-up 0.4s ease 0.72s both', opacity: 0 }}>
          <h2 className="text-[2rem] font-black text-gray-900 dark:text-white tracking-tight leading-none">Randevunuz Alındı!</h2>
          <p className="text-base font-medium text-gray-500 dark:text-gray-400 mt-2">{successData.serviceName}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 capitalize">{dateStr} · {successData.startTime}</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm mt-10" style={{ animation: 'sc-up 0.4s ease 0.92s both', opacity: 0 }}>
          <button onClick={() => navigate('/my-appointments')} className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[.98] text-white text-base font-bold shadow-lg shadow-emerald-500/30 transition-all">Randevularımı Gör</button>
          <button onClick={() => navigate('/book')} className="w-full py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Yeni Randevu Al</button>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate('/book/datetime')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-4"><ArrowLeft size={15} />Geri</button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Randevuyu Onayla</h1>
        <p className="text-sm text-gray-400 mt-1">Bilgilerinizi kontrol edin ve onaylayın</p>
      </div>
      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800/60 p-5 space-y-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Hizmet Detayı</p>
        <SummaryRow icon={<Scissors size={16} />} label={service!.name} sub={`${service!.price} ₺`} accent />
        <SummaryRow icon={<User size={16} />} label={employee!.name} sub={`${service!.durationMinutes} dk`} />
        <div className="h-px bg-gray-100 dark:bg-gray-700/60" />
        <SummaryRow icon={<CalendarDays size={16} />} label={new Date(booking.date!).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
        <SummaryRow icon={<Clock size={16} />} label={`${booking.startTime} – ${endTime}`} />
      </div>
      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800/60 p-5 space-y-3.5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Müşteri Bilgileri</p>
          <button onClick={() => navigate('/profile')} className="flex items-center gap-1 text-[11px] text-[#6366F1] font-semibold hover:underline">Düzenle <ChevronRight size={11} /></button>
        </div>
        <SummaryRow icon={<User size={16} />} label={currentUser!.name} />
        <SummaryRow icon={<Phone size={16} />} label={currentUser!.phone} />
        <SummaryRow icon={<Mail size={16} />} label={currentUser!.email} />
      </div>
      <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Toplam Tutar</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{service!.price} ₺</span>
        </div>
        <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800/30">
          <Star size={13} className="text-amber-500 fill-amber-400" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Bu randevudan <span className="font-black">{Math.round(service!.price * 0.1)} puan</span> kazanacaksınız</span>
        </div>
      </div>
      <button onClick={handleConfirm} disabled={loading} className="w-full py-4 rounded-2xl bg-[#6366F1] hover:bg-[#4F46E5] active:scale-[.98] text-white text-base font-bold shadow-lg shadow-[#6366F1]/30 transition-all disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2">
        {loading ? <><span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />İşleniyor…</> : 'Randevuyu Onayla'}
      </button>
      <p className="text-center text-xs text-gray-400">Onayladıktan sonra randevunuz hemen oluşturulur.</p>
    </div>
  );
}
