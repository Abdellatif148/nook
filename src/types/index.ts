import type { Database } from './database'

export type Cafe = Database['public']['Tables']['cafes']['Row']
export type Staff = Database['public']['Tables']['staff']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type ClientAccount = Database['public']['Tables']['client_accounts']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type BalanceTransaction = Database['public']['Tables']['balance_transactions']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']

export interface StaffPermissions {
  sessions: boolean
  reports: boolean
  clients: boolean
  settings: boolean
}

export type AuthType = 'owner' | 'staff' | null

export interface StaffSession {
  type: 'staff'
  staff_id: string
  cafe_id: string
  name: string
  permissions: StaffPermissions
  expires_at: string
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}
