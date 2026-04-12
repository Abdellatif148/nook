// @ts-nocheck
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X, User, Phone, Armchair, Clock, Zap, Sliders, MessageSquare, Play, Loader2, ChevronDown, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useSessionStore } from '../stores/sessionStore'
import { useUIStore } from '../stores/uiStore'
import { useTranslation } from '../i18n'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { cn } from '../utils/cn'

export const NewSessionPage: React.FC = () => {
  const navigate = useNavigate()
  const { cafe, staff, type } = useAuthStore()
  const { activeSessions } = useSessionStore()
  const { addToast } = useUIStore()
  const { t } = useTranslation()

  const [customerName, setCustomerName] = React.useState('')
  const [customerPhone, setCustomerPhone] = React.useState('')
  const [selectedSeat, setSelectedSeat] = React.useState<number | null>(null)
  const [rateType, setRateType] = React.useState<'standard' | 'premium' | 'custom'>('standard')
  const [customRate, setCustomRate] = React.useState(cafe?.default_rate || 2.00)
  const [notes, setNotes] = React.useState('')
  const [isNoteOpen, setIsNoteOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [recentCustomers, setRecentCustomers] = React.useState<string[]>([])

  React.useEffect(() => {
    if (!cafe?.id) return
    supabase
      .from('sessions')
      .select('customer_name')
      .eq('cafe_id', cafe.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          const unique = Array.from(new Set(data.map(d => d.customer_name))).slice(0, 6)
          setRecentCustomers(unique)
        }
      })
  }, [cafe?.id])

  const handleStartSession = async () => {
    if (!cafe?.id || !selectedSeat || !customerName) return

    // Re-check if seat is occupied
    const isOccupied = activeSessions.some(s => s.seat_number === selectedSeat)
    if (isOccupied) {
      addToast({ type: 'error', message: 'Cette place est déjà occupée' })
      return
    }

    setIsLoading(true)
    const rate = rateType === 'standard' ? cafe.default_rate : rateType === 'premium' ? cafe.premium_rate : customRate

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          cafe_id: cafe.id,
          staff_id: type === 'staff' ? staff?.id : null,
          customer_name: customerName,
          customer_phone: customerPhone,
          seat_number: selectedSeat,
          rate_per_hour: rate,
          notes: notes,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      addToast({ type: 'success', message: `Session démarrée — Place ${selectedSeat}` })
      navigate('/dashboard')
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const occupiedSeats = activeSessions.map(s => s.seat_number)

  return (
    <div className="min-h-screen bg-bg pt-14 pb-24">
      <div className="fixed top-0 left-0 right-0 h-14 bg-bg border-b border-border z-[110] px-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text3 hover:text-text"><X className="w-5 h-5" /></button>
        <h1 className="text-sm font-bold text-text uppercase tracking-widest">Nouvelle session</h1>
        <div className="w-8" />
      </div>

      <div className="p-6 space-y-8 max-w-xl mx-auto">
        {/* CLIENT SECTION */}
        <section className="space-y-4">
          <label className="text-[11px] font-bold text-text3 uppercase tracking-[0.1em]">Client</label>
          <div className="space-y-3">
            <Input
              placeholder="Nom du client"
              icon={<User className="w-4 h-4" />}
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="h-14 text-lg"
              autoFocus
            />
            {recentCustomers.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {recentCustomers.map(name => (
                  <button
                    key={name}
                    onClick={() => setCustomerName(name)}
                    className="shrink-0 px-3 py-1.5 bg-surface2 border border-border rounded-full text-xs text-text2 hover:border-accent transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            <Input
              placeholder="Téléphone (optionnel)"
              type="tel"
              icon={<Phone className="w-4 h-4" />}
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
            />
          </div>
        </section>

        {/* SEAT GRID */}
        <section className="space-y-4">
          <label className="text-[11px] font-bold text-text3 uppercase tracking-[0.1em]">Sélectionner une place</label>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: cafe?.total_seats || 20 }).map((_, i) => {
              const seatNum = i + 1
              const isOccupied = occupiedSeats.includes(seatNum)
              const isSelected = selectedSeat === seatNum
              const session = activeSessions.find(s => s.seat_number === seatNum)

              return (
                <button
                  key={seatNum}
                  disabled={isOccupied}
                  onClick={() => setSelectedSeat(seatNum)}
                  className={cn(
                    "relative aspect-square rounded-card border flex flex-col items-center justify-center transition-all",
                    isOccupied ? "bg-error/5 border-error/20 text-error/40 cursor-not-allowed" :
                    isSelected ? "bg-accent-glow border-accent text-accent2 shadow-accent/20 scale-105" :
                    "bg-surface border-border text-text2 hover:border-text3"
                  )}
                >
                  <span className="font-mono text-sm font-black">{seatNum}</span>
                  {isOccupied && <span className="text-[8px] font-bold truncate px-1">{session?.customer_name[0]}</span>}
                </button>
              )
            })}
          </div>
        </section>

        {/* RATE SECTION */}
        <section className="space-y-4">
          <label className="text-[11px] font-bold text-text3 uppercase tracking-[0.1em]">Tarif</label>
          <div className="space-y-2">
            <RateOption
              selected={rateType === 'standard'}
              onClick={() => setRateType('standard')}
              icon={<Clock className="w-5 h-5" />}
              title="Standard"
              subtitle={`${cafe?.default_rate.toFixed(2)} DH / heure`}
            />
            <RateOption
              selected={rateType === 'premium'}
              onClick={() => setRateType('premium')}
              icon={<Zap className="w-5 h-5 text-accent" />}
              title="Premium"
              subtitle={`${cafe?.premium_rate.toFixed(2)} DH / heure`}
            />
            <div className="space-y-2">
              <RateOption
                selected={rateType === 'custom'}
                onClick={() => setRateType('custom')}
                icon={<Sliders className="w-5 h-5" />}
                title="Personnalisé"
                subtitle="Définir un tarif unique"
              />
              <AnimatePresence>
                {rateType === 'custom' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <Input type="number" step="0.5" value={customRate} onChange={e => setCustomRate(parseFloat(e.target.value))} icon={<span className="text-xs font-bold">DH</span>} className="pl-8" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* NOTE SECTION */}
        <section className="space-y-2">
          <button
            onClick={() => setIsNoteOpen(!isNoteOpen)}
            className="flex items-center gap-2 text-text3 hover:text-text2 transition-colors py-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">Ajouter une note</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", isNoteOpen && "rotate-180")} />
          </button>
          <AnimatePresence>
            {isNoteOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Note interne..."
                  className="w-full bg-black/25 border border-border rounded-btn p-3 text-sm text-text outline-none focus:border-accent h-24"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* PREVIEW & ACTION */}
      <AnimatePresence>
        {customerName && selectedSeat && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-bg border-t border-border z-[120]"
          >
            <div className="max-w-xl mx-auto space-y-4">
              <div className="bg-surface2 border border-accent-border rounded-card p-3 flex justify-between items-center text-[11px] text-text3 uppercase tracking-wider">
                <div className="flex gap-4">
                  <p>Client: <span className="text-text font-bold">{customerName}</span></p>
                  <p>Place: <span className="text-text font-bold">{selectedSeat}</span></p>
                </div>
                <p>Début: <span className="text-text font-bold">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></p>
              </div>
              <Button onClick={handleStartSession} className="w-full h-14 text-lg" isLoading={isLoading} leftIcon={<Play className="w-5 h-5 fill-current" />}>
                Démarrer la session
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const RateOption = ({ selected, onClick, icon, title, subtitle }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full p-4 flex items-center justify-between border rounded-card transition-all",
      selected ? "bg-accent-glow border-accent shadow-accent/10" : "bg-surface border-border hover:border-text3"
    )}
  >
    <div className="flex items-center gap-4">
      <div className={cn("p-2 rounded-btn", selected ? "bg-accent text-white" : "bg-surface2 text-text3")}>
        {icon}
      </div>
      <div className="text-left">
        <p className="text-sm font-bold text-text">{title}</p>
        <p className="text-xs text-text3">{subtitle}</p>
      </div>
    </div>
    <div className={cn(
      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
      selected ? "border-accent bg-accent" : "border-border"
    )}>
      {selected && <div className="w-2 h-2 bg-white rounded-full" />}
    </div>
  </button>
)
