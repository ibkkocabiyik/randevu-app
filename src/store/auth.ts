import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Hardcoded admin credentials — replace with real auth in Faz 2
const ADMIN_EMAIL = 'admin@kuafor.com';
const ADMIN_PASSWORD = 'admin123';

interface AuthStore {
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: (email, password) => {
        const ok = email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
        if (ok) set({ isAuthenticated: true });
        return ok;
      },
      logout: () => set({ isAuthenticated: false }),
    }),
    { name: 'randevu-auth' }
  )
);
