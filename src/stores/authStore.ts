import { create } from 'zustand';
import type { User, CafeSettings } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  settings: CafeSettings | null;
  isLoading: boolean;
  setAuth: (token: string, user: User, settings: CafeSettings) => void;
  updateSettings: (settings: CafeSettings) => void;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  settings: null,
  isLoading: true,
  setAuth: (token, user, settings) => {
    localStorage.setItem('nook_token', token);
    localStorage.setItem('nook_user', JSON.stringify(user));
    set({ token, user, settings, isLoading: false });
  },
  updateSettings: (settings) => set({ settings }),
  logout: () => {
    localStorage.removeItem('nook_token');
    localStorage.removeItem('nook_user');
    set({ token: null, user: null, settings: null, isLoading: false });
  },
  init: () => {
    const token = localStorage.getItem('nook_token');
    const userStr = localStorage.getItem('nook_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isLoading: false });
      } catch {
        localStorage.removeItem('nook_token');
        localStorage.removeItem('nook_user');
        set({ token: null, user: null, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
