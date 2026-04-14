// @ts-nocheck
import * as React from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Calendar, ChevronRight, Banknote, CreditCard, User, Gift, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { formatDH, formatTime, formatDate } from '../utils/formatters'
import type { Session } from '../types'

export const SessionHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const { cafe } = useAuthStore()
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [period, setPeriod] = React.useState<'today' | 'week' | 'month' | 'all'>('today')
  const [search, setSearch] = React.useState('')
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)

  React.useEffect(() => {
    if (!cafe) return
    const fetchHistory = async () => {
      let query = supabase
        .from('sessions')
        .select('*')
        .eq('cafe_id', cafe.id)
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })

      if (period === 'today') {
        const today = new Date().toISOString().split('T')[0]
        query = query.gte('ended_at', `${today}T00:00:00`)
      } else if (period === 'week') {
        const lastWeek = new Date()
        lastWeek.setDate(lastWeek.getDate() - 7)
        query = query.gte('ended_at', lastWeek.toISOString())
      } else if (period === 'month') {
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        query = query.gte('ended_at', lastMonth.toISOString())
      }

      const { data } = await query
      if (data) setSessions(data as Session[])
    }
    fetchHistory()
  }, [cafe, period])

  const filtered = sessions.filter(s =>
    s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    s.seat_number.toString() === search
  )

  const stats = {
    count: filtered.length,
    revenue: filtered.reduce((acc, s) => acc + (s.total_amount || 0), 0),
    avgDuration: filtered.length ? Math.round(filtered.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / filtered.length) : 0
  }

  // Group by day
  const grouped = filtered.reduce((acc: Record<string, Session[]>, s) => {
    const day = s.ended_at!.split('T')[0]
    if (!acc[day]) acc[day] = []
    acc[day].push(s)
    return acc
  }, {})

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border">
        <div className="h-[56px] px-4 flex items-center justify-between">
          <h1 className="text-[18px] font-bold text-text">Historique</h1>
          <div className="flex items-center gap-1">
             <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-2 rounded-lg transition-all ${isSearchOpen ? 'text-accent bg-accent-glow' : 'text-text3 hover:text-text2'}`}>
               <Search className="w-5 h-5" />
             </button>
             <button className="p-2 text-text3 hover:text-text2 transition-all">
               <Filter className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3">
          {[
            { id: 'today', label: 'Aujourd\'hui' },
            { id: 'week', label: 'Cette semaine' },
            { id: 'month', label: 'Ce mois' },
            { id: 'all', label: 'Tout' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setPeriod(opt.id as any)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold border transition-all ${
                period === opt.id ? 'bg-accent border-accent text-white' : 'bg-surface2 border-border text-text3 hover:border-text3'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <motion.div
          animate={{ height: isSearchOpen ? 'auto' : 0, opacity: isSearchOpen ? 1 : 0 }}
          className="overflow-hidden px-4"
        >
          <div className="pb-3 pt-1">
            <input
              autoFocus={isSearchOpen}
              className="w-full bg-black/25 border border-accent/20 rounded-lg h-10 px-4 text-sm text-text focus:border-accent outline-none"
              placeholder="Chercher par nom ou place..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </motion.div>
      </header>

      <main className="p-4 space-y-6">
        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-[9px] font-black text-text3 uppercase mb-1">Sessions</p>
            <p className="text-[16px] font-mono font-black text-text">{stats.count}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-[9px] font-black text-text3 uppercase mb-1">Recette</p>
            <p className="text-[16px] font-mono font-black text-accent2">{formatDH(stats.revenue)}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-[9px] font-black text-text3 uppercase mb-1">Moyenne</p>
            <p className="text-[16px] font-mono font-black text-text">{stats.avgDuration}m</p>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-8">
           {Object.keys(grouped).map(day => (
             <section key={day} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                   <div className="flex items-center gap-2">
                     <Calendar className="w-3.5 h-3.5 text-accent" />
                     <span className="text-[11px] font-bold text-text2 uppercase tracking-widest">{formatDate(day)}</span>
                   </div>
                   <span className="text-[11px] font-mono font-bold text-text3">{formatDH(grouped[day].reduce((a, b) => a + (b.total_amount || 0), 0))}</span>
                </div>
                <div className="bg-surface border border-border rounded-xl overflow-hidden divide-y divide-border/50 shadow-sm">
                   {grouped[day].map(s => (
                     <div
                      key={s.id}
                      onClick={() => navigate(`/sessions/${s.id}`)}
                      className="flex items-center justify-between p-4 active:bg-white/5 transition-colors cursor-pointer"
                     >
                       <div className="flex items-center gap-4">
                          <div className="text-[12px] font-mono text-text3 min-w-[42px]">
                            {formatTime(s.ended_at!)}
                          </div>
                          <div className="space-y-0.5">
                             <p className="text-[13px] font-bold text-text">{s.customer_name}</p>
                             <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 bg-accent-glow border border-accent-border rounded text-[9px] font-black text-accent2">PLACE {s.seat_number}</span>
                                <span className="text-[11px] text-text3">{s.duration_minutes} min • {formatDH(s.total_amount || 0)}</span>
                             </div>
                          </div>
                       </div>
                       <div className="text-text3">
                         {s.payment_method === 'cash' ? <Banknote className="w-4 h-4" /> :
                          s.payment_method === 'card' ? <CreditCard className="w-4 h-4" /> :
                          s.payment_method === 'account' ? <User className="w-4 h-4" /> :
                          <Gift className="w-4 h-4" />}
                       </div>
                     </div>
                   ))}
                </div>
             </section>
           ))}

           {filtered.length === 0 && (
             <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <Clock className="w-12 h-12 text-surface2" />
                <p className="text-text3 font-medium">Aucune session trouvée</p>
             </div>
           )}
        </div>
      </main>
    </div>
  )
}
