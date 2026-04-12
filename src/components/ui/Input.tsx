import * as React from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, icon, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && <label className="text-[11px] font-semibold text-text3 uppercase tracking-wider pl-1">{label}</label>}
        <div className="relative group">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text3 group-focus-within:text-accent transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-black/25 border border-border rounded-btn px-3.5 py-2.5 text-text placeholder:text-text3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all h-[44px]',
              icon && 'pl-10',
              error && 'border-error focus:border-error focus:ring-error/5',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-error pl-1">{error}</p>}
      </div>
    )
  }
)
