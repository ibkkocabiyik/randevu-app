import { useStore } from '../../store';
import { useData } from '../../lib/data';
import { useReviewStore } from '../../store/reviews';
import { useNavigate } from 'react-router-dom';
import { User, Clock, ChevronRight, ArrowLeft, Scissors, Star, CalendarCheck } from 'lucide-react';

export default function StepEmployee() {
  const { booking, setBooking } = useStore();
  const { employees, services, appointments, reviews: dataReviews } = useData();
  const legacyReviews = useReviewStore(s => s.reviews);
  const reviews = [...dataReviews, ...legacyReviews.filter(r => !dataReviews.some(dr => dr.id === r.id))];
  const navigate = useNavigate();

  const service  = services.find(s => s.id === booking.serviceId);
  const eligible = employees.filter(e => service && e.serviceIds.includes(service.id));

  if (!service) { navigate('/book'); return null; }

  function select(id: string) {
    setBooking({ employeeId: id, date: null, startTime: null });
    navigate('/book/datetime');
  }

  function empStats(empId: string) {
    const done = appointments.filter(a => a.employeeId === empId && a.status === 'completed').length;
    const rs   = reviews.filter(r => r.employeeId === empId);
    const avg  = rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : null;
    return { done, avg, reviewCount: rs.length };
  }

  return (
    <div className="space-y-5 pb-4">
      <div>
        <button onClick={() => navigate('/book')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-3 -ml-0.5"><ArrowLeft size={15} /> Geri</button>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Berber Seçin</h1>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#6366F1] bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full"><Scissors size={11} /> {service.name}</span>
          <span className="text-xs text-gray-400">{service.durationMinutes} dk · {service.price} ₺</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {eligible.length === 0 ? (
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800/60 p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3"><User size={20} className="text-gray-400" /></div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bu hizmet için müsait personel yok</p>
          </div>
        ) : eligible.map(e => {
          const { done, avg, reviewCount } = empStats(e.id);
          return (
            <button key={e.id} onClick={() => select(e.id)}
              className="w-full flex items-center gap-4 bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800/60 hover:border-[#6366F1]/40 hover:shadow-md hover:shadow-[#6366F1]/8 rounded-2xl px-4 py-4 transition-all group text-left active:scale-[0.98]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#a78bfa] flex items-center justify-center shrink-0 shadow-md shadow-[#6366F1]/25 text-white font-bold text-lg">
                {e.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-[15px] leading-snug">{e.name}</p>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={11} />{e.workingHours.start} – {e.workingHours.end}</span>
                  {done > 0 && <span className="flex items-center gap-1 text-xs text-gray-400"><CalendarCheck size={11} />{done} tamamlanan</span>}
                  {avg !== null && <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium"><Star size={10} className="fill-amber-400 text-amber-400" />{avg.toFixed(1)}<span className="text-gray-400 font-normal ml-0.5">({reviewCount})</span></span>}
                </div>
              </div>
              <ChevronRight size={15} className="text-gray-300 group-hover:text-[#6366F1] transition-colors shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
