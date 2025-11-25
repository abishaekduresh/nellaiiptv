import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Customer, User } from '@/types';

interface AuthState {
  token: string | null;
  user: Customer | User | null;
  isAdmin: boolean;
  setAuth: (token: string, user: Customer | User, isAdmin?: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAdmin: false,
      setAuth: (token, user, isAdmin = false) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ token, user, isAdmin });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAdmin: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
