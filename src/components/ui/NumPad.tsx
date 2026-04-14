import * as React from 'react'
import { motion } from 'framer-motion'
import { Delete, Check } from 'lucide-react'

interface NumPadProps {
  onInput: (digit: string) => void
  onDelete: () => void
  onConfirm?: () => void
  showConfirm?: boolean
}

export const NumPad: React.FC<NumPadProps> = ({ onInput, onDelete, onConfirm, showConfirm }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] mx-auto">
      {keys.map((key) => (
        <motion.button
          key={key}
          whileTap={{ scale: 0.92 }}
          onClick={() => onInput(key)}
          className="h-14 flex items-center justify-center bg-surface2 border border-border rounded-lg text-lg font-bold text-text hover:bg-surface2/80 transition-colors"
        >
          {key}
        </motion.button>
      ))}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onDelete}
        className="h-14 flex items-center justify-center bg-surface2 border border-border rounded-lg text-text3 hover:text-text hover:bg-surface2/80 transition-colors"
      >
        <Delete className="w-5 h-5" />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => onInput('0')}
        className="h-14 flex items-center justify-center bg-surface2 border border-border rounded-lg text-lg font-bold text-text hover:bg-surface2/80 transition-colors"
      >
        0
      </motion.button>
      {showConfirm ? (
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onConfirm}
          className="h-14 flex items-center justify-center bg-success-dim border border-success/30 rounded-lg text-success hover:bg-success-dim/80 transition-colors"
        >
          <Check className="w-5 h-5" />
        </motion.button>
      ) : (
        <div className="h-14" />
      )}
    </div>
  )
}
