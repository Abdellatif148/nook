import * as React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'danger' | 'success' | 'warning' | 'info'
  icon?: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', icon, className }) => {
  const variants = {
    primary: 'bg-accent-glow border-accent-border text-accent2',
    danger: 'bg-error-dim border-error/20 text-error',
    success: 'bg-success-dim border-success/20 text-success',
    warning: 'bg-warning-dim border-warning/20 text-warning',
    info: 'bg-info-dim border-info/20 text-info'
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge border text-[11px] font-bold uppercase tracking-wider',
      variants[variant],
      className
    )}>
      {icon}
      {children}
    </div>
  )
}
