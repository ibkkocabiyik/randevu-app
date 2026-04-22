import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationPreferences {
  bookingConfirmed: boolean;
  bookingCancelled: boolean;
  bookingReminder: boolean;
  reviewRequest: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  bookingConfirmed: true,
  bookingCancelled: true,
  bookingReminder: true,
  reviewRequest: true,
};

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  favoriteServiceIds: string[];
  notificationPrefs: NotificationPreferences;
  loyaltyPoints: number;
  createdAt: string;
}

interface UserAuthStore {
  currentUser: UserAccount | null;
  users: UserAccount[];

  register: (data: { name: string; email: string; phone: string; password: string }) => { ok: boolean; error?: string };
  login: (emailOrPhone: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (patch: Partial<Pick<UserAccount, 'name' | 'email' | 'phone' | 'favoriteServiceIds' | 'notificationPrefs'>>) => void;
  addLoyaltyPoints: (phone: string, points: number) => void;
}

let _id = Date.now();
const uid = () => String(++_id);

const SEED_USERS: UserAccount[] = [
  { id: 'u1', name: 'Ali Yılmaz',   email: 'ali@demo.com',    phone: '05301111111', passwordHash: btoa('demo123'), favoriteServiceIds: [], notificationPrefs: DEFAULT_PREFS, loyaltyPoints: 830, createdAt: '2026-01-03T10:00:00.000Z' },
  { id: 'u2', name: 'Fatma Kaya',   email: 'fatma@demo.com',  phone: '05302222222', passwordHash: btoa('demo123'), favoriteServiceIds: [], notificationPrefs: DEFAULT_PREFS, loyaltyPoints: 620, createdAt: '2026-01-10T09:00:00.000Z' },
  { id: 'u3', name: 'Emre Demir',   email: 'emre@demo.com',   phone: '05303333333', passwordHash: btoa('demo123'), favoriteServiceIds: [], notificationPrefs: DEFAULT_PREFS, loyaltyPoints: 390, createdAt: '2026-01-15T11:00:00.000Z' },
  { id: 'u4', name: 'Zeynep Çelik', email: 'zeynep@demo.com', phone: '05304444444', passwordHash: btoa('demo123'), favoriteServiceIds: [], notificationPrefs: DEFAULT_PREFS, loyaltyPoints: 560, createdAt: '2026-01-20T14:00:00.000Z' },
  { id: 'u5', name: 'Murat Şahin',  email: 'murat@demo.com',  phone: '05305555555', passwordHash: btoa('demo123'), favoriteServiceIds: [], notificationPrefs: DEFAULT_PREFS, loyaltyPoints: 450, createdAt: '2026-02-01T08:00:00.000Z' },
];

export const useUserAuth = create<UserAuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: SEED_USERS,

      register: ({ name, email, phone, password }) => {
        const { users } = get();
        if (users.find(u => u.email === email))
          return { ok: false, error: 'Bu e-posta zaten kayıtlı.' };
        if (users.find(u => u.phone === phone))
          return { ok: false, error: 'Bu telefon numarası zaten kayıtlı.' };
        const newUser: UserAccount = {
          id: uid(),
          name,
          email,
          phone,
          passwordHash: btoa(password),
          favoriteServiceIds: [],
          notificationPrefs: DEFAULT_PREFS,
          loyaltyPoints: 0,
          createdAt: new Date().toISOString(),
        };
        set(s => ({ users: [...s.users, newUser], currentUser: newUser }));
        return { ok: true };
      },

      login: (emailOrPhone, password) => {
        const { users } = get();
        const user = users.find(
          u => (u.email === emailOrPhone || u.phone === emailOrPhone) &&
               u.passwordHash === btoa(password)
        );
        if (!user) return { ok: false, error: 'E-posta/telefon veya şifre hatalı.' };
        set({ currentUser: user });
        return { ok: true };
      },

      logout: () => set({ currentUser: null }),

      updateProfile: (patch) =>
        set(s => {
          if (!s.currentUser) return s;
          const updated = { ...s.currentUser, ...patch };
          return {
            currentUser: updated,
            users: s.users.map(u => u.id === updated.id ? updated : u),
          };
        }),

      addLoyaltyPoints: (phone, points) =>
        set(s => {
          const users = s.users.map(u =>
            u.phone === phone ? { ...u, loyaltyPoints: u.loyaltyPoints + points } : u
          );
          const currentUser = s.currentUser?.phone === phone
            ? { ...s.currentUser, loyaltyPoints: s.currentUser.loyaltyPoints + points }
            : s.currentUser;
          return { users, currentUser };
        }),
    }),
    {
      name: 'randevu-user-auth',
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<typeof current>;
        const existingIds = new Set((p.users ?? []).map((u: UserAccount) => u.id));
        const newSeeds = SEED_USERS.filter(u => !existingIds.has(u.id));
        const mergedUsers = (p.users ?? []).map((u: UserAccount) => ({
          ...u,
          notificationPrefs: u.notificationPrefs ?? DEFAULT_PREFS,
          loyaltyPoints: u.loyaltyPoints ?? 0,
        }));
        return {
          ...current,
          ...p,
          users: [...mergedUsers, ...newSeeds],
          currentUser: p.currentUser
            ? {
                ...p.currentUser,
                notificationPrefs: p.currentUser.notificationPrefs ?? DEFAULT_PREFS,
                loyaltyPoints: p.currentUser.loyaltyPoints ?? 0,
              }
            : null,
        };
      },
    }
  )
);
