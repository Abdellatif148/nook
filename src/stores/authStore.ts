import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Cafe, Staff, AuthType } from '../types'

interface AuthState {
  type: AuthType
  owner: User | null
  staff: Staff | null
  cafe: Cafe | null
  isLoading: boolean
  setAuth: (type: AuthType, owner: User | null, staff: Staff | null, cafe: Cafe | null) => void
  setCafe: (cafe: Cafe) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  type: null,
  owner: null,
  staff: null,
  cafe: null,
  isLoading: true,
  setAuth: (type, owner, staff, cafe) => set({ type, owner, staff, cafe, isLoading: false }),
  setCafe: (cafe) => set({ cafe }),
  logout: () => {
    localStorage.removeItem('nook_staff_session')
    set({ type: null, owner: null, staff: null, cafe: null, isLoading: false })
  }
}))
