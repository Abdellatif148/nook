import * as React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, Banknote, CreditCard, Wallet, Gift, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { formatDH, formatTime } from '../utils/formatters'
import { Input } from '../components/ui/Input'
import { cn } from '../utils/cn'

export const SessionHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const { cafe } = useAuthStore()

  const [sessions, setSessions] = React.useState<any[]>([])
  const [filter, setFilter] = React.useState<'today' | 'week' | 'month' | 'all'>('today')
  const [search, setSearch] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchHistory = async () => {
    if (!cafe?.id) return
    setIsLoading(true)
    let query = supabase.from('sessions').select('*').eq('cafe_id', cafe.id).eq('status', 'completed').order('ended_at', { ascending: false })
    if (filter === 'today') { const d = new Date(); d.setHours(0,0,0,0); query = query.gte('ended_at', d.toISOString()) }
    else if (filter === 'week') { const d = new Date(); d.setDate(d.getDate() - 7); query = query.gte('ended_at', d.toISOString()) }
    else if (filter === 'month') { const d = new Date(); d.setMonth(d.getMonth() - 1); query = query.gte('ended_at', d.toISOString()) }
    const { data } = await query
    setSessions(data || [])
    setIsLoading(false)
  }

  React.useEffect(() => { fetchHistory() }, [cafe?.id, filter])

  const filteredSessions = sessions.filter(s => s.customer_name.toLowerCase().includes(search.toLowerCase()))

  const stats = React.useMemo(() => {
    const total = filteredSessions.reduce((acc, s) => acc + Number(s.total_amount), 0)
    const count = filteredSessions.length
    const avgDuration = count > 0 ? filteredSessions.reduce((acc, s) => acc + s.duration_minutes, 0) / count : 0
    return { total, count, avgDuration }
  }, [filteredSessions])

  return (
    <div className="pt-20 pb-24 px-4 space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-text">Historique</h1>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['today', 'week', 'month', 'all'].map((f: any) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-4 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0", filter === f ? "bg-accent text-white border-accent" : "bg-surface border-border text-text3")}>{f === 'today' ? "Aujourd'hui" : f === 'week' ? '7j' : f === 'month' ? '30j' : 'Tout'}</button>
          ))}
        </div>
        <Input placeholder="Rechercher..." icon={<Search className="w-4 h-4" />} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Sessions" value={stats.count.toString()} />
        <StatCard label="Recette" value={formatDH(stats.total)} highlight />
        <StatCard label="Durée moy" value={`${Math.round(stats.avgDuration)}min`} />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="bg-surface border border-border rounded-card overflow-hidden divide-y divide-border/50">
            {filteredSessions.map((s) => (
              <div key={s.id} onClick={() => navigate(`/sessions/${s.id}`)} className="p-4 flex items-center justify-between active:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[40px]"><p className="text-[10px] font-black text-text3 uppercase">{new Date(s.ended_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p><p className="text-xs font-mono font-bold text-text2">{formatTime(s.ended_at)}</p></div>
                  <div><p className="text-sm font-bold text-text">Place {s.seat_number} — {s.customer_name}</p><p className="text-[10px] text-text3 font-medium uppercase tracking-wider">{s.duration_minutes}min • {s.payment_method}</p></div>
                </div>
                <div className="flex items-center gap-3"><div className="text-right"><p className="text-sm font-mono font-bold text-accent2">{s.total_amount.toFixed(2)} DH</p><div className="flex justify-end">{getPaymentIcon(s.payment_method)}</div></div><ChevronRight className="w-4 h-4 text-text3" /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const StatCard = ({ label, value, highlight }: any) => (
  <div className="bg-surface border border-border rounded-card p-3 text-center space-y-1"><p className="text-[10px] font-bold text-text3 uppercase tracking-widest">{label}</p><p className={cn("text-sm font-mono font-black", highlight ? "text-accent2" : "text-text")}>{value}</p></div>
)

const getPaymentIcon = (method: string) => {
  const props = { className: "w-3 h-3 text-text3" }
  switch(method) {
    case 'cash': return <Banknote {...props} />
    case 'card': return <CreditCard {...props} />
    case 'account': return <Wallet {...props} />
    case 'free': return <Gift {...props} />
    default: return null
  }
}
