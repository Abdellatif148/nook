import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PINDotsProps {
  length: number
  maxLength?: number
  error?: boolean
}

export const PINDots: React.FC<PINDotsProps> = ({ length, maxLength = 4, error }) => {
  const dots = Array.from({ length: maxLength })

  return (
    <motion.div
      animate={error ? { x: [-4, 4, -4, 4, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex justify-center gap-6"
    >
      {dots.map((_, i) => (
        <div
          key={i}
          className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
            i < length
              ? 'bg-accent border-accent scale-110 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
              : 'border-border'
          } ${error ? 'border-error bg-error' : ''}`}
        />
      ))}
    </motion.div>
  )
}
