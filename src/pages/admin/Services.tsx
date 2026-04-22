import { useState } from 'react';
import { useStore } from '../../store';
import { useReviewStore } from '../../store/reviews';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { useSwal } from '../../lib/swal';
import { CirclePlus, Pencil, Trash2, Clock, Scissors, Star, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Service, Review } from '../../types';

const CATEGORY_LABELS: Record<Service['category'], string> = {
  sac: 'Saç', sakal: 'Sakal', bakim: 'Bakım',
};
const CATEGORY_COLORS: Record<Service['category'], string> = {
  sac: 'bg-[#EEF2FF] text-[#6366F1] dark:bg-[#312E81]/30 dark:text-indigo-400',
  sakal: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  bakim: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function ServiceForm({ initial, onSave, onCancel }: {
  initial?: Partial<Service>;
  onSave: (data: Omit<Service, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    durationMinutes: initial?.durationMinutes ?? 30,
    price: initial?.price ?? 100,
    category: initial?.category ?? ('sac' as Service['category']),
  });

  const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition';

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Hizmet Adı</label>
        <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Örn: Saç Kesimi" className={inputCls} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Süre (dakika)</label>
          <input type="number" min={5} required value={form.durationMinutes}
            onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Fiyat (₺)</label>
          <input type="number" min={0} required value={form.price}
            onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-[0.8125rem] font-medium text-gray-700 dark:text-white/60">Kategori</label>
        <div className="flex gap-2">
          {(['sac', 'sakal', 'bakim'] as Service['category'][]).map(cat => (
            <button key={cat} type="button" onClick={() => setForm(f => ({ ...f, category: cat }))}
              className={cn('flex-1 rounded-xl border py-2 text-sm font-medium transition-all',
                form.category === cat
                  ? 'bg-[#6366F1] text-white border-[#6366F1] shadow-sm shadow-[#6366F1]/20'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#6366F1]/40'
              )}>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
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

function ReviewsModal({ service: _service, reviews }: { service: Service; reviews: Review[] }) {
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      {avg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20">
          <div className="text-3xl font-bold text-amber-500">{avg}</div>
          <div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={16} className={cn(
                  parseFloat(avg) >= s ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                )} />
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{reviews.length} değerlendirme</p>
          </div>
        </div>
      )}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {reviews.map(r => (
          <div key={r.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{r.customerName}</p>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={12} className={cn(r.rating >= s ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200')} />
                ))}
              </div>
            </div>
            {r.comment && <p className="text-sm text-gray-500 dark:text-gray-400">{r.comment}</p>}
            <p className="text-[10px] text-gray-300 dark:text-gray-600">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Services() {
  const { services, appointments, addService, updateService, deleteService } = useStore();
  const { reviews } = useReviewStore();
  const swal = useSwal();
  const [showNew, setShowNew] = useState(false);
  const [editSvc, setEditSvc] = useState<Service | null>(null);
  const [reviewSvc, setReviewSvc] = useState<Service | null>(null);

  async function handleDelete(id: string) {
    const ok = await swal.confirm({ title: 'Hizmeti sil?', text: 'Bu hizmet kalıcı olarak silinecek.', confirmText: 'Evet, sil' });
    if (!ok) return;
    deleteService(id);
    swal.toast({ icon: 'success', title: 'Hizmet silindi' });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Hizmetler</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{services.length} hizmet</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-medium text-white shadow-sm shadow-[#6366F1]/30 hover:bg-[#4F46E5] active:scale-[0.98] transition-all">
          <CirclePlus size={16} />
          Hizmet Ekle
        </button>
      </div>

      <Card padding="none">
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60">
                {['Hizmet', 'Kategori', 'Süre', 'Fiyat', 'Kullanım', 'Puan', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
              {services.map(svc => {
                const usageCount = appointments.filter(a => a.serviceId === svc.id).length;
                const svcReviews = reviews.filter(r => r.serviceId === svc.id);
                const avg = svcReviews.length
                  ? (svcReviews.reduce((s, r) => s + r.rating, 0) / svcReviews.length).toFixed(1)
                  : null;
                return (
                  <tr key={svc.id} className="group hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] dark:bg-[#312E81]/30 flex items-center justify-center">
                          <Scissors size={14} className="text-[#6366F1]" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{svc.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', CATEGORY_COLORS[svc.category])}>
                        {CATEGORY_LABELS[svc.category]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <Clock size={13} />
                        {svc.durationMinutes} dk
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#6366F1]">{svc.price} ₺</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{usageCount} randevu</td>
                    <td className="px-5 py-4">
                      {avg ? (
                        <button onClick={() => setReviewSvc(svc)}
                          className="flex items-center gap-1 text-sm font-semibold text-amber-500 hover:underline">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          {avg}
                          <span className="text-xs text-gray-400 font-normal">({svcReviews.length})</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {svcReviews.length > 0 && (
                          <button onClick={() => setReviewSvc(svc)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-500 transition-colors">
                            <MessageSquare size={13} />
                          </button>
                        )}
                        <button onClick={() => setEditSvc(svc)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-[#EEF2FF] dark:hover:bg-[#312E81]/30 hover:text-[#6366F1] transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(svc.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-700/40">
          {services.map(svc => (
            <div key={svc.id} className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] dark:bg-[#312E81]/30 flex items-center justify-center shrink-0">
                <Scissors size={16} className="text-[#6366F1]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">{svc.name}</p>
                <p className="text-xs text-gray-400">{svc.durationMinutes} dk · {CATEGORY_LABELS[svc.category]}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#6366F1]">{svc.price} ₺</p>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => setEditSvc(svc)} className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:text-[#6366F1]"><Pencil size={12} /></button>
                  <button onClick={() => handleDelete(svc.id)} className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Hizmet Ekle">
        <ServiceForm onSave={d => { addService(d); setShowNew(false); swal.toast({ icon: 'success', title: 'Hizmet eklendi' }); }} onCancel={() => setShowNew(false)} />
      </Modal>
      <Modal isOpen={!!editSvc} onClose={() => setEditSvc(null)} title="Hizmet Düzenle">
        {editSvc && <ServiceForm initial={editSvc} onSave={d => { updateService(editSvc.id, d); setEditSvc(null); swal.toast({ icon: 'success', title: 'Hizmet güncellendi' }); }} onCancel={() => setEditSvc(null)} />}
      </Modal>
      <Modal isOpen={!!reviewSvc} onClose={() => setReviewSvc(null)} title={reviewSvc ? `${reviewSvc.name} — Değerlendirmeler` : ''} size="md">
        {reviewSvc && <ReviewsModal service={reviewSvc} reviews={reviews.filter(r => r.serviceId === reviewSvc.id)} />}
      </Modal>
    </div>
  );
}
