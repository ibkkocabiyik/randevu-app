import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Scissors, Sun, Moon } from 'lucide-react';
import { useUserAuth } from '../../store/userAuth';
import { useTheme } from '../../store/theme';
import { cn } from '../../lib/utils';

const DEMO_USERS = [
  { name: 'Ali Yılmaz',   email: 'ali@example.com',    password: 'demo1234' },
  { name: 'Fatma Kaya',   email: 'fatma@example.com',  password: 'demo1234' },
  { name: 'Emre Demir',   email: 'emre@example.com',   password: 'demo1234' },
  { name: 'Zeynep Çelik', email: 'zeynep@example.com', password: 'demo1234' },
  { name: 'Murat Şahin',  email: 'murat@example.com',  password: 'demo1234' },
];

const inputCls = (icon = true) =>
  cn(
    'w-full rounded-xl border border-gray-200 dark:border-white/10',
    'bg-gray-50 dark:bg-white/[0.06] py-2.5 pr-3 text-sm',
    'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25',
    'outline-none transition-colors',
    'focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 dark:focus:border-[#6366F1]/60',
    icon ? 'pl-9' : 'pl-3'
  );

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label: string;
  rightEl?: React.ReactNode;
}
function Field({ label, icon, rightEl, className, ...props }: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/25 pointer-events-none">
            {icon}
          </span>
        )}
        <input className={cn(inputCls(!!icon), className)} {...props} />
        {rightEl && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</span>
        )}
      </div>
    </div>
  );
}

function LoginForm() {
  const login = useUserAuth(s => s.login);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nextPath = searchParams.get('next') ?? '/my-appointments';

  function fillDemo(u: typeof DEMO_USERS[0]) {
    setEmailOrPhone(u.email);
    setPassword(u.password);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { ok, error: err } = await login(emailOrPhone, password);
    setLoading(false);
    if (ok) navigate(nextPath, { replace: true });
    else setError(err ?? 'Giriş başarısız.');
  }

  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="E-posta veya Telefon"
          icon={<Mail size={14} />}
          type="text"
          required
          autoComplete="email"
          placeholder="ornek@mail.com veya 05xx..."
          value={emailOrPhone}
          onChange={e => setEmailOrPhone(e.target.value)}
        />
        <Field
          label="Şifre"
          icon={<Lock size={14} />}
          type={showPass ? 'text' : 'password'}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          rightEl={
            <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white/50 transition-colors">
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
        />

        {error && (
          <p className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-500">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#4F46E5] active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none">
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
          Giriş Yap
        </button>
      </form>

      <div className="rounded-xl border border-indigo-100 dark:border-indigo-500/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDemo(v => !v)}
          className="flex w-full items-center justify-between px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
        >
          <span className="text-[0.75rem] font-semibold text-[#6366F1] dark:text-indigo-400">Test hesaplarını göster</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className={`text-[#6366F1] dark:text-indigo-400 transition-transform duration-200 ${showDemo ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div
          className="border-t border-indigo-100 dark:border-indigo-500/20 overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: showDemo ? '600px' : '0px', opacity: showDemo ? 1 : 0 }}
        >
          <div className="flex flex-col gap-1.5 p-3 bg-indigo-50/50 dark:bg-indigo-500/5">
            {DEMO_USERS.map(u => (
              <button
                key={u.email}
                type="button"
                onClick={() => fillDemo(u)}
                className="flex items-center justify-between rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-white/5 px-3 py-2 text-left transition hover:border-indigo-400 dark:hover:border-indigo-400/60"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-white">{u.name}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{u.email}</p>
                </div>
                <span className="text-[11px] font-medium text-[#6366F1] dark:text-indigo-400">Doldur →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterForm() {
  const register = useUserAuth(s => s.register);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const nextPath = searchParams.get('next') ?? '/my-appointments';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Şifre en az 6 karakter olmalıdır.'); return; }
    setLoading(true);
    const { ok, error: err } = await register(form);
    setLoading(false);
    if (ok) navigate(nextPath, { replace: true });
    else setError(err ?? 'Kayıt başarısız.');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Ad Soyad" icon={<User size={14} />} type="text" required
        placeholder="Adınız Soyadınız" value={form.name} onChange={set('name')} />
      <Field label="E-posta" icon={<Mail size={14} />} type="email" required
        autoComplete="email" placeholder="ornek@mail.com" value={form.email} onChange={set('email')} />
      <Field label="Telefon" icon={<Phone size={14} />} type="tel" required
        placeholder="05xx xxx xx xx" value={form.phone} onChange={set('phone')} />
      <Field label="Şifre" icon={<Lock size={14} />}
        type={showPass ? 'text' : 'password'} required
        autoComplete="new-password" placeholder="En az 6 karakter"
        value={form.password} onChange={set('password')}
        rightEl={
          <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white/50 transition-colors">
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        }
      />

      {error && (
        <p className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#4F46E5] active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none">
        {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
        Hesap Oluştur
      </button>
    </form>
  );
}

function AuthThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:text-white/50 dark:hover:bg-white/10 transition-colors"
      aria-label="Tema değiştir"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login';
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');
  const nextQs = next ? `?next=${encodeURIComponent(next)}` : '';

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#F0F2FF] dark:bg-[#0f1117]">
      <div className="relative z-10 hidden lg:flex lg:w-1/2 flex-col justify-between p-14">
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.07) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div aria-hidden className="pointer-events-none absolute left-0 top-0 h-[70%] w-[60%] rounded-full"
          style={{ background: 'radial-gradient(ellipse,rgba(99,102,241,0.12),transparent 70%)', filter: 'blur(40px)' }} />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6366F1] flex items-center justify-center shadow-lg shadow-[#6366F1]/30">
            <Scissors size={17} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-800 dark:text-white/90">Randevu CRM</span>
        </div>
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6366F1] mb-3">
            {isLogin ? 'Tekrar hoş geldiniz' : 'Hesap oluşturun'}
          </p>
          <h1 style={{ fontSize: 'clamp(2rem,3.5vw,3rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1.5rem' }}
            className="text-gray-900 dark:text-white">
            {isLogin ? (
              <><span>Randevunuzu</span><br /><span style={{ backgroundImage: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>kolayca yönetin</span></>
            ) : (
              <><span>Dakikalar içinde</span><br /><span style={{ backgroundImage: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>randevu alın</span></>
            )}
          </h1>
          <p className="text-gray-600 dark:text-white/45 max-w-[380px]" style={{ fontSize: '0.9375rem', lineHeight: 1.7 }}>
            {isLogin
              ? 'Hesabınıza giriş yaparak tüm randevularınızı takip edin, iptal edin veya yeniden planlayın.'
              : 'Ücretsiz hesap oluşturun; randevularınızı takip edin, favori hizmetlerinizi kaydedin.'}
          </p>
          <div className="mt-10 flex flex-col gap-3.5">
            {[
              { e: '📅', t: 'Randevularınızı tek ekrandan takip edin' },
              { e: '⚡', t: 'Maksimum 3 adımda randevu alın' },
              { e: '🔔', t: 'Hatırlatma bildirimleri alın' },
              { e: '⭐', t: 'Favori hizmetlerinizi kaydedin' },
            ].map(f => (
              <div key={f.e} className="flex items-center gap-3">
                <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10">
                  {f.e}
                </div>
                <span className="text-sm text-gray-600 dark:text-white/60">{f.t}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-gray-400 dark:text-white/20">© 2026 Randevu CRM.</p>
      </div>

      <div aria-hidden className="hidden lg:block w-px self-stretch"
        style={{ background: 'linear-gradient(to bottom,transparent,rgba(99,102,241,0.25),transparent)' }} />

      <div className="flex flex-1 flex-col items-center justify-center p-6 relative">
        <AuthThemeToggle />
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <div className="w-10 h-10 rounded-2xl bg-[#6366F1] flex items-center justify-center shadow-lg shadow-[#6366F1]/30 mb-3">
            <Scissors size={18} className="text-white" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">Randevu CRM</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isLogin ? 'Hoş geldiniz' : 'Hesap oluşturun'}
          </p>
        </div>

        <div className="w-full max-w-[28rem] rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] dark:backdrop-blur-xl p-7 shadow-xl shadow-gray-200/60 dark:shadow-none">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6366F1]">
              {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/40">
              {isLogin ? 'Hesabınıza erişin' : 'Birkaç saniyede hesabınızı oluşturun'}
            </p>
          </div>

          {isLogin ? <LoginForm /> : <RegisterForm />}

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.08]" />
            <span className="text-[0.6875rem] font-semibold tracking-[0.08em] text-gray-400 dark:text-white/25">VEYA</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.08]" />
          </div>

          {isLogin ? (
            <div className="mt-5 flex flex-col gap-3">
              <p className="text-center text-sm text-gray-500 dark:text-white/40">
                Hesabınız yok mu?{' '}
                <Link to={`/register${nextQs}`} className="font-semibold text-[#6366F1] hover:text-[#4F46E5] dark:text-indigo-400 transition-colors">
                  Kayıt olun
                </Link>
              </p>
              <Link
                to="/admin/login"
                className="flex w-full items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Yönetim Girişi
              </Link>
            </div>
          ) : (
            <p className="mt-5 text-center text-sm text-gray-500 dark:text-white/40">
              Zaten hesabınız var mı?{' '}
              <Link to={`/login${nextQs}`} className="font-semibold text-[#6366F1] hover:text-[#4F46E5] dark:text-indigo-400 transition-colors">
                Giriş yapın
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}