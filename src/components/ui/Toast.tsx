import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { Toast as ToastType } from '../../types'
import { useUIStore } from '../../stores/uiStore'

export const Toast: React.FC<ToastType> = ({ id, type, message }) => {
  const removeToast = useUIStore(state => state.removeToast)

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-success" />,
    error: <XCircle className="w-4 h-4 text-error" />,
    warning: <AlertTriangle className="w-4 h-4 text-warning" />,
    info: <Info className="w-4 h-4 text-info" />
  }

  const borders = {
    success: 'border-l-success',
    error: 'border-l-error',
    warning: 'border-l-warning',
    info: 'border-l-info'
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => removeToast(id)}
      className={cn(
        'flex items-center gap-3 p-3 min-w-[280px] bg-surface2 border border-border rounded-[10px] shadow-lg border-l-4 cursor-pointer',
        borders[type]
      )}
    >
      {icons[type]}
      <span className="flex-1 text-sm font-medium text-text">{message}</span>
      <X className="w-3.5 h-3.5 text-text3" />
    </motion.div>
  )
}

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore(state => state.toasts)

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
