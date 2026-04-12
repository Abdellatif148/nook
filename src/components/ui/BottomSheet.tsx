import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children, className }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose()
            }}
            className={cn(
              'fixed bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-[20px] z-[160] max-h-[90vh] overflow-y-auto pb-8',
              className
            )}
          >
            <div className="w-8 h-1 bg-border2 rounded-full mx-auto my-3" />
            <div className="px-6 flex items-center justify-between mb-4">
              {title && <h3 className="text-lg font-bold text-text">{title}</h3>}
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text3">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
