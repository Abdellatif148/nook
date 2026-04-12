import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Timer, BarChart2, Users, Settings } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useTranslation } from '../../i18n'
import { useAuthStore } from '../../stores/authStore'

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

  const checkPermission = (item: typeof navItems[0]) => {
    if (type === 'owner') return true
    if (!item.permission) return true
    const perms = staff?.permissions as any
    return perms?.[item.permission] === true
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-bg/95 backdrop-blur-lg border-t border-border z-[100] px-2 flex items-center justify-around pb-safe">
      {navItems.map((item) => {
        const hasAccess = checkPermission(item)
        return (
          <NavLink
            key={item.path}
            to={hasAccess ? item.path : '#'}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 transition-all",
              !hasAccess && "opacity-30 pointer-events-none grayscale",
              isActive && hasAccess ? "text-accent2" : "text-text3"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && hasAccess && (
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
