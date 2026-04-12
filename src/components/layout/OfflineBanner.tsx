import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          exit={{ y: -50 }}
          className="fixed top-14 left-0 right-0 z-[90] bg-warning-dim border-b border-warning/20 py-1.5 flex items-center justify-center gap-2"
        >
          <WifiOff className="w-3.5 h-3.5 text-warning" />
          <span className="text-[11px] font-semibold text-warning uppercase tracking-wider">
            Mode hors ligne
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
