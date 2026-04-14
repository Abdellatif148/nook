import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Timer, BarChart2, Users, Settings } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useAuthStore } from '../../stores/authStore'
import { clsx } from 'clsx'

export const BottomNav: React.FC = () => {
  const { t } = useTranslation()
  const { type, staff } = useAuthStore()

  const navItems = [
    { icon: Home, label: t('nav.home'), path: '/dashboard', permission: null },
    { icon: Timer, label: t('nav.sessions'), path: '/sessions', permission: 'sessions' },
    { icon: BarChart2, label: t('nav.reports'), path: '/reports', permission: 'reports' },
    { icon: Users, label: t('nav.clients'), path: '/clients', permission: 'clients' },
    { icon: Settings, label: t('nav.settings'), path: '/settings', permission: 'settings' },
  ]

  const hasPermission = (permission: string | null) => {
    if (!permission || type === 'owner') return true
    return (staff?.permissions as any)?.[permission]
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-bg2/95 backdrop-blur-md border-t border-border flex items-center justify-around safe-bottom z-50">
      {navItems.map((item) => {
        const enabled = hasPermission(item.permission)
        return (
          <NavLink
            key={item.path}
            to={enabled ? item.path : '#'}
            className={({ isActive }) =>
              clsx(
                "relative flex flex-col items-center gap-1 transition-all duration-200",
                !enabled ? "opacity-30 cursor-not-allowed" : isActive ? "text-accent" : "text-text3"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {enabled && isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-accent rounded-full" />
                )}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
