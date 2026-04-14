// @ts-nocheck
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Activity, Timer, CheckCircle, PlusCircle, List, Users, BarChart2, Clock } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useSessionStore } from '../stores/sessionStore'
import { useTranslation } from '../i18n'
import { useRealtime } from '../hooks/useRealtime'
import { SessionCard } from '../components/sessions/SessionCard'
import { TopBar } from '../components/layout/TopBar'
import { BottomNav } from '../components/layout/BottomNav'
import { OfflineBanner } from '../components/layout/OfflineBanner'
import { AlertBanner } from '../components/layout/AlertBanner'
import { formatDH, formatTime } from '../utils/formatters'
import { supabase } from '../lib/supabase'
import type { Session } from '../types'

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = React.useState(value)

  React.useEffect(() => {
    let start = displayValue
    const end = value
    if (start === end) return

    const duration = 800
    const startTime = performance.now()

    const update = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const current = start + (end - start) * progress
      setDisplayValue(current)
      if (progress < 1) requestAnimationFrame(update)
    }
    requestAnimationFrame(update)
  }, [value])

  return <span>{displayValue.toFixed(2)}</span>
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { cafe, type, staff } = useAuthStore()
  const { activeSessions } = useSessionStore()
  const [completedToday, setCompletedToday] = React.useState<Session[]>([])
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  useRealtime()

  const fetchTodayStats = React.useCallback(async () => {
    if (!cafe) return
    setIsRefreshing(true)
    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('cafe_id', cafe.id)
      .eq('status', 'completed')
      .gte('ended_at', `${today}T00:00:00`)
      .order('ended_at', { ascending: false })

    if (data) setCompletedToday(data as Session[])
    setIsRefreshing(false)
  }, [cafe])

  React.useEffect(() => {
    fetchTodayStats()
  }, [fetchTodayStats])

  const totalRevenue = completedToday.reduce((acc, s) => acc + (s.total_amount || 0), 0)

  const alerts = React.useMemo(() => {
    const list: string[] = []
    const limit = (cafe?.long_session_alert_hours || 3) * 60 * 60 * 1000
    activeSessions.forEach(s => {
      const start = new Date(s.started_at).getTime()
      if (Date.now() - start > limit) {
        list.push(`Session longue: Place ${s.seat_number} (${s.customer_name})`)
      }
    })
    return list
  }, [activeSessions, cafe])

  const hasPermission = (perm: 'clients' | 'reports') => {
    if (type === 'owner') return true
    return (staff?.permissions as any)?.[perm]
  }

  return (
    <div className="min-h-screen pb-24">
      <OfflineBanner />
      <AlertBanner alerts={alerts} />

      <main className="p-4 space-y-6">
        {/* REVENUE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-accent/15 to-accent/5 border border-accent-border rounded-2xl p-5 shadow-sm"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-bold text-accent2 uppercase tracking-[0.08em]">
              {t('dashboard.today')}
            </span>
            <button
              onClick={fetchTodayStats}
              className={`p-1.5 text-accent2 hover:bg-accent-glow rounded-full transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-baseline gap-2 mb-5">
            <div className="text-[38px] font-mono font-extrabold text-text tracking-tight">
              <AnimatedNumber value={totalRevenue} />
            </div>
            <span className="text-lg font-bold text-text3 font-mono">DH</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface2/50 border border-border rounded-full text-[11px] font-bold text-text2">
              <Activity className="w-3.5 h-3.5" />
              {activeSessions.length + completedToday.length} sessions
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-glow border border-accent-border rounded-full text-[11px] font-bold text-accent2">
              <Timer className="w-3.5 h-3.5" />
              {activeSessions.length} actives
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success-dim border border-success/20 rounded-full text-[11px] font-bold text-success">
              <CheckCircle className="w-3.5 h-3.5" />
              {completedToday.length} clôturées
            </div>
          </div>
        </motion.div>

        {/* ACTIVE SESSIONS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[15px] font-bold text-text flex items-center gap-2">
              {t('dashboard.active_sessions')}
              <span className="px-2 py-0.5 bg-accent text-white text-[10px] font-black rounded-full shadow-[0_0_8px_rgba(249,115,22,0.3)]">
                {activeSessions.length}
              </span>
            </h2>
          </div>

          {activeSessions.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center text-text3">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-text">{t('dashboard.no_active')}</p>
                <p className="text-[13px] text-text3 px-4">Démarrez une session pour commencer à facturer le temps</p>
              </div>
              <button
                onClick={() => navigate('/sessions/new')}
                className="px-6 py-2.5 bg-accent text-white font-bold rounded-lg shadow-lg shadow-accent/20 active:scale-95 transition-all text-sm"
              >
                + {t('dashboard.new_session')}
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence mode="popLayout">
                {activeSessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onClick={(s) => navigate(`/sessions/${s.id}`)}
                    onEnd={(s) => navigate(`/sessions/${s.id}`)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* QUICK ACTIONS */}
        <section className="space-y-4 pt-2">
          <h2 className="text-[15px] font-bold text-text px-1">{t('dashboard.quick_actions')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/sessions/new')}
              className="h-[76px] flex flex-col items-center justify-center gap-2 bg-accent-glow border border-accent-border rounded-xl shadow-sm group"
            >
              <PlusCircle className="w-6 h-6 text-accent2 group-hover:scale-110 transition-transform" />
              <span className="text-[13px] font-bold text-accent2">{t('dashboard.new_session')}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/sessions')}
              className="h-[76px] flex flex-col items-center justify-center gap-2 bg-surface border border-border rounded-xl shadow-sm group"
            >
              <List className="w-6 h-6 text-text2 group-hover:scale-110 transition-transform" />
              <span className="text-[13px] font-bold text-text">{t('dashboard.history')}</span>
            </motion.button>

            {hasPermission('clients') && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/clients')}
                className="h-[76px] flex flex-col items-center justify-center gap-2 bg-surface border border-border rounded-xl shadow-sm group"
              >
                <Users className="w-6 h-6 text-text2 group-hover:scale-110 transition-transform" />
                <span className="text-[13px] font-bold text-text">{t('nav.clients')}</span>
              </motion.button>
            )}

            {hasPermission('reports') && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/reports')}
                className="h-[76px] flex flex-col items-center justify-center gap-2 bg-surface border border-border rounded-xl shadow-sm group"
              >
                <BarChart2 className="w-6 h-6 text-text2 group-hover:scale-110 transition-transform" />
                <span className="text-[13px] font-bold text-text">{t('nav.reports')}</span>
              </motion.button>
            )}
          </div>
        </section>

        {/* LAST SESSIONS */}
        <section className="space-y-4 pt-2">
          <h2 className="text-[15px] font-bold text-text px-1">{t('dashboard.last_sessions')}</h2>
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm divide-y divide-border/50">
            {completedToday.length > 0 ? (
              completedToday.slice(0, 5).map(session => (
                <div key={session.id} className="flex items-center justify-between p-4 active:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/sessions/${session.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className="text-[12px] font-mono text-text3 bg-surface2 px-2 py-1 rounded">
                      {formatTime(session.ended_at!)}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[13px] font-bold text-text">Place {session.seat_number} — {session.customer_name}</p>
                      <p className="text-[11px] text-text3">{session.duration_minutes} min • {session.payment_method === 'cash' ? 'Espèces' : session.payment_method === 'card' ? 'Carte' : session.payment_method === 'account' ? 'Compte' : 'Offert'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-mono font-bold text-text">{formatDH(session.total_amount || 0)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-text3 text-[13px]">Aucune session clôturée aujourd'hui</p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
