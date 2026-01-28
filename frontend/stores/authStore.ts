import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Customer, User } from '@/types';

interface AuthState {
  token: string | null;
  tempToken: string | null;
  deviceId: string | null;
  user: Customer | User | null;
  isAdmin: boolean;
  setAuth: (token: string, user: Customer | User, isAdmin?: boolean) => void;
  setTempToken: (token: string) => void;
  getDeviceId: () => string;
  logout: (skipApi?: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      tempToken: null,
      deviceId: null,
      user: null,
      isAdmin: false,
      // Industry-Standard Device Identification:
      // Generates a persistent unique ID for each browser/device that persists
      // even if cookies or site data are cleared.
      getDeviceId: () => {
        const state = get();
        if (state.deviceId) return state.deviceId;
        
        let id = localStorage.getItem('deviceId');
        if (!id) {
          id = typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Math.random().toString(36).substring(2) + Date.now().toString(36);
          localStorage.setItem('deviceId', id);
        }
        set({ deviceId: id });
        return id;
      },
      setAuth: (token, user, isAdmin = false) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ token, user, isAdmin, tempToken: null });
      },
      setTempToken: (token) => {
        set({ tempToken: token });
      },
      logout: async (skipApi = false) => {
        if (!skipApi) {
            try {
                // Import api dynamically to avoid circular dependency
                const api = (await import('@/lib/api')).default;
                await api.post('/customers/logout');
            } catch (e) {
                console.error('Logout failed', e);
            }
        }
        // Aggressive Cleanup
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('admin_token'); // Clear Admin Token too
        localStorage.removeItem('auth-storage'); // Clear Zustand persist
        // Also clear any legacy or other potential tokens
        localStorage.removeItem('tempToken'); 
        
        set({ token: null, user: null, isAdmin: false, tempToken: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
