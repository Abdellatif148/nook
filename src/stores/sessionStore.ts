import { create } from 'zustand';
import type { Session } from '../types';
import { getActiveSessions, saveSession } from '../db/sessions';

interface SessionState {
  activeSessions: Session[];
  isLoading: boolean;
  loadActiveSessions: (cafeId: string) => Promise<void>;
  addActiveSession: (session: Session) => void;
  updateActiveSession: (session: Session) => void;
  removeActiveSession: (id: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSessions: [],
  isLoading: false,
  loadActiveSessions: async (cafeId: string) => {
    set({ isLoading: true });
    try {
      const sessions = await getActiveSessions(cafeId);
      set({ activeSessions: sessions, isLoading: false });
    } catch (error) {
      console.error('Failed to load active sessions', error);
      set({ isLoading: false });
    }
  },
  addActiveSession: (session) => set((state) => ({ activeSessions: [session, ...state.activeSessions] })),
  updateActiveSession: (session) => set((state) => ({
    activeSessions: state.activeSessions.map((s) => (s.id === session.id ? session : s)),
  })),
  removeActiveSession: (id) => set((state) => ({
    activeSessions: state.activeSessions.filter((s) => s.id !== id),
  })),
}));
