import { useStore } from './index';
import { useUserAuth } from './userAuth';
import { useReviewStore } from './reviews';
import { useData } from '../lib/data';
import type { Appointment } from '../types';

const SYNC_KEYS = ['randevu-store', 'randevu-user-auth', 'randevu-reviews', 'randevu-appointments'] as const;
const POLL_MS = 1500;
const BASE = `${window.location.protocol}//${window.location.hostname}:3000`;

const lastSeen: Record<string, number> = {
  'randevu-store': 0, 'randevu-user-auth': 0,
  'randevu-reviews': 0, 'randevu-appointments': 0,
};

let writing = false;
let _orig: (k: string, v: string) => void;

function pushRaw(key: string, value: string) {
  const ts = Date.now();
  lastSeen[key] = ts;
  fetch(`${BASE}/__sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value, ts }),
  }).catch(() => {});
}

// useData.appointments değişince /__sync'e push et
function pushAppointments(appointments: Appointment[]) {
  if (writing) return;
  pushRaw('randevu-appointments', JSON.stringify(appointments));
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
      if (key !== 'randevu-appointments') _orig(key, data.value);
      if (key === 'randevu-store') useStore.persist.rehydrate();
      if (key === 'randevu-user-auth') useUserAuth.persist.rehydrate();
      if (key === 'randevu-reviews') {
        useReviewStore.persist.rehydrate();
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
      if (key === 'randevu-appointments') {
        try {
          const incoming = JSON.parse(data.value) as Appointment[];
          const store = useData.getState();
          incoming.forEach(a => store.upsertAppointment(a));
          // Remove appointments that no longer exist remotely
          store.appointments
            .filter(a => !incoming.some(i => i.id === a.id))
            .forEach(a => store.removeAppointment(a.id));
        } catch {}
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
      pushRaw(key, value);
    }
  };

  // useData.appointments değişince diğer sekmelere yay
  let prevAppointments = useData.getState().appointments;
  useData.subscribe(s => {
    if (s.appointments !== prevAppointments) {
      prevAppointments = s.appointments;
      pushAppointments(s.appointments);
    }
  });

  setInterval(() => SYNC_KEYS.forEach(poll), POLL_MS);
}
