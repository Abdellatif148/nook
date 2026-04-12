import * as React from 'react'
import { Bell, LogOut, Store } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Avatar } from '../ui/Avatar'
import { useTranslation } from '../../i18n'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const TopBar: React.FC = () => {
  const { type, user, staff, cafe, logout } = useAuthStore()
  const { language } = useTranslation()
  const today = format(new Date(), 'EEEE d MMMM', { locale: language === 'fr' ? fr : undefined })

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-bg/90 backdrop-blur-lg border-b border-border z-[100] px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
          <span className="text-white font-black text-sm">N</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-text leading-tight">
            {type === 'owner' ? 'Nook OS' : (cafe?.name || 'Nook OS')}
          </span>
          {type === 'staff' && (
            <span className="text-[10px] text-text3 font-medium uppercase tracking-wider leading-none">
              {staff?.name}
            </span>
          )}
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
        <span className="text-xs text-text2 font-medium capitalize">{today}</span>
      </div>

      <div className="flex items-center gap-3">
        {type === 'owner' ? (
          <>
            <button className="relative p-1.5 text-text2 hover:text-text transition-colors">
              <Bell className="w-5 h-5" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border-2 border-bg" />
            </button>
            <Avatar name={user?.user_metadata?.full_name || 'Owner'} size="sm" />
          </>
        ) : (
          <button onClick={logout} className="p-2 text-text3 hover:text-error transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  )
}
