import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Scissors } from 'lucide-react';
import { useAuth } from '../../store/auth';
import { useData } from '../../lib/data';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);

  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login('', password);
    if (ok) {
      await useData.getState().fetchAll();
      setLoading(false);
      navigate('/admin', { replace: true });
    } else {
      setLoading(false);
      setError('Şifre hatalı.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef0fb] dark:bg-[#0f1117] p-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-white dark:bg-[#1a1d27] rounded-3xl shadow-xl shadow-indigo-100/60 dark:shadow-black/40 px-8 py-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-300/40">
              <Scissors size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Yönetim Paneli</h1>
            <p className="text-sm text-gray-400 mt-1">Admin şifrenizi girin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[.98] text-white text-sm font-semibold shadow-lg shadow-indigo-300/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Giriş Yap
            </button>

            <div className="rounded-xl border border-indigo-100 dark:border-indigo-500/20 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDemo(v => !v)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
              >
                <span className="text-[0.75rem] font-semibold text-indigo-600 dark:text-indigo-400">Test hesaplarını göster</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14" height="14"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  className={`text-indigo-500 dark:text-indigo-400 transition-transform duration-200 ${showDemo ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div
                className="border-t border-indigo-100 dark:border-indigo-500/20 overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: showDemo ? '120px' : '0px', opacity: showDemo ? 1 : 0 }}
              >
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-500/5">
                  <button
                    type="button"
                    onClick={() => setPassword('admin123')}
                    className="flex w-full items-center justify-between rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-white/5 px-3 py-2 text-left transition hover:border-indigo-400 dark:hover:border-indigo-400/60"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-white">Yönetici</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">Şifre: admin123</p>
                    </div>
                    <span className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400">Doldur →</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.08]" />
            <span className="text-[0.6875rem] font-semibold tracking-[0.08em] text-gray-400 dark:text-white/25">VEYA</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.08]" />
          </div>

          <Link
            to="/login"
            className="mt-4 flex w-full items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Müşteri Girişi
          </Link>
        </div>
      </div>
    </div>
  );
}
