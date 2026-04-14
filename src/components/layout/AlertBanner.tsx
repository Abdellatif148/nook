import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AlertBannerProps {
  alerts: string[]
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts }) => {
  if (alerts.length === 0) return null

  return (
    <div className="w-full overflow-hidden bg-error-dim border-b border-error/10">
      <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
        {alerts.map((alert, i) => (
          <div key={i} className="min-w-full flex items-center gap-3 px-4 py-2.5 snap-center">
            <AlertTriangle className="w-4 h-4 text-error shrink-0" />
            <span className="text-[13px] font-medium text-error truncate">{alert}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
