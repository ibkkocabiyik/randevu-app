import { useState } from 'react';
import { useData, toEmployee } from '../../lib/data';
import { employeesApi } from '../../lib/api';
import { useReviewStore } from '../../store/reviews';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { useSwal } from '../../lib/swal';
import { CirclePlus, Pencil, Trash2, Clock, Star, CalendarCheck, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Employee } from '../../types';

function EmployeeForm({ initial, onSave, onCancel }: {
  initial?: Partial<Employee>;
  onSave: (data: Omit<Employee, 'id'>) => void;
  onCancel: () => void;
}) {
  const { services } = useData();
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    workingHours: initial?.workingHours ?? { start: '09:00', end: '18:00' },
    serviceIds: initial?.serviceIds ?? services.map(s => s.id),
  });
  const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition';
  const toggleService = (id: string) => setForm(f => ({
    ...f, serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter(s => s !== id) : [...f.serviceIds, id],
  }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Ad Soyad</label>
        <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Personel adı" className={inputCls} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Mesai Başlangıcı</label>
          <input type="time" value={form.workingHours.start} onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, start: e.target.value } }))} className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Mesai Bitişi</label>
          <input type="time" value={form.workingHours.end} onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, end: e.target.value } }))} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Sunduğu Hizmetler</label>
        <div className="flex flex-wrap gap-2">
          {services.map(s => (
            <button key={s.id} type="button" onClick={() => toggleService(s.id)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-all border',
                form.serviceIds.includes(s.id) ? 'bg-[#6366F1] text-white border-[#6366F1] shadow-sm' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#6366F1]/40'
              )}>
              {s.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">İptal</button>
        <button type="submit" className="rounded-xl bg-[#6366F1] px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-[#6366F1]/30 hover:bg-[#4F46E5] active:scale-[0.98] transition-all">Kaydet</button>
      </div>
    </form>
  );
}

export default function Staff() {
  const { employees, services, appointments, reviews: dataReviews, upsertEmployee, removeEmployee, initialized } = useData();
  const legacyReviews = useReviewStore(s => s.reviews);
  const reviews = [...dataReviews, ...legacyReviews.filter(r => !dataReviews.some(dr => dr.id === r.id))];
  const swal = useSwal();
  const [showNew, setShowNew] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);

  async function handleDelete(id: string) {
    const activeCount = appointments.filter(a => a.employeeId === id && (a.status === 'confirmed' || a.status === 'pending')).length;
    if (activeCount > 0) {
      await swal.confirm({ title: `Bu personelin ${activeCount} aktif randevusu var`, text: 'Silmeden önce randevuları başka personele aktarın.', confirmText: 'Anladım' });
      return;
    }
    const ok = await swal.confirm({ title: 'Personeli sil?', text: 'Bu personele ait bilgiler silinecek.', confirmText: 'Evet, sil' });
    if (!ok) return;
    removeEmployee(id);
    try { await employeesApi.delete(id); }
    catch { await useData.getState().fetchEmployees(); }
    swal.toast({ icon: 'success', title: 'Personel silindi' });
  }

  async function handleSaveNew(data: Omit<Employee, 'id'>) {
    try {
      const api = await employeesApi.create({ name: data.name, workingHours: data.workingHours, serviceIds: data.serviceIds });
      upsertEmployee(toEmployee(api));
    } catch (e: unknown) {
      swal.toast({ icon: 'error', title: (e as Error).message ?? 'Hata' }); return;
    }
    setShowNew(false);
    swal.toast({ icon: 'success', title: 'Personel eklendi' });
  }

  async function handleSaveEdit(data: Omit<Employee, 'id'>) {
    if (!editEmp) return;
    upsertEmployee({ ...editEmp, ...data });
    try {
      const api = await employeesApi.update(editEmp.id, { name: data.name, workingHours: data.workingHours, serviceIds: data.serviceIds });
      upsertEmployee(toEmployee(api as never));
    } catch { await useData.getState().fetchEmployees(); }
    setEditEmp(null);
    swal.toast({ icon: 'success', title: 'Personel güncellendi' });
  }

  function empStats(empId: string) {
    const empAppts = appointments.filter(a => a.employeeId === empId);
    const completed = empAppts.filter(a => a.status === 'completed').length;
    const revenue = empAppts.filter(a => a.status === 'completed')
      .reduce((s, a) => s + (services.find(sv => sv.id === a.serviceId)?.price ?? 0), 0);
    const empReviews = reviews.filter(r => r.employeeId === empId);
    const avgRating = empReviews.length ? empReviews.reduce((s, r) => s + r.rating, 0) / empReviews.length : null;
    return { completed, revenue, avgRating, reviewCount: empReviews.length };
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Personel</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{employees.length} personel</p>
        </div>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-medium text-white shadow-sm shadow-[#6366F1]/30 hover:bg-[#4F46E5] active:scale-[0.98] transition-all">
          <CirclePlus size={16} /> Personel Ekle
        </button>
      </div>

      {!initialized ? (
        <div className="py-16 text-center text-sm text-gray-400">Yükleniyor…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map(emp => {
            const empServices = services.filter(s => emp.serviceIds.includes(s.id));
            const { completed, revenue, avgRating, reviewCount } = empStats(emp.id);
            return (
              <Card key={emp.id} className="group">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#a78bfa] flex items-center justify-center text-white font-bold text-lg shadow-md shadow-[#6366F1]/20 shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white leading-tight">{emp.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5"><Clock size={11} className="text-gray-400" /><span className="text-xs text-gray-400">{emp.workingHours.start} – {emp.workingHours.end}</span></div>
                    {avgRating !== null && (
                      <div className="flex items-center gap-1 mt-0.5"><Star size={10} className="fill-amber-400 text-amber-400" /><span className="text-xs text-amber-500 font-semibold">{avgRating.toFixed(1)}</span><span className="text-xs text-gray-400">({reviewCount})</span></div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditEmp(emp)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-[#EEF2FF] dark:hover:bg-[#312E81]/30 hover:text-[#6366F1] transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(emp.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {empServices.slice(0, 3).map(s => <span key={s.id} className="rounded-md bg-[#EEF2FF] dark:bg-[#312E81]/30 px-1.5 py-0.5 text-[10px] font-medium text-[#6366F1] dark:text-indigo-400">{s.name}</span>)}
                  {empServices.length > 3 && <span className="rounded-md bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">+{empServices.length - 3}</span>}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5"><CalendarCheck size={13} className="text-emerald-500 shrink-0" /><div><p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{completed}</p><p className="text-[10px] text-gray-400 uppercase tracking-wide">Tamamlanan</p></div></div>
                  <div className="flex items-center gap-1.5"><TrendingUp size={13} className="text-[#6366F1] shrink-0" /><div><p className="text-sm font-bold text-[#6366F1] dark:text-indigo-400 tabular-nums truncate">{revenue.toLocaleString('tr-TR')} ₺</p><p className="text-[10px] text-gray-400 uppercase tracking-wide">Gelir</p></div></div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Personel Ekle">
        <EmployeeForm onSave={handleSaveNew} onCancel={() => setShowNew(false)} />
      </Modal>
      <Modal isOpen={!!editEmp} onClose={() => setEditEmp(null)} title="Personel Düzenle">
        {editEmp && <EmployeeForm initial={editEmp} onSave={handleSaveEdit} onCancel={() => setEditEmp(null)} />}
      </Modal>
    </div>
  );
}
