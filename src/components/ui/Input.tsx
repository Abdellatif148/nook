import * as React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  error?: string
}

export const Input: React.FC<InputProps> = ({ label, icon, error, className, ...props }) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-[11px] font-bold text-text3 uppercase tracking-wider pl-1">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text3">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full bg-black/25 border border-border rounded-input px-3.5 py-2.5 text-text text-sm transition-all focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none placeholder:text-text3',
            icon && 'pl-10',
            error && 'border-error/50 focus:border-error focus:ring-error/5',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-error pl-1">{error}</p>}
    </div>
  )
}
