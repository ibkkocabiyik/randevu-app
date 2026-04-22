import { create } from 'zustand';
import { subscribeToChanges } from './realtime';
import {
  appointmentsApi, servicesApi, employeesApi, reviewsApi,
  customersApi,
} from './api';
import type { ApiAppointment, ApiService, ApiEmployee, ApiReview, ApiCustomerNote } from './api';
import type { Appointment, Service, Employee, Review, CustomerNote } from '../types';

// ─── Converters ──────────────────────────────────────────────────────────────

export function toAppointment(a: ApiAppointment): Appointment {
  return {
    id:            a.id,
    customerId:    a.customer_id,
    customerName:  a.customer_name,
    customerPhone: a.customer_phone,
    serviceId:     a.service_id,
    employeeId:    a.employee_id,
    date:          a.date,
    startTime:     a.start_time,
    endTime:       a.end_time,
    status:        a.status,
    notes:         a.notes,
  };
}

export function toService(s: ApiService): Service {
  return {
    id:              s.id,
    name:            s.name,
    durationMinutes: s.duration_minutes,
    price:           s.price,
    category:        s.category,
  };
}

export function toEmployee(e: ApiEmployee): Employee {
  return {
    id:           e.id,
    name:         e.name,
    avatar:       e.avatar,
    workingHours: e.workingHours ?? { start: e.working_hours_start, end: e.working_hours_end },
    serviceIds:   e.serviceIds ?? [],
  };
}

export function toReview(r: ApiReview): Review {
  return {
    id:           r.id,
    appointmentId: r.appointment_id,
    serviceId:    r.service_id,
    employeeId:   r.employee_id,
    customerName: r.customer_name,
    rating:       r.rating as 1|2|3|4|5,
    comment:      r.comment,
    createdAt:    r.created_at,
  };
}

export function toCustomerNote(n: ApiCustomerNote): CustomerNote {
  return {
    id:            n.id,
    customerPhone: n.customer_phone,
    text:          n.text,
    createdAt:     n.created_at,
  };
}

// ─── Central data store ──────────────────────────────────────────────────────

interface DataState {
  appointments: Appointment[];
  services: Service[];
  employees: Employee[];
  reviews: Review[];
  customerNotes: CustomerNote[];
  loading: { appointments: boolean; services: boolean; employees: boolean; reviews: boolean };
  initialized: boolean; // true after first fetchAll completes

  fetchAppointments: () => Promise<void>;
  fetchServices: () => Promise<void>;
  fetchEmployees: () => Promise<void>;
  fetchReviews: () => Promise<void>;
  fetchAll: () => Promise<void>;

  // Optimistic mutations
  setAppointments: (a: Appointment[]) => void;
  setServices: (s: Service[]) => void;
  setEmployees: (e: Employee[]) => void;
  setReviews: (r: Review[]) => void;
  setCustomerNotes: (n: CustomerNote[]) => void;

  upsertAppointment: (a: Appointment) => void;
  removeAppointment: (id: string) => void;
  upsertService: (s: Service) => void;
  removeService: (id: string) => void;
  upsertEmployee: (e: Employee) => void;
  removeEmployee: (id: string) => void;
  upsertReview: (r: Review) => void;
}

export const useData = create<DataState>((set, get) => ({
  appointments: [],
  services: [],
  employees: [],
  reviews: [],
  customerNotes: [],
  loading: { appointments: false, services: false, employees: false, reviews: false },
  initialized: false,

  fetchAppointments: async () => {
    set(s => ({ loading: { ...s.loading, appointments: true } }));
    try {
      const data = await appointmentsApi.list();
      set({ appointments: data.map(toAppointment) });
    } catch (e) { console.error('[data] fetchAppointments failed:', e); }
    set(s => ({ loading: { ...s.loading, appointments: false } }));
  },

  fetchServices: async () => {
    set(s => ({ loading: { ...s.loading, services: true } }));
    try {
      const data = await servicesApi.list();
      set({ services: data.map(toService) });
    } catch (e) { console.error('[data] fetchServices failed:', e); }
    set(s => ({ loading: { ...s.loading, services: false } }));
  },

  fetchEmployees: async () => {
    set(s => ({ loading: { ...s.loading, employees: true } }));
    try {
      const data = await employeesApi.list();
      set({ employees: data.map(toEmployee) });
    } catch (e) { console.error('[data] fetchEmployees failed:', e); }
    set(s => ({ loading: { ...s.loading, employees: false } }));
  },

  fetchReviews: async () => {
    set(s => ({ loading: { ...s.loading, reviews: true } }));
    try {
      const data = await reviewsApi.list();
      set({ reviews: data.map(toReview) });
    } catch (e) { console.error('[data] fetchReviews failed:', e); }
    set(s => ({ loading: { ...s.loading, reviews: false } }));
  },

  fetchAll: async () => {
    const { fetchAppointments, fetchServices, fetchEmployees, fetchReviews } = get();
    await Promise.all([fetchAppointments(), fetchServices(), fetchEmployees(), fetchReviews()]);
    set({ initialized: true });
  },

  setAppointments: (appointments) => set({ appointments }),
  setServices: (services) => set({ services }),
  setEmployees: (employees) => set({ employees }),
  setReviews: (reviews) => set({ reviews }),
  setCustomerNotes: (customerNotes) => set({ customerNotes }),

  upsertAppointment: (a) => set(s => ({
    appointments: s.appointments.some(x => x.id === a.id)
      ? s.appointments.map(x => x.id === a.id ? a : x)
      : [...s.appointments, a],
  })),
  removeAppointment: (id) => set(s => ({ appointments: s.appointments.filter(a => a.id !== id) })),

  upsertService: (sv) => set(s => ({
    services: s.services.some(x => x.id === sv.id)
      ? s.services.map(x => x.id === sv.id ? sv : x)
      : [...s.services, sv],
  })),
  removeService: (id) => set(s => ({ services: s.services.filter(x => x.id !== id) })),

  upsertEmployee: (e) => set(s => ({
    employees: s.employees.some(x => x.id === e.id)
      ? s.employees.map(x => x.id === e.id ? e : x)
      : [...s.employees, e],
  })),
  removeEmployee: (id) => set(s => ({ employees: s.employees.filter(x => x.id !== id) })),

  upsertReview: (r) => set(s => ({
    reviews: s.reviews.some(x => x.id === r.id)
      ? s.reviews.map(x => x.id === r.id ? r : x)
      : [...s.reviews, r],
  })),
}));

// ─── Realtime subscription (call once at app root) ───────────────────────────

let realtimeStarted = false;

export function startRealtime() {
  if (realtimeStarted) return;
  realtimeStarted = true;

  subscribeToChanges({
    onAppointment: async (payload: unknown) => {
      const p = payload as { eventType: string; new?: Record<string, unknown>; old?: Record<string, unknown> };
      const store = useData.getState();
      if (p.eventType === 'DELETE' && p.old?.id) {
        store.removeAppointment(p.old.id as string);
      } else if (p.new?.id) {
        store.upsertAppointment(toAppointment(p.new as unknown as ApiAppointment));
      }
    },
    onReview: async (payload: unknown) => {
      const p = payload as { eventType: string; new?: Record<string, unknown> };
      if (p.new?.id) {
        useData.getState().upsertReview(toReview(p.new as unknown as ApiReview));
      }
    },
    onService: async (payload: unknown) => {
      const p = payload as { eventType: string; new?: Record<string, unknown>; old?: Record<string, unknown> };
      const store = useData.getState();
      if (p.eventType === 'DELETE' && p.old?.id) {
        store.removeService(p.old.id as string);
      } else if (p.new?.id) {
        store.upsertService(toService(p.new as unknown as ApiService));
      }
    },
    onEmployee: async (payload: unknown) => {
      const p = payload as { eventType: string; new?: Record<string, unknown>; old?: Record<string, unknown> };
      const store = useData.getState();
      if (p.eventType === 'DELETE' && p.old?.id) {
        store.removeEmployee(p.old.id as string);
      } else if (p.new?.id) {
        // Employee has join table data, refetch to get serviceIds
        const data = await employeesApi.list();
        store.setEmployees(data.map(toEmployee));
      }
    },
  });
}

// ─── Admin: fetch customer notes ─────────────────────────────────────────────

export async function fetchCustomerNotes(phone?: string) {
  try {
    const data = await customersApi.notes(phone);
    if (!phone) {
      useData.getState().setCustomerNotes(data.map(toCustomerNote));
    }
    return data.map(toCustomerNote);
  } catch {
    return [];
  }
}
