import * as React from 'react';
import { Bell, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const TopBar: React.FC = () => {
  const { user } = useAuthStore();
  const today = format(new Date(), 'EEE dd MMM', { locale: fr });

  return (
    <header className="sticky top-0 z-50 h-[56px] bg-bg/90 backdrop-blur-md border-b border-border px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
          <span className="text-white font-black text-[14px]">N</span>
        </div>
        <span className="text-[15px] font-bold text-text">Nook OS</span>
      </div>

      <div className="text-[13px] text-text2 font-medium capitalize">
        {today}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Bell className="w-5 h-5 text-text2" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red rounded-full border-2 border-bg" />
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-[12px] font-bold text-white uppercase shadow-main">
          {user?.name.substring(0, 2) || 'OS'}
        </div>
      </div>
    </header>
  );
};
