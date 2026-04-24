import { useStore } from './index';
import { useUserAuth } from './userAuth';
import { useReviewStore } from './reviews';
import { useData } from '../lib/data';

const SYNC_KEYS = ['randevu-store', 'randevu-user-auth', 'randevu-reviews'] as const;
const POLL_MS = 1500;
const BASE = `${window.location.protocol}//${window.location.hostname}:3000`;

// Sunucudaki en son gördüğümüz timestamp (poll yanıtından)
const lastSeen: Record<string, number> = { 'randevu-store': 0, 'randevu-user-auth': 0, 'randevu-reviews': 0 };

let writing = false;
let _orig: (k: string, v: string) => void;

function push(key: string, value: string) {
  const ts = Date.now();
  // Kendi push'umuzu lastSeen'e yaz — aksi hâlde poll bunu "yeni" sanır
  lastSeen[key] = ts;
  fetch(`${BASE}/__sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value, ts }),
  }).catch(() => {});
}

async function poll(key: string) {
  if (writing) return;
  try {
    const res = await fetch(`${BASE}/__sync?key=${encodeURIComponent(key)}&since=${lastSeen[key] ?? 0}`);
    if (!res.ok) return;
    const data = await res.json() as { updated: boolean; value?: string; ts?: number };
    if (data.updated && data.value && data.ts) {
      lastSeen[key] = data.ts;
      writing = true;
      _orig(key, data.value);
      if (key === 'randevu-store') useStore.persist.rehydrate();
      if (key === 'randevu-user-auth') useUserAuth.persist.rehydrate();
      if (key === 'randevu-reviews') {
        useReviewStore.persist.rehydrate();
        // Sync reviews into useData so admin panels that read from useData also update
        setTimeout(() => {
          const legacy = useReviewStore.getState().reviews;
          const dataRevs = useData.getState().reviews;
          legacy.forEach(r => {
            if (!dataRevs.some(d => d.id === r.id)) {
              useData.getState().upsertReview(r);
            }
          });
        }, 50);
      }
      setTimeout(() => { writing = false; }, 150);
    }
  } catch {}
}

export function initSync() {
  _orig = localStorage.setItem.bind(localStorage);

  localStorage.setItem = (key: string, value: string) => {
    _orig(key, value);
    if (!writing && (SYNC_KEYS as readonly string[]).includes(key)) {
      push(key, value);
    }
  };

  setInterval(() => SYNC_KEYS.forEach(poll), POLL_MS);
}
