import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, setToken, clearToken } from '../lib/api';

export interface NotificationPreferences {
  bookingConfirmed: boolean;
  bookingCancelled: boolean;
  bookingReminder: boolean;
  reviewRequest: boolean;
}

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
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
  login: (emailOrPhone: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<UserAccount, 'name' | 'email' | 'phone' | 'favoriteServiceIds' | 'notificationPrefs'>>) => Promise<void>;
  addLoyaltyPoints: (phone: string, points: number) => void;
}

const DEFAULT_PREFS: NotificationPreferences = {
  bookingConfirmed: true, bookingCancelled: true,
  bookingReminder: true, reviewRequest: true,
};

function apiUserToAccount(u: Awaited<ReturnType<typeof authApi.me>>): UserAccount {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    passwordHash: '',
    favoriteServiceIds: [],
    loyaltyPoints: u.loyalty_points ?? 0,
    notificationPrefs: {
      bookingConfirmed: u.notif_booking_confirmed ?? true,
      bookingCancelled: u.notif_booking_cancelled ?? true,
      bookingReminder:  u.notif_booking_reminder  ?? true,
      reviewRequest:    u.notif_review_request    ?? true,
    },
    createdAt: u.created_at ?? new Date().toISOString(),
  };
}

const SEED_USERS: UserAccount[] = [
  {
    id: 'u1',
    name: 'Ali Yılmaz',
    email: 'ali@example.com',
    phone: '05301111111',
    passwordHash: 'demo1234',
    favoriteServiceIds: ['s1', 's3'],
    notificationPrefs: DEFAULT_PREFS,
    loyaltyPoints: 45,
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'u2',
    name: 'Fatma Kaya',
    email: 'fatma@example.com',
    phone: '05302222222',
    passwordHash: 'demo1234',
    favoriteServiceIds: ['s4'],
    notificationPrefs: DEFAULT_PREFS,
    loyaltyPoints: 60,
    createdAt: '2026-01-02T10:00:00.000Z',
  },
  {
    id: 'u3',
    name: 'Emre Demir',
    email: 'emre@example.com',
    phone: '05303333333',
    passwordHash: 'demo1234',
    favoriteServiceIds: ['s2', 's3'],
    notificationPrefs: DEFAULT_PREFS,
    loyaltyPoints: 30,
    createdAt: '2026-01-03T10:00:00.000Z',
  },
  {
    id: 'u4',
    name: 'Zeynep Çelik',
    email: 'zeynep@example.com',
    phone: '05304444444',
    passwordHash: 'demo1234',
    favoriteServiceIds: ['s4', 's1'],
    notificationPrefs: DEFAULT_PREFS,
    loyaltyPoints: 55,
    createdAt: '2026-01-04T10:00:00.000Z',
  },
  {
    id: 'u5',
    name: 'Murat Şahin',
    email: 'murat@example.com',
    phone: '05305555555',
    passwordHash: 'demo1234',
    favoriteServiceIds: ['s1', 's2'],
    notificationPrefs: DEFAULT_PREFS,
    loyaltyPoints: 25,
    createdAt: '2026-01-05T10:00:00.000Z',
  },
];

export const useUserAuth = create<UserAuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: SEED_USERS,

      register: async ({ name, email, phone, password }) => {
        try {
          const { token, user } = await authApi.register({ name, email, phone, password });
          setToken(token);
          const account = apiUserToAccount(user);
          set(s => ({ currentUser: account, users: [...s.users.filter(u => u.id !== account.id), account] }));
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : 'Kayıt başarısız' };
        }
      },

      login: async (emailOrPhone, password) => {
        try {
          const { token, user } = await authApi.login(emailOrPhone, password);
          setToken(token);
          const account = apiUserToAccount(user);
          set(s => ({ currentUser: account, users: [...s.users.filter(u => u.id !== account.id), account] }));
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : 'Giriş başarısız' };
        }
      },

      logout: () => {
        clearToken();
        set({ currentUser: null });
      },

      updateProfile: async (patch) => {
        const { currentUser } = get();
        if (!currentUser) return;
        try {
          const apiPatch: Record<string, unknown> = {};
          if (patch.name)  apiPatch.name  = patch.name;
          if (patch.email) apiPatch.email = patch.email;
          if (patch.phone) apiPatch.phone = patch.phone;
          if (patch.notificationPrefs) {
            apiPatch.notif_booking_confirmed = patch.notificationPrefs.bookingConfirmed;
            apiPatch.notif_booking_cancelled = patch.notificationPrefs.bookingCancelled;
            apiPatch.notif_booking_reminder  = patch.notificationPrefs.bookingReminder;
            apiPatch.notif_review_request    = patch.notificationPrefs.reviewRequest;
          }
          const updated = await authApi.updateMe(apiPatch as never);
          const account = apiUserToAccount(updated);
          // favoriteServiceIds yerel olarak sakla (backend'de henüz yok)
          account.favoriteServiceIds = patch.favoriteServiceIds ?? currentUser.favoriteServiceIds;
          set({ currentUser: account });
        } catch {}
      },

      addLoyaltyPoints: (phone, points) =>
        set(s => {
          if (!s.currentUser || s.currentUser.phone !== phone) return s;
          const updated = { ...s.currentUser, loyaltyPoints: s.currentUser.loyaltyPoints + points };
          return { currentUser: updated };
        }),
    }),
    {
      name: 'randevu-user-auth',
      partialize: (s) => ({ currentUser: s.currentUser }),
    }
  )
);

// UUID v4 kontrolü — seed user'lar ('u1' vb.) ile gelen eski oturumları geçersiz kıl
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const persistedUser = useUserAuth.getState().currentUser;
if (persistedUser && !UUID_RE.test(persistedUser.id)) {
  clearToken();
  useUserAuth.setState({ currentUser: null });
}

// Sayfa yenilenince token varsa kullanıcıyı yenile
const token = localStorage.getItem('randevu-token');
if (token && useUserAuth.getState().currentUser) {
  authApi.me().then(user => {
    const account = apiUserToAccount(user);
    account.favoriteServiceIds = useUserAuth.getState().currentUser?.favoriteServiceIds ?? [];
    useUserAuth.setState({ currentUser: account });
  }).catch(() => {
    clearToken();
    useUserAuth.setState({ currentUser: null });
  });
}
