export interface Session {
  id: string                    // UUID generated client-side
  local_id: string              // same as id, for offline tracking
  cafe_id: string               // from logged-in user
  customer_name: string         // entered by staff (required)
  customer_phone?: string       // optional
  seat_number: number           // 1-50
  rate_per_hour: number         // in DH (default from settings)
  started_at: string            // ISO timestamp — IMMUTABLE after creation
  ended_at?: string             // ISO timestamp when closed
  duration_minutes?: number     // calculated on close
  time_cost?: number            // duration * rate / 60
  extras: Extra[]               // food/drinks added
  extras_total: number          // sum of extras
  total_amount: number          // time_cost + extras_total
  payment_method?: 'cash' | 'card' | 'account' | 'free'
  amount_received?: number      // for cash — to calculate change
  change_given?: number         // amount_received - total_amount
  client_account_id?: string    // if charged to account
  status: 'active' | 'completed' | 'cancelled'
  created_by: string            // staff user id
  synced: boolean               // false = pending sync to API
  created_at: string
  updated_at: string
}

export interface Extra {
  id: string
  name: string
  price: number
  quantity: number
}

export interface ClientAccount {
  id: string
  cafe_id: string
  name: string
  phone?: string
  balance: number               // current credit balance in DH
  total_visits: number
  total_spent: number
  notes?: string
  synced: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  cafe_id: string
  name: string
  price: number
  category: 'boisson' | 'nourriture' | 'autre'
  active: boolean
}

export interface CafeSettings {
  cafe_id: string
  cafe_name: string
  owner_name: string
  total_seats: number           // default 20
  default_rate: number          // DH per hour — default 2
  premium_rate: number          // DH per hour — default 3
  billing_increment: 'minute' | '15min' | '30min' | 'hour'
  long_session_alert_hours: number  // default 3
  low_balance_alert: number     // default 20 DH
  currency: 'DH'
}

export interface DailyStats {
  date: string                  // YYYY-MM-DD
  total_sessions: number
  total_revenue: number
  cash_revenue: number
  card_revenue: number
  account_revenue: number
  free_sessions: number
  average_duration_minutes: number
  average_revenue_per_session: number
}

export interface AuditLog {
  id: string
  cafe_id: string
  staff_id: string
  action: string
  details: string
  timestamp: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'owner' | 'staff'
  cafe_id: string
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export interface SyncItem {
  id: string
  type: 'create_session' | 'update_session' | 'create_client' | 'update_client_balance' | 'update_settings'
  payload: any
  retry_count: number
  created_at: string
}
