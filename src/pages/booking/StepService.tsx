import { useStore } from '../../store';
import { useData } from '../../lib/data';
import { useReviewStore } from '../../store/reviews';
import { useUserAuth } from '../../store/userAuth';
import { useNavigate } from 'react-router-dom';
import { Scissors, Wind, Leaf, ChevronRight, Clock, Star, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Service } from '../../types';

const CATEGORY_META: Record<Service['category'], { label: string; icon: React.ReactNode; pillCls: string; iconBg: string }> = {
  sac:   { label: 'Saç',   icon: <Scissors size={13} />, pillCls: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',    iconBg: 'bg-indigo-50 dark:bg-indigo-900/30' },
  sakal: { label: 'Sakal', icon: <Wind size={13} />,     pillCls: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',    iconBg: 'bg-purple-50 dark:bg-purple-900/30' },
  bakim: { label: 'Bakım', icon: <Leaf size={13} />,     pillCls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-900/30' },
};
const ICON_COLOR: Record<Service['category'], string> = { sac: 'text-indigo-500', sakal: 'text-purple-500', bakim: 'text-emerald-500' };

function SkeletonCard() {
  return (
    <div className="w-full flex items-center gap-4 bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800/60 rounded-2xl px-4 py-4 animate-pulse">
      <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
      </div>
      <div className="h-5 w-14 bg-gray-100 dark:bg-gray-800 rounded" />
    </div>
  );
}

export default function StepService() {
  const { setBooking } = useStore();
  const { services, reviews: dataReviews, loading } = useData();
  const legacyReviews = useReviewStore(s => s.reviews);
  const reviews = [...dataReviews, ...legacyReviews.filter(r => !dataReviews.some(dr => dr.id === r.id))];
  const { currentUser } = useUserAuth();
  const navigate = useNavigate();
  const favIds = currentUser?.favoriteServiceIds ?? [];

  function avgRating(serviceId: string) {
    const rs = reviews.filter(r => r.serviceId === serviceId);
    return rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : null;
  }

  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    acc[s.category] = [...(acc[s.category] ?? []), s];
    return acc;
  }, {});

  function select(id: string) {
    setBooking({ serviceId: id, employeeId: null, date: null, startTime: null });
    navigate('/book/employee');
  }

  const hasFavs = favIds.some(id => services.find(s => s.id === id));
  const isLoading = loading.services && services.length === 0;

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Hizmet Seçin</h1>
        <p className="text-sm text-gray-400 mt-1">Size uygun hizmeti seçerek başlayın</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Scissors size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Henüz hizmet tanımlanmamış</p>
        </div>
      ) : (
        <>
          {hasFavs && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-500">
                <Heart size={12} className="fill-amber-400 text-amber-400" /> Favorilerim
              </div>
              {services.filter(s => favIds.includes(s.id)).map(s => (
                <ServiceCard key={s.id} s={s} meta={CATEGORY_META[s.category]} avg={avgRating(s.id)} isFav onSelect={select} />
              ))}
            </div>
          )}
          {Object.entries(grouped).map(([cat, list]) => {
            const meta = CATEGORY_META[cat as Service['category']];
            const nonFavList = hasFavs ? list.filter(s => !favIds.includes(s.id)) : list;
            if (!nonFavList.length) return null;
            return (
              <div key={cat} className="space-y-2">
                <div className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', meta.pillCls)}>
                  {meta.icon}{meta.label}
                </div>
                {nonFavList.map(s => <ServiceCard key={s.id} s={s} meta={meta} avg={avgRating(s.id)} onSelect={select} />)}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function ServiceCard({ s, meta, avg, isFav = false, onSelect }: {
  s: Service; meta: { label: string; icon: React.ReactNode; pillCls: string; iconBg: string };
  avg: number | null; isFav?: boolean; onSelect: (id: string) => void;
}) {
  return (
    <button onClick={() => onSelect(s.id)}
      className={cn('w-full flex items-center gap-4 bg-white dark:bg-[#1a1d27] border rounded-2xl px-4 py-4 transition-all group text-left active:scale-[0.98]',
        isFav ? 'border-amber-200 dark:border-amber-800/40 hover:border-amber-400/60 hover:shadow-md hover:shadow-amber-400/10'
              : 'border-gray-100 dark:border-gray-800/60 hover:border-[#6366F1]/40 hover:shadow-md hover:shadow-[#6366F1]/8'
      )}>
      <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', meta.iconBg)}>
        <span className={ICON_COLOR[s.category]}>{meta.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-gray-900 dark:text-white text-[15px] leading-snug">{s.name}</p>
          {isFav && <Heart size={11} className="fill-amber-400 text-amber-400 shrink-0" />}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={11} /> {s.durationMinutes} dk</span>
          {avg !== null && <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium"><Star size={10} className="fill-amber-400 text-amber-400" />{avg.toFixed(1)}</span>}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <span className="font-black text-[#6366F1] dark:text-indigo-400 text-base tabular-nums">{s.price} ₺</span>
        <ChevronRight size={15} className="text-gray-300 group-hover:text-[#6366F1] transition-colors" />
      </div>
    </button>
  );
}
