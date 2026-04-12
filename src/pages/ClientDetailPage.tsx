// @ts-nocheck
import * as React from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, MoreVertical, PlusCircle, MessageCircle, BarChart, TrendingUp, Calendar, Check, Wallet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { formatDH } from '../utils/formatters'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Input } from '../components/ui/Input'
import type { ClientAccount } from '../types'
import { cn } from '../utils/cn'

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cafe } = useAuthStore()
  const { addToast } = useUIStore()

  const [client, setClient] = React.useState<ClientAccount | null>(null)
  const [history, setHistory] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [showRechargeSheet, setShowRechargeSheet] = React.useState(false)
  const [rechargeAmount, setRechargeAmount] = React.useState('')

  const fetchData = async () => {
    if (!id) return
    setIsLoading(true)
    const [clientRes, historyRes] = await Promise.all([
      supabase.from('client_accounts').select('*').eq('id', id).single(),
      supabase.from('sessions').select('*').eq('client_account_id', id).order('ended_at', { ascending: false }).limit(10)
    ])
    if (clientRes.data) setClient(clientRes.data as ClientAccount)
    if (historyRes.data) setHistory(historyRes.data)
    setIsLoading(false)
  }

  React.useEffect(() => { fetchData() }, [id])

  const handleRecharge = async () => {
    if (!client || !rechargeAmount) return
    const amount = parseFloat(rechargeAmount)
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('client_accounts')
        .update({ balance: client.balance + amount } as any)
        .eq('id', client.id)

      if (error) throw error

      await supabase.from('balance_transactions').insert({
        cafe_id: cafe?.id,
        client_id: client.id,
        type: 'credit',
        amount: amount,
        balance_before: client.balance,
        balance_after: client.balance + amount,
        description: 'Recharge compte'
      } as any)

      addToast({ type: 'success', message: 'Compte rechargé' })
      setShowRechargeSheet(false)
      setRechargeAmount('')
      fetchData()
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !client) return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
  if (!client) return <div className="min-h-screen bg-bg p-8 text-center">Client non trouvé</div>

  return (
    <div className="min-h-screen bg-bg pt-14 pb-24">
      <div className="fixed top-0 left-0 right-0 h-14 bg-bg border-b border-border z-[110] px-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text3 hover:text-text"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-sm font-bold text-text uppercase tracking-widest">Détail Client</h1>
        <button className="p-2 -mr-2 text-text3 hover:text-text"><MoreVertical className="w-5 h-5" /></button>
      </div>

      <div className="p-6 space-y-8 max-w-xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar name={client.name} size="lg" className="scale-125 mb-2" />
          <h2 className="text-2xl font-black text-text">{client.name}</h2>
        </div>

        <div className="bg-surface border border-border rounded-card-lg p-6 space-y-6">
          <div className="text-center space-y-1">
            <p className="text-[11px] font-black text-text3 uppercase tracking-widest">Solde Actuel</p>
            <p className={cn("text-5xl font-mono font-black", client.balance > 50 ? "text-success" : client.balance < 20 ? "text-error" : "text-warning")}>
              {client.balance.toFixed(2)} <span className="text-xl">DH</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setShowRechargeSheet(true)} variant="success" className="h-12 text-sm font-bold" leftIcon={<PlusCircle className="w-5 h-5" />}>Recharger</Button>
            {client.phone && <Button variant="ghost" className="h-12 text-sm font-bold" leftIcon={<MessageCircle className="w-5 h-5" />} onClick={() => window.open(`https://wa.me/${client.phone}`)}>WhatsApp</Button>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SmallStat icon={<BarChart className="w-3.5 h-3.5" />} label="Visites" value={client.total_visits.toString()} />
          <SmallStat icon={<TrendingUp className="w-3.5 h-3.5" />} label="Dépensé" value={`${Math.round(client.total_spent)} DH`} />
          <SmallStat icon={<Calendar className="w-3.5 h-3.5" />} label="Inscrit" value={new Date(client.created_at).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })} />
        </div>

        <section className="space-y-4">
          <h3 className="text-[15px] font-bold text-text">Dernières visites</h3>
          <div className="bg-surface border border-border rounded-card divide-y divide-border/50">
            {history.length === 0 ? (<div className="p-4 text-center text-xs text-text3">Aucune visite</div>) : history.map(s => (
              <div key={s.id} className="p-4 flex items-center justify-between">
                <div className="space-y-0.5"><p className="text-sm font-bold text-text">Place {s.seat_number}</p><p className="text-[10px] text-text3 uppercase font-medium">{new Date(s.ended_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}</p></div>
                <span className="font-mono text-sm font-bold text-text">{s.total_amount.toFixed(2)} DH</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomSheet isOpen={showRechargeSheet} onClose={() => setShowRechargeSheet(false)} title="Recharger">
        <div className="space-y-6 pt-2">
          <div className="flex gap-2 overflow-x-auto pb-1">{[20, 50, 100, 200].map(amt => (<button key={amt} onClick={() => setRechargeAmount(amt.toString())} className="px-6 py-3 bg-surface2 border border-border rounded-card font-mono font-bold text-text hover:border-accent">{amt} DH</button>))}</div>
          <Input label="Montant (DH)" type="number" icon={<Wallet className="w-4 h-4" />} value={rechargeAmount} onChange={e => setRechargeAmount(e.target.value)} />
          <Button onClick={handleRecharge} className="w-full h-14" isLoading={isLoading} leftIcon={<Check className="w-5 h-5" />}>Confirmer</Button>
        </div>
      </BottomSheet>
    </div>
  )
}

const SmallStat = ({ icon, label, value }: any) => (
  <div className="bg-surface2 border border-border rounded-card p-3 text-center space-y-1"><div className="flex justify-center text-text3">{icon}</div><p className="text-[9px] font-black text-text3 uppercase tracking-[0.1em]">{label}</p><p className="text-xs font-bold text-text">{value}</p></div>
)
