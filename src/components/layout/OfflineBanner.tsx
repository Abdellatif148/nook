import * as React from 'react'
import { WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -36 }}
          animate={{ y: 0 }}
          exit={{ y: -36 }}
          className="w-full h-9 bg-warning-dim border-b border-warning/20 flex items-center justify-center gap-2 z-[60]"
        >
          <WifiOff className="w-3.5 h-3.5 text-warning" />
          <span className="text-[13px] font-bold text-warning uppercase tracking-wider">Mode hors ligne</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
