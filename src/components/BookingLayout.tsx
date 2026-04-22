import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Scissors, User, CalendarDays, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { useUserAuth } from '../store/userAuth';
import { useSwal } from '../lib/swal';
import { useTheme } from '../store/theme';
import { NotificationCenter } from './ui/NotificationCenter';
import { PageTransition } from './PageTransition';

const STEPS = [
  { path: '/book',          label: 'Hizmet' },
  { path: '/book/employee', label: 'Berber' },
  { path: '/book/datetime', label: 'Tarih & Saat' },
  { path: '/book/confirm',  label: 'Onay' },
];

/* ── Avatar dropdown ─────────────────────────────────────────────── */
function UserMenu({ initials }: { initials: string }) {
  const { currentUser, logout } = useUserAuth();
  const navigate = useNavigate();
  const swal = useSwal();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  async function handleLogout() {
    setOpen(false);
    const ok = await swal.confirm({ title: 'Çıkış yapmak istiyor musunuz?', confirmText: 'Evet, çık' });
    if (!ok) return;
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#a78bfa] flex items-center justify-center text-xs font-bold text-white shadow-sm shadow-[#6366F1]/30 active:scale-95 transition-transform"
      >
        {initials || <User size={14} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-10 w-56 rounded-2xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-[#1a1d27] shadow-2xl shadow-gray-300/40 dark:shadow-black/50 overflow-hidden z-50"
            style={{ animation: 'um-drop 0.18s cubic-bezier(0.34,1.4,0.64,1)' }}
          >
            <style>{`@keyframes um-drop{from{opacity:0;transform:translateY(-8px) scale(0.95)}to{opacity:1;transform:none}}`}</style>
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{currentUser?.name}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{currentUser?.email}</p>
            </div>
            <div className="py-1">
              <Link to="/my-appointments" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                <CalendarDays size={15} className="text-gray-400" /> Randevularım
              </Link>
              <Link to="/profile" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                <Settings size={15} className="text-gray-400" /> Profil Ayarları
              </Link>
            </div>
            <div className="border-t border-gray-100 dark:border-white/[0.06] py-1">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <LogOut size={15} /> Çıkış Yap
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
      aria-label="Tema değiştir"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

/* ── Ana layout ──────────────────────────────────────────────────── */
export default function BookingLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const currentStep = STEPS.findIndex(s => s.path === pathname);
  const isBookingStep = currentStep >= 0;
  const currentUser = useUserAuth(s => s.currentUser);
  const initials = currentUser
    ? currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    /* h-[100dvh] — klavye açıkken küçülen gerçek viewport yüksekliği */
    <div className="h-[100dvh] bg-[#f4f5fb] dark:bg-[#0f1117] flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="shrink-0 bg-white dark:bg-[#1a1d27] border-b border-gray-100 dark:border-gray-800/60 safe-area-top">
        <div className="max-w-2xl mx-auto px-4 h-14 grid grid-cols-[1fr_auto_1fr] items-center">

          {/* Sol — Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 dark:text-white justify-self-start">
            <div className="w-8 h-8 rounded-xl bg-[#6366F1] flex items-center justify-center shadow-sm shadow-[#6366F1]/30">
              <Scissors size={15} className="text-white" />
            </div>
            <span className="text-[15px]">Randevu</span>
          </Link>

          {/* Orta — boş, grid dengesini korur */}
          <div />

          {/* Sağ — Nav */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 justify-self-end">
              <ThemeToggle />
              <NotificationCenter />
              <UserMenu initials={initials} />
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-self-end">
              <ThemeToggle />
              <Link to="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#6366F1] transition-colors">
                Giriş
              </Link>
              <Link to="/register" className="rounded-lg bg-[#6366F1] px-3 py-1.5 text-white text-xs font-semibold hover:bg-[#4F46E5] transition-colors">
                Kayıt
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ── Scrollable content ──────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-6 min-h-full">

          {/* Step indicator — booking adımlarında içerik üstünde */}
          {isBookingStep && (
            <div className="flex items-center mb-6">
              {STEPS.map((s, i) => (
                <div key={s.path} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                      i < currentStep
                        ? 'bg-[#6366F1] text-white'
                        : i === currentStep
                        ? 'bg-[#6366F1] text-white ring-4 ring-[#6366F1]/20'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}>
                      {i < currentStep ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] font-medium transition-colors ${
                      i <= currentStep ? 'text-[#6366F1]' : 'text-gray-400'
                    }`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full mx-2 mb-4 transition-colors duration-300 ${
                      i < currentStep ? 'bg-[#6366F1]' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}

          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
