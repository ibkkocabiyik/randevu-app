import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { useData, toAppointment, toReview } from '../../lib/data';
import { useReviewStore } from '../../store/reviews';
import { useUserAuth } from '../../store/userAuth';
import { useSwal } from '../../lib/swal';
import { appointmentsApi, reviewsApi } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import {
  CalendarDays, Clock, User, Scissors, RotateCcw, X, Plus, Star,
  ChevronRight, TrendingUp,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAvailableSlots } from '../../utils/slots';
import type { Appointment } from '../../types';

const STATUS_META: Record<string, { label: string; dot: string; cls: string }> = {
  confirmed: { label: 'Onaylı',      dot: 'bg-emerald-400', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  pending:   { label: 'Bekliyor',    dot: 'bg-amber-400',   cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'   },
  completed: { label: 'Tamamlandı',  dot: 'bg-gray-400',    cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'          },
  cancelled: { label: 'İptal',       dot: 'bg-red-400',     cls: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'           },
  'no-show': { label: 'Gelmedi',     dot: 'bg-orange-400',  cls: 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400' },
  noshow:    { label: 'Gelmedi',     dot: 'bg-orange-400',  cls: 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400' },
};

function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500' };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap', m.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  );
}

/* ── Reschedule modal ─────────────────────────────────────────────── */
function RescheduleModal({ appt, onClose }: { appt: Appointment; onClose: () => void }) {
  const { employees, appointments, services, upsertAppointment } = useData();
  const swal = useSwal();
  const employee = employees.find(e => e.id === appt.employeeId);
  const service  = services.find(s => s.id === appt.serviceId);

  const today = new Date().toISOString().split('T')[0];
  const days  = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const DAYS = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const slots = employee && service
    ? getAvailableSlots(employee, selectedDate, service.durationMinutes,
        appointments.filter(a => a.id !== appt.id))
    : [];

  function calcEnd(start: string, dur: number) {
    const [h, m] = start.split(':').map(Number);
    const t = h * 60 + m + dur;
    return `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`;
  }

  async function confirm() {
    if (!selectedTime || !service) return;
    const ok = await swal.confirm({
      title: 'Randevu yeniden planlanacak',
      text: `${new Date(selectedDate).toLocaleDateString('tr-TR', { day:'numeric', month:'long' })} tarihinde ${selectedTime} saatine taşınsın mı?`,
      confirmText: 'Evet, taşı',
    });
    if (!ok) return;
    const newEnd = calcEnd(selectedTime, service.durationMinutes);
    try {
      await appointmentsApi.update(appt.id, {
        date: selectedDate,
        start_time: selectedTime,
        end_time: newEnd,
      });
    } catch {}
    upsertAppointment({ ...appt, date: selectedDate, startTime: selectedTime, endTime: newEnd });
    swal.toast({ icon: 'success', title: 'Randevu güncellendi' });
    onClose();
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Yeni Tarih</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory">
          {days.map(d => {
            const date = new Date(d);
            const sel  = selectedDate === d;
            return (
              <button key={d} onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                className={cn(
                  'snap-start shrink-0 flex flex-col items-center w-12 pt-2.5 pb-2 rounded-2xl transition-all active:scale-95',
                  sel
                    ? 'bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/30'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}>
                <span className={cn('text-[9px] font-bold uppercase tracking-wide', sel ? 'text-white/70' : 'text-gray-400')}>
                  {DAYS[date.getDay()]}
                </span>
                <span className="text-[18px] font-black mt-0.5 leading-none">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">Müsait Saatler</p>
        {slots.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 py-8 text-center">
            <p className="text-sm text-gray-400">Bu tarihte müsait saat yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {slots.map(slot => (
              <button key={slot} onClick={() => setSelectedTime(slot)}
                className={cn(
                  'py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-95',
                  selectedTime === slot
                    ? 'bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/30'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#6366F1]/40 hover:text-[#6366F1]'
                )}>
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={confirm} disabled={!selectedTime}
        className="w-full rounded-2xl bg-[#6366F1] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6366F1]/30 hover:bg-[#4F46E5] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none">
        Randevuyu Taşı
      </button>
    </div>
  );
}

/* ── Review modal ─────────────────────────────────────────────────── */
function ReviewModal({ appt, onClose }: { appt: Appointment; onClose: () => void }) {
  const { services, employees } = useData();
  const { addReview } = useReviewStore();
  const { currentUser } = useUserAuth();
  const swal = useSwal();
  const service  = services.find(s => s.id === appt.serviceId);
  const employee = employees.find(e => e.id === appt.employeeId);

  const [rating, setRating]   = useState<1|2|3|4|5>(5);
  const [comment, setComment] = useState('');
  const [hover, setHover]     = useState<number | null>(null);

  const STAR_LABELS = ['', 'Berbat', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const api = await reviewsApi.create({
        appointmentId: appt.id, serviceId: appt.serviceId,
        employeeId: appt.employeeId, customerName: currentUser.name, rating, comment,
      });
      useData.getState().upsertReview(toReview(api));
      addReview({ appointmentId: appt.id, serviceId: appt.serviceId, employeeId: appt.employeeId, customerName: currentUser.name, rating, comment });
    } catch { addReview({ appointmentId: appt.id, serviceId: appt.serviceId, employeeId: appt.employeeId, customerName: currentUser.name, rating, comment }); }
    swal.toast({ icon: 'success', title: 'Değerlendirmeniz için teşekkürler!' });
    onClose();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
        <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center shrink-0">
          <Scissors size={16} className="text-[#6366F1]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{service?.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{employee?.name} · {new Date(appt.date).toLocaleDateString('tr-TR', { day:'numeric', month:'long' })}</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Puanınız</p>
          <div className="flex gap-1.5 items-center">
            {([1,2,3,4,5] as const).map(star => (
              <button key={star} type="button"
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 active:scale-95 p-0.5">
                <Star
                  size={34}
                  className={cn(
                    'transition-all duration-150',
                    (hover ?? rating) >= star
                      ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                      : 'fill-gray-100 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                  )}
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-semibold text-amber-500">
              {STAR_LABELS[hover ?? rating]}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">
            Yorumunuz <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Deneyiminizi paylaşın…"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition resize-none"
          />
        </div>

        <button type="submit"
          className="w-full rounded-2xl bg-[#6366F1] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6366F1]/30 hover:bg-[#4F46E5] active:scale-[0.98] transition-all">
          Değerlendirmeyi Gönder
        </button>
      </form>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────── */
export default function MyAppointments() {
  const { appointments, services, employees, upsertAppointment, upsertReview } = useData();
  const { addNotification } = useStore();
  const { hasReview, addReview: _addReview } = useReviewStore();
  const { currentUser } = useUserAuth();
  const navigate = useNavigate();
  const swal = useSwal();

  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  void upsertReview; void _addReview;
  const [reschedule, setReschedule] = useState<Appointment | null>(null);
  const [reviewing, setReviewing]   = useState<Appointment | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const myAppts = appointments
    .filter(a => currentUser && a.customerPhone === currentUser.phone)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

  const upcoming = myAppts.filter(a =>
    a.date >= today && a.status !== 'cancelled' && a.status !== 'completed'
    && a.status !== 'noshow'
  );
  const past = myAppts.filter(a =>
    a.date < today || a.status === 'cancelled' || a.status === 'completed'
    || a.status === 'noshow'
  );

  const shown = tab === 'upcoming' ? upcoming : past;

  // Özet istatistikler
  const totalSpent = myAppts
    .filter(a => a.status === 'completed')
    .reduce((s, a) => s + (services.find(sv => sv.id === a.serviceId)?.price ?? 0), 0);

  async function handleCancel(id: string) {
    const ok = await swal.confirm({ title: 'Randevuyu iptal et?', text: 'Bu işlem geri alınamaz.', confirmText: 'Evet, iptal et' });
    if (!ok) return;
    const appt = appointments.find(a => a.id === id);
    const appt2 = appointments.find(a => a.id === id);
    if (appt2) upsertAppointment({ ...appt2, status: 'cancelled' });
    try { await appointmentsApi.update(id, { status: 'cancelled' } as never); }
    catch { if (appt2) upsertAppointment(appt2); }
    if (appt) {
      const svc = services.find(s => s.id === appt.serviceId);
      addNotification({
        type: 'booking_cancelled',
        title: 'Randevunuz iptal edildi',
        body: svc ? `${svc.name} · ${appt.date} ${appt.startTime}` : '',
        appointmentId: id,
      });
    }
    swal.toast({ icon: 'success', title: 'Randevu iptal edildi' });
  }

  const canReschedule = (a: Appointment) =>
    a.date >= today && (a.status === 'confirmed' || a.status === 'pending');

  const leftBorderColor = (status: string) => {
    if (status === 'confirmed') return 'bg-emerald-400';
    if (status === 'pending')   return 'bg-amber-400';
    if (status === 'cancelled') return 'bg-red-400';
    if (status === 'noshow' || status === 'no-show') return 'bg-orange-400';
    return 'bg-gray-300';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Randevularım</h1>
          <p className="mt-0.5 text-sm text-gray-400">{myAppts.length} toplam</p>
        </div>
        <button onClick={() => navigate('/book')}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-[#6366F1]/30 hover:bg-[#4F46E5] active:scale-[0.98] transition-all shrink-0">
          <Plus size={15} />
          Yeni Randevu
        </button>
      </div>

      {/* Özet kartları */}
      {myAppts.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Tamamlanan', value: myAppts.filter(a => a.status === 'completed').length, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Yaklaşan',   value: upcoming.length, color: 'text-[#6366F1]', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Harcama',    value: `${totalSpent.toLocaleString('tr-TR')}₺`, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          ].map(item => (
            <div key={item.label} className={cn('rounded-2xl p-3 text-center', item.bg)}>
              <p className={cn('text-lg font-black tabular-nums leading-none', item.color)}>{item.value}</p>
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
        <button onClick={() => setTab('upcoming')}
          className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all',
            tab === 'upcoming'
              ? 'bg-[#6366F1] text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}>
          Yaklaşan ({upcoming.length})
        </button>
        <button onClick={() => setTab('past')}
          className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all',
            tab === 'past'
              ? 'bg-[#6366F1] text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}>
          Geçmiş ({past.length})
        </button>
      </div>

      {/* Liste */}
      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <CalendarDays size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              {tab === 'upcoming' ? 'Yaklaşan randevunuz yok' : 'Geçmiş randevu bulunamadı'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {tab === 'upcoming' ? 'Hemen randevu alabilirsiniz.' : 'Tamamlanan randevular burada görünür.'}
            </p>
          </div>
          {tab === 'upcoming' && (
            <button onClick={() => navigate('/book')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#6366F1]/30 hover:bg-[#4F46E5] transition-all">
              <Plus size={15} />
              Randevu Al
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(appt => {
            const service  = services.find(s => s.id === appt.serviceId);
            const employee = employees.find(e => e.id === appt.employeeId);
            const isPast   = tab === 'past';
            const reviewed = hasReview(appt.id);

            return (
              <Card key={appt.id} className={cn('transition-all overflow-hidden', !isPast && 'hover:shadow-md hover:shadow-[#6366F1]/8')}>
                <div className="flex items-stretch gap-3.5">
                  {/* Sol renk şeridi */}
                  <div className={cn('w-1 rounded-full shrink-0', leftBorderColor(appt.status))} />

                  <div className="flex-1 min-w-0 py-0.5">
                    {/* Üst satır: hizmet adı + durum */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-900 dark:text-white text-[15px] leading-snug">{service?.name ?? '—'}</p>
                      <StatusPill status={appt.status} />
                    </div>

                    {/* Bilgi satırları */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <CalendarDays size={12} className="shrink-0" />
                        <span>{new Date(appt.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <Clock size={12} className="shrink-0" />
                          {appt.startTime} – {appt.endTime}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <User size={12} className="shrink-0" />
                          {employee?.name ?? '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#6366F1] dark:text-indigo-400">
                        <Scissors size={12} className="shrink-0" />
                        {service?.price} ₺
                      </div>
                    </div>

                    {/* Aksiyonlar */}
                    {(canReschedule(appt) || appt.status === 'completed') && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                        {canReschedule(appt) && (
                          <>
                            <button onClick={() => setReschedule(appt)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-[#6366F1]/40 hover:text-[#6366F1] dark:hover:text-indigo-400 transition-colors">
                              <RotateCcw size={11} />
                              Yeniden Planla
                            </button>
                            <button onClick={() => handleCancel(appt.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-red-300 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                              <X size={11} />
                              İptal Et
                            </button>
                          </>
                        )}
                        {appt.status === 'completed' && !reviewed && (
                          <button onClick={() => setReviewing(appt)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            Değerlendir
                          </button>
                        )}
                        {appt.status === 'completed' && reviewed && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400">
                            <Star size={11} className="fill-amber-300 text-amber-300" />
                            Değerlendirildi
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Yeni randevu CTA — geçmiş sekmesi altta */}
      {tab === 'past' && past.length > 0 && (
        <button onClick={() => navigate('/book')}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-[#6366F1]/5 dark:bg-[#6366F1]/10 border border-[#6366F1]/20 hover:bg-[#6366F1]/10 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6366F1] flex items-center justify-center">
              <TrendingUp size={15} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#6366F1] dark:text-indigo-400">Tekrar randevu al</p>
              <p className="text-xs text-gray-400">Favori usta ve hizmetinizle devam edin</p>
            </div>
          </div>
          <ChevronRight size={15} className="text-[#6366F1] opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {/* Reschedule modal */}
      <Modal isOpen={!!reschedule} onClose={() => setReschedule(null)} title="Yeniden Planla" size="md">
        {reschedule && <RescheduleModal appt={reschedule} onClose={() => setReschedule(null)} />}
      </Modal>

      {/* Review modal */}
      <Modal isOpen={!!reviewing} onClose={() => setReviewing(null)} title="Hizmeti Değerlendir" size="sm">
        {reviewing && <ReviewModal appt={reviewing} onClose={() => setReviewing(null)} />}
      </Modal>
    </div>
  );
}
