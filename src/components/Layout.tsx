import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, Scissors } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <Scissors size={20} className="text-indigo-500" />
            <span>Randevu</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" label="Randevu Al" icon={<CalendarDays size={16} />} active={!isAdmin} />
            <NavLink to="/admin" label="Yönetim" icon={<LayoutDashboard size={16} />} active={isAdmin} />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
          : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
