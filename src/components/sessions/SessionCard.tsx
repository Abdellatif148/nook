import * as React from 'react'
import { motion } from 'framer-motion'
import { Armchair, StopCircle, AlertCircle, Gauge, Clock } from 'lucide-react'
import { useLiveTimer } from '../../hooks/useLiveTimer'
import { useCurrentBill } from '../../hooks/useCurrentBill'
import { formatDH } from '../../utils/formatters'
import { useAuthStore } from '../../stores/authStore'
import type { Session } from '../../types'

interface SessionCardProps {
  session: Session
  onEnd: (session: Session) => void
  onClick: (session: Session) => void
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onEnd, onClick }) => {
  const { cafe } = useAuthStore()
  const { display, totalMinutes } = useLiveTimer(session.started_at)
  const { totalAmount } = useCurrentBill(session, cafe)

  const longSessionLimit = (cafe?.long_session_alert_hours || 3) * 60
  const isLong = totalMinutes > longSessionLimit

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onClick(session)}
      className={`group relative bg-surface border ${
        isLong ? 'border-warning/50' : 'border-border'
      } rounded-xl p-4 transition-all active:scale-[0.98] shadow-sm hover:shadow-md cursor-pointer`}
    >
      {isLong && (
        <div className="absolute -top-px left-4 right-4 h-[2px] bg-warning shadow-[0_0_8px_var(--warning)] animate-pulse rounded-full" />
      )}

      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-glow border border-accent-border rounded-full text-accent2 text-[11px] font-bold">
            <Armchair className="w-3 h-3" />
            Place {session.seat_number}
          </div>
          <span className="text-[14px] font-semibold text-text truncate max-w-[140px]">
            {session.customer_name}
          </span>
        </div>
        <div className="px-2 py-0.5 bg-surface2 border border-border rounded text-[10px] font-bold text-text3 uppercase tracking-wider">
          {session.rate_per_hour} DH/h
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="space-y-0.5">
          <div className="text-[26px] font-mono font-bold text-text leading-none tracking-tight">
            {display}
          </div>
          <div className="text-[10px] text-text3 uppercase font-bold tracking-widest pl-0.5">durée</div>
        </div>

        <div className="space-y-0.5 text-center">
          <div className="text-[20px] font-mono font-bold text-accent2 leading-none">
            {formatDH(totalAmount)}
          </div>
          <div className="text-[10px] text-text3 uppercase font-bold tracking-widest">montant</div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onEnd(session)
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-error-dim border border-error/20 rounded-lg text-error text-[13px] font-bold transition-all hover:bg-error/10 active:scale-95"
        >
          <StopCircle className="w-4 h-4" />
          Terminer
        </button>
      </div>

      {isLong && (
        <div className="mt-3.5 flex items-center gap-2 py-1.5 px-3 bg-warning-dim border border-warning/10 rounded-lg animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-3.5 h-3.5 text-warning" />
          <span className="text-[11px] font-bold text-warning uppercase tracking-wider">Session longue — vérifier</span>
        </div>
      )}
    </motion.div>
  )
}
