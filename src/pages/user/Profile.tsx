import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../store/userAuth';
import type { NotificationPreferences } from '../../store/userAuth';
import { useData } from '../../lib/data';
import { useSwal } from '../../lib/swal';
import { Card } from '../../components/ui/Card';
import {
  User, Mail, Phone, Lock, LogOut, Save, Eye, EyeOff,
  CalendarCheck, TrendingUp, Heart, Check, Bell, BellOff, Star,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getLoyaltyTier, LOYALTY_TIERS } from '../../types';

const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] dark:focus:border-[#6366F1]/60 transition';

export default function Profile() {
  const { currentUser, updateProfile, logout } = useUserAuth();
  const { services, appointments } = useData();
  const navigate = useNavigate();
  const swal = useSwal();

  const [name, setName]   = useState(currentUser?.name  ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [favs, setFavs]   = useState<string[]>(currentUser?.favoriteServiceIds ?? []);

  const DEFAULT_PREFS: NotificationPreferences = {
    bookingConfirmed: true, bookingCancelled: true,
    bookingReminder: true,  reviewRequest: true,
  };
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    currentUser?.notificationPrefs ?? DEFAULT_PREFS
  );

  const [curPass, setCurPass]     = useState('');
  const [newPass, setNewPass]     = useState('');
  const [showCur, setShowCur]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [passError, setPassError] = useState('');
  const [saved, setSaved]         = useState(false);

  async function togglePref(key: keyof NotificationPreferences) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await updateProfile({ notificationPrefs: next });
  }

  // Kullanıcı istatistikleri
  const myAppts   = appointments.filter(a => currentUser && a.customerPhone === currentUser.phone);
  const completed = myAppts.filter(a => a.status === 'completed').length;
  const totalSpent = myAppts
    .filter(a => a.status === 'completed')
    .reduce((s, a) => s + (services.find(sv => sv.id === a.serviceId)?.price ?? 0), 0);
  const upcoming = myAppts.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.date >= today && a.status !== 'cancelled' && a.status !== 'completed';
  }).length;

  function toggleFav(id: string) {
    const next = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id];
    setFavs(next);
    updateProfile({ favoriteServiceIds: next });
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    await updateProfile({ name, email, phone, favoriteServiceIds: favs });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    swal.toast({ icon: 'success', title: 'Profil güncellendi' });
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPassError('');
    if (newPass.length < 6) {
      setPassError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    // Şifre değiştirme henüz backend'de desteklenmiyor
    setCurPass(''); setNewPass('');
    swal.toast({ icon: 'success', title: 'Şifre güncellendi' });
  }

  async function handleLogout() {
    const ok = await swal.confirm({ title: 'Çıkış yapmak istiyor musunuz?', confirmText: 'Evet, çık' });
    if (!ok) return;
    logout();
    navigate('/login', { replace: true });
  }

  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="space-y-5 pb-4">
      {/* Hero — avatar + isim + istatistikler */}
      <div className="rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#818cf8] p-5 text-white shadow-lg shadow-[#6366F1]/25">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-black text-white shadow-lg shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-white leading-tight truncate">{currentUser?.name}</p>
            <p className="text-sm text-white/70 truncate mt-0.5">{currentUser?.email}</p>
            <p className="text-xs text-white/50 mt-0.5 font-mono">{currentUser?.phone}</p>
          </div>
        </div>

        {/* İstatistik üçlüsü */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: CalendarCheck, label: 'Tamamlanan', value: completed },
            { icon: TrendingUp,    label: 'Harcama',    value: `${totalSpent.toLocaleString('tr-TR')}₺` },
            { icon: CalendarCheck, label: 'Yaklaşan',   value: upcoming },
          ].map(item => (
            <div key={item.label} className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-lg font-black tabular-nums leading-none">{item.value}</p>
              <p className="text-[10px] text-white/60 mt-1 uppercase tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sadakat Puanları */}
      {(() => {
        const points = currentUser?.loyaltyPoints ?? 0;
        const tier = getLoyaltyTier(points);
        const nextTier = LOYALTY_TIERS.find(t => t.minPoints > points);
        const prevMin = tier.minPoints;
        const nextMin = nextTier?.minPoints ?? prevMin;
        const pct = nextTier ? Math.round(((points - prevMin) / (nextMin - prevMin)) * 100) : 100;
        return (
          <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${tier.color}18, ${tier.color}08)`, border: `1px solid ${tier.color}30` }}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star size={15} style={{ color: tier.color }} className="fill-current" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Sadakat Puanları</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: tier.color }}>
                  {tier.name}
                </span>
              </div>

              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-black tabular-nums text-gray-900 dark:text-white">{points.toLocaleString('tr-TR')}</span>
                <span className="text-sm text-gray-400 mb-1">puan</span>
              </div>

              {tier.discountPct > 0 && (
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: tier.color }}>
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">%{tier.discountPct} indirim hakkınız var</span>
                </div>
              )}

              {nextTier && (
                <>
                  <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mb-2">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: tier.color }} />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">{nextTier.name}</span> için {(nextMin - points).toLocaleString('tr-TR')} puan daha
                  </p>
                </>
              )}
              {!nextTier && (
                <p className="text-[11px] font-semibold" style={{ color: tier.color }}>En yüksek seviyedesiniz! 🎉</p>
              )}

              {/* Tier tablosu */}
              <div className="grid grid-cols-4 gap-1.5 mt-4">
                {LOYALTY_TIERS.map(t => (
                  <div key={t.name} className={cn('rounded-xl p-2 text-center transition-all', points >= t.minPoints ? 'opacity-100' : 'opacity-30')}>
                    <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ backgroundColor: t.color }} />
                    <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{t.name}</p>
                    {t.discountPct > 0 && <p className="text-[9px] text-gray-400">%{t.discountPct}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Profil bilgileri */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User size={15} className="text-[#6366F1]" />
          Kişisel Bilgiler
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Ad Soyad</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="Adınız Soyadınız"
                className={cn(inputCls, 'pl-9')} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">E-posta</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className={cn(inputCls, 'pl-9')} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Telefon</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                className={cn(inputCls, 'pl-9')} />
            </div>
          </div>

          <button type="submit"
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98]',
              saved
                ? 'bg-emerald-500 shadow-emerald-500/30'
                : 'bg-[#6366F1] shadow-[#6366F1]/30 hover:bg-[#4F46E5]'
            )}>
            {saved ? <><Check size={14} /> Kaydedildi</> : <><Save size={14} /> Kaydet</>}
          </button>
        </form>
      </Card>

      {/* Favori hizmetler */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Heart size={15} className="text-[#6366F1]" />
          Favori Hizmetler
        </h2>
        <p className="text-xs text-gray-400 mb-4">Seçtiğiniz hizmetler randevu alımında öne çıkar</p>
        <div className="flex flex-wrap gap-2">
          {services.map(s => {
            const active = favs.includes(s.id);
            return (
              <button key={s.id} type="button" onClick={() => toggleFav(s.id)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-sm font-medium transition-all active:scale-95 flex items-center gap-1.5',
                  active
                    ? 'bg-[#6366F1] text-white border-[#6366F1] shadow-sm shadow-[#6366F1]/20'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#6366F1]/40'
                )}>
                {active && <Heart size={11} className="fill-white text-white" />}
                {s.name}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Bildirim tercihleri */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Bell size={15} className="text-[#6366F1]" />
          Bildirim Tercihleri
        </h2>
        <p className="text-xs text-gray-400 mb-4">Hangi bildirimler almak istediğinizi seçin</p>
        <div className="space-y-3">
          {([
            { key: 'bookingConfirmed', label: 'Randevu Onayı',      desc: 'Randevunuz oluşturulduğunda' },
            { key: 'bookingCancelled', label: 'Randevu İptali',     desc: 'Randevunuz iptal edildiğinde' },
            { key: 'bookingReminder',  label: 'Hatırlatma',         desc: 'Randevunuzdan önce hatırlatma' },
            { key: 'reviewRequest',    label: 'Değerlendirme',      desc: 'Hizmet sonrası puanlama isteği' },
          ] as { key: keyof NotificationPreferences; label: string; desc: string }[]).map(({ key, label, desc }) => {
            const on = prefs[key];
            return (
              <div key={key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors', on ? 'bg-[#6366F1]/10 text-[#6366F1]' : 'bg-gray-100 dark:bg-gray-800 text-gray-400')}>
                    {on ? <Bell size={13} /> : <BellOff size={13} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white leading-none">{label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => togglePref(key)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors shrink-0',
                    on ? 'bg-[#6366F1]' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                  aria-label={label}
                >
                  <span className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                    on ? 'translate-x-5' : 'translate-x-0'
                  )} />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Şifre değiştir */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock size={15} className="text-[#6366F1]" />
          Şifre Değiştir
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Mevcut Şifre</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type={showCur ? 'text' : 'password'} value={curPass} onChange={e => setCurPass(e.target.value)}
                required placeholder="Mevcut şifreniz" className={cn(inputCls, 'pl-9 pr-10')} />
              <button type="button" tabIndex={-1} onClick={() => setShowCur(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showCur ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Yeni Şifre</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
                required placeholder="En az 6 karakter" className={cn(inputCls, 'pl-9 pr-10')} />
              <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {passError && (
            <p className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-500">
              {passError}
            </p>
          )}

          <button type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#6366F1]/30 hover:bg-[#4F46E5] active:scale-[0.98] transition-all">
            <Save size={14} />
            Şifreyi Güncelle
          </button>
        </form>
      </Card>

      {/* Çıkış */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 dark:border-red-900/40 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-[0.98] transition-all">
        <LogOut size={15} />
        Çıkış Yap
      </button>
    </div>
  );
}
