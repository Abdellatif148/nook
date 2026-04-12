// @ts-nocheck
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Activity, Timer, CheckCircle, Zap, PlusCircle, List, Users, BarChart2, Clock } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useSessionStore } from '../stores/sessionStore'
import { useTranslation } from '../i18n'
import { useRealtime } from '../hooks/useRealtime'
import { SessionCard } from '../components/sessions/SessionCard'
import { formatDH } from '../utils/formatters'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export const DashboardPage: React.FC = () => {
  useRealtime()
  const { cafe, type, staff } = useAuthStore()
  const { activeSessions } = useSessionStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [todayRevenue, setTodayRevenue] = React.useState(0)
  const [completedCount, setCompletedCount] = React.useState(0)
  const [lastSessions, setLastSessions] = React.useState<any[]>([])

  const fetchStats = async () => {
    if (!cafe?.id) return

    const today = new Date()
    today.setHours(0,0,0,0)

    const { data } = await supabase
      .from('sessions')
      .select('total_amount, status')
      .eq('cafe_id', cafe.id)
      .eq('status', 'completed')
      .gte('ended_at', today.toISOString())

    if (data) {
      const revenue = data.reduce((acc, s) => acc + Number(s.total_amount), 0)
      setTodayRevenue(revenue)
      setCompletedCount(data.length)
    }

    const { data: recent } = await supabase
      .from('sessions')
      .select('*')
      .eq('cafe_id', cafe.id)
      .eq('status', 'completed')
      .order('ended_at', { ascending: false })
      .limit(5)

    setLastSessions(recent || [])
  }

  React.useEffect(() => {
    fetchStats()
  }, [cafe?.id, activeSessions.length])

  const hasPermission = (perm: string) => {
    if (type === 'owner') return true
    return (staff?.permissions as any)?.[perm] === true
  }

  return (
    <div className="pt-20 pb-24 px-4 space-y-6 max-w-2xl mx-auto">
      {/* REVENUE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-card-lg p-5 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-black text-accent2 uppercase tracking-[0.1em]">{t('dashboard.today')}</span>
          <button onClick={fetchStats} className="text-accent/60 hover:text-accent"><RefreshCw className="w-3.5 h-3.5" /></button>
        </div>

        <div className="mb-6">
          <motion.p
            key={todayRevenue}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl font-mono font-black text-text"
          >
            {todayRevenue.toFixed(2)} <span className="text-xl text-text3">DH</span>
          </motion.p>
        </div>

        <div className="flex gap-2">
          <StatChip icon={<Activity className="w-3 h-3" />} label={`${activeSessions.length + completedCount} sessions`} />
          <StatChip icon={<Timer className="w-3 h-3" />} label={`${activeSessions.length} actives`} active />
          <StatChip icon={<CheckCircle className="w-3 h-3" />} label={`${completedCount} clôturées`} success />
        </div>
      </motion.div>

      {/* ACTIVE SESSIONS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-text flex items-center gap-2">
            {t('dashboard.active_sessions')}
            {activeSessions.length > 0 && (
              <span className="bg-accent text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-current" />
                {activeSessions.length}
              </span>
            )}
          </h2>
        </div>

        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {activeSessions.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 bg-surface/50 border border-border border-dashed rounded-card text-center px-6"
              >
                <Clock className="w-10 h-10 text-text3 mb-3" />
                <p className="text-sm font-bold text-text2 mb-1">{t('dashboard.no_active_sessions')}</p>
                <p className="text-xs text-text3 mb-4">{t('dashboard.start_session')}</p>
                <button
                  onClick={() => navigate('/sessions/new')}
                  className="bg-accent-glow text-accent2 text-xs font-bold py-2 px-4 rounded-btn border border-accent-border"
                >
                  {t('dashboard.new_session')}
                </button>
              </motion.div>
            ) : (
              activeSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onEnd={() => navigate(`/sessions/${session.id}`)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="space-y-3">
        <h2 className="text-[15px] font-bold text-text">{t('dashboard.quick_actions')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            icon={<PlusCircle className="w-6 h-6 text-accent" />}
            label={t('dashboard.new_session')}
            onClick={() => navigate('/sessions/new')}
            primary
          />
          <QuickAction
            icon={<List className="w-6 h-6 text-text2" />}
            label={t('dashboard.history')}
            onClick={() => navigate('/sessions')}
          />
          {hasPermission('clients') && (
            <QuickAction
              icon={<Users className="w-6 h-6 text-text2" />}
              label={t('nav.clients')}
              onClick={() => navigate('/clients')}
            />
          )}
          {hasPermission('reports') && (
            <QuickAction
              icon={<BarChart2 className="w-6 h-6 text-text2" />}
              label={t('nav.reports')}
              onClick={() => navigate('/reports')}
            />
          )}
        </div>
      </section>

      {/* LAST SESSIONS */}
      <section className="space-y-3">
        <h2 className="text-[15px] font-bold text-text">{t('dashboard.last_sessions')}</h2>
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          {lastSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-text3">Aucun historique pour aujourd'hui</div>
          ) : (
            lastSessions.map((s, i) => (
              <div key={s.id} className={`p-4 flex items-center justify-between ${i !== lastSessions.length - 1 ? 'border-bottom border-border' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-text3">{new Date(s.ended_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <div>
                    <p className="text-xs font-bold text-text">Place {s.seat_number} — {s.customer_name}</p>
                    <p className="text-[10px] text-text3">{s.duration_minutes}min</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-text">{s.total_amount.toFixed(2)} DH</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

const StatChip = ({ icon, label, active, success }: any) => (
  <div className={cn(
    "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border",
    active ? "bg-accent text-white border-accent" :
    success ? "bg-success-dim text-success border-success/20" :
    "bg-surface border-border text-text3"
  )}>
    {icon}
    {label}
  </div>
)

const QuickAction = ({ icon, label, onClick, primary }: any) => (
  <motion.button
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-2 h-20 rounded-card border transition-all",
      primary ? "bg-accent-glow border-accent-border" : "bg-surface border-border"
    )}
  >
    {icon}
    <span className="text-xs font-bold">{label}</span>
  </motion.button>
)

const cn = (...classes: any) => classes.filter(Boolean).join(' ')
