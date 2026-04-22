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

export const useUserAuth = create<UserAuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],

      register: async ({ name, email, phone, password }) => {
        try {
          const { token, user } = await authApi.register({ name, email, phone, password });
          setToken(token);
          const account = apiUserToAccount(user);
          set({ currentUser: account, users: [account] });
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
          set({ currentUser: account, users: [account] });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : 'Giriş başarısız' };
        }
      },

      logout: () => {
        clearToken();
        set({ currentUser: null, users: [] });
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

// Sayfa yenilenince token varsa kullanıcıyı yenile
const token = localStorage.getItem('randevu-token');
if (token && useUserAuth.getState().currentUser) {
  authApi.me().then(user => {
    const account = apiUserToAccount(user);
    account.favoriteServiceIds = useUserAuth.getState().currentUser?.favoriteServiceIds ?? [];
    useUserAuth.setState({ currentUser: account });
  }).catch(() => {
    // Token geçersiz, temizle
    clearToken();
    useUserAuth.setState({ currentUser: null });
  });
}
