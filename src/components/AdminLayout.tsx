import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { PageTransition } from './PageTransition';
import { useAuth } from '../store/auth';
import { useTheme } from '../store/theme';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  UserCog,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Star,
} from 'lucide-react';
import { cn } from '../lib/utils';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/appointments', label: 'Randevular', icon: CalendarDays },
  { to: '/admin/customers', label: 'Müşteriler', icon: Users },
  { to: '/admin/services', label: 'Hizmetler', icon: Scissors },
  { to: '/admin/staff', label: 'Personel', icon: UserCog },
  { to: '/admin/reviews', label: 'Yorumlar', icon: Star },
];

/* ── Sidebar içeriği (desktop + mobile drawer paylaşır) ──────────── */
function SidebarContent({ onNav }: { onNav?: () => void }) {
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 dark:border-white/[0.06] shrink-0">
        <div className="w-8 h-8 rounded-xl bg-[#6366F1] flex items-center justify-center shadow-md shadow-[#6366F1]/30">
          <Scissors size={15} className="text-white" />
        </div>
        <p className="text-sm font-bold text-gray-900 dark:text-white/90 leading-tight">Randevu CRM</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNav}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/25'
                  : 'text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white/90'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex items-center gap-3">
                  <Icon size={17} />
                  {label}
                </span>
                {!isActive && (
                  <ChevronRight size={13} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade card */}
      <div className="mx-3 mb-3 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#a78bfa] p-4 text-white shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles size={14} />
          <span className="text-xs font-semibold tracking-wide">Pro Plana Geç</span>
        </div>
        <p className="text-[11px] text-white/70 mb-3 leading-relaxed">SMS bildirim, online ödeme ve sınırsız müşteri.</p>
        <button className="w-full bg-white text-[#6366F1] text-xs font-bold py-1.5 rounded-lg hover:bg-white/90 transition-colors">
          Yükselt →
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-5 py-4 text-sm text-gray-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 border-t border-gray-100 dark:border-white/[0.06] transition-colors shrink-0"
      >
        <LogOut size={16} />
        Çıkış Yap
      </button>
    </div>
  );
}

/* ── Mobile bottom tab bar ───────────────────────────────────────── */
const BOTTOM_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/appointments', label: 'Randevular', icon: CalendarDays },
  { to: '/admin/customers', label: 'Müşteriler', icon: Users },
  { to: '/admin/staff', label: 'Personel', icon: UserCog },
  { to: '/admin/reviews', label: 'Yorumlar', icon: Star },
];

function BottomTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-[#1a1d27]/95 backdrop-blur-md border-t border-gray-100 dark:border-white/[0.06] flex">
      {BOTTOM_NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors relative',
              isActive
                ? 'text-[#6366F1]'
                : 'text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#6366F1]" />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/* ── Ana layout ──────────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { dark, toggle } = useTheme();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sayfa değişince drawer'ı kapat
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Drawer açıkken body scroll'unu kilitle
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const pageTitle = NAV.find(n => {
    if (n.end) return location.pathname === n.to;
    return location.pathname.startsWith(n.to);
  })?.label ?? 'Admin';

  return (
    <div className="flex h-[100dvh] bg-[#F0F2FF] dark:bg-[#0f1117] overflow-hidden">

      {/* ── Desktop sidebar ──────────────────────────────────── */}
      <aside className="hidden md:flex w-[220px] shrink-0 flex-col bg-white dark:bg-[#1a1d27] border-r border-gray-100 dark:border-white/[0.06]">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer overlay ────────────────────────────── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onClick={() => setDrawerOpen(false)}
        >
          {/* Scrim */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            style={{ animation: 'scrim-in 0.2s ease' }} />

          {/* Panel */}
          <div
            className="relative w-[260px] bg-white dark:bg-[#1a1d27] h-full shadow-2xl"
            style={{ animation: 'drawer-in 0.25s cubic-bezier(0.34,1.2,0.64,1)' }}
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent onNav={() => setDrawerOpen(false)} />
          </div>

          {/* Close button top-right of panel */}
          <button
            className="absolute top-4 left-[268px] w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes scrim-in { from { opacity:0 } to { opacity:1 } }
        @keyframes drawer-in { from { transform:translateX(-100%) } to { transform:translateX(0) } }
      `}</style>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 bg-white dark:bg-[#1a1d27] border-b border-gray-100 dark:border-white/[0.06] shrink-0">

          {/* Left: hamburger (mobile) + date (desktop) */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:text-white/50 dark:hover:bg-white/10 transition-colors"
              onClick={() => setDrawerOpen(true)}
              aria-label="Menüyü aç"
            >
              <Menu size={20} />
            </button>

            {/* Mobile: page title */}
            <p className="md:hidden text-[15px] font-bold text-gray-900 dark:text-white">{pageTitle}</p>

            {/* Desktop: date */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400 dark:text-white/30">
              <CalendarDays size={15} />
              <span>
                {new Date().toLocaleDateString('tr-TR', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Right: dark toggle + avatar */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggle}
              className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-white/50 dark:hover:bg-white/10 transition-colors"
              aria-label="Tema değiştir"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-100 dark:border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#a78bfa] flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">A</span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-white/70">Admin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────── */}
      <BottomTabBar />
    </div>
  );
}
