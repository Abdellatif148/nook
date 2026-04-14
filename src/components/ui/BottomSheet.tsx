import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-[4px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 40, stiffness: 400 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80) onClose()
            }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-surface border-t border-border rounded-t-[20px] max-h-[90vh] flex flex-col safe-bottom"
          >
            <div className="flex flex-col items-center pt-3 pb-2" onClick={onClose}>
              <div className="w-8 h-1 bg-border2 rounded-full mb-4" />
            </div>
            <div className="px-6 pb-4 flex justify-between items-center border-b border-border">
              <h2 className="text-lg font-bold text-text">{title}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
