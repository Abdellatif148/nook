// @ts-nocheck
import * as React from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, MoreVertical, Clock, Gauge, Plus, StopCircle, ShoppingBag, Banknote, CreditCard, Wallet, Gift, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { Button } from '../components/ui/Button'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Input } from '../components/ui/Input'
import type { Session, Product } from '../types'
import { formatTime } from '../utils/formatters'
import { cn } from '../utils/cn'

export const SessionDetailPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cafe } = useAuthStore()
  const { addToast } = useUIStore()

  const [session, setSession] = React.useState<Session | null>(null)
  const [duration, setDuration] = React.useState(0)
  const [amount, setAmount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)

  const [showEndSheet, setShowEndSheet] = React.useState(false)
  const [showExtrasSheet, setShowExtrasSheet] = React.useState(false)
  const [paymentMethod, setPaymentMethod] = React.useState<'cash' | 'card' | 'account' | 'free' | null>(null)
  const [amountReceived, setAmountReceived] = React.useState('')

  const fetchSession = async () => {
    if (!id) return
    const { data } = await supabase.from('sessions').select('*').eq('id', id).single()
    if (data) setSession(data as Session)
    setIsLoading(false)
  }

  React.useEffect(() => {
    fetchSession()
    const subscription = supabase
      .channel(`session-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${id}` }, payload => {
        setSession(payload.new as Session)
      })
      .subscribe()
    return () => { supabase.removeChannel(subscription) }
  }, [id])

  React.useEffect(() => {
    if (!session || session.status !== 'active') return
    const update = () => {
      const start = new Date(session.started_at).getTime()
      const now = new Date().getTime()
      const diffMs = Math.max(0, now - start)
      setDuration(Math.floor(diffMs / 60000))
      const timeCost = (diffMs / (1000 * 60 * 60)) * session.rate_per_hour
      setAmount(timeCost + (session.extras_total || 0))
    }
    update()
    const interval = setInterval(update, 10000)
    return () => clearInterval(interval)
  }, [session])

  const handleEndSession = async () => {
    if (!session || !paymentMethod) return
    setIsLoading(true)
    const endedAt = new Date().toISOString()
    const diffMs = new Date(endedAt).getTime() - new Date(session.started_at).getTime()
    const timeCost = (diffMs / (1000 * 60 * 60)) * session.rate_per_hour
    const total = timeCost + session.extras_total

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          ended_at: endedAt,
          duration_minutes: Math.floor(diffMs / 60000),
          time_cost: timeCost,
          total_amount: total,
          payment_method: paymentMethod,
          amount_received: paymentMethod === 'cash' ? parseFloat(amountReceived) : total,
          change_given: paymentMethod === 'cash' ? parseFloat(amountReceived) - total : 0
        } as any)
        .eq('id', session.id)

      if (error) throw error
      addToast({ type: 'success', message: `Session clôturée — ${total.toFixed(2)} DH` })
      navigate('/dashboard')
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
  if (!session) return <div className="min-h-screen bg-bg p-8 text-center">Session non trouvée</div>

  const h = Math.floor(duration / 60)
  const m = duration % 60

  return (
    <div className="min-h-screen bg-bg pt-14 pb-24">
      <div className="fixed top-0 left-0 right-0 h-14 bg-bg border-b border-border z-[110] px-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text3 hover:text-text"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-sm font-bold text-text uppercase tracking-widest">Place {session.seat_number}</h1>
        <button className="p-2 -mr-2 text-text3 hover:text-text"><MoreVertical className="w-5 h-5" /></button>
      </div>

      <div className="p-6 space-y-6 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-gradient-to-br from-accent/10 to-transparent border border-accent-border rounded-card-lg p-8 flex flex-col items-center text-center">
          <p className="text-text2 text-sm font-bold mb-2">{session.customer_name}</p>
          <motion.h2 animate={{ scale: [1, 1.005, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="text-6xl font-mono font-black text-text mb-4">
            {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}
          </motion.h2>
          <div className="flex gap-6 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-text3"><Clock className="w-3.5 h-3.5" />{formatTime(session.started_at)}</div>
            <div className="flex items-center gap-1.5 text-xs text-text3"><Gauge className="w-3.5 h-3.5" />{session.rate_per_hour.toFixed(2)} DH/h</div>
          </div>
        </motion.div>

        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-border/50 bg-surface2/30">
            <span className="text-base font-bold text-text">Total</span>
            <span className="text-2xl font-mono font-black text-accent2">{amount.toFixed(2)} DH</span>
          </div>
        </div>

        <button onClick={() => setShowExtrasSheet(true)} className="w-full h-14 border-2 border-dashed border-border rounded-card flex items-center justify-center gap-2 text-text3 transition-all"><Plus className="w-5 h-5" /><span>Consommation</span></button>
        <Button onClick={() => setShowEndSheet(true)} className="w-full h-16 text-lg bg-gradient-to-br from-error to-[#dc2626]" leftIcon={<StopCircle className="w-6 h-6" />}>Terminer</Button>
      </div>

      <BottomSheet isOpen={showEndSheet} onClose={() => setShowEndSheet(false)} title="Clôture">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <PaymentCard active={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')} icon={<Banknote />} label="Espèces" />
            <PaymentCard active={paymentMethod === 'card'} onClick={() => setPaymentMethod('card')} icon={<CreditCard />} label="Carte" />
            <PaymentCard active={paymentMethod === 'account'} onClick={() => setPaymentMethod('account')} icon={<Wallet />} label="Compte" />
            <PaymentCard active={paymentMethod === 'free'} onClick={() => setPaymentMethod('free')} icon={<Gift />} label="Offert" />
          </div>
          {paymentMethod === 'cash' && <Input label="Montant reçu" type="number" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} />}
          <Button onClick={handleEndSession} disabled={!paymentMethod} className="w-full h-14 bg-success" leftIcon={<Check className="w-5 h-5" />}>Encaisser</Button>
        </div>
      </BottomSheet>

      <ExtrasSheet isOpen={showExtrasSheet} onClose={() => setShowExtrasSheet(false)} onAdd={async (items: any[]) => {
        const newExtras = [...(session.extras as any[] || []), ...items]
        const extraTotal = newExtras.reduce((acc, e) => acc + e.total, 0)
        await supabase.from('sessions').update({ extras: newExtras, extras_total: extraTotal } as any).eq('id', session.id)
        fetchSession()
      }} cafeId={cafe?.id || ''} />
    </div>
  )
}

const PaymentCard = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={cn("h-20 flex flex-col items-center justify-center gap-2 rounded-card border transition-all", active ? "bg-accent-glow border-accent text-accent2" : "bg-surface border-border text-text3")}>{React.cloneElement(icon, { className: "w-6 h-6" })}<span className="text-xs font-bold">{label}</span></button>
)

const ExtrasSheet = ({ isOpen, onClose, onAdd, cafeId }: any) => {
  const [products, setProducts] = React.useState<Product[]>([])
  const [counts, setCounts] = React.useState<Record<string, number>>({})
  React.useEffect(() => { if (isOpen) supabase.from('products').select('*').eq('cafe_id', cafeId).eq('active', true).then(({ data }) => setProducts(data as Product[] || [])) }, [isOpen])
  const handleAdd = () => {
    const items = Object.entries(counts).filter(([_, qty]) => qty > 0).map(([id, qty]) => {
      const p = products.find(prod => prod.id === id)!
      return { id, name: p.name, qty, price: p.price, total: qty * p.price }
    })
    onAdd(items); setCounts({}); onClose()
  }
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Consommations">
      <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
        {products.map(p => (
          <div key={p.id} className={cn("p-3 bg-surface2 border rounded-card space-y-3", counts[p.id] > 0 ? "border-accent-border bg-accent-glow" : "border-border")}>
            <p className="text-xs font-bold">{p.name}</p>
            <div className="flex items-center justify-between"><button onClick={() => setCounts({ ...counts, [p.id]: Math.max(0, (counts[p.id] || 0) - 1) })} className="w-8 h-8 rounded bg-black/20 text-text2">－</button><span className="font-mono text-sm">{counts[p.id] || 0}</span><button onClick={() => setCounts({ ...counts, [p.id]: (counts[p.id] || 0) + 1 })} className="w-8 h-8 rounded bg-black/20 text-text2">＋</button></div>
          </div>
        ))}
      </div>
      <Button onClick={handleAdd} className="w-full h-14 mt-6">Ajouter</Button>
    </BottomSheet>
  )
}
