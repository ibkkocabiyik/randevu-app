import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BookingState, Notification } from '../types';
import { useUserAuth } from './userAuth';

interface Store {
  booking: BookingState;
  setBooking: (partial: Partial<BookingState>) => void;
  resetBooking: () => void;

  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const emptyBooking: BookingState = {
  serviceId: null,
  employeeId: null,
  date: null,
  startTime: null,
};

let _id = Date.now();
const uid = () => String(++_id);

export const useStore = create<Store>()(
  persist(
    (set) => ({
      booking: emptyBooking,
      setBooking: (partial) => set((s) => ({ booking: { ...s.booking, ...partial } })),
      resetBooking: () => set({ booking: emptyBooking }),

      notifications: [],
      addNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: uid(), createdAt: new Date().toISOString(), read: false },
            ...s.notifications,
          ],
        })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    }),
    {
      name: 'randevu-ui',
      partialize: (s) => ({ booking: s.booking, notifications: s.notifications }),
    }
  )
);

// Re-export useUserAuth helpers for backward compat
export { useUserAuth };
