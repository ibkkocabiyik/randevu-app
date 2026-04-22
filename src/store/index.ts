import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Appointment, Employee, Service, BookingState, Notification, CustomerNote } from '../types';
import { useUserAuth } from './userAuth';

const SEED_SERVICES: Service[] = [
  { id: 's1', name: 'Saç Kesimi', durationMinutes: 30, price: 150, category: 'sac' },
  { id: 's2', name: 'Sakal Tıraşı', durationMinutes: 20, price: 100, category: 'sakal' },
  { id: 's3', name: 'Saç + Sakal', durationMinutes: 50, price: 230, category: 'sac' },
  { id: 's4', name: 'Cilt Bakımı', durationMinutes: 45, price: 200, category: 'bakim' },
];

const SEED_EMPLOYEES: Employee[] = [
  {
    id: 'e1',
    name: 'Ahmet Usta',
    workingHours: { start: '09:00', end: '18:00' },
    serviceIds: ['s1', 's2', 's3', 's4'],
  },
  {
    id: 'e2',
    name: 'Mehmet Usta',
    workingHours: { start: '10:00', end: '19:00' },
    serviceIds: ['s1', 's2', 's3'],
  },
];

interface Store {
  // Data
  services: Service[];
  employees: Employee[];
  appointments: Appointment[];
  notifications: Notification[];
  customerNotes: CustomerNote[];

  // Booking wizard state
  booking: BookingState;
  setBooking: (partial: Partial<BookingState>) => void;
  resetBooking: () => void;

  // Appointment actions
  addAppointment: (appt: Omit<Appointment, 'id'>) => Appointment;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  cancelAppointment: (id: string) => void;

  // Notification actions
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Customer note actions
  addCustomerNote: (phone: string, text: string) => void;
  updateCustomerNote: (id: string, text: string) => void;
  deleteCustomerNote: (id: string) => void;
  getCustomerNotes: (phone: string) => CustomerNote[];

  // Admin service/employee CRUD
  addService: (s: Omit<Service, 'id'>) => void;
  updateService: (id: string, patch: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addEmployee: (e: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
}

const emptyBooking: BookingState = {
  serviceId: null,
  employeeId: null,
  date: null,
  startTime: null,
};

const SEED_APPOINTMENTS: Appointment[] = [
  // ── Ocak ──
  { id: 'a001', customerName: 'Ali Yılmaz',   customerPhone: '05301111111', serviceId: 's1', employeeId: 'e1', date: '2026-01-05', startTime: '09:00', endTime: '09:30', status: 'completed' },
  { id: 'a002', customerName: 'Fatma Kaya',   customerPhone: '05302222222', serviceId: 's4', employeeId: 'e1', date: '2026-01-07', startTime: '11:00', endTime: '11:45', status: 'completed' },
  { id: 'a003', customerName: 'Emre Demir',   customerPhone: '05303333333', serviceId: 's3', employeeId: 'e2', date: '2026-01-10', startTime: '14:00', endTime: '14:50', status: 'completed' },
  { id: 'a004', customerName: 'Zeynep Çelik', customerPhone: '05304444444', serviceId: 's2', employeeId: 'e1', date: '2026-01-13', startTime: '10:00', endTime: '10:20', status: 'completed' },
  { id: 'a005', customerName: 'Ali Yılmaz',   customerPhone: '05301111111', serviceId: 's2', employeeId: 'e2', date: '2026-01-17', startTime: '15:00', endTime: '15:20', status: 'completed' },
  { id: 'a006', customerName: 'Murat Şahin',  customerPhone: '05305555555', serviceId: 's1', employeeId: 'e1', date: '2026-01-20', startTime: '09:30', endTime: '10:00', status: 'completed' },
  { id: 'a007', customerName: 'Fatma Kaya',   customerPhone: '05302222222', serviceId: 's3', employeeId: 'e2', date: '2026-01-22', startTime: '13:00', endTime: '13:50', status: 'cancelled' },
  { id: 'a008', customerName: 'Emre Demir',   customerPhone: '05303333333', serviceId: 's1', employeeId: 'e1', date: '2026-01-27', startTime: '11:00', endTime: '11:30', status: 'completed' },
  // ── Şubat ──
  { id: 'a009', customerName: 'Zeynep Çelik', customerPhone: '05304444444', serviceId: 's4', employeeId: 'e1', date: '2026-02-03', startTime: '10:30', endTime: '11:15', status: 'completed' },
  { id: 'a010', customerName: 'Murat Şahin',  customerPhone: '05305555555', serviceId: 's3', employeeId: 'e2', date: '2026-02-06', startTime: '16:00', endTime: '16:50', status: 'completed' },
  { id: 'a011', customerName: 'Ali Yılmaz',   customerPhone: '05301111111', serviceId: 's1', employeeId: 'e2', date: '2026-02-10', startTime: '10:00', endTime: '10:30', status: 'completed' },
  { id: 'a012', customerName: 'Fatma Kaya',   customerPhone: '05302222222', serviceId: 's2', employeeId: 'e1', date: '2026-02-13', startTime: '14:00', endTime: '14:20', status: 'completed' },
  { id: 'a013', customerName: 'Emre Demir',   customerPhone: '05303333333', serviceId: 's4', employeeId: 'e1', date: '2026-02-17', startTime: '09:00', endTime: '09:45', status: 'no-show' },
  { id: 'a014', customerName: 'Ali Yılmaz',   customerPhone: '05301111111', serviceId: 's3', employeeId: 'e1', date: '2026-02-20', startTime: '11:30', endTime: '12:20', status: 'completed' },
  { id: 'a015', customerName: 'Murat Şahin',  customerPhone: '05305555555', serviceId: 's1', employeeId: 'e1', date: '2026-02-24', startTime: '13:00', endTime: '13:30', status: 'completed' },
  { id: 'a016', customerName: 'Zeynep Çelik', customerPhone: '05304444444', serviceId: 's1', employeeId: 'e2', date: '2026-02-27', startTime: '15:00', endTime: '15:30', status: 'completed' },
  // ── Mart ──
  { id: 'a017', customerName: 'Fatma Kaya',   customerPhone: '05302222222', serviceId: 's4', employeeId: 'e1', date: '2026-03-03', startTime: '10:00', endTime: '10:45', status: 'completed' },
  { id: 'a018', customerName: 'Emre Demir',   customerPhone: '05303333333', serviceId: 's2', employeeId: 'e2', date: '2026-03-05', startTime: '14:30', endTime: '14:50', status: 'completed' },
  { id: 'a019', customerName: 'Ali Yılmaz',   customerPhone: '05301111111', serviceId: 's1', employeeId: 'e1', date: '2026-03-10', startTime: '09:00', endTime: '09:30', status: 'completed' },
  { id: 'a020', customerName: 'Murat Şahin',  customerPhone: '05305555555', serviceId: 's3', employeeId: 'e1', date: '2026-03-12', startTime: '11:00', endTime: '11:50', status: 'cancelled' },
  { id: 'a021', customerName: 'Zeynep Çelik', customerPhone: '05304444444', serviceId: 's2', employeeId: 'e2', date: '2026-03-14', startTime: '16:00', endTime: '16:20', status: 'completed' },
  { id: 'a022', customerName: 'Fatma Kaya',   customerPhone: '05302222222', serviceId: 's1', employeeId: 'e2', date: '2026-03-18', startTime: '12:00', endTime: '12:30', status: 'completed' },
  { id: 'a023', customerName: 'Emre Demir',   customerPhone: '05303333333', serviceId: 's3', employeeId: 'e1', date: '2026-03-21', startTime: '10:00', endTime: '10:50', status: 'completed' },
  { id: 'a024', customerName: 'Ali Yılmaz',   customerPhone: '05301111111', serviceId: 's4', employeeId: 'e1', date: '2026-03-25', startTime: '13:30', endTime: '14:15', status: 'completed' },
  { id: 'a025', customerName: 'Murat Şahin',  customerPhone: '05305555555', serviceId: 's2', employeeId: 'e2', date: '2026-03-28', startTime: '10:30', endTime: '10:50', status: 'completed' },
  // ── Nisan ──
  { id: 'a026', customerName: 'Zeynep Çelik', customerPhone: '05304444444', serviceId: 's4', employeeId: 'e1', date: '2026-04-01', startTime: '09:30', endTime: '10:15', status: 'completed' },
  { id: 'a027', customerName: 'Fatma Kaya',   customerPhone: '05302222222', serviceId: 's3', employeeId: 'e1', date: '2026-04-03', startTime: '11:00', endTime: '11:50', status: 'completed' },
  { id: 'a028', customerName: 'Ali Yılmaz',   customerPhone: '05301111111', serviceId: 's2', employeeId: 'e2', date: '2026-04-07', startTime: '15:00', endTime: '15:20', status: 'completed' },
  { id: 'a029', customerName: 'Emre Demir',   customerPhone: '05303333333', serviceId: 's1', employeeId: 'e2', date: '2026-04-10', startTime: '13:00', endTime: '13:30', status: 'no-show' },
  { id: 'a030', customerName: 'Murat Şahin',  customerPhone: '05305555555', serviceId: 's1', employeeId: 'e1', date: '2026-04-14', startTime: '09:00', endTime: '09:30', status: 'completed' },
  { id: 'a031', customerName: 'Zeynep Çelik', customerPhone: '05304444444', serviceId: 's3', employeeId: 'e2', date: '2026-04-16', startTime: '14:00', endTime: '14:50', status: 'completed' },
  { id: 'a032', customerName: 'Fatma Kaya',   customerPhone: '05302222222', serviceId: 's2', employeeId: 'e2', date: '2026-04-18', startTime: '10:00', endTime: '10:20', status: 'confirmed' },
  { id: 'a033', customerName: 'Ali Yılmaz',   customerPhone: '05301111111', serviceId: 's1', employeeId: 'e1', date: '2026-04-22', startTime: '11:00', endTime: '11:30', status: 'confirmed' },
  { id: 'a034', customerName: 'Murat Şahin',  customerPhone: '05305555555', serviceId: 's4', employeeId: 'e1', date: '2026-04-24', startTime: '14:30', endTime: '15:15', status: 'confirmed' },
  { id: 'a035', customerName: 'Emre Demir',   customerPhone: '05303333333', serviceId: 's3', employeeId: 'e1', date: '2026-04-28', startTime: '10:00', endTime: '10:50', status: 'confirmed' },
];

let _idCounter = Date.now();
const uid = () => String(++_idCounter);

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      services: SEED_SERVICES,
      employees: SEED_EMPLOYEES,
      appointments: SEED_APPOINTMENTS,
      notifications: [],
      customerNotes: [],

      booking: emptyBooking,
      setBooking: (partial) =>
        set((s) => ({ booking: { ...s.booking, ...partial } })),
      resetBooking: () => set({ booking: emptyBooking }),

      addAppointment: (appt) => {
        const newAppt: Appointment = { ...appt, id: uid() };
        set((s) => ({ appointments: [...s.appointments, newAppt] }));
        return newAppt;
      },
      updateAppointment: (id, patch) => {
        const prev = get().appointments.find(a => a.id === id);
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, ...patch } : a
          ),
        }));
        // Durum completed'a geçince review_request bildirimi + sadakat puanı
        if (patch.status === 'completed' && prev && prev.status !== 'completed') {
          const svc = get().services.find(s => s.id === prev.serviceId);
          get().addNotification({
            type: 'review_request',
            title: 'Hizmetinizi değerlendirin',
            body: svc ? `${svc.name} hizmetini beğendiniz mi? Yorumunuzu paylaşın.` : 'Aldığınız hizmeti değerlendirin.',
            appointmentId: id,
          });
          // Hizmet fiyatının %10'u kadar sadakat puanı ekle
          if (svc && prev.customerPhone) {
            const pts = Math.round(svc.price * 0.1);
            useUserAuth.getState().addLoyaltyPoints(prev.customerPhone, pts);
          }
        }
      },
      cancelAppointment: (id) => get().updateAppointment(id, { status: 'cancelled' }),

      addNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: uid(), createdAt: new Date().toISOString(), read: false },
            ...s.notifications,
          ],
        })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      addCustomerNote: (phone, text) =>
        set(s => ({
          customerNotes: [...s.customerNotes, { id: uid(), customerPhone: phone, text, createdAt: new Date().toISOString() }],
        })),
      updateCustomerNote: (id, text) =>
        set(s => ({ customerNotes: s.customerNotes.map(n => n.id === id ? { ...n, text } : n) })),
      deleteCustomerNote: (id) =>
        set(s => ({ customerNotes: s.customerNotes.filter(n => n.id !== id) })),
      getCustomerNotes: (phone) => get().customerNotes.filter(n => n.customerPhone === phone),

      addService: (s) =>
        set((st) => ({ services: [...st.services, { ...s, id: uid() }] })),
      updateService: (id, patch) =>
        set((s) => ({
          services: s.services.map((sv) => (sv.id === id ? { ...sv, ...patch } : sv)),
        })),
      deleteService: (id) =>
        set((s) => ({ services: s.services.filter((sv) => sv.id !== id) })),

      addEmployee: (e) =>
        set((s) => ({ employees: [...s.employees, { ...e, id: uid() }] })),
      updateEmployee: (id, patch) =>
        set((s) => ({
          employees: s.employees.map((em) => (em.id === id ? { ...em, ...patch } : em)),
        })),
      deleteEmployee: (id) =>
        set((s) => ({ employees: s.employees.filter((em) => em.id !== id) })),
    }),
    {
      name: 'randevu-store',
      version: 3,
      migrate: (s) => s,
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<typeof current>;
        // Seed appointment'ları sadece yoksa ekle
        const existingIds = new Set((p.appointments ?? []).map((a: Appointment) => a.id));
        const newSeeds = SEED_APPOINTMENTS.filter(a => !existingIds.has(a.id));
        return {
          ...current,          // fonksiyon referansları current'tan gelir
          ...p,                // tüm persist edilmiş veriler (reviews dahil) üzerine yazar
          appointments: [...(p.appointments ?? []), ...newSeeds],
          notifications: p.notifications ?? current.notifications,
          customerNotes: p.customerNotes ?? current.customerNotes,
          booking:       p.booking       ?? current.booking,
        };
      },
    }
  )
);
