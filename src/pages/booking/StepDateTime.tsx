import { useState } from 'react';
import { useStore } from '../../store';
import { useData } from '../../lib/data';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getAllSlots } from '../../utils/slots';
import { cn } from '../../lib/utils';

function SkeletonSlots() {
  return (
    <div className="flex flex-col gap-5 pb-4 animate-pulse">
      <div>
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-16 mb-3" />
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-xl w-32 mb-2" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-48" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {[1,2,3,4,5].map(i => <div key={i} className="shrink-0 w-12 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl" />)}
      </div>
      <div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-12 mb-2" />
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

function isoToday() { return new Date().toISOString().split('T')[0]; }
function addDays(iso: string, n: number) {
  const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0];
}

const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const DAYS   = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

export default function StepDateTime() {
  const { booking, setBooking } = useStore();
  const { services, employees, appointments, loading } = useData();
  const navigate = useNavigate();
  const today = isoToday();
  const [selectedDate, setSelectedDate] = useState(booking.date ?? today);

  const isLoading = (loading.services && services.length === 0) || (loading.employees && employees.length === 0);
  if (isLoading) return <SkeletonSlots />;

  const service  = services.find(s => s.id === booking.serviceId);
  const employee = employees.find(e => e.id === booking.employeeId);
  if (!service || !employee) { navigate('/book'); return null; }

  const days  = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const allSlots = getAllSlots(employee, selectedDate, service.durationMinutes, appointments);

  const morning   = allSlots.filter(s => parseInt(s.time) < 12);
  const afternoon = allSlots.filter(s => parseInt(s.time) >= 12 && parseInt(s.time) < 17);
  const evening   = allSlots.filter(s => parseInt(s.time) >= 17);
  const hasAny    = allSlots.length > 0;

  function pickDate(d: string) { setSelectedDate(d); setBooking({ date: d, startTime: null }); }
  function selectSlot(time: string) { setBooking({ date: selectedDate, startTime: time }); navigate('/book/confirm'); }

  const selDate = new Date(selectedDate);
  const isActive = (t: string) => booking.startTime === t && booking.date === selectedDate;

  function SlotGroup({ label, list }: { label: string; list: typeof allSlots }) {
    if (!list.length) return null;
    return (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
        <div className="grid grid-cols-4 gap-2">
          {list.map(({ time, available }) => (
            <button key={time} onClick={() => available && selectSlot(time)} disabled={!available}
              className={cn('py-2.5 rounded-xl text-[13px] font-semibold transition-all',
                isActive(time) ? 'bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/30'
                : available ? 'bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#6366F1]/40 hover:text-[#6366F1] dark:hover:text-indigo-400 active:scale-95'
                : 'bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700/50 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through'
              )}>
              {time}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div>
        <button onClick={() => navigate('/book/employee')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-3 -ml-0.5"><ArrowLeft size={15} /> Geri</button>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#6366F1] mb-1">Tarih Seç</p>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{selDate.getDate()} {MONTHS[selDate.getMonth()]}</h1>
            <p className="text-sm text-gray-400 mt-1">{DAYS[selDate.getDay()]} · {service.name} · {employee.name}</p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => { const prev = days[Math.max(0, days.indexOf(selectedDate) - 1)]; if (prev) pickDate(prev); }} disabled={selectedDate === today}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-400 hover:border-[#6366F1]/40 hover:text-[#6366F1] disabled:opacity-30 disabled:pointer-events-none transition-colors">
              <ArrowLeft size={15} />
            </button>
            <button onClick={() => { const next = days[Math.min(days.length - 1, days.indexOf(selectedDate) + 1)]; if (next) pickDate(next); }} disabled={selectedDate === days[days.length - 1]}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-400 hover:border-[#6366F1]/40 hover:text-[#6366F1] disabled:opacity-30 disabled:pointer-events-none transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {days.map(d => {
          const date = new Date(d);
          const sel  = selectedDate === d;
          const isToday = d === today;
          return (
            <button key={d} onClick={() => pickDate(d)}
              className={cn('snap-start shrink-0 flex flex-col items-center w-12 pt-2.5 pb-2 rounded-2xl transition-all active:scale-95',
                sel ? 'bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/30' : 'bg-white dark:bg-[#1a1d27] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}>
              <span className={cn('text-[9px] font-bold uppercase tracking-wide', sel ? 'text-white/70' : 'text-gray-400')}>{DAYS[date.getDay()]}</span>
              <span className="text-[19px] font-black mt-0.5 leading-none">{date.getDate()}</span>
              <span className={cn('w-1 h-1 rounded-full mt-1.5', isToday ? (sel ? 'bg-white/60' : 'bg-[#6366F1]') : 'bg-transparent')} />
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-4">
        {!hasAny ? (
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800/60 px-5 py-12 text-center">
            <p className="text-2xl mb-2">😔</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bu gün çalışma saati yok</p>
            <p className="text-xs text-gray-400 mt-1">Ok tuşlarıyla başka bir gün seçin</p>
          </div>
        ) : (
          <>
            <SlotGroup label="Sabah" list={morning} />
            <SlotGroup label="Öğleden Sonra" list={afternoon} />
            <SlotGroup label="Akşam" list={evening} />
          </>
        )}
      </div>
    </div>
  );
}
