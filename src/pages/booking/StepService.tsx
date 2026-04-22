import { useStore } from '../../store';
import { useUserAuth } from '../../store/userAuth';
import { useNavigate } from 'react-router-dom';
import { Scissors, Wind, Leaf, ChevronRight, Clock, Star, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Service } from '../../types';

const CATEGORY_META: Record<Service['category'], { label: string; icon: React.ReactNode; pillCls: string; iconBg: string }> = {
  sac:   { label: 'Saç',   icon: <Scissors size={13} />, pillCls: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',   iconBg: 'bg-indigo-50 dark:bg-indigo-900/30' },
  sakal: { label: 'Sakal', icon: <Wind size={13} />,     pillCls: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',   iconBg: 'bg-purple-50 dark:bg-purple-900/30' },
  bakim: { label: 'Bakım', icon: <Leaf size={13} />,     pillCls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-900/30' },
};

const ICON_COLOR: Record<Service['category'], string> = {
  sac:   'text-indigo-500',
  sakal: 'text-purple-500',
  bakim: 'text-emerald-500',
};

export default function StepService() {
  const { services, setBooking, reviews } = useStore();
  const { currentUser } = useUserAuth();
  const navigate = useNavigate();

  const favIds = currentUser?.favoriteServiceIds ?? [];

  // Average rating per service
  function avgRating(serviceId: string) {
    const rs = reviews.filter(r => r.serviceId === serviceId);
    if (!rs.length) return null;
    return rs.reduce((s, r) => s + r.rating, 0) / rs.length;
  }

  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    acc[s.category] = [...(acc[s.category] ?? []), s];
    return acc;
  }, {});

  function select(id: string) {
    setBooking({ serviceId: id, employeeId: null, date: null, startTime: null });
    navigate('/book/employee');
  }

  // Favoriler önce gelsin
  const hasFavs = favIds.some(id => services.find(s => s.id === id));

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Hizmet Seçin</h1>
        <p className="text-sm text-gray-400 mt-1">Size uygun hizmeti seçerek başlayın</p>
      </div>

      {/* Favori hizmetler — login yapıldıysa ve favori varsa */}
      {hasFavs && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-500">
            <Heart size={12} className="fill-amber-400 text-amber-400" />
            Favorilerim
          </div>
          {services.filter(s => favIds.includes(s.id)).map(s => {
            const meta = CATEGORY_META[s.category];
            const avg  = avgRating(s.id);
            return (
              <ServiceCard key={s.id} s={s} meta={meta} avg={avg} isFav onSelect={select} />
            );
          })}
        </div>
      )}

      {/* Kategoriye göre listeleme */}
      {Object.entries(grouped).map(([cat, list]) => {
        const meta = CATEGORY_META[cat as Service['category']];
        const nonFavList = hasFavs ? list.filter(s => !favIds.includes(s.id)) : list;
        if (!nonFavList.length) return null;
        return (
          <div key={cat} className="space-y-2">
            <div className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', meta.pillCls)}>
              {meta.icon}
              {meta.label}
            </div>
            {nonFavList.map(s => {
              const avg = avgRating(s.id);
              return <ServiceCard key={s.id} s={s} meta={meta} avg={avg} onSelect={select} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

function ServiceCard({
  s, meta, avg, isFav = false, onSelect,
}: {
  s: Service;
  meta: { label: string; icon: React.ReactNode; pillCls: string; iconBg: string };
  avg: number | null;
  isFav?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(s.id)}
      className={cn(
        'w-full flex items-center gap-4 bg-white dark:bg-[#1a1d27] border rounded-2xl px-4 py-4 transition-all group text-left active:scale-[0.98]',
        isFav
          ? 'border-amber-200 dark:border-amber-800/40 hover:border-amber-400/60 hover:shadow-md hover:shadow-amber-400/10'
          : 'border-gray-100 dark:border-gray-800/60 hover:border-[#6366F1]/40 hover:shadow-md hover:shadow-[#6366F1]/8',
      )}
    >
      {/* Kategori ikonu */}
      <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', meta.iconBg)}>
        <span className={ICON_COLOR[s.category]}>{meta.icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-gray-900 dark:text-white text-[15px] leading-snug">{s.name}</p>
          {isFav && <Heart size={11} className="fill-amber-400 text-amber-400 shrink-0" />}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={11} /> {s.durationMinutes} dk
          </span>
          {avg !== null && (
            <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              {avg.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <span className="font-black text-[#6366F1] dark:text-indigo-400 text-base tabular-nums">{s.price} ₺</span>
        <ChevronRight size={15} className="text-gray-300 group-hover:text-[#6366F1] transition-colors" />
      </div>
    </button>
  );
}
