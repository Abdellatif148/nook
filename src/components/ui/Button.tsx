// @ts-nocheck
import * as React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success'
  isLoading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', isLoading, icon, iconRight, className, disabled, ...props
}) => {
  const variants = {
    primary: 'bg-gradient-to-br from-accent to-[#ea6b0a] text-white font-semibold shadow-[0_2px_12px_rgba(249,115,22,0.3)] hover:shadow-[0_4px_20px_rgba(249,115,22,0.4)]',
    ghost: 'bg-transparent border border-border text-text2 hover:bg-white/5',
    danger: 'bg-error-dim border border-error/25 text-error',
    success: 'bg-success-dim border border-success/20 text-success'
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      className={cn(
        'flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-btn transition-all text-sm disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {icon}
          {children}
          {iconRight}
        </>
      )}
    </motion.button>
  )
}
