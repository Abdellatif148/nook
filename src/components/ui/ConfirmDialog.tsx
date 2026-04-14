import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', onConfirm, onCancel, danger
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="relative bg-surface w-full max-w-[320px] rounded-2xl p-6 shadow-2xl border border-border"
          >
            <h3 className="text-lg font-bold text-text mb-2">{title}</h3>
            <p className="text-sm text-text2 mb-6">{message}</p>
            <div className="flex gap-3 mt-8">
              <Button
                variant="ghost"
                onClick={onCancel}
                className="flex-1"
              >
                {cancelLabel}
              </Button>
              <Button
                variant={danger ? 'danger' : 'primary'}
                onClick={onConfirm}
                className="flex-1"
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
