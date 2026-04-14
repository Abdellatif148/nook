import * as React from 'react'
import { useAuthStore } from '../../stores/authStore'
import type { StaffPermissions } from '../../types'

interface PermissionGateProps {
  permission: keyof StaffPermissions
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ permission, children, fallback = null }) => {
  const { type, staff } = useAuthStore()

  if (type === 'owner') return <>{children}</>
  if (type === 'staff' && staff?.permissions && (staff.permissions as any)[permission]) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
