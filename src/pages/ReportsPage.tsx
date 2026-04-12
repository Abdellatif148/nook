import * as React from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Download, Banknote, CreditCard, Wallet, Gift } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useTranslation } from '../i18n'
import { Button } from '../components/ui/Button'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { cn } from '../utils/cn'

export const ReportsPage: React.FC = () => {
  const { cafe } = useAuthStore()
  const { t } = useTranslation()

  const [filter, setFilter] = React.useState<'today' | 'week' | 'month'>('today')
  const [data, setData] = React.useState<any[]>([])

  const fetchReport = async () => {
    if (!cafe?.id) return

    let query = supabase
      .from('sessions')
      .select('*')
      .eq('cafe_id', cafe.id)
      .eq('status', 'completed')

    if (filter === 'today') {
      const d = new Date()
      d.setHours(0,0,0,0)
      query = query.gte('ended_at', d.toISOString())
    } else if (filter === 'week') {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      query = query.gte('ended_at', d.toISOString())
    } else if (filter === 'month') {
      const d = new Date()
      d.setMonth(d.getMonth() - 1)
      query = query.gte('ended_at', d.toISOString())
    }

    const { data: sessions } = await query
    setData(sessions || [])
  }

  React.useEffect(() => {
    fetchReport()
  }, [cafe?.id, filter])

  const stats = React.useMemo(() => {
    const revenue = data.reduce((acc, s) => acc + Number(s.total_amount), 0)
    const count = data.length
    const avg = count > 0 ? revenue / count : 0

    const byMethod = {
      cash: data.filter(s => s.payment_method === 'cash').reduce((acc, s) => acc + Number(s.total_amount), 0),
      card: data.filter(s => s.payment_method === 'card').reduce((acc, s) => acc + Number(s.total_amount), 0),
      account: data.filter(s => s.payment_method === 'account').reduce((acc, s) => acc + Number(s.total_amount), 0),
      free: data.filter(s => s.payment_method === 'free').length
    }

    return { revenue, count, avg, byMethod }
  }, [data])

  const chartData = React.useMemo(() => {
    if (filter === 'today') {
      const hours = Array.from({ length: 15 }, (_, i) => ({ name: `${i + 8}h`, value: 0 }))
      data.forEach(s => {
        const hour = new Date(s.ended_at).getHours()
        const index = hour - 8
        if (index >= 0 && index < 15) hours[index].value += Number(s.total_amount)
      })
      return hours
    } else {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return { name: d.toLocaleDateString('fr-FR', { weekday: 'short' }), value: 0, date: d.toDateString() }
      }).reverse()

      data.forEach(s => {
        const date = new Date(s.ended_at).toDateString()
        const day = last7Days.find(d => d.date === date)
        if (day) day.value += Number(s.total_amount)
      })
      return last7Days
    }
  }, [data, filter])

  const generatePDF = () => {
    const doc = new jsPDF()
    const period = filter === 'today' ? "Aujourd'hui" : filter === 'week' ? "Cette semaine" : "Ce mois"

    doc.setFontSize(20)
    doc.text(`Rapport Nook OS - ${cafe?.name}`, 20, 20)
    doc.setFontSize(10)
    doc.text(`Période: ${period}`, 20, 30)

    autoTable(doc, {
      startY: 40,
      head: [['Métrique', 'Valeur']],
      body: [
        ['Recette totale', `${stats.revenue.toFixed(2)} DH`],
        ['Nombre de sessions', stats.count.toString()],
        ['Moyenne / session', `${stats.avg.toFixed(2)} DH`],
        ['Espèces', `${stats.byMethod.cash.toFixed(2)} DH`],
        ['Carte', `${stats.byMethod.card.toFixed(2)} DH`],
        ['Comptes clients', `${stats.byMethod.account.toFixed(2)} DH`],
        ['Sessions offertes', stats.byMethod.free.toString()],
      ]
    })

    doc.save(`Rapport_${cafe?.name}.pdf`)
  }

  return (
    <div className="pt-20 pb-24 px-4 space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text">Rapports</h1>
          <Button variant="ghost" className="h-9 px-3 text-xs" leftIcon={<Download className="w-4 h-4" />} onClick={generatePDF}>Exporter PDF</Button>
        </div>
        <div className="flex gap-2">
          {['today', 'week', 'month'].map((f: any) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-4 py-1.5 rounded-full text-xs font-bold border transition-all", filter === f ? "bg-accent text-white border-accent" : "bg-surface border-border text-text3")}>{f === 'today' ? "Aujourd'hui" : f === 'week' ? '7 jours' : '30 jours'}</button>
          ))}
        </div>
      </div>

      <motion.div key={filter} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-accent-border rounded-card-lg p-6 text-center space-y-2 relative overflow-hidden">
        <p className="text-[11px] font-black text-text3 uppercase tracking-widest">{t('reports.revenue') || 'Recette Totale'}</p>
        <p className="text-5xl font-mono font-black text-text">{stats.revenue.toFixed(2)} <span className="text-xl text-text3">DH</span></p>
      </motion.div>

      <section className="space-y-4">
        <h3 className="text-[15px] font-bold text-text">Évolution</h3>
        <div className="bg-surface border border-border rounded-card p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2d45', borderRadius: '8px' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (<Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#f97316' : '#1f2d45'} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[15px] font-bold text-text">Répartition</h3>
        <div className="space-y-3">
          <PaymentRow icon={<Banknote />} label="Espèces" value={stats.byMethod.cash} total={stats.revenue} color="bg-success" />
          <PaymentRow icon={<CreditCard />} label="Carte" value={stats.byMethod.card} total={stats.revenue} color="bg-info" />
          <PaymentRow icon={<Wallet />} label="Comptes" value={stats.byMethod.account} total={stats.revenue} color="bg-accent" />
          <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-card">
            <div className="flex items-center gap-3"><Gift className="w-5 h-5 text-text3" /><span className="text-sm font-bold text-text">Offert</span></div>
            <span className="text-sm font-mono font-bold text-text3">{stats.byMethod.free} sessions</span>
          </div>
        </div>
      </section>
    </div>
  )
}

const PaymentRow = ({ icon, label, value, total, color }: any) => {
  const percent = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="bg-surface border border-border rounded-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">{React.cloneElement(icon, { className: "w-5 h-5 text-text3" })}<span className="text-sm font-bold text-text">{label}</span></div>
        <span className="text-sm font-mono font-bold text-text">{value.toFixed(2)} DH</span>
      </div>
      <div className="h-1.5 bg-surface2 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={cn("h-full", color)} /></div>
    </div>
  )
}
