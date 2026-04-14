// @ts-nocheck
import * as React from 'react'
import { Bell, LogOut } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useTranslation } from '../../i18n'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

export const TopBar: React.FC = () => {
  const { type, owner, staff, cafe, logout } = useAuthStore()
  const { language } = useTranslation()
  const today = format(new Date(), 'EEE dd MMM', { locale: language === 'fr' ? fr : enUS })

  const name = type === 'owner' ? (owner?.user_metadata?.full_name || 'Admin') : (staff?.name || 'Staff')
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-50 h-[56px] bg-bg/90 backdrop-blur-md border-b border-border px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {type === 'owner' ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-white font-black text-sm">N</span>
            </div>
            <span className="text-[15px] font-bold text-text">Nook OS</span>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-text truncate max-w-[120px]">{cafe?.name}</span>
            <span className="text-[10px] text-text3 uppercase font-bold tracking-widest">{name}</span>
          </div>
        )}
      </div>

      <div className="text-[13px] text-text2 font-medium capitalize font-mono">
        {today}
      </div>

      <div className="flex items-center gap-3">
        {type === 'owner' ? (
          <>
            <div className="relative">
              <Bell className="w-5 h-5 text-text2" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-bg" />
            </div>
            <div className="w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-[11px] font-bold text-text shadow-sm uppercase">
              {initials}
            </div>
          </>
        ) : (
          <button
            onClick={logout}
            className="p-2 text-text3 hover:text-error transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  )
}
