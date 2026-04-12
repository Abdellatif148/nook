import * as React from 'react'
import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { cn } from '../../utils/cn'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-br from-[#f97316] to-[#ea6b0a] text-white font-semibold shadow-accent hover:shadow-accent-hover',
      ghost: 'bg-transparent border border-border text-text2 hover:bg-white/5',
      danger: 'bg-error-dim border border-error/25 text-error',
      success: 'bg-success-dim border border-success/20 text-success'
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'relative flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] rounded-btn font-inter text-sm transition-shadow disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden',
          variants[variant],
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!isLoading && leftIcon}
        <span className={cn(isLoading && 'opacity-0')}>
          {children as React.ReactNode}
        </span>
        {!isLoading && rightIcon}
      </motion.button>
    )
  }
)
