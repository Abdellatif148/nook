// @ts-nocheck
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X, User, Phone, Armchair, Clock, Zap, Sliders, MessageSquare, Play, Loader2, Eye, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useSessionStore } from '../stores/sessionStore'
import { useUIStore } from '../stores/uiStore'
import { supabase } from '../lib/supabase'
import { formatTime } from '../utils/formatters'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export const NewSessionPage: React.FC = () => {
  const navigate = useNavigate()
  const { cafe, staff, type, owner } = useAuthStore()
  const { activeSessions } = useSessionStore()
  const { addToast } = useUIStore()

  const [customerName, setCustomerName] = React.useState('')
  const [customerPhone, setCustomerPhone] = React.useState('')
  const [selectedSeat, setSelectedSeat] = React.useState<number | null>(null)
  const [rateType, setRateType] = React.useState<'standard' | 'premium' | 'custom'>('standard')
  const [customRate, setCustomRate] = React.useState<number>(0)
  const [note, setNote] = React.useState('')
  const [isNoteExpanded, setIsNoteExpanded] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [recentCustomers, setRecentCustomers] = React.useState<string[]>([])

  const occupiedSeats = React.useMemo(() =>
    new Set(activeSessions.map(s => s.seat_number)),
    [activeSessions]
  )

  React.useEffect(() => {
    if (!cafe) return
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('customer_name')
        .eq('cafe_id', cafe.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        const names = Array.from(new Set(data.map(d => d.customer_name))).slice(0, 6)
        setRecentCustomers(names)
      }
    }
    fetchRecent()
  }, [cafe])

  const handleStart = async () => {
    if (!cafe || !customerName || selectedSeat === null) return

    // Re-check occupation
    if (occupiedSeats.has(selectedSeat)) {
      addToast({ type: 'error', message: 'Cette place est déjà occupée' })
      return
    }

    setIsLoading(true)
    const rate = rateType === 'standard' ? cafe.default_rate
               : rateType === 'premium' ? cafe.premium_rate
               : customRate

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          cafe_id: cafe.id,
          staff_id: type === 'staff' ? staff?.id : null,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || null,
          seat_number: selectedSeat,
          rate_per_hour: rate,
          notes: note.trim() || null,
          status: 'active',
          extras: [],
          extras_total: 0,
          total_amount: 0
        })
        .select()
        .single()

      if (error) throw error

      // Audit Log
      await supabase.from('audit_log').insert({
        cafe_id: cafe.id,
        staff_id: type === 'staff' ? staff?.id : null,
        is_owner: type === 'owner',
        action: 'session_started',
        details: { customer_name: customerName, seat_number: selectedSeat, rate }
      })

      addToast({ type: 'success', message: `Session démarrée — Place ${selectedSeat}` })
      navigate('/dashboard')
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const seats = Array.from({ length: cafe?.total_seats || 20 }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="sticky top-0 z-50 h-[56px] bg-bg/90 backdrop-blur-md border-b border-border px-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text3 hover:text-text">
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-[16px] font-bold text-text">Nouvelle session</h1>
        <div className="w-9" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-32 space-y-8">
        {/* CLIENT SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-bold text-text3 uppercase tracking-[0.08em]">Client</label>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Input
                autoFocus
                placeholder="Nom du client"
                icon={<User className="w-4 h-4" />}
                className="h-[52px] text-base"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
              {customerName && (
                <button
                  onClick={() => setCustomerName('')}
                  className="absolute right-3 top-[18px] p-1 text-text3 hover:text-text"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {recentCustomers.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {recentCustomers.map(name => (
                  <motion.button
                    key={name}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCustomerName(name)}
                    className="shrink-0 px-3 py-1.5 bg-surface2 border border-border rounded-full text-[12px] font-medium text-text2 hover:text-text hover:border-text3 transition-all"
                  >
                    {name}
                  </motion.button>
                ))}
              </div>
            )}

            <Input
              placeholder="Téléphone (optionnel)"
              icon={<Phone className="w-4 h-4" />}
              type="tel"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
            />
          </div>
        </section>

        {/* SEAT GRID */}
        <section className="space-y-4">
          <label className="text-[11px] font-bold text-text3 uppercase tracking-[0.08em] px-1">Sélectionner une place</label>
          <div className="grid grid-cols-5 gap-2.5">
            {seats.map(num => {
              const isOccupied = occupiedSeats.has(num)
              const isSelected = selectedSeat === num
              const occupant = activeSessions.find(s => s.seat_number === num)

              return (
                <motion.button
                  key={num}
                  disabled={isOccupied}
                  whileTap={!isOccupied ? { scale: 0.9 } : {}}
                  onClick={() => setSelectedSeat(num)}
                  className={`
                    relative h-14 flex flex-col items-center justify-center rounded-xl border transition-all duration-200
                    ${isOccupied
                      ? 'bg-error-dim border-error/10 text-error opacity-40 cursor-not-allowed'
                      : isSelected
                        ? 'bg-accent-glow border-accent text-accent2 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                        : 'bg-surface border-border text-text2 hover:border-text3'
                    }
                  `}
                >
                  <span className={`text-[15px] font-mono font-bold ${isSelected ? 'scale-110 transition-transform' : ''}`}>{num}</span>
                  {isOccupied && (
                    <span className="text-[9px] font-bold uppercase truncate max-w-[40px]">
                      {occupant?.customer_name[0]}
                    </span>
                  )}
                  {isSelected && !isOccupied && (
                    <motion.div
                      layoutId="selected-dot"
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-bg"
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </section>

        {/* RATE OPTIONS */}
        <section className="space-y-4">
          <label className="text-[11px] font-bold text-text3 uppercase tracking-[0.08em] px-1">Tarif</label>
          <div className="space-y-2.5">
            <button
              onClick={() => setRateType('standard')}
              className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                rateType === 'standard' ? 'bg-accent-glow border-accent' : 'bg-surface border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${rateType === 'standard' ? 'bg-accent text-white' : 'bg-surface2 text-text3'}`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold ${rateType === 'standard' ? 'text-accent2' : 'text-text'}`}>Standard</p>
                  <p className="text-[11px] text-text3">{cafe?.default_rate.toFixed(2)} DH / heure</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${rateType === 'standard' ? 'border-accent' : 'border-border2'}`}>
                {rateType === 'standard' && <div className="w-2.5 h-2.5 bg-accent rounded-full" />}
              </div>
            </button>

            <button
              onClick={() => setRateType('premium')}
              className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                rateType === 'premium' ? 'bg-accent-glow border-accent' : 'bg-surface border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${rateType === 'premium' ? 'bg-accent text-white' : 'bg-surface2 text-text3'}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold ${rateType === 'premium' ? 'text-accent2' : 'text-text'}`}>Premium</p>
                  <p className="text-[11px] text-text3">{cafe?.premium_rate.toFixed(2)} DH / heure</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${rateType === 'premium' ? 'border-accent' : 'border-border2'}`}>
                {rateType === 'premium' && <div className="w-2.5 h-2.5 bg-accent rounded-full" />}
              </div>
            </button>

            <div className={`rounded-xl border overflow-hidden transition-all ${
              rateType === 'custom' ? 'bg-accent-glow border-accent' : 'bg-surface border-border'
            }`}>
              <button
                onClick={() => setRateType('custom')}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${rateType === 'custom' ? 'bg-accent text-white' : 'bg-surface2 text-text3'}`}>
                    <Sliders className="w-5 h-5" />
                  </div>
                  <p className={`text-sm font-bold ${rateType === 'custom' ? 'text-accent2' : 'text-text'}`}>Personnalisé</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${rateType === 'custom' ? 'border-accent' : 'border-border2'}`}>
                  {rateType === 'custom' && <div className="w-2.5 h-2.5 bg-accent rounded-full" />}
                </div>
              </button>

              <AnimatePresence>
                {rateType === 'custom' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4"
                  >
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        className="w-full bg-black/20 border border-accent/20 rounded-lg px-4 py-2.5 text-text font-mono focus:border-accent outline-none"
                        placeholder="0.00"
                        value={customRate || ''}
                        onChange={e => setCustomRate(parseFloat(e.target.value) || 0)}
                      />
                      <span className="absolute right-4 top-2.5 font-bold text-text3">DH/h</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* NOTE SECTION */}
        <section className="space-y-3">
          <button
            onClick={() => setIsNoteExpanded(!isNoteExpanded)}
            className="flex items-center gap-2 text-[13px] font-medium text-text3 hover:text-text2 transition-colors px-1"
          >
            <MessageSquare className="w-4 h-4" />
            Ajouter une note
            <motion.div animate={{ rotate: isNoteExpanded ? 180 : 0 }}>
              <Sliders className="w-3 h-3 rotate-90" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isNoteExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <textarea
                  rows={3}
                  placeholder="Note interne..."
                  className="w-full bg-black/25 border border-border rounded-xl p-3 text-text text-sm focus:border-accent outline-none transition-all placeholder:text-text3"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* PREVIEW CARD */}
        <AnimatePresence>
          {customerName && selectedSeat !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-surface2 border border-accent-border rounded-2xl p-5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Eye className="w-12 h-12" />
              </div>
              <label className="text-[10px] font-black text-text3 uppercase tracking-[0.1em] mb-4 block">Aperçu de la session</label>

              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div className="space-y-0.5">
                  <p className="text-[11px] text-text3 font-medium">Client</p>
                  <p className="text-sm font-bold text-text truncate">{customerName}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[11px] text-text3 font-medium">Place</p>
                  <p className="text-sm font-bold text-accent2">Place {selectedSeat}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] text-text3 font-medium">Tarif</p>
                  <p className="text-sm font-bold text-text font-mono">
                    {(rateType === 'standard' ? cafe?.default_rate : rateType === 'premium' ? cafe?.premium_rate : customRate)?.toFixed(2)} DH/h
                  </p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[11px] text-text3 font-medium">Début</p>
                  <p className="text-sm font-bold text-text font-mono">{formatTime(new Date())}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg via-bg to-transparent pb-8 safe-bottom">
        <Button
          onClick={handleStart}
          isLoading={isLoading}
          disabled={!customerName || selectedSeat === null}
          className="w-full h-14 text-base font-bold shadow-2xl"
          icon={<Play className="w-5 h-5 fill-current" />}
        >
          Démarrer la session
        </Button>
      </div>
    </div>
  )
}
