import * as React from 'react'
import { motion } from 'framer-motion'
import { Armchair, Clock, Zap, StopCircle, AlertCircle } from 'lucide-react'
import type { Session } from '../../types'
import { formatDH, formatTime } from '../../utils/formatters'
import { Badge } from '../ui/Badge'
import { useNavigate } from 'react-router-dom'

interface SessionCardProps {
  session: Session
  onEnd: (id: string) => void
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onEnd }) => {
  const navigate = useNavigate()
  const [duration, setDuration] = React.useState(0)
  const [amount, setAmount] = React.useState(0)

  React.useEffect(() => {
    const update = () => {
      const start = new Date(session.started_at).getTime()
      const now = new Date().getTime()
      const diffMs = Math.max(0, now - start)
      const diffMins = Math.floor(diffMs / 60000)

      setDuration(diffMins)
      // cost = (mins / 60) * rate
      const cost = (diffMs / (1000 * 60 * 60)) * session.rate_per_hour
      setAmount(cost + (session.extras_total || 0))
    }

    update()
    const interval = setInterval(update, 10000) // Update every 10s
    return () => clearInterval(interval)
  }, [session.started_at, session.rate_per_hour, session.extras_total])

  const h = Math.floor(duration / 60)
  const m = duration % 60
  const isLong = h >= 3 // Alert after 3 hours

  return (
    <motion.div
      layout
      onClick={() => navigate(`/sessions/${session.id}`)}
      className={`bg-surface border rounded-card p-4 space-y-4 cursor-pointer transition-colors ${isLong ? 'border-warning/30 bg-warning-dim/5' : 'border-border'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="primary" icon={<Armchair className="w-3 h-3" />}>
            Place {session.seat_number}
          </Badge>
          <span className="text-sm font-bold text-text">{session.customer_name}</span>
        </div>
        <div className="text-[10px] font-mono text-text3 bg-surface2 px-2 py-0.5 rounded uppercase tracking-wider">
          {session.rate_per_hour} DH/h
        </div>
      </div>

      {isLong && (
        <div className="flex items-center gap-2 text-warning text-[10px] font-bold uppercase tracking-widest bg-warning-dim p-2 rounded-btn">
          <AlertCircle className="w-3.5 h-3.5" />
          Session longue — vérifier
        </div>
      )}

      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-[10px] text-text3 font-bold uppercase tracking-widest">Durée</p>
          <p className="text-2xl font-mono font-bold text-text leading-none">
            {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}
          </p>
        </div>

        <div className="space-y-1 text-center">
          <p className="text-[10px] text-text3 font-bold uppercase tracking-widest">Montant</p>
          <p className="text-2xl font-mono font-bold text-accent2 leading-none">
            {amount.toFixed(2)} <span className="text-xs">DH</span>
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onEnd(session.id)
          }}
          className="flex items-center gap-2 bg-error-dim border border-error/20 text-error px-3 py-2 rounded-btn font-bold text-xs"
        >
          <span>Terminer</span>
          <StopCircle className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
