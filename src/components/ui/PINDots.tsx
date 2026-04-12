import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface PINDotsProps {
  length: number
  maxLength: number
  error?: boolean
}

export const PINDots: React.FC<PINDotsProps> = ({ length, maxLength, error }) => {
  return (
    <div className={cn("flex justify-center gap-4", error && "animate-shake")}>
      {Array.from({ length: maxLength }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: i < length ? 1.1 : 1,
            backgroundColor: i < length ? 'var(--accent)' : 'transparent',
            borderColor: i < length ? 'var(--accent)' : 'var(--border)'
          }}
          className={cn(
            "w-3 h-3 rounded-full border-2 transition-colors",
            error && "border-error"
          )}
        />
      ))}
    </div>
  )
}
