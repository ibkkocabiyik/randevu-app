import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Scissors } from 'lucide-react';
import { useAuth } from '../../store/auth';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);

  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login('', password);
    setLoading(false);
    if (ok) {
      navigate('/admin', { replace: true });
    } else {
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
          </form>
        </div>
      </div>
    </div>
  );
}
