// @ts-nocheck
import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, MoreVertical, Edit2, Trash2, Clock, Gauge, ShoppingBag, Plus, StopCircle, AlertCircle, Banknote, CreditCard, User, Gift, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useSessionStore } from '../stores/sessionStore'
import { useUIStore } from '../stores/uiStore'
import { useLiveTimer } from '../hooks/useLiveTimer'
import { useCurrentBill } from '../hooks/useCurrentBill'
import { formatDH, formatTime } from '../utils/formatters'
import { Button } from '../components/ui/Button'
import { BottomSheet } from '../components/ui/BottomSheet'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Badge } from '../components/ui/Badge'
import type { Session, Product, Extra } from '../types'

export const SessionDetailPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cafe, type, staff } = useAuthStore()
  const { updateSession, removeSession } = useSessionStore()
  const { addToast } = useUIStore()

  const [session, setSession] = React.useState<Session | null>(null)
  const [isAddExtrasOpen, setIsAddExtrasOpen] = React.useState(false)
  const [isEndSessionOpen, setIsEndSessionOpen] = React.useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(true)

  const fetchSession = async () => {
    if (!id) return
    setIsRefreshing(true)
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (data) setSession(data as Session)
    setIsRefreshing(false)
  }

  React.useEffect(() => {
    fetchSession()
  }, [id])

  const { display, totalMinutes } = useLiveTimer(session?.started_at || new Date().toISOString())
  const { timeCost, extrasTotal, totalAmount } = useCurrentBill(session || { started_at: new Date().toISOString(), rate_per_hour: 0, extras: [], status: 'completed' } as any, cafe)

  const handleCancelSession = async () => {
    if (!session) return
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', session.id)

      if (error) throw error

      removeSession(session.id)
      addToast({ type: 'warning', message: 'Session annulée' })
      navigate('/dashboard')
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    }
  }

  if (isRefreshing) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
    </div>
  )

  if (!session) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-surface2 flex items-center justify-center text-text3"><AlertCircle className="w-8 h-8" /></div>
      <p className="text-text2 font-bold">Session introuvable</p>
      <Button variant="ghost" onClick={() => navigate('/dashboard')}>Retour au tableau de bord</Button>
    </div>
  )

  const isLong = cafe && totalMinutes > (cafe.long_session_alert_hours || 3) * 60

  return (
    <div className="min-h-screen bg-bg flex flex-col pb-32">
      <header className="sticky top-0 z-50 h-[56px] bg-bg/90 backdrop-blur-md border-b border-border px-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text3 hover:text-text transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[16px] font-bold text-text">Place {session.seat_number}</h1>
        <div className="relative group">
          <button className="p-2 -mr-2 text-text3 hover:text-text transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
          {/* Simple Dropdown could go here */}
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* TIMER CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-gradient-to-br from-accent/10 to-transparent border border-accent-border rounded-[20px] p-8 flex flex-col items-center text-center space-y-2 shadow-sm"
        >
          <p className="text-[15px] font-bold text-text2 uppercase tracking-widest">{session.customer_name}</p>
          <motion.div
            animate={{ scale: [1, 1.005, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-[64px] font-mono font-black text-text leading-none tracking-tight"
          >
            {session.status === 'active' ? display : `${Math.floor((session.duration_minutes || 0) / 60).toString().padStart(2, '0')}:${((session.duration_minutes || 0) % 60).toString().padStart(2, '0')}:00`}
          </motion.div>

          <div className="flex gap-6 pt-4">
            <div className="flex items-center gap-2 text-[12px] font-medium text-text3">
              <Clock className="w-3.5 h-3.5" />
              <span>Démarré à {formatTime(session.started_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-text3">
              <Gauge className="w-3.5 h-3.5" />
              <span>{session.rate_per_hour} DH/h</span>
            </div>
          </div>

          {isLong && session.status === 'active' && (
            <div className="absolute bottom-0 left-0 right-0 py-2 bg-warning/10 border-t border-warning/10 flex items-center justify-center gap-2 rounded-b-[20px]">
              <AlertCircle className="w-3.5 h-3.5 text-warning" />
              <span className="text-[11px] font-bold text-warning uppercase tracking-wider">Session longue — {Math.floor(totalMinutes/60)}h {totalMinutes%60}min</span>
            </div>
          )}
        </motion.div>

        {/* BILL CARD */}
        <section className="space-y-3">
          <label className="text-[11px] font-black text-text3 uppercase tracking-[0.1em] px-1">Note actuelle</label>
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-3 text-text2">
                <div className="p-2 bg-surface2 rounded-lg"><Clock className="w-4 h-4" /></div>
                <span>Temps</span>
              </div>
              <span className="font-mono font-bold text-accent2">{formatDH(timeCost)}</span>
            </div>

            {session.extras && (session.extras as any[]).length > 0 && (
              <div className="space-y-4 pt-1">
                {(session.extras as any[]).map((extra, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-text">
                      <div className="p-2 bg-surface2 rounded-lg text-text3"><ShoppingBag className="w-4 h-4" /></div>
                      <span className="font-medium">{extra.quantity}× {extra.name}</span>
                    </div>
                    <span className="font-mono font-bold text-text">{formatDH(extra.price * extra.quantity)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="h-px bg-border/60" />

            <div className="flex justify-between items-center">
              <span className="text-[15px] font-extrabold text-text uppercase">Total</span>
              <motion.span
                key={totalAmount}
                initial={{ scale: 1.1, color: 'var(--accent)' }}
                animate={{ scale: 1, color: 'var(--accent2)' }}
                className="text-[24px] font-mono font-black"
              >
                {formatDH(totalAmount)}
              </motion.span>
            </div>
          </div>
        </section>

        {session.status === 'active' && (
          <button
            onClick={() => setIsAddExtrasOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-border rounded-xl text-text3 font-bold text-sm hover:border-text3 hover:text-text2 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Ajouter une consommation
          </button>
        )}

        {session.notes && (
          <div className="bg-surface2/30 border border-border rounded-lg p-3 text-[13px] text-text2 italic">
             <span className="not-italic font-bold text-text3 text-[10px] uppercase block mb-1">Note interne:</span>
             {session.notes}
          </div>
        )}
      </main>

      {session.status === 'active' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg via-bg to-transparent pb-8 safe-bottom">
          <button
            onClick={() => setIsEndSessionOpen(true)}
            className="w-full h-14 bg-gradient-to-r from-error to-[#dc2626] text-white font-bold rounded-xl shadow-xl shadow-error/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <StopCircle className="w-5 h-5" />
            Terminer la session
          </button>
        </div>
      )}

      {/* Sheets & Dialogs */}
      <AddExtrasSheet
        isOpen={isAddExtrasOpen}
        onClose={() => setIsAddExtrasOpen(false)}
        session={session}
        onUpdate={(updated) => { setSession(updated); updateSession(updated); }}
      />

      <EndSessionSheet
        isOpen={isEndSessionOpen}
        onClose={() => setIsEndSessionOpen(false)}
        session={session}
        currentBill={{ timeCost, extrasTotal, totalAmount, totalMinutes }}
      />

      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        title="Annuler la session ?"
        message="Cette action est irréversible. Les données de cette session ne seront pas comptabilisées dans les rapports."
        danger
        confirmLabel="Annuler la session"
        onConfirm={handleCancelSession}
        onCancel={() => setIsCancelDialogOpen(false)}
      />
    </div>
  )
}

// Sub-component: AddExtrasSheet
const AddExtrasSheet: React.FC<{ isOpen: boolean; onClose: () => void; session: Session; onUpdate: (s: Session) => void }> = ({ isOpen, onClose, session, onUpdate }) => {
  const [products, setProducts] = React.useState<Product[]>([])
  const [quantities, setQuantities] = React.useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const { addToast } = useUIStore()
  const { cafe } = useAuthStore()

  React.useEffect(() => {
    if (isOpen && cafe) {
      const fetchProducts = async () => {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('cafe_id', cafe.id)
          .eq('active', true)
          .order('sort_order')
        if (data) setProducts(data as Product[])
      }
      fetchProducts()
    }
  }, [isOpen, cafe])

  const handleQtyChange = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }))
  }

  const handleAdd = async () => {
    setIsLoading(true)
    try {
      const newItems = products
        .filter(p => quantities[p.id] > 0)
        .map(p => ({ id: p.id, name: p.name, price: p.price, quantity: quantities[p.id] }))

      if (newItems.length === 0) {
        onClose()
        return
      }

      const existingExtras = (session.extras as any[]) || []
      const updatedExtras = [...existingExtras]

      newItems.forEach(item => {
        const idx = updatedExtras.findIndex(e => e.id === item.id)
        if (idx > -1) {
          updatedExtras[idx].quantity += item.quantity
        } else {
          updatedExtras.push(item)
        }
      })

      const extras_total = updatedExtras.reduce((acc, e) => acc + (e.price * e.quantity), 0)

      const { data, error } = await supabase
        .from('sessions')
        .update({ extras: updatedExtras, extras_total })
        .eq('id', session.id)
        .select()
        .single()

      if (error) throw error
      onUpdate(data as Session)
      addToast({ type: 'success', message: 'Consommations ajoutées' })
      onClose()
      setQuantities({})
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCount = Object.values(quantities).reduce((a, b) => a + b, 0)
  const selectedTotal = products.reduce((acc, p) => acc + (p.price * (quantities[p.id] || 0)), 0)

  const categories = ['boisson', 'nourriture', 'autre']

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Consommations">
      <div className="space-y-8 pb-4">
        {categories.map(cat => {
          const catProds = products.filter(p => p.category === cat)
          if (catProds.length === 0) return null
          return (
            <div key={cat} className="space-y-4">
              <h3 className="text-[10px] font-black text-text3 uppercase tracking-[0.15em] px-1">{cat}s</h3>
              <div className="grid grid-cols-2 gap-3">
                {catProds.map(p => (
                  <motion.div
                    key={p.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      quantities[p.id] > 0 ? 'bg-accent-glow border-accent-border' : 'bg-surface2/50 border-border'
                    }`}
                  >
                    <div className="space-y-1 mb-3">
                      <p className="text-[13px] font-bold text-text truncate">{p.name}</p>
                      <p className="text-[12px] font-mono font-bold text-accent2">{p.price.toFixed(2)} DH</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleQtyChange(p.id, -1)}
                        className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-text2"
                      >-</button>
                      <span className="font-mono font-bold text-sm">{quantities[p.id] || 0}</span>
                      <button
                        onClick={() => handleQtyChange(p.id, 1)}
                        className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-text2"
                      >+</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })}

        <div className="sticky bottom-0 bg-surface pt-4 border-t border-border mt-8 space-y-4">
          <div className="flex justify-between items-center px-1">
             <span className="text-[13px] font-bold text-text2">{selectedCount} articles</span>
             <span className="text-[18px] font-mono font-black text-accent2">{formatDH(selectedTotal)}</span>
          </div>
          <Button
            onClick={handleAdd}
            className="w-full h-12"
            isLoading={isLoading}
            disabled={selectedCount === 0}
          >
            Ajouter à la session
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

// Sub-component: EndSessionSheet
const EndSessionSheet: React.FC<{ isOpen: boolean; onClose: () => void; session: Session; currentBill: any }> = ({ isOpen, onClose, session, currentBill }) => {
  const [paymentMethod, setPaymentMethod] = React.useState<'cash' | 'card' | 'account' | 'free' | null>(null)
  const [cashReceived, setCashReceived] = React.useState<number>(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const { addToast } = useUIStore()
  const { cafe, type, staff } = useAuthStore()
  const navigate = useNavigate()

  const handleConfirm = async () => {
    if (!paymentMethod) return
    setIsLoading(true)

    try {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          ended_at: now,
          duration_minutes: currentBill.totalMinutes,
          time_cost: currentBill.timeCost,
          total_amount: currentBill.totalAmount,
          payment_method: paymentMethod,
          amount_received: paymentMethod === 'cash' ? cashReceived : null,
          change_given: paymentMethod === 'cash' ? (cashReceived - currentBill.totalAmount) : null
        })
        .eq('id', session.id)

      if (error) throw error

      // Audit Log
      await supabase.from('audit_log').insert({
        cafe_id: session.cafe_id,
        staff_id: type === 'staff' ? staff?.id : null,
        is_owner: type === 'owner',
        action: 'session_ended',
        details: { customer_name: session.customer_name, total: currentBill.totalAmount, payment: paymentMethod }
      })

      addToast({ type: 'success', message: `Session clôturée — ${formatDH(currentBill.totalAmount)}` })
      navigate('/dashboard')
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const methods = [
    { id: 'cash', label: 'Espèces', icon: <StopCircle className="w-5 h-5" /> }, // Icons should match prompt request
    { id: 'card', label: 'Carte', icon: <StopCircle className="w-5 h-5" /> },
    { id: 'account', label: 'Compte', icon: <StopCircle className="w-5 h-5" /> },
    { id: 'free', label: 'Offert', icon: <StopCircle className="w-5 h-5" /> }
  ]

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Clôturer la session">
      <div className="space-y-8 pb-4">
        <div className="bg-surface2/50 border border-border rounded-xl p-5 space-y-4">
          <div className="flex justify-between text-sm"><span className="text-text3">Client:</span><span className="font-bold text-text">{session.customer_name}</span></div>
          <div className="flex justify-between text-sm"><span className="text-text3">Durée:</span><span className="font-bold text-text">{Math.floor(currentBill.totalMinutes/60)}h {currentBill.totalMinutes%60}min</span></div>
          <div className="h-px bg-border/40" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-text uppercase">Total à payer</span>
            <span className="text-[22px] font-mono font-black text-accent2">{formatDH(currentBill.totalAmount)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-black text-text3 uppercase tracking-[0.1em] px-1">Mode de règlement</label>
          <div className="grid grid-cols-2 gap-3">
             {methods.map(m => (
               <motion.button
                key={m.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setPaymentMethod(m.id as any)}
                className={`h-[72px] flex flex-col items-center justify-center gap-1.5 rounded-xl border transition-all ${
                  paymentMethod === m.id ? 'bg-accent-glow border-accent text-accent2' : 'bg-surface2/30 border-border text-text3'
                }`}
               >
                 <span className="text-lg">{m.id === 'cash' ? <Banknote /> : m.id === 'card' ? <CreditCard /> : m.id === 'account' ? <User /> : <Gift />}</span>
                 <span className="text-[13px] font-bold">{m.label}</span>
               </motion.button>
             ))}
          </div>
        </div>

        <AnimatePresence>
          {paymentMethod === 'cash' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 overflow-hidden">
               <div className="space-y-2">
                 <label className="text-[11px] font-bold text-text3 uppercase px-1">Montant reçu</label>
                 <div className="relative">
                   <input
                    type="number"
                    className="w-full bg-black/25 border border-border rounded-lg h-12 px-4 text-text font-mono focus:border-accent outline-none"
                    placeholder="0.00"
                    onChange={e => setCashReceived(parseFloat(e.target.value) || 0)}
                   />
                   <span className="absolute right-4 top-3 font-bold text-text3 font-mono">DH</span>
                 </div>
               </div>
               {cashReceived > 0 && (
                 <div className="flex justify-between items-center px-1">
                   <span className="text-sm font-medium text-text2">Monnaie à rendre:</span>
                   <span className={`text-lg font-mono font-black ${cashReceived >= currentBill.totalAmount ? 'text-success' : 'text-error'}`}>
                    {cashReceived >= currentBill.totalAmount ? formatDH(cashReceived - currentBill.totalAmount) : 'Montant insuffisant'}
                   </span>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="success"
          onClick={handleConfirm}
          className="w-full h-14 text-base font-bold shadow-xl shadow-success/10"
          isLoading={isLoading}
          disabled={!paymentMethod || (paymentMethod === 'cash' && cashReceived < currentBill.totalAmount)}
          icon={<CheckCircle className="w-5 h-5" />}
        >
          Encaisser {formatDH(currentBill.totalAmount)}
        </Button>
      </div>
    </BottomSheet>
  )
}
