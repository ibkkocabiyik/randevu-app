import { useState } from 'react';
import { useStore } from '../../store';
import { customersApi } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { useSwal } from '../../lib/swal';
import { Search, CalendarDays, TrendingUp, Phone, MessageSquare, Plus, Pencil, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  confirmed: { label: 'Onaylı',     cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  pending:   { label: 'Bekliyor',   cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  completed: { label: 'Tamamlandı', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
  cancelled: { label: 'İptal',      cls: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400' },
  noshow:    { label: 'Gelmedi',    cls: 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400' },
  'no-show': { label: 'Gelmedi',    cls: 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400' },
};

interface CustomerSummary {
  phone: string;
  name: string;
  totalAppointments: number;
  completedCount: number;
  lastDate: string;
  totalSpent: number;
}

export default function Customers() {
  const {
    appointments, services,
    customerNotes, addCustomerNote, updateCustomerNote, deleteCustomerNote,
  } = useStore();
  const swal = useSwal();
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<CustomerSummary | null>(null);
  const [noteText, setNoteText] = useState('');
  const [editNote, setEditNote] = useState<{ id: string; text: string } | null>(null);

  // Build customer list
  const customerMap = new Map<string, CustomerSummary>();
  for (const a of appointments) {
    const price    = services.find(s => s.id === a.serviceId)?.price ?? 0;
    const existing = customerMap.get(a.customerPhone);
    if (existing) {
      existing.totalAppointments++;
      if (a.status === 'completed') { existing.totalSpent += price; existing.completedCount++; }
      if (a.date > existing.lastDate) existing.lastDate = a.date;
    } else {
      customerMap.set(a.customerPhone, {
        phone: a.customerPhone,
        name: a.customerName,
        totalAppointments: 1,
        completedCount: a.status === 'completed' ? 1 : 0,
        lastDate: a.date,
        totalSpent: a.status === 'completed' ? price : 0,
      });
    }
  }

  const customers = [...customerMap.values()]
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate));

  const customerAppts = selected
    ? appointments.filter(a => a.customerPhone === selected.phone)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const notes = selected ? customerNotes.filter(n => n.customerPhone === selected.phone) : [];

  async function handleAddNote() {
    if (!selected || !noteText.trim()) return;
    try { await customersApi.addNote(selected.phone, noteText.trim()); } catch {}
    addCustomerNote(selected.phone, noteText.trim());
    setNoteText('');
  }

  async function handleDeleteNote(id: string) {
    const ok = await swal.confirm({ title: 'Notu sil?', confirmText: 'Evet, sil' });
    if (!ok) return;
    try { await customersApi.deleteNote(id); } catch {}
    deleteCustomerNote(id);
  }

  function handleSaveEditNote() {
    if (!editNote || !editNote.text.trim()) return;
    updateCustomerNote(editNote.id, editNote.text.trim());
    setEditNote(null);
  }

  // Müşteri için toplam randevu sayısını üst köşede göster
  const noteCount = (phone: string) => customerNotes.filter(n => n.customerPhone === phone).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Müşteriler</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{customers.length} müşteri</p>
        </div>
      </div>

      {/* Search */}
      <Card padding="sm">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="İsim veya telefon ara…"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition"
          />
        </div>
      </Card>

      {/* Desktop table */}
      <Card padding="none">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60">
                {['Müşteri', 'Telefon', 'Randevu', 'Son Ziyaret', 'Harcama', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
              {customers.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">Müşteri bulunamadı.</td></tr>
              ) : customers.map(c => (
                <tr key={c.phone} className="group hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelected(c)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#a78bfa] flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                        {noteCount(c.phone) > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-500 font-medium">
                            <MessageSquare size={9} /> {noteCount(c.phone)} not
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-gray-500 dark:text-gray-400">{c.phone}</td>
                  <td className="px-5 py-4">
                    <p className="text-gray-700 dark:text-gray-300">{c.totalAppointments}</p>
                    <p className="text-xs text-gray-400">{c.completedCount} tamamlanan</p>
                  </td>
                  <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                    {new Date(c.lastDate).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-5 py-4 font-bold text-[#6366F1]">{c.totalSpent.toLocaleString('tr-TR')} ₺</td>
                  <td className="px-5 py-4">
                    <span className="opacity-0 group-hover:opacity-100 text-xs font-semibold text-[#6366F1] transition-opacity">
                      Detay →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-700/40">
          {customers.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Müşteri bulunamadı.</p>
          ) : customers.map(c => (
            <div key={c.phone} className="flex items-center gap-3 p-4 active:bg-gray-50 dark:active:bg-white/[0.02] transition-colors" onClick={() => setSelected(c)}>
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#6366F1] to-[#a78bfa] flex items-center justify-center text-sm font-bold text-white shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.phone} · {c.totalAppointments} randevu</p>
                {noteCount(c.phone) > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-500 font-medium mt-0.5">
                    <MessageSquare size={9} /> {noteCount(c.phone)} not
                  </span>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[#6366F1]">{c.totalSpent.toLocaleString('tr-TR')} ₺</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(c.lastDate).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Customer detail modal */}
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setNoteText(''); setEditNote(null); }} title={selected?.name ?? ''} size="lg">
        {selected && (
          <div className="space-y-5">
            {/* Özet istatistikler */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 p-3.5 text-center">
                <CalendarDays size={16} className="mx-auto mb-1.5 text-[#6366F1]" />
                <p className="text-xl font-black text-gray-900 dark:text-white">{selected.totalAppointments}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Randevu</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-3.5 text-center">
                <TrendingUp size={16} className="mx-auto mb-1.5 text-emerald-500" />
                <p className="text-xl font-black text-gray-900 dark:text-white truncate text-sm">{selected.totalSpent.toLocaleString('tr-TR')} ₺</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Harcama</p>
              </div>
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-3.5 text-center">
                <Phone size={16} className="mx-auto mb-1.5 text-amber-500" />
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight mt-1">{selected.phone}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Telefon</p>
              </div>
            </div>

            {/* CRM Notları */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-[#6366F1]" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">CRM Notları</h3>
                <span className="ml-auto text-xs text-gray-400">{notes.length} not</span>
              </div>

              {/* Not giriş alanı */}
              <div className="flex gap-2 mb-3">
                <input
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddNote()}
                  placeholder="Not ekle… (ör: kısa kesim sever)"
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  className="w-9 h-9 rounded-xl bg-[#6366F1] flex items-center justify-center text-white hover:bg-[#4F46E5] disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95 shrink-0">
                  <Plus size={15} />
                </button>
              </div>

              {/* Not listesi */}
              {notes.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  Henüz not eklenmemiş
                </p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {notes.map(n => (
                    <div key={n.id} className="group flex items-start gap-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/30 px-3 py-2.5">
                      {editNote?.id === n.id ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            value={editNote.text}
                            onChange={e => setEditNote({ ...editNote, text: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleSaveEditNote()}
                            className="flex-1 rounded-lg border border-[#6366F1]/40 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6366F1]/30"
                            autoFocus
                          />
                          <button onClick={handleSaveEditNote}
                            className="text-xs text-[#6366F1] font-semibold hover:underline px-1">Kaydet</button>
                          <button onClick={() => setEditNote(null)}
                            className="text-xs text-gray-400 hover:underline px-1">İptal</button>
                        </div>
                      ) : (
                        <>
                          <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-snug">{n.text}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => setEditNote({ id: n.id, text: n.text })}
                              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-[#6366F1] hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                              <Pencil size={11} />
                            </button>
                            <button onClick={() => handleDeleteNote(n.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <X size={11} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Randevu geçmişi */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <CalendarDays size={14} className="text-[#6366F1]" />
                Randevu Geçmişi
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {customerAppts.map(a => {
                  const service  = useStore.getState().services.find(s => s.id === a.serviceId);
                  const employee = useStore.getState().employees.find(e => e.id === a.employeeId);
                  const meta     = STATUS_META[a.status] ?? { label: a.status, cls: 'bg-gray-100 text-gray-500' };
                  return (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{service?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {employee?.name} · {new Date(a.date).toLocaleDateString('tr-TR', { day:'numeric', month:'short', year:'numeric' })} {a.startTime}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-[#6366F1]">{service?.price} ₺</span>
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', meta.cls)}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
