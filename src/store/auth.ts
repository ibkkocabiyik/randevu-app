import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, setToken, clearToken } from '../lib/api';

const LOCAL_ADMIN_PASSWORD = 'admin123';

interface AuthStore {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,

      login: async (_email: string, password: string) => {
        try {
          const { token } = await authApi.adminLogin(password);
          setToken(token);
          set({ isAuthenticated: true });
          return true;
        } catch {
          // Backend yoksa yerel şifreyle kontrol et
          if (password === LOCAL_ADMIN_PASSWORD) {
            set({ isAuthenticated: true });
            return true;
          }
          return false;
        }
      },

      logout: () => {
        clearToken();
        set({ isAuthenticated: false });
      },
    }),
    { name: 'randevu-auth' }
  )
);