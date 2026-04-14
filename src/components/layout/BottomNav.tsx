import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Clock, BarChart3, Users, Settings } from 'lucide-react';
import { clsx } from 'clsx';

export const BottomNav: React.FC = () => {
  const navItems = [
    { icon: Home, label: 'Accueil', path: '/dashboard' },
    { icon: Clock, label: 'Sessions', path: '/sessions' },
    { icon: BarChart3, label: 'Rapport', path: '/reports' },
    { icon: Users, label: 'Clients', path: '/clients' },
    { icon: Settings, label: 'Réglages', path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-bg/95 backdrop-blur-md border-t border-border flex items-center justify-around safe-bottom z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            clsx(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-accent2" : "text-text3"
            )
          }
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
