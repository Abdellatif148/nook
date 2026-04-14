import * as React from 'react'
import { motion } from 'framer-motion'

interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label?: string
  disabled?: boolean
}

export const Toggle: React.FC<ToggleProps> = ({ enabled, onChange, label, disabled }) => {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      {label && <span className="text-sm font-medium text-text">{label}</span>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? 'bg-accent' : 'bg-surface2'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <motion.span
          animate={{ x: enabled ? 20 : 0 }}
          className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        />
      </button>
    </div>
  )
}
