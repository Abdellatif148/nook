import { create } from 'zustand'
import type { Session } from '../types'

interface SessionState {
  activeSessions: Session[]
  setActiveSessions: (sessions: Session[]) => void
  addSession: (session: Session) => void
  updateSession: (session: Session) => void
  removeSession: (sessionId: string) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSessions: [],
  setActiveSessions: (sessions) => set({ activeSessions: sessions }),
  addSession: (session) => set((state) => ({
    activeSessions: [...state.activeSessions, session]
  })),
  updateSession: (session) => set((state) => ({
    activeSessions: state.activeSessions.map((s) => s.id === session.id ? session : s)
  })),
  removeSession: (sessionId) => set((state) => ({
    activeSessions: state.activeSessions.filter((s) => s.id !== sessionId)
  }))
}))
