import * as React from 'react'
import { motion } from 'framer-motion'
import { Delete, Check } from 'lucide-react'
import { cn } from '../../utils/cn'

interface NumPadProps {
  onInput: (val: string) => void
  onDelete: () => void
  onConfirm?: () => void
  showConfirm?: boolean
  className?: string
}

export const NumPad: React.FC<NumPadProps> = ({ onInput, onDelete, onConfirm, showConfirm, className }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className={cn("grid grid-cols-3 gap-3 max-w-[320px] mx-auto", className)}>
      {keys.map((key) => (
        <NumKey key={key} onClick={() => onInput(key)}>
          {key}
        </NumKey>
      ))}
      <NumKey onClick={onDelete}>
        <Delete className="w-5 h-5 text-text2" />
      </NumKey>
      <NumKey onClick={() => onInput('0')}>0</NumKey>
      {showConfirm ? (
        <NumKey onClick={onConfirm || (() => {})} className="bg-success-dim border-success/20">
          <Check className="w-5 h-5 text-success" />
        </NumKey>
      ) : (
        <div />
      )}
    </div>
  )
}

const NumKey: React.FC<{ children: React.ReactNode; onClick: () => void; className?: string }> = ({ children, onClick, className }) => (
  <motion.button
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    className={cn(
      "h-14 bg-surface2 border border-border rounded-btn flex items-center justify-center text-xl font-mono font-bold text-text hover:bg-accent-glow hover:border-accent-border transition-colors",
      className
    )}
  >
    {children}
  </motion.button>
)
