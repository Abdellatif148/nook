import { create } from 'zustand'
import type { Session } from '../types'

interface SessionState {
  activeSessions: Session[]
  setActiveSessions: (sessions: Session[]) => void
  addSession: (session: Session) => void
  updateSession: (session: Session) => void
  removeSession: (id: string) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSessions: [],
  setActiveSessions: (activeSessions) => set({ activeSessions }),
  addSession: (session) => set((state) => ({
    activeSessions: [session, ...state.activeSessions.filter(s => s.id !== session.id)]
  })),
  updateSession: (session) => set((state) => ({
    activeSessions: state.activeSessions.map(s => s.id === session.id ? session : s)
  })),
  removeSession: (id) => set((state) => ({
    activeSessions: state.activeSessions.filter(s => s.id !== id)
  }))
}))
