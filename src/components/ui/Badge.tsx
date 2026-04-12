import * as React from 'react'
import { cn } from '../../utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'ghost'
  icon?: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', icon, className }) => {
  const variants = {
    primary: 'bg-accent-glow border-accent-border text-accent2',
    success: 'bg-success-dim border-success/20 text-success',
    error: 'bg-error-dim border-error/25 text-error',
    warning: 'bg-warning-dim border-warning/25 text-warning',
    info: 'bg-info-dim border-info/25 text-info',
    ghost: 'bg-surface2 border-border text-text2'
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 border rounded-full text-[11px] font-semibold',
      variants[variant],
      className
    )}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  )
}
