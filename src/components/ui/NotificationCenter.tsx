import { useEffect, useRef, useState } from 'react';
import { Bell, CalendarDays, X, CheckCheck, AlertCircle, Star } from 'lucide-react';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';
import type { Notification } from '../../types';

function icon(type: Notification['type']) {
  switch (type) {
    case 'booking_confirmed':  return <CalendarDays size={15} className="text-emerald-500" />;
    case 'booking_cancelled':  return <AlertCircle size={15} className="text-red-400" />;
    case 'booking_reminder':   return <Bell size={15} className="text-[#6366F1]" />;
    case 'review_request':     return <Star size={15} className="text-amber-400" />;
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Az önce';
  if (m < 60) return `${m}d önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}s önce`;
  return `${Math.floor(h / 24)}g önce`;
}

export function NotificationCenter() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full bg-[#6366F1] text-[10px] font-bold text-white flex items-center justify-center px-1 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1d27] shadow-xl shadow-gray-200/60 dark:shadow-black/40 z-50 overflow-hidden"
          style={{ animation: 'notif-drop 0.18s cubic-bezier(0.34,1.4,0.64,1)' }}>
          <style>{`@keyframes notif-drop{from{opacity:0;transform:translateY(-8px) scale(0.97)}to{opacity:1;transform:none}}`}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/60">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Bildirimler {unread > 0 && <span className="ml-1 text-xs text-[#6366F1]">({unread} yeni)</span>}
            </p>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllNotificationsRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 hover:text-[#6366F1] hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                  <CheckCheck size={13} />
                  Tümünü oku
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Bell size={20} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm text-gray-400">Henüz bildirim yok</p>
              </div>
            ) : (
              notifications.map(n => (
                <button key={n.id} onClick={() => markNotificationRead(n.id)}
                  className={cn('w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors border-b border-gray-50 dark:border-gray-800/40 last:border-0',
                    !n.read && 'bg-indigo-50/50 dark:bg-indigo-900/10')}>
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                    n.type === 'booking_confirmed' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                    n.type === 'booking_cancelled' ? 'bg-red-50 dark:bg-red-900/20' :
                    n.type === 'review_request'   ? 'bg-amber-50 dark:bg-amber-900/20' :
                    'bg-indigo-50 dark:bg-indigo-900/20')}>
                    {icon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm leading-snug', n.read ? 'text-gray-600 dark:text-gray-400' : 'font-semibold text-gray-900 dark:text-white')}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-[#6366F1] mt-1.5 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
