// @ts-nocheck
import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, MoreVertical, PlusCircle, MessageCircle, TrendingUp, Calendar, BarChart, CreditCard, Loader2, Check } from 'lucide-react'
import { Phone } from "lucide-react"
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { formatDH, formatDate, formatTime } from '../utils/formatters'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Input } from '../components/ui/Input'
import type { ClientAccount, Session } from '../types'

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cafe } = useAuthStore()
  const { addToast } = useUIStore()
  const [client, setClient] = React.useState<ClientAccount | null>(null)
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [isRechargeOpen, setIsRechargeOpen] = React.useState(false)
  const [rechargeAmount, setRechargeAmount] = React.useState(0)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(true)

  const fetchData = async () => {
    if (!id || !cafe) return
    setIsRefreshing(true)

    const [clientRes, sessionsRes] = await Promise.all([
      supabase.from('client_accounts').select('*').eq('id', id).single(),
      supabase.from('sessions')
        .select('*')
        .or(`client_account_id.eq.${id},customer_name.ilike.${client?.name || ''}`)
        .eq('cafe_id', cafe.id)
        .order('ended_at', { ascending: false })
        .limit(20)
    ])

    if (clientRes.data) setClient(clientRes.data as ClientAccount)
    if (sessionsRes.data) setSessions(sessionsRes.data as Session[])
    setIsRefreshing(false)
  }

  React.useEffect(() => {
    fetchData()
  }, [id, cafe])

  const handleRecharge = async () => {
    if (!client || rechargeAmount <= 0) return
    setIsSaving(true)
    try {
      const newBalance = client.balance + rechargeAmount

      const { data, error } = await supabase
        .from('client_accounts')
        .update({ balance: newBalance })
        .eq('id', client.id)
        .select()
        .single()

      if (error) throw error

      await supabase.from('balance_transactions').insert({
        cafe_id: cafe!.id,
        client_id: client.id,
        type: 'credit',
        amount: rechargeAmount,
        balance_before: client.balance,
        balance_after: newBalance,
        description: 'Recharge compte client'
      })

      setClient(data as ClientAccount)
      addToast({ type: 'success', message: `${formatDH(rechargeAmount)} ajoutés au compte` })
      setIsRechargeOpen(false)
      setRechargeAmount(0)
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  if (isRefreshing && !client) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
    </div>
  )

  if (!client) return null

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 h-[56px] bg-bg/90 backdrop-blur-md border-b border-border px-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text3 hover:text-text transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[16px] font-bold text-text truncate max-w-[200px]">{client.name}</h1>
        <button className="p-2 -mr-2 text-text3 hover:text-text transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      <main className="p-4 space-y-6">
        <div className="flex flex-col items-center gap-4 py-4">
           <Avatar name={client.name} size="lg" className="ring-4 ring-white/5" />
           <div className="text-center space-y-1">
             <h2 className="text-xl font-black text-text">{client.name}</h2>
             {client.phone && (
               <div className="flex items-center justify-center gap-2 text-[13px] text-text2 font-mono">
                 <Phone className="w-3 h-3" />
                 {client.phone}
               </div>
             )}
           </div>
        </div>

        <div className="bg-surface border border-border rounded-[16px] p-6 space-y-8 shadow-sm">
           <div className="space-y-1">
             <p className="text-[11px] font-bold text-text3 uppercase tracking-widest text-center">Solde disponible</p>
             <p className={`text-[36px] font-mono font-black text-center tracking-tight ${
               client.balance < 10 ? 'text-error' : client.balance < 50 ? 'text-warning' : 'text-success'
             }`}>
               {formatDH(client.balance)}
             </p>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <Button variant="success" onClick={() => setIsRechargeOpen(true)} className="h-12 font-bold" icon={<PlusCircle className="w-4 h-4" />}>Recharger</Button>
              {client.phone && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    const text = `Bonjour ${client.name}, votre solde chez ${cafe?.name} est de ${formatDH(client.balance)}.`
                    window.open(`whatsapp://send?phone=${client.phone?.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(text)}`)
                  }}
                  className="h-12 font-bold"
                  icon={<MessageCircle className="w-4 h-4 text-[#25D366]" />}
                >
                  WhatsApp
                </Button>
              )}
           </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface2/30 border border-border rounded-xl p-3.5 text-center">
             <BarChart className="w-4 h-4 text-accent mx-auto mb-2" />
             <p className="text-[14px] font-mono font-black text-text">{client.total_visits}</p>
             <p className="text-[10px] font-bold text-text3 uppercase">Visites</p>
          </div>
          <div className="bg-surface2/30 border border-border rounded-xl p-3.5 text-center">
             <TrendingUp className="w-4 h-4 text-accent mx-auto mb-2" />
             <p className="text-[14px] font-mono font-black text-text">{Math.round(client.total_spent)}</p>
             <p className="text-[10px] font-bold text-text3 uppercase">Dépensé</p>
          </div>
          <div className="bg-surface2/30 border border-border rounded-xl p-3.5 text-center">
             <Calendar className="w-4 h-4 text-accent mx-auto mb-2" />
             <p className="text-[11px] font-bold text-text truncate">{new Date(client.created_at).toLocaleDateString(undefined, {month: 'short', year: '2-digit'})}</p>
             <p className="text-[10px] font-bold text-text3 uppercase">Membre</p>
          </div>
        </div>

        <section className="space-y-4">
          <h3 className="text-[15px] font-bold text-text px-1">Historique des visites</h3>
          <div className="bg-surface border border-border rounded-xl overflow-hidden divide-y divide-border/50">
             {sessions.map(s => (
               <div key={s.id} className="flex items-center justify-between p-4 active:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/sessions/${s.id}`)}>
                  <div className="space-y-1">
                     <p className="text-[13px] font-bold text-text">{formatDate(s.started_at)}</p>
                     <p className="text-[11px] text-text3">{formatTime(s.started_at)} • {s.duration_minutes} min</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-mono font-black text-text">{formatDH(s.total_amount || 0)}</p>
                  </div>
               </div>
             ))}
             {sessions.length === 0 && (
               <p className="p-12 text-center text-text3 text-[13px]">Aucune visite enregistrée</p>
             )}
          </div>
        </section>
      </main>

      <BottomSheet isOpen={isRechargeOpen} onClose={() => setIsRechargeOpen(false)} title="Recharger le compte">
         <div className="space-y-8 pb-4">
            <div className="text-center space-y-1 py-4">
               <p className="text-[11px] font-black text-text3 uppercase tracking-widest">Montant à ajouter</p>
               <div className="text-[48px] font-mono font-black text-accent2 tracking-tight">
                  {rechargeAmount.toFixed(2)} <span className="text-lg">DH</span>
               </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
               {[20, 50, 100, 200].map(amt => (
                 <button
                  key={amt}
                  onClick={() => setRechargeAmount(amt)}
                  className={`h-11 rounded-lg border font-bold text-sm transition-all ${
                    rechargeAmount === amt ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' : 'bg-surface2/50 border-border text-text2 hover:border-text3'
                  }`}
                 >
                   {amt}
                 </button>
               ))}
            </div>

            <div className="space-y-4">
               <div className="relative">
                 <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
                 <input
                  type="number"
                  className="w-full bg-black/25 border border-border rounded-lg h-12 pl-10 pr-4 text-text font-mono focus:border-accent outline-none"
                  placeholder="Autre montant..."
                  value={rechargeAmount || ''}
                  onChange={e => setRechargeAmount(parseFloat(e.target.value) || 0)}
                 />
               </div>

               <div className="bg-success-dim border border-success/10 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-[13px] font-bold text-success">Nouveau solde:</span>
                  <span className="text-[18px] font-mono font-black text-success">{formatDH(client.balance + rechargeAmount)}</span>
               </div>
            </div>

            <Button onClick={handleRecharge} className="w-full h-14 text-base font-bold shadow-xl" isLoading={isSaving} disabled={rechargeAmount <= 0}>
               Confirmer la recharge
            </Button>
         </div>
      </BottomSheet>
    </div>
  )
}
