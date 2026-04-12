import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Cafe, Staff, AuthType } from '../types'

interface AuthState {
  type: AuthType
  user: User | null
  staff: Staff | null
  cafe: Cafe | null
  isLoading: boolean
  setAuth: (type: AuthType, user: User | null, staff: Staff | null, cafe: Cafe | null) => void
  setCafe: (cafe: Cafe | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  type: null,
  user: null,
  staff: null,
  cafe: null,
  isLoading: true,
  setAuth: (type, user, staff, cafe) => set({ type, user, staff, cafe, isLoading: false }),
  setCafe: (cafe) => set({ cafe }),
  logout: () => {
    localStorage.removeItem('nook_staff_session')
    set({ type: null, user: null, staff: null, cafe: null, isLoading: false })
  }
}))
