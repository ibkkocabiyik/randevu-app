import { useState } from 'react';
import { useStore } from '../../store';
import { useReviewStore } from '../../store/reviews';
import { Star, MessageSquare, TrendingUp, Award, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={13}
          className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'}
        />
      ))}
    </div>
  );
}

function RatingBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const { ref, pct } = { ref: null, pct: total > 0 ? (count / total) * 100 : 0 };
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-3 text-right">{rating}</span>
      <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-5 text-right tabular-nums">{count}</span>
    </div>
  );
}

export default function Reviews() {
  const { services, employees } = useStore();
  const { reviews } = useReviewStore();
  const [filterService, setFilterService] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // İstatistikler
  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews.filter(rv => rv.rating === r).length,
  }));

  // Filtrele
  let filtered = reviews.filter(r => {
    if (filterService && r.serviceId !== filterService) return false;
    if (filterEmployee && r.employeeId !== filterEmployee) return false;
    if (filterRating && r.rating !== filterRating) return false;
    return true;
  });

  // Sırala
  filtered = [...filtered].sort((a, b) => {
    if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
    if (sort === 'highest') return b.rating - a.rating;
    return a.rating - b.rating;
  });

  // Hizmet bazlı ortalama
  const serviceAvg = services.map(svc => {
    const svcReviews = reviews.filter(r => r.serviceId === svc.id);
    const a = svcReviews.length > 0 ? svcReviews.reduce((s, r) => s + r.rating, 0) / svcReviews.length : 0;
    return { name: svc.name, avg: a, count: svcReviews.length };
  }).filter(s => s.count > 0).sort((a, b) => b.avg - a.avg);

  const selectCls = 'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Değerlendirmeler</h1>
        <p className="text-sm text-gray-400 mt-0.5">Müşteri yorumları ve puanlamaları</p>
      </div>

      {/* Üst istatistik kartları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Ortalama puan — büyük kart */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 p-5 text-white shadow-lg shadow-amber-400/25 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Ortalama</p>
            <Star size={16} className="text-white fill-white" />
          </div>
          <div>
            <p className="text-4xl font-black tabular-nums leading-none mt-2">{avg > 0 ? avg.toFixed(1) : '—'}</p>
            <div className="flex items-center gap-1 mt-1">
              {avg > 0 && <StarRow rating={Math.round(avg)} />}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.06] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Toplam</p>
            <MessageSquare size={15} className="text-[#6366F1]" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{total}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">yorum</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.06] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">5 Yıldız</p>
            <Award size={15} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {reviews.filter(r => r.rating === 5).length}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {total > 0 ? `%${Math.round((reviews.filter(r => r.rating === 5).length / total) * 100)}` : '%0'}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.06] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Memnuniyet</p>
            <TrendingUp size={15} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {total > 0 ? `%${Math.round((reviews.filter(r => r.rating >= 4).length / total) * 100)}` : '—'}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">4★ ve üzeri</p>
        </div>
      </div>

      {/* Puan dağılımı + Hizmet bazlı */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.06] p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Puan Dağılımı</p>
          {total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Henüz değerlendirme yok.</p>
          ) : (
            <div className="space-y-2.5">
              {ratingDist.map(({ rating, count }) => (
                <RatingBar key={rating} rating={rating} count={count} total={total} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.06] p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Hizmet Bazlı Ortalama</p>
          {serviceAvg.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Henüz değerlendirme yok.</p>
          ) : (
            <div className="space-y-3">
              {serviceAvg.map(s => (
                <div key={s.name} className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-gray-700 dark:text-gray-300 truncate">{s.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <StarRow rating={Math.round(s.avg)} />
                    <span className="text-[12px] font-bold text-amber-500 tabular-nums w-8 text-right">{s.avg.toFixed(1)}</span>
                    <span className="text-[11px] text-gray-400">({s.count})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-gray-400" />
        <select value={filterService} onChange={e => setFilterService(e.target.value)} className={selectCls}>
          <option value="">Tüm Hizmetler</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className={selectCls}>
          <option value="">Tüm Personel</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={filterRating} onChange={e => setFilterRating(Number(e.target.value))} className={selectCls}>
          <option value={0}>Tüm Puanlar</option>
          {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Yıldız</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className={cn(selectCls, 'ml-auto')}>
          <option value="newest">En Yeni</option>
          <option value="highest">En Yüksek</option>
          <option value="lowest">En Düşük</option>
        </select>
      </div>

      {/* Yorum listesi */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
          <MessageSquare size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm font-medium text-gray-400">
            {total === 0 ? 'Henüz değerlendirme yapılmadı.' : 'Filtreyle eşleşen değerlendirme yok.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const svc = services.find(s => s.id === r.serviceId);
            const emp = employees.find(e => e.id === r.employeeId);
            const dateStr = new Date(r.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            return (
              <div key={r.id} className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.06] p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#a78bfa] flex items-center justify-center text-[12px] font-bold text-white shrink-0">
                      {r.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white leading-tight">{r.customerName}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{dateStr}</p>
                    </div>
                  </div>
                  <StarRow rating={r.rating} />
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {svc && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#EEF2FF] dark:bg-[#312E81]/30 text-[#6366F1] dark:text-indigo-400">
                      {svc.name}
                    </span>
                  )}
                  {emp && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      {emp.name}
                    </span>
                  )}
                </div>

                {r.comment && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{r.comment}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
