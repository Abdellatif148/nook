// @ts-nocheck
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Store, MapPin, Navigation, Phone, Armchair, Clock, Star, Timer, User, CheckCircle2, Copy, ArrowRight, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { hashPin } from '../lib/crypto'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Toggle } from '../components/ui/Toggle'
import { NumPad } from '../components/ui/NumPad'
import { PINDots } from '../components/ui/PINDots'

export const WizardPage: React.FC = () => {
  const [step, setStep] = React.useState(1)
  const { owner, setAuth, setCafe } = useAuthStore()
  const { addToast } = useUIStore()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = React.useState(false)

  // Step 1: Info
  const [cafeName, setCafeName] = React.useState('')
  const [city, setCity] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [phone, setPhone] = React.useState('')

  // Step 2: Config
  const [seats, setSeats] = React.useState(20)
  const [standardRate, setStandardRate] = React.useState(2)
  const [premiumRate, setPremiumRate] = React.useState(3)
  const [increment, setIncrement] = React.useState('minute')

  // Step 3: First Staff
  const [addStaff, setAddStaff] = React.useState(false)
  const [staffName, setStaffName] = React.useState('')
  const [staffPin, setStaffPin] = React.useState('')
  const [staffPermissions, setStaffPermissions] = React.useState({
    sessions: true,
    reports: false,
    clients: false,
    settings: false
  })

  // Final data
  const [inviteCode, setInviteCode] = React.useState('')

  const handleNext = () => setStep(step + 1)
  const handleBack = () => setStep(step - 1)

  const finishWizard = async () => {
    if (!owner) return
    setIsLoading(true)

    try {
      // 1. Create Cafe
      const { data: cafeData, error: cafeError } = await supabase
        .from('cafes')
        .insert({
          owner_id: owner.id,
          name: cafeName,
          city,
          address,
          phone,
          total_seats: seats,
          default_rate: standardRate,
          premium_rate: premiumRate,
          billing_increment: increment,
          invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(), // Simplified, real one from DB function
          setup_complete: true
        })
        .select()
        .single()

      if (cafeError) throw cafeError

      // 2. Create Staff if requested
      if (addStaff && staffName && staffPin.length === 4) {
        const pinHash = await hashPin(staffPin)
        const { error: staffError } = await supabase
          .from('staff')
          .insert({
            cafe_id: cafeData.id,
            name: staffName,
            pin_hash: pinHash,
            permissions: staffPermissions,
            active: true
          })

        if (staffError) throw staffError
      }

      setCafe(cafeData as any)
      setAuth('owner', owner, null, cafeData as any)
      setInviteCode(cafeData.invite_code)
      setStep(4)
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { icon: <Store className="w-4 h-4" />, label: 'Café' },
    { icon: <Clock className="w-4 h-4" />, label: 'Tarifs' },
    { icon: <User className="w-4 h-4" />, label: 'Équipe' },
    { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Prêt' }
  ]

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center p-6 sm:p-12">
      <div className="w-full max-w-[520px]">
        {/* Progress */}
        <div className="flex justify-between items-center mb-12 px-4 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
          {steps.map((s, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step > i + 1 ? 'bg-success border-success text-white' :
                step === i + 1 ? 'bg-accent border-accent text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]' :
                'bg-surface border-border text-text3'
              }`}>
                {step > i + 1 ? <CheckCircle2 className="w-5 h-5" /> : s.icon}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${step === i + 1 ? 'text-accent' : 'text-text3'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="text-center">
                <h1 className="text-2xl font-extrabold text-text mb-2">Parlons de votre café</h1>
                <p className="text-text2 text-sm">Ces informations apparaîtront sur vos rapports</p>
              </div>
              <div className="space-y-4">
                <Input label="Nom du café" placeholder="Café Atlas, Espace Étude..." icon={<Store className="w-4 h-4" />} value={cafeName} onChange={e => setCafeName(e.target.value)} />
                <Input label="Ville" placeholder="Casablanca, Marrakech..." icon={<MapPin className="w-4 h-4" />} value={city} onChange={e => setCity(e.target.value)} />
                <Input label="Adresse complète" placeholder="Rue, quartier..." icon={<Navigation className="w-4 h-4" />} value={address} onChange={e => setAddress(e.target.value)} />
                <Input label="Téléphone" placeholder="+212 6XX XXX XXX" icon={<Phone className="w-4 h-4" />} type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <Button onClick={handleNext} disabled={!cafeName} className="w-full h-12 mt-4" iconRight={<ArrowRight className="w-4 h-4" />}>Suivant</Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="text-center">
                <h1 className="text-2xl font-extrabold text-text mb-2">Configuration de base</h1>
                <p className="text-text2 text-sm">Vous pourrez modifier ces valeurs plus tard</p>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-surface border border-border rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent-glow rounded-lg text-accent"><Armchair className="w-5 h-5" /></div>
                      <span className="font-bold text-text">Nombre de places</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSeats(Math.max(1, seats - 1))} className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text2 hover:text-text">-</button>
                      <span className="font-mono font-bold text-lg w-6 text-center">{seats}</span>
                      <button onClick={() => setSeats(Math.min(200, seats + 1))} className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text2 hover:text-text">+</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Tarif Standard (DH/h)" type="number" step="0.5" value={standardRate} onChange={e => setStandardRate(parseFloat(e.target.value))} icon={<Clock className="w-4 h-4 text-accent" />} />
                  <Input label="Tarif Premium (DH/h)" type="number" step="0.5" value={premiumRate} onChange={e => setPremiumRate(parseFloat(e.target.value))} icon={<Star className="w-4 h-4 text-accent" />} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-text3 uppercase tracking-wider pl-1">Incrément de facturation</label>
                  <select
                    className="w-full bg-black/25 border border-border rounded-input px-3.5 py-2.5 text-text text-sm"
                    value={increment}
                    onChange={e => setIncrement(e.target.value)}
                  >
                    <option value="minute">À la minute (défaut)</option>
                    <option value="15min">Par 15 minutes</option>
                    <option value="30min">Par 30 minutes</option>
                    <option value="hour">À l'heure</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="ghost" onClick={handleBack} className="flex-1 h-12" icon={<ArrowLeft className="w-4 h-4" />}>Retour</Button>
                <Button onClick={handleNext} className="flex-1 h-12" iconRight={<ArrowRight className="w-4 h-4" />}>Suivant</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="text-center">
                <h1 className="text-2xl font-extrabold text-text mb-2">Votre premier employé</h1>
                <p className="text-text2 text-sm">Vous pouvez aussi le faire plus tard</p>
              </div>

              <div className={`p-4 rounded-2xl border transition-all duration-300 ${addStaff ? 'bg-accent-glow border-accent-border' : 'bg-surface border-border'}`}>
                <Toggle enabled={addStaff} onChange={setAddStaff} label="Ajouter un employé maintenant" />
              </div>

              {addStaff && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-6 overflow-hidden">
                  <Input label="Nom de l'employé" placeholder="Prénom Nom" icon={<User className="w-4 h-4" />} value={staffName} onChange={e => setStaffName(e.target.value)} />

                  <div className="space-y-4">
                    <label className="text-[11px] font-bold text-text3 uppercase tracking-wider block text-center">Créer son code PIN (4 chiffres)</label>
                    <PINDots length={staffPin.length} />
                    <NumPad onInput={(d) => staffPin.length < 4 && setStaffPin(staffPin + d)} onDelete={() => setStaffPin(staffPin.slice(0, -1))} />
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-bold text-text3 uppercase tracking-wider">Accès autorisés</p>
                    <div className="space-y-2 bg-surface2/50 p-3 rounded-xl border border-border">
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <div className="flex items-center gap-3"><Timer className="w-4 h-4 text-accent" /><span className="text-sm">Gérer les sessions</span></div>
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <Toggle enabled={staffPermissions.reports} onChange={v => setStaffPermissions({...staffPermissions, reports: v})} label="Voir les rapports" />
                      <Toggle enabled={staffPermissions.clients} onChange={v => setStaffPermissions({...staffPermissions, clients: v})} label="Gérer les clients" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <Button variant="ghost" onClick={handleBack} className="flex-1 h-12">Retour</Button>
                  <Button onClick={finishWizard} isLoading={isLoading} className="flex-1 h-12" disabled={addStaff && (!staffName || staffPin.length !== 4)}>Suivant</Button>
                </div>
                {!addStaff && (
                  <button onClick={finishWizard} className="text-xs text-text3 hover:text-text2 text-center underline">Ignorer cette étape</button>
                )}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 py-4">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="w-20 h-20 rounded-full bg-success-dim border border-success/20 flex items-center justify-center text-success relative">
                  <CheckCircle2 className="w-10 h-10" />
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2 border-success"
                  />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-extrabold text-text">Votre café est prêt !</h1>
                  <p className="text-text2 text-sm">Partagez ce code avec vos employés</p>
                </div>

                <div className="w-full bg-surface2 border border-border rounded-2xl p-6 space-y-4">
                  <div className="text-[32px] font-mono font-bold tracking-[0.4em] text-text">
                    {inviteCode}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteCode)
                      addToast({ type: 'success', message: 'Code copié' })
                    }}
                    icon={<Copy className="w-4 h-4" />}
                  >
                    Copier le code
                  </Button>
                </div>

                <div className="w-full bg-surface border border-border rounded-xl p-4 text-left space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-text3">Café:</span><span className="font-bold text-text">{cafeName}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text3">Places:</span><span className="font-bold text-text">{seats}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text3">Tarif:</span><span className="font-bold text-text">{standardRate.toFixed(2)} DH/h</span></div>
                </div>

                <Button onClick={() => navigate('/dashboard')} className="w-full h-[52px] text-base" iconRight={<ArrowRight className="w-5 h-5" />}>Commencer à utiliser Nook OS</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
