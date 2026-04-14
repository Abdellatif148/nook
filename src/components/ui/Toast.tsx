import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 w-full max-w-[90vw] sm:max-w-[400px] pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            layout
            className="pointer-events-auto flex items-center gap-3 p-4 rounded-lg border-l-[3px] shadow-lg bg-surface2 border-border"
            style={{
              borderColor:
                toast.type === 'success' ? 'var(--success)' :
                toast.type === 'error' ? 'var(--error)' :
                toast.type === 'warning' ? 'var(--warning)' :
                'var(--info)'
            }}
          >
            <div className="shrink-0">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-success" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-error" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-warning" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-info" />}
            </div>
            <p className="text-sm font-medium text-text flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text3 hover:text-text p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
