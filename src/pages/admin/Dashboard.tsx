import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import { Card } from '../../components/ui/Card';
import {
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CircleCheckBig,
  CircleX,
  Ticket,
  AlertCircle,
  CirclePlus,
  UserCog,
  Star,
  Flame,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../store/userAuth';
import { useReviewStore } from '../../store/reviews';

// ─── Intersection Observer hook — eleman görünce true döner ─────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── helpers ────────────────────────────────────────────────────────────────
function isoToday() { return new Date().toISOString().split('T')[0]; }
function addDays(iso: string, n: number) {
  const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0];
}
function shortDay(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { weekday: 'short' });
}

// ─── Trend badge ─────────────────────────────────────────────────────────────
function Trend({ value, lowerIsBetter = false }: { value: number; lowerIsBetter?: boolean }) {
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
        %0
      </span>
    );
  const good = lowerIsBetter ? value < 0 : value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${good ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
      {good ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {value > 0 ? '+' : ''}{value}%
    </span>
  );
}

// ─── Stat card (big number) ───────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend, lowerIsBetter, trendLabel }: {
  label: string; value: number | string; icon: React.ElementType;
  iconBg: string; iconColor: string; trend?: number; lowerIsBetter?: boolean; trendLabel?: string;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
          </p>
          {trend !== undefined && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Trend value={trend} lowerIsBetter={lowerIsBetter} />
              {trendLabel && <span className="text-xs text-gray-400 dark:text-gray-500">{trendLabel}</span>}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Mini stat card ───────────────────────────────────────────────────────────
function MiniCard({ label, value, icon: Icon, iconBg, iconColor }: {
  label: string; value: number; icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{value.toLocaleString('tr-TR')}</p>
        </div>
      </div>
    </Card>
  );
}

// ─── Line + Area chart (SVG, ticket-teal pattern) ────────────────────────────
function LineChart({ data }: { data: { date: string; opened: number; closed: number }[] }) {
  const { ref, visible } = useInView();

  const margin = { top: 16, right: 16, bottom: 32, left: 36 };
  const W = 600, H = 180;
  const iW = W - margin.left - margin.right;
  const iH = H - margin.top - margin.bottom;
  const maxVal = Math.max(...data.flatMap(d => [d.opened, d.closed]), 1);
  const stepX = iW / Math.max(data.length - 1, 1);
  const scaleY = (v: number) => iH - (v / maxVal) * iH;

  function points(key: 'opened' | 'closed') {
    return data.map((d, i) => ({ x: margin.left + i * stepX, y: margin.top + scaleY(d[key]) }));
  }
  function path(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C ${mx} ${pts[i - 1].y}, ${mx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  }
  function area(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return '';
    const base = margin.top + iH;
    let d = `M ${pts[0].x} ${base} L ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C ${mx} ${pts[i - 1].y}, ${mx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }
    d += ` L ${pts[pts.length - 1].x} ${base} Z`;
    return d;
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: margin.top + iH * (1 - f),
    label: Math.round(maxVal * f),
  }));

  const op = points('opened');
  const cl = points('closed');

  return (
    <div ref={ref} className="relative w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="grad-opened" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="grad-closed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridLines.map(g => (
          <g key={g.y}>
            <line x1={margin.left} y1={g.y} x2={W - margin.right} y2={g.y}
              stroke="currentColor" strokeWidth="0.5" className="text-gray-100 dark:text-gray-700" strokeDasharray="4 4" />
            <text x={margin.left - 6} y={g.y + 4} textAnchor="end" fontSize="9"
              className="fill-gray-400 dark:fill-gray-500" fill="currentColor">{g.label}</text>
          </g>
        ))}

        <path d={area(op)} fill="url(#grad-opened)" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }} />
        <path d={area(cl)} fill="url(#grad-closed)" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease 0.1s' }} />
        <path d={path(op)} fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }} />
        <path d={path(cl)} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.1s' }} />

        {op.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#6366F1" stroke="white" strokeWidth="1.5"
            style={{ opacity: visible ? 1 : 0, transition: `opacity 0.3s ease ${0.3 + 0.05 * i}s` }} />
        ))}
        {cl.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#10B981" stroke="white" strokeWidth="1.5"
            style={{ opacity: visible ? 1 : 0, transition: `opacity 0.3s ease ${0.35 + 0.05 * i}s` }} />
        ))}
        {data.map((d, i) => (
          <text key={i} x={margin.left + i * stepX} y={H - 6} textAnchor="middle"
            fontSize="9" fill="currentColor" className="fill-gray-400 dark:fill-gray-500">
            {d.date}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#6366F1]" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Alınan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Tamamlanan</span>
        </div>
      </div>
    </div>
  );
}

// ─── Bar chart (priority/status) ─────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; color: string; textColor: string }[] }) {
  const { ref, visible } = useInView();
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div ref={ref} className="flex h-48 gap-3">
      <div className="flex flex-col-reverse justify-between pb-6">
        {gridLines.map(f => (
          <span key={f} className="text-right text-[9px] text-gray-400 dark:text-gray-500">
            {Math.round(maxVal * f)}
          </span>
        ))}
      </div>
      <div className="relative flex flex-1 flex-col">
        <div className="absolute inset-0 mb-6 flex flex-col-reverse justify-between">
          {gridLines.map(f => (
            <div key={f} className="w-full border-t border-dashed border-gray-100 dark:border-gray-700/60" />
          ))}
        </div>
        <div className="relative flex h-full items-end gap-2 pb-6">
          {data.map((d, i) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
              <span className={`text-xs font-semibold tabular-nums transition-opacity duration-300 ${d.textColor} ${visible ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: `${80 * i + 400}ms` }}>
                {d.value}
              </span>
              <div className="relative w-full max-w-[52px] overflow-hidden rounded-t-lg">
                <div className="h-32 w-full rounded-t-lg bg-gray-50 dark:bg-gray-700/30" />
                <div
                  className={`absolute bottom-0 w-full rounded-t-lg ${d.color} transition-all duration-700`}
                  style={{
                    height: visible ? `${(d.value / maxVal) * 100}%` : '0%',
                    transitionDelay: `${80 * i}ms`,
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {data.map(d => (
            <div key={d.label} className="flex-1 text-center">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Status pill ─────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    cancelled: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400',
    completed: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    noshow: 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400',
  };
  const labels: Record<string, string> = {
    confirmed: 'Onaylı', pending: 'Bekliyor', cancelled: 'İptal', completed: 'Tamamlandı', noshow: 'Gelmedi',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {labels[status] ?? status}
    </span>
  );
}

// ─── Revenue bar chart (6 months) ────────────────────────────────────────────
const BAR_H = 100; // px — sabit yükseklik
function RevenueChart({ data }: { data: { label: string; revenue: number; count: number }[] }) {
  const { ref, visible } = useInView();
  const maxVal = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div ref={ref} className="flex items-end gap-2">
      {data.map((d, i) => {
        const barPx = visible ? Math.max((d.revenue / maxVal) * BAR_H, d.revenue > 0 ? 4 : 0) : 0;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
            <span className={`text-[10px] font-bold tabular-nums text-[#6366F1] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: `${80 * i + 300}ms` }}>
              {d.revenue > 0 ? `${(d.revenue / 1000).toFixed(1)}k` : '—'}
            </span>
            <div className="relative w-full rounded-t-lg bg-gray-100 dark:bg-gray-700/40 overflow-hidden" style={{ height: BAR_H }}>
              <div
                className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-[#6366F1] to-[#818cf8] transition-all duration-700"
                style={{
                  height: barPx,
                  transitionDelay: `${80 * i}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
            </div>
            <span className="text-[10px] text-gray-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Saatlik yoğunluk haritası ───────────────────────────────────────────────
function HourHeatmap({ data }: { data: number[] }) {
  const { ref, visible } = useInView();
  const max = Math.max(...data, 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div ref={ref}>
      <div className="grid grid-cols-12 gap-1">
        {hours.map(h => {
          const val = data[h] ?? 0;
          const pct = val / max;
          const bg = pct === 0
            ? 'bg-gray-100 dark:bg-gray-700/40'
            : pct < 0.33
            ? 'bg-[#c7d2fe] dark:bg-indigo-800/50'
            : pct < 0.66
            ? 'bg-[#818cf8] dark:bg-indigo-600/70'
            : 'bg-[#6366F1]';
          return (
            <div key={h} className="flex flex-col items-center gap-0.5">
              <div
                className={`w-full h-8 rounded-md ${bg} transition-all duration-500 flex items-center justify-center`}
                style={{ opacity: visible ? 1 : 0, transitionDelay: `${h * 20}ms` }}
                title={`${h}:00 — ${val} randevu`}
              >
                {val > 0 && <span className="text-[9px] font-bold text-white/90">{val}</span>}
              </div>
              {h % 3 === 0 && <span className="text-[9px] text-gray-400">{h}:00</span>}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 justify-end">
        {['Az', 'Orta', 'Yoğun'].map((l, i) => (
          <div key={l} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm ${['bg-[#c7d2fe] dark:bg-indigo-800/50', 'bg-[#818cf8]', 'bg-[#6366F1]'][i]}`} />
            <span className="text-[10px] text-gray-400">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hizmet dağılımı ─────────────────────────────────────────────────────────
function ServiceDistribution({ data }: { data: { name: string; count: number; revenue: number; color: string }[] }) {
  const { ref, visible } = useInView();
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div ref={ref} className="space-y-3">
      {data.map((d, i) => {
        const pct = total > 0 ? (d.count / total) * 100 : 0;
        return (
          <div key={d.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[13px] text-gray-700 dark:text-gray-300">{d.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-400 tabular-nums">{d.revenue.toLocaleString('tr-TR')} ₺</span>
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 w-5 text-right tabular-nums">{d.count}</span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: visible ? `${pct}%` : '0%',
                  backgroundColor: d.color,
                  transitionDelay: `${i * 80}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Quick action card ────────────────────────────────────────────────────────
function QuickAction({ label, icon: Icon, iconColor, onClick }: {
  label: string; icon: React.ElementType; iconColor: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-left transition-colors hover:border-[#6366F1]/20 hover:bg-[#EEF2FF] dark:hover:border-[#6366F1]/30 dark:hover:bg-[#312E81]/20 w-full">
      <Icon size={20} className={iconColor} />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
    </button>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { appointments, services, employees } = useStore();
  const { reviews } = useReviewStore();
  const { users } = useUserAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'tickets' | 'summary'>('tickets');
  const today = isoToday();

  // Stats
  const total = appointments.length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;
  const pending = appointments.filter(a => a.status === 'pending').length;
  const noshow = appointments.filter(a => a.status === 'noshow').length;
  const todayAppts = appointments.filter(a => a.date === today && a.status !== 'cancelled').length;

  const totalRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((s, a) => s + (services.find(sv => sv.id === a.serviceId)?.price ?? 0), 0);

  // Month-over-month gelir karşılaştırması
  const thisMonthPrefix = today.slice(0, 7); // "2026-04"
  const lastMonthDate   = new Date(today); lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthPrefix = lastMonthDate.toISOString().slice(0, 7);

  const revenueThisMonth = appointments
    .filter(a => a.status === 'completed' && a.date.startsWith(thisMonthPrefix))
    .reduce((s, a) => s + (services.find(sv => sv.id === a.serviceId)?.price ?? 0), 0);
  const revenueLastMonth = appointments
    .filter(a => a.status === 'completed' && a.date.startsWith(lastMonthPrefix))
    .reduce((s, a) => s + (services.find(sv => sv.id === a.serviceId)?.price ?? 0), 0);
  const revenueMoM = revenueLastMonth > 0
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : 0;

  // 6-aylık gelir grafiği verisi
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - (5 - i));
    const prefix = d.toISOString().slice(0, 7);
    const revenue = appointments
      .filter(a => a.status === 'completed' && a.date.startsWith(prefix))
      .reduce((s, a) => s + (services.find(sv => sv.id === a.serviceId)?.price ?? 0), 0);
    const count = appointments.filter(a => a.date.startsWith(prefix)).length;
    return {
      label: d.toLocaleDateString('tr-TR', { month: 'short' }),
      revenue,
      count,
    };
  });

  // 7-day chart data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6);
    return {
      date: shortDay(d),
      opened: appointments.filter(a => a.date === d).length,
      closed: appointments.filter(a => a.date === d && (a.status === 'completed' || a.status === 'cancelled')).length,
    };
  });

  // Değerlendirme istatistikleri
  const reviewAvg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const reviewCount = reviews.length;
  const positiveReviews = reviews.filter(r => r.rating >= 4).length;
  const satisfactionRate = reviewCount > 0 ? Math.round((positiveReviews / reviewCount) * 100) : 0;

  // Status bar chart
  const statusBars = [
    { label: 'Onaylı', value: confirmed, color: 'bg-[#6366F1]', textColor: 'text-[#6366F1]' },
    { label: 'Bekliyor', value: pending, color: 'bg-amber-500', textColor: 'text-amber-500' },
    { label: 'Tamamlandı', value: completed, color: 'bg-emerald-500', textColor: 'text-emerald-500' },
    { label: 'İptal', value: cancelled, color: 'bg-red-400', textColor: 'text-red-400' },
  ];

  // Recent appointments
  const recent = [...appointments]
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
    .slice(0, 5);

  const nonCancelled = appointments.filter(a => a.status !== 'cancelled').length;
  const noShowRate = nonCancelled > 0 ? Math.round((noshow / nonCancelled) * 100) : 0;

  // Saatlik yoğunluk: tüm randevular için saat dağılımı
  const hourlyData = Array(24).fill(0) as number[];
  appointments.forEach(a => {
    const h = parseInt(a.startTime.split(':')[0], 10);
    if (h >= 0 && h < 24) hourlyData[h]++;
  });

  // Hizmet dağılımı
  const SERVICE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  const serviceDistData = services.map((svc, i) => {
    const appts = appointments.filter(a => a.serviceId === svc.id && a.status === 'completed');
    return {
      name: svc.name,
      count: appts.length,
      revenue: appts.reduce((s) => s + svc.price, 0),
      color: SERVICE_COLORS[i % SERVICE_COLORS.length],
    };
  }).sort((a, b) => b.count - a.count);

  // En sadık müşteriler (tamamlanan randevu sayısına göre)
  const customerMap = new Map<string, { name: string; phone: string; count: number; revenue: number }>();
  appointments.filter(a => a.status === 'completed').forEach(a => {
    const existing = customerMap.get(a.customerPhone);
    const price = services.find(s => s.id === a.serviceId)?.price ?? 0;
    if (existing) {
      existing.count++;
      existing.revenue += price;
    } else {
      customerMap.set(a.customerPhone, { name: a.customerName, phone: a.customerPhone, count: 1, revenue: price });
    }
  });
  const topCustomers = [...customerMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">İstatistikler</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Hoş geldiniz, Admin</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab toggle */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800 flex-1 sm:flex-none">
            <button onClick={() => setTab('tickets')}
              className={`flex-1 sm:flex-none rounded-lg px-3 sm:px-4 py-1.5 text-sm font-medium transition-all duration-200 ${tab === 'tickets' ? 'bg-[#6366F1] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
              Randevular
            </button>
            <button onClick={() => setTab('summary')}
              className={`flex-1 sm:flex-none rounded-lg px-3 sm:px-4 py-1.5 text-sm font-medium transition-all duration-200 ${tab === 'summary' ? 'bg-[#6366F1] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
              Özet
            </button>
          </div>
          <button
            onClick={() => navigate('/admin/appointments')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-3 sm:px-4 py-2 text-sm font-medium text-white shadow-sm shadow-[#6366F1]/30 hover:bg-[#4F46E5] active:scale-[0.98] transition-all shrink-0"
          >
            <CirclePlus size={16} />
            <span className="hidden sm:inline">Yeni Randevu</span>
          </button>
        </div>
      </div>

      {/* Tab: Randevular */}
      <div className={`transition-all duration-300 ease-out ${tab === 'tickets' ? 'opacity-100 translate-y-0' : 'pointer-events-none absolute opacity-0 translate-y-3'}`}>
        {tab === 'tickets' && (
          <div className="space-y-6">
            {/* Stat cards row 1 */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 [&>*:last-child:nth-child(odd)]:col-span-2 [&>*:last-child:nth-child(odd)]:md:col-span-1">
              <StatCard label="Toplam Randevu" value={total} icon={Ticket} iconBg="bg-[#EEF2FF] dark:bg-[#312E81]/30" iconColor="text-[#6366F1]" />
              <StatCard label="Onaylı" value={confirmed} icon={CalendarCheck} iconBg="bg-blue-50 dark:bg-blue-900/20" iconColor="text-blue-500" />
              <StatCard label="Tamamlandı" value={completed} icon={CircleCheckBig} iconBg="bg-emerald-50 dark:bg-emerald-900/20" iconColor="text-emerald-500" />
              <StatCard label="Bekliyor" value={pending} icon={Clock} iconBg="bg-amber-50 dark:bg-amber-900/20" iconColor="text-amber-500" />
              <StatCard label="İptal" value={cancelled} icon={CircleX} iconBg="bg-red-50 dark:bg-red-900/20" iconColor="text-red-400" />
              <StatCard label="No-Show" value={noshow} icon={AlertCircle} iconBg="bg-orange-50 dark:bg-orange-900/20" iconColor="text-orange-500" />
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Son 7 Günlük Randevu Akışı</h3>
                  <span className="rounded-full bg-[#EEF2FF] dark:bg-[#312E81]/30 px-2 py-0.5 text-xs font-medium text-[#6366F1] dark:text-indigo-400">Bu Hafta</span>
                </div>
                <LineChart data={last7} />
              </Card>

              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Durum Dağılımı</h3>
                  <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">Tüm Zamanlar</span>
                </div>
                <BarChart data={statusBars} />
              </Card>
            </div>

            {/* 6 Aylık Gelir Grafiği */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Aylık Gelir</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Son 6 ay</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black tabular-nums text-[#6366F1]">{revenueThisMonth.toLocaleString('tr-TR')} ₺</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    {revenueMoM !== 0 && (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${revenueMoM > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-red-500 bg-red-50 dark:bg-red-900/30'}`}>
                        {revenueMoM > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {revenueMoM > 0 ? '+' : ''}{revenueMoM}%
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">bu ay</span>
                  </div>
                </div>
              </div>
              <RevenueChart data={last6Months} />
            </Card>

            {/* Quick actions + summary progress */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Hızlı İşlemler</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <QuickAction label="Yeni Randevu Oluştur" icon={CirclePlus} iconColor="text-[#6366F1]" onClick={() => navigate('/admin/appointments')} />
                  <QuickAction label="Bekleyen Randevular" icon={Clock} iconColor="text-amber-500" onClick={() => navigate('/admin/appointments')} />
                  <QuickAction label="Personel Yönetimi" icon={Users} iconColor="text-orange-500" onClick={() => navigate('/admin/staff')} />
                  <QuickAction label="Hizmet Yönetimi" icon={Ticket} iconColor="text-[#6366F1]" onClick={() => navigate('/admin/services')} />
                </div>
              </Card>

              <Card>
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Randevu Özeti</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Onaylı', count: confirmed, color: 'bg-[#6366F1]' },
                    { label: 'Bekliyor', count: pending, color: 'bg-amber-500' },
                    { label: 'Tamamlandı', count: completed, color: 'bg-emerald-500' },
                    { label: 'İptal', count: cancelled, color: 'bg-red-400' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{item.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                        <div className={`h-1.5 rounded-full ${item.color} transition-all duration-700`}
                          style={{ width: total > 0 ? `${(item.count / total) * 100}%` : '0%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Tab: Özet */}
      <div className={`transition-all duration-300 ease-out ${tab === 'summary' ? 'opacity-100 translate-y-0' : 'pointer-events-none absolute opacity-0 translate-y-3'}`}>
        {tab === 'summary' && (
          <div className="space-y-4">

            {/* ── Hero metrik kartları ── */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Bugünkü randevular — tam genişlik hero */}
              <div className="sm:col-span-1 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#818cf8] p-5 text-white shadow-lg shadow-[#6366F1]/25 flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Bugün</p>
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <CalendarCheck size={16} className="text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-4xl font-black tabular-nums leading-none mt-3">{todayAppts}</p>
                  <p className="text-[11px] text-white/60 mt-1">randevu</p>
                </div>
              </div>

              {/* Toplam gelir */}
              <div className="sm:col-span-1 rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.06] p-5 flex flex-col justify-between min-h-[110px] shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Gelir</p>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                    <TrendingUp size={16} className="text-emerald-500" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black tabular-nums text-gray-900 dark:text-white mt-3 truncate">
                    {totalRevenue.toLocaleString('tr-TR')} <span className="text-lg font-bold">₺</span>
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {revenueMoM !== 0 && (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${revenueMoM > 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' : 'text-red-500 bg-red-50 dark:bg-red-900/30'}`}>
                        {revenueMoM > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {revenueMoM > 0 ? '+' : ''}{revenueMoM}%
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">geçen aya göre</span>
                  </div>
                </div>
              </div>

              {/* No-show oranı */}
              <div className="sm:col-span-1 rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.06] p-5 flex flex-col justify-between min-h-[110px] shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">No-Show</p>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                    <AlertCircle size={16} className="text-amber-500" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black tabular-nums text-gray-900 dark:text-white mt-3">
                    %{noShowRate}
                  </p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-1.5 rounded-full bg-amber-400 transition-all duration-700"
                      style={{ width: `${Math.min(noShowRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Değerlendirme özet kartı ── */}
            <div className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.06] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star size={15} className="text-amber-400 fill-amber-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Müşteri Değerlendirmeleri</h3>
                </div>
                <button onClick={() => navigate('/admin/reviews')}
                  className="text-xs text-[#6366F1] font-semibold hover:underline">
                  Tümü →
                </button>
              </div>
              {reviewCount === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Henüz değerlendirme yok.</p>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="text-center shrink-0">
                    <p className="text-4xl font-black text-amber-500 tabular-nums leading-none">{reviewAvg.toFixed(1)}</p>
                    <div className="flex items-center justify-center gap-0.5 mt-1.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={12} className={i < Math.round(reviewAvg) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'} />
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{reviewCount} yorum</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map(r => {
                      const cnt = reviews.filter(rv => rv.rating === r).length;
                      const pct = reviewCount > 0 ? (cnt / reviewCount) * 100 : 0;
                      return (
                        <div key={r} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 w-2">{r}</span>
                          <Star size={9} className="text-amber-400 fill-amber-400 shrink-0" />
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400 w-4 text-right tabular-nums">{cnt}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center shrink-0">
                    <p className="text-2xl font-black text-emerald-500">%{satisfactionRate}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">memnuniyet</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── İşletme sayaçları (pill row) ── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Personel', value: employees.length, icon: UserCog, color: 'text-[#6366F1]', bg: 'bg-[#EEF2FF] dark:bg-[#312E81]/30' },
                { label: 'Hizmet', value: services.length, icon: Ticket, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                { label: 'Müşteri', value: new Set(appointments.map(a => a.customerPhone)).size, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.06] p-4 flex flex-col items-center gap-2 shadow-sm">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon size={17} className={color} />
                  </div>
                  <p className="text-xl font-black tabular-nums text-gray-900 dark:text-white leading-none">{value}</p>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>

            {/* ── Randevu dağılımı (progress bar listesi) ── */}
            <div className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.06] p-5 shadow-sm space-y-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Durum Dağılımı</p>
              {[
                { label: 'Onaylı',     count: confirmed, color: 'bg-[#6366F1]',  pill: 'bg-[#EEF2FF] text-[#6366F1] dark:bg-[#312E81]/30 dark:text-indigo-400' },
                { label: 'Bekliyor',  count: pending,   color: 'bg-amber-400',   pill: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
                { label: 'Tamamlandı',count: completed, color: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
                { label: 'İptal',     count: cancelled, color: 'bg-red-400',     pill: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400' },
                { label: 'Gelmedi',   count: noshow,    color: 'bg-orange-400',  pill: 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400' },
              ].map(item => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-600 dark:text-gray-400">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.pill}`}>{item.count}</span>
                      <span className="text-[11px] text-gray-400 w-8 text-right tabular-nums">
                        {total > 0 ? `%${Math.round((item.count / total) * 100)}` : '%0'}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-700`}
                      style={{ width: total > 0 ? `${(item.count / total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Saatlik yoğunluk haritası ── */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame size={15} className="text-[#6366F1]" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Saatlik Yoğunluk</h3>
                </div>
                <span className="text-[10px] text-gray-400">Tüm zamanlar</span>
              </div>
              <HourHeatmap data={hourlyData} />
            </Card>

            {/* ── Hizmet dağılımı + En sadık müşteriler ── */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Ticket size={15} className="text-[#6366F1]" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Hizmet Dağılımı</h3>
                </div>
                <ServiceDistribution data={serviceDistData} />
              </Card>

              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Star size={15} className="text-amber-500 fill-amber-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">En Sadık Müşteriler</h3>
                </div>
                <div className="space-y-3">
                  {topCustomers.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Henüz tamamlanan randevu yok.</p>
                  )}
                  {topCustomers.map((c, i) => {
                    const user = users.find(u => u.phone === c.phone);
                    const pts = user?.loyaltyPoints ?? 0;
                    return (
                      <div key={c.phone} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0 ${
                          i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-[#6366F1]/60'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate leading-tight">{c.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400">{c.count} randevu</span>
                            {pts > 0 && (
                              <span className="text-[10px] text-amber-500 font-medium flex items-center gap-0.5">
                                <Star size={9} className="fill-amber-400" />{pts.toLocaleString('tr-TR')} p
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300 tabular-nums shrink-0">
                          {c.revenue.toLocaleString('tr-TR')} ₺
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* ── Son randevular ── */}
            <div className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/[0.06] overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Son Randevular</h3>
                <button onClick={() => navigate('/admin/appointments')}
                  className="text-xs text-[#6366F1] font-semibold hover:underline">
                  Tümü →
                </button>
              </div>
              {recent.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-10">Henüz randevu yok.</p>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {recent.map(appt => {
                    const service = services.find(s => s.id === appt.serviceId);
                    const employee = employees.find(e => e.id === appt.employeeId);
                    return (
                      <div key={appt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#a78bfa] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                          {appt.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate leading-tight">{appt.customerName}</p>
                          <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">{service?.name} · {employee?.name}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <StatusPill status={appt.status} />
                          <p className="text-[10px] text-gray-400 font-mono">
                            {new Date(appt.date).toLocaleDateString('tr-TR', { day:'numeric', month:'short' })} {appt.startTime}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
