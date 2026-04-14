// @ts-nocheck
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, ChevronDown, BarChart, TrendingUp, Banknote, CreditCard, Wallet, Gift, Loader2, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { formatDH, formatDate, formatTime } from '../utils/formatters'
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import type { Session } from '../types'

export const ReportsPage: React.FC = () => {
  const { cafe } = useAuthStore()
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [period, setPeriod] = React.useState<'today' | 'week' | 'month' | 'all'>('today')
  const [isFiscalOpen, setIsFiscalOpen] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(true)

  const fetchReports = async () => {
    if (!cafe) return
    setIsRefreshing(true)
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('cafe_id', cafe.id)
      .eq('status', 'completed')
      .order('ended_at', { ascending: true })

    if (period === 'today') {
      const today = new Date().toISOString().split('T')[0]
      query = query.gte('ended_at', `${today}T00:00:00`)
    } else if (period === 'week') {
      const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 7)
      query = query.gte('ended_at', lastWeek.toISOString())
    } else if (period === 'month') {
      const lastMonth = new Date(); lastMonth.setMonth(lastMonth.getMonth() - 1)
      query = query.gte('ended_at', lastMonth.toISOString())
    }

    const { data } = await query
    if (data) setSessions(data as Session[])
    setIsRefreshing(false)
  }

  React.useEffect(() => {
    fetchReports()
  }, [cafe, period])

  const stats = React.useMemo(() => {
    const revenue = sessions.reduce((a, b) => a + (b.total_amount || 0), 0)
    const count = sessions.length
    const avg = count ? revenue / count : 0

    const breakdown = {
      cash: sessions.filter(s => s.payment_method === 'cash').reduce((a, b) => a + (b.total_amount || 0), 0),
      card: sessions.filter(s => s.payment_method === 'card').reduce((a, b) => a + (b.total_amount || 0), 0),
      account: sessions.filter(s => s.payment_method === 'account').reduce((a, b) => a + (b.total_amount || 0), 0),
      free: sessions.filter(s => s.payment_method === 'free').length
    }

    return { revenue, count, avg, breakdown }
  }, [sessions])

  // Chart data: grouped by hour for today, by day for others
  const chartData = React.useMemo(() => {
    if (period === 'today') {
      const hours = Array.from({ length: 15 }, (_, i) => i + 8) // 8h to 22h
      return hours.map(h => {
        const hourStr = h.toString().padStart(2, '0')
        const amount = sessions
          .filter(s => s.ended_at!.includes(`T${hourStr}:`))
          .reduce((a, b) => a + (b.total_amount || 0), 0)
        return { name: `${h}h`, value: amount }
      })
    } else {
      const days: Record<string, number> = {}
      sessions.forEach(s => {
        const d = s.ended_at!.split('T')[0]
        days[d] = (days[d] || 0) + (s.total_amount || 0)
      })
      return Object.keys(days).map(d => ({
        name: new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        value: days[d]
      }))
    }
  }, [sessions, period])

  const generatePDF = () => {
    const doc = new jsPDF() as any
    const title = `Rapport ${cafe?.name} - ${period.toUpperCase()}`

    doc.setFontSize(20)
    doc.text(title, 14, 22)

    doc.setFontSize(11)
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 30)
    doc.text(`Recette totale: ${formatDH(stats.revenue)}`, 14, 38)
    doc.text(`Total sessions: ${stats.count}`, 14, 44)

    const tableData = sessions.map(s => [
      formatDate(s.ended_at!),
      formatTime(s.ended_at!),
      s.customer_name,
      `${s.duration_minutes} min`,
      formatDH(s.total_amount || 0),
      s.payment_method || '-'
    ])

    doc.autoTable({
      startY: 55,
      head: [['Date', 'Heure', 'Client', 'Durée', 'Montant', 'Paiement']],
      body: tableData,
      headStyles: { fillColor: [249, 115, 22] }
    })

    doc.save(`Rapport_NookOS_${period}_${new Date().getTime()}.pdf`)
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border">
         <div className="h-[56px] px-4 flex items-center justify-between">
           <h1 className="text-[18px] font-bold text-text">Rapports</h1>
           <button onClick={generatePDF} className="p-2 text-accent2 hover:bg-accent-glow rounded-lg transition-all">
              <Download className="w-5 h-5" />
           </button>
         </div>
         <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3">
            {['today', 'week', 'month', 'all'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold border transition-all capitalize ${
                  period === p ? 'bg-accent border-accent text-white' : 'bg-surface2 border-border text-text3'
                }`}
              >
                {p === 'today' ? 'Aujourd\'hui' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Tout'}
              </button>
            ))}
         </div>
      </header>

      <main className="p-4 space-y-6">
        {/* SUMMARY CARD */}
        <div className="relative overflow-hidden bg-surface border-2 border-accent/20 rounded-[20px] p-6 shadow-sm">
           <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
           <p className="text-[11px] font-black text-accent2 uppercase tracking-[0.15em] mb-2">Recette Totale</p>
           <div className="flex items-baseline gap-2 mb-6">
              <span className="text-[44px] font-mono font-black text-text tracking-tighter">
                {isRefreshing ? '...' : stats.revenue.toFixed(2)}
              </span>
              <span className="text-xl font-bold text-text3 font-mono">DH</span>
           </div>

           <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-5">
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-text3 uppercase">Sessions</p>
                 <p className="text-[16px] font-mono font-black text-text">{stats.count}</p>
              </div>
              <div className="space-y-1 text-right">
                 <p className="text-[10px] font-bold text-text3 uppercase">Moyenne</p>
                 <p className="text-[16px] font-mono font-black text-accent2">{formatDH(stats.avg)}</p>
              </div>
           </div>
        </div>

        {/* CHART */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-5 shadow-sm">
           <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-text flex items-center gap-2">
                 <BarChart className="w-4 h-4 text-accent" />
                 Évolution recette
              </h2>
           </div>

           <div className="h-[220px] w-full">
              {isRefreshing ? (
                <div className="h-full flex items-center justify-center text-text3"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                      dy={10}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(249,115,22,0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-surface border border-border p-2.5 rounded-lg shadow-2xl">
                               <p className="text-[11px] font-bold text-text3 uppercase mb-1">{payload[0].payload.name}</p>
                               <p className="text-sm font-mono font-black text-accent2">{formatDH(payload[0].value as number)}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                       {chartData.map((_, index) => (
                         <Cell key={`cell-${index}`} fill="var(--accent)" fillOpacity={0.8} />
                       ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              )}
           </div>
        </section>

        {/* BREAKDOWN */}
        <section className="space-y-4">
           <h2 className="text-sm font-bold text-text px-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Répartition par mode
           </h2>
           <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
              {[
                { id: 'cash', label: 'Espèces', val: stats.breakdown.cash, icon: <Banknote className="w-4 h-4" />, color: '#10b981' },
                { id: 'card', label: 'Carte', val: stats.breakdown.card, icon: <CreditCard className="w-4 h-4" />, color: '#3b82f6' },
                { id: 'account', label: 'Comptes', val: stats.breakdown.account, icon: <Wallet className="w-4 h-4" />, color: '#f97316' },
                { id: 'free', label: 'Offert', val: stats.breakdown.free, icon: <Gift className="w-4 h-4" />, color: '#ef4444', isCount: true }
              ].map(item => (
                <div key={item.id} className="space-y-2">
                   <div className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2 text-text2">
                         <div className="text-text3">{item.icon}</div>
                         <span>{item.label}</span>
                      </div>
                      <span className="font-mono font-bold text-text">{item.isCount ? `${item.val} sessions` : formatDH(item.val)}</span>
                   </div>
                   <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (item.val / (stats.revenue || 1)) * 100)}%` }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* FISCAL SECTION */}
        <section className="border border-border rounded-xl overflow-hidden">
           <button
            onClick={() => setIsFiscalOpen(!isFiscalOpen)}
            className="w-full flex items-center justify-between p-4 bg-surface2/30 active:bg-surface2/50 transition-colors"
           >
              <div className="flex items-center gap-3">
                 <FileText className="w-5 h-5 text-text3" />
                 <span className="text-sm font-bold text-text">Calculateur TVA (20%)</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-text3 transition-transform ${isFiscalOpen ? 'rotate-180' : ''}`} />
           </button>

           <AnimatePresence>
             {isFiscalOpen && (
               <motion.div
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="bg-surface border-t border-border overflow-hidden"
               >
                  <div className="p-5 space-y-4">
                     <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-[13px] text-text2">Recette HT</span>
                        <span className="font-mono font-bold text-text">{formatDH(stats.revenue / 1.2)}</span>
                     </div>
                     <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-[13px] text-text2">Montant TVA</span>
                        <span className="font-mono font-bold text-text">{formatDH(stats.revenue - (stats.revenue / 1.2))}</span>
                     </div>
                     <div className="flex justify-between items-center py-2">
                        <span className="text-[13px] font-bold text-text">Total TTC</span>
                        <span className="font-mono font-black text-accent2 text-lg">{formatDH(stats.revenue)}</span>
                     </div>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </section>
      </main>
    </div>
  )
}
