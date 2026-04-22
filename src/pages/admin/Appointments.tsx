import { useState } from 'react';
import { useStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { useSwal } from '../../lib/swal';
import { Search, CirclePlus, Trash2, Pencil, Eye, CalendarDays, Clock, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Appointment } from '../../types';

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Onaylı', pending: 'Bekliyor', cancelled: 'İptal',
  completed: 'Tamamlandı', noshow: 'Gelmedi',
};
const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  cancelled: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  noshow: 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400',
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', STATUS_COLORS[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── New/Edit appointment form ────────────────────────────────────────────────
function AppointmentForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Appointment>;
  onSave: (data: Omit<Appointment, 'id'>) => void;
  onCancel: () => void;
}) {
  const { services, employees } = useStore();
  const [form, setForm] = useState({
    customerName: initial?.customerName ?? '',
    customerPhone: initial?.customerPhone ?? '',
    serviceId: initial?.serviceId ?? services[0]?.id ?? '',
    employeeId: initial?.employeeId ?? employees[0]?.id ?? '',
    date: initial?.date ?? new Date().toISOString().split('T')[0],
    startTime: initial?.startTime ?? '09:00',
    endTime: initial?.endTime ?? '09:30',
    status: initial?.status ?? 'confirmed',
    notes: initial?.notes ?? '',
  } as Omit<Appointment, 'id'>);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] dark:focus:border-[#6366F1]/60 transition';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Ad Soyad</label>
          <input required value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Müşteri adı" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Telefon</label>
          <input required type="tel" value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)} placeholder="0555 000 00 00" className={inputCls} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Hizmet</label>
          <select value={form.serviceId} onChange={e => set('serviceId', e.target.value)} className={inputCls}>
            {services.map(s => <option key={s.id} value={s.id}>{s.name} – {s.price} ₺</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Personel</label>
          <select value={form.employeeId} onChange={e => set('employeeId', e.target.value)} className={inputCls}>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Tarih</label>
          <input type="date" required value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Başlangıç</label>
          <input type="time" required value={form.startTime} onChange={e => set('startTime', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Bitiş</label>
          <input type="time" required value={form.endTime} onChange={e => set('endTime', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Durum</label>
        <select value={form.status} onChange={e => set('status', e.target.value as Appointment['status'])} className={inputCls}>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Not (opsiyonel)</label>
        <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Müşteri notu…" className={cn(inputCls, 'resize-none')} />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          İptal
        </button>
        <button type="submit"
          className="rounded-xl bg-[#6366F1] px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-[#6366F1]/30 hover:bg-[#4F46E5] active:scale-[0.98] transition-all">
          Kaydet
        </button>
      </div>
    </form>
  );
}

// ─── Detail view ─────────────────────────────────────────────────────────────
function AppointmentDetail({ appt, onClose }: { appt: Appointment; onClose: () => void }) {
  const { services, employees } = useStore();
  const service = services.find(s => s.id === appt.serviceId);
  const employee = employees.find(e => e.id === appt.employeeId);

  const rows = [
    { icon: User, label: 'Müşteri', value: appt.customerName },
    { icon: Clock, label: 'Telefon', value: appt.customerPhone },
    { icon: CalendarDays, label: 'Tarih', value: new Date(appt.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
    { icon: Clock, label: 'Saat', value: `${appt.startTime} – ${appt.endTime}` },
    { icon: User, label: 'Hizmet', value: `${service?.name ?? '—'} (${service?.price ?? 0} ₺)` },
    { icon: User, label: 'Personel', value: employee?.name ?? '—' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <StatusPill status={appt.status} />
      </div>
      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.label} className="flex items-start gap-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 px-4 py-3">
            <r.icon size={15} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">{r.label}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{r.value}</p>
            </div>
          </div>
        ))}
        {appt.notes && (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 px-4 py-3">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Not</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{appt.notes}</p>
          </div>
        )}
      </div>
      <button onClick={onClose}
        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        Kapat
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Appointments() {
  const { appointments, services, employees, addAppointment, updateAppointment, cancelAppointment } = useStore();
  const swal = useSwal();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = appointments.filter(a => {
    const matchSearch = a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.customerPhone.includes(search);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

  async function handleDelete(id: string) {
    const ok = await swal.confirm({ title: 'Randevuyu sil?', text: 'Bu işlem geri alınamaz.', confirmText: 'Evet, sil' });
    if (!ok) return;
    cancelAppointment(id);
    swal.toast({ icon: 'success', title: 'Randevu iptal edildi' });
  }

  function handleSaveNew(data: Omit<Appointment, 'id'>) {
    addAppointment(data);
    setShowNew(false);
    swal.toast({ icon: 'success', title: 'Randevu oluşturuldu' });
  }

  function handleSaveEdit(data: Omit<Appointment, 'id'>) {
    if (!editAppt) return;
    updateAppointment(editAppt.id, data);
    setEditAppt(null);
    swal.toast({ icon: 'success', title: 'Randevu güncellendi' });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Randevular</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{filtered.length} randevu</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-medium text-white shadow-sm shadow-[#6366F1]/30 hover:bg-[#4F46E5] active:scale-[0.98] transition-all"
        >
          <CirclePlus size={16} />
          Yeni Randevu
        </button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Müşteri adı veya telefon…"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition"
            />
          </div>
          {/* Status filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['all', 'confirmed', 'pending', 'completed', 'cancelled', 'noshow'].map(s => (
              <button key={s}
                onClick={() => setStatusFilter(s)}
                className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  statusFilter === s
                    ? 'bg-[#6366F1] text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}>
                {s === 'all' ? 'Tümü' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60">
                {['Müşteri', 'Hizmet', 'Personel', 'Tarih & Saat', 'Durum', 'İşlemler'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">Randevu bulunamadı.</td></tr>
              ) : filtered.map(appt => {
                const service = services.find(s => s.id === appt.serviceId);
                const employee = employees.find(e => e.id === appt.employeeId);
                return (
                  <tr key={appt.id} className="group hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{appt.customerName}</p>
                      <p className="text-xs text-gray-400 font-mono">{appt.customerPhone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-700 dark:text-gray-300">{service?.name ?? '—'}</p>
                      <p className="text-xs text-[#6366F1] font-semibold">{service?.price} ₺</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">{employee?.name ?? '—'}</td>
                    <td className="px-5 py-4">
                      <p className="text-gray-700 dark:text-gray-300">{new Date(appt.date).toLocaleDateString('tr-TR')}</p>
                      <p className="text-xs text-gray-400 font-mono">{appt.startTime} – {appt.endTime}</p>
                    </td>
                    <td className="px-5 py-4"><StatusPill status={appt.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setDetailAppt(appt)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 transition-colors" title="Detay">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => setEditAppt(appt)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#6366F1] transition-colors" title="Düzenle">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(appt.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors" title="İptal">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-700/40">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Randevu bulunamadı.</p>
          ) : filtered.map(appt => {
            const service = services.find(s => s.id === appt.serviceId);
            const employee = employees.find(e => e.id === appt.employeeId);
            return (
              <div key={appt.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{appt.customerName}</p>
                    <p className="text-xs text-gray-400">{appt.customerPhone}</p>
                  </div>
                  <StatusPill status={appt.status} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{service?.name} · {employee?.name}</p>
                <p className="text-xs font-mono text-gray-400">{new Date(appt.date).toLocaleDateString('tr-TR')} {appt.startTime}–{appt.endTime}</p>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setDetailAppt(appt)} className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Detay</button>
                  <button onClick={() => setEditAppt(appt)} className="flex-1 rounded-lg border border-[#6366F1]/30 py-1.5 text-xs font-medium text-[#6366F1] hover:bg-[#EEF2FF] dark:hover:bg-[#312E81]/20 transition-colors">Düzenle</button>
                  <button onClick={() => handleDelete(appt.id)} className="flex-1 rounded-lg border border-red-200 dark:border-red-900/40 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">İptal</button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modals */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Yeni Randevu" size="lg">
        <AppointmentForm onSave={handleSaveNew} onCancel={() => setShowNew(false)} />
      </Modal>

      <Modal isOpen={!!editAppt} onClose={() => setEditAppt(null)} title="Randevu Düzenle" size="lg">
        {editAppt && <AppointmentForm initial={editAppt} onSave={handleSaveEdit} onCancel={() => setEditAppt(null)} />}
      </Modal>

      <Modal isOpen={!!detailAppt} onClose={() => setDetailAppt(null)} title="Randevu Detayı">
        {detailAppt && <AppointmentDetail appt={detailAppt} onClose={() => setDetailAppt(null)} />}
      </Modal>
    </div>
  );
}
