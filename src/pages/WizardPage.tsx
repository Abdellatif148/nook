// @ts-nocheck
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Store, MapPin, Navigation, Phone, Timer, User, CheckCircle, ArrowRight, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { useTranslation } from '../i18n'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { hashPin } from '../lib/crypto'

export const WizardPage: React.FC = () => {
  const [step, setStep] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const { user, setCafe } = useAuthStore()
  const { addToast } = useUIStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [cafeName, setCafeName] = React.useState('')
  const [city, setCity] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [seats, setSeats] = React.useState(20)
  const [standardRate, setStandardRate] = React.useState(2.00)
  const [premiumRate, setPremiumRate] = React.useState(3.00)
  const [increment, setIncrement] = React.useState('minute')
  const [addStaff, setAddStaff] = React.useState(false)
  const [staffName, setStaffName] = React.useState('')
  const [staffPin, setStaffPin] = React.useState('')
  const [inviteCode, setInviteCode] = React.useState('')

  const handleNext = () => setStep(s => s + 1)
  const handleBack = () => setStep(s => s - 1)

  const handleFinish = async () => {
    setIsLoading(true)
    try {
      const { data: codeData, error: codeError } = await supabase.rpc('generate_invite_code')
      if (codeError) throw codeError
      const code = codeData as string
      setInviteCode(code)

      const { data: cafeData, error: cafeError } = await supabase
        .from('cafes')
        .insert({
          owner_id: user?.id,
          name: cafeName,
          city,
          address,
          phone,
          invite_code: code,
          total_seats: seats,
          default_rate: standardRate,
          premium_rate: premiumRate,
          billing_increment: increment,
          setup_complete: true
        } as any)
        .select()
        .single()

      if (cafeError) throw cafeError

      if (addStaff && staffName && staffPin) {
        const pinHash = await hashPin(staffPin)
        await supabase.from('staff').insert({
          cafe_id: cafeData.id,
          name: staffName,
          pin_hash: pinHash,
          permissions: { sessions: true, reports: false, clients: false, settings: false }
        } as any)
      }

      setCafe(cafeData as any)
      setStep(4)
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { id: 1, label: 'Informations', icon: Store },
    { id: 2, label: 'Configuration', icon: Timer },
    { id: 3, label: 'Équipe', icon: User },
    { id: 4, label: 'Prêt', icon: CheckCircle },
  ]

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center pt-12 px-6">
      <div className="w-full max-w-[520px] mb-12 flex justify-between relative">
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-border -z-10" />
        {steps.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step >= s.id ? 'bg-accent border-accent text-white' : 'bg-surface border-border text-text3'}`}>
              {step > s.id ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s.id ? 'text-text' : 'text-text3'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-[520px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-text mb-1">{t('wizard.step1.title')}</h2>
                <p className="text-text2 text-sm">{t('wizard.step1.subtitle')}</p>
              </div>
              <div className="space-y-4 pt-4">
                <Input label="Nom du café" placeholder="Café Atlas..." icon={<Store className="w-4 h-4" />} value={cafeName} onChange={e => setCafeName(e.target.value)} required />
                <Input label="Ville" placeholder="Casablanca..." icon={<MapPin className="w-4 h-4" />} value={city} onChange={e => setCity(e.target.value)} />
                <Input label="Adresse" placeholder="Quartier..." icon={<Navigation className="w-4 h-4" />} value={address} onChange={e => setAddress(e.target.value)} />
                <Input label="Téléphone" placeholder="+212..." type="tel" icon={<Phone className="w-4 h-4" />} value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <Button onClick={handleNext} className="w-full h-14" disabled={!cafeName}>{t('common.next')}</Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-text mb-1">{t('wizard.step2.title')}</h2>
                <p className="text-text2 text-sm">{t('wizard.step2.subtitle')}</p>
              </div>
              <div className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text3 uppercase tracking-wider pl-1">Nombre de places</label>
                  <div className="flex items-center gap-4 bg-surface2 border border-border rounded-btn p-2 px-4 h-14">
                    <button onClick={() => setSeats(Math.max(1, seats - 1))} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-text2">－</button>
                    <span className="flex-1 text-center font-mono text-lg font-bold">{seats}</span>
                    <button onClick={() => setSeats(seats + 1)} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-text2">＋</button>
                  </div>
                </div>
                <Input label="Tarif Standard (DH/h)" type="number" step="0.5" icon={<Timer className="w-4 h-4" />} value={standardRate} onChange={e => setStandardRate(parseFloat(e.target.value))} />
                <Input label="Tarif Premium (DH/h)" type="number" step="0.5" icon={<CheckCircle className="w-4 h-4" />} value={premiumRate} onChange={e => setPremiumRate(parseFloat(e.target.value))} />
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={handleBack} className="flex-1">Retour</Button>
                <Button onClick={handleNext} className="flex-[2]">Suivant</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-text mb-1">{t('wizard.step3.title')}</h2>
                <p className="text-text2 text-sm">{t('wizard.step3.subtitle')}</p>
              </div>
              <div className="pt-4 space-y-4">
                <div onClick={() => setAddStaff(!addStaff)} className={`p-4 rounded-card border transition-all cursor-pointer ${addStaff ? 'bg-accent-glow border-accent-border' : 'bg-surface border-border'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${addStaff ? 'bg-accent text-white' : 'bg-surface2 text-text3'}`}><User className="w-5 h-5" /></div>
                      <div><p className="text-sm font-bold">Ajouter un employé maintenant</p></div>
                    </div>
                  </div>
                </div>
                {addStaff && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 overflow-hidden">
                    <Input label="Nom de l'employé" placeholder="Nom..." value={staffName} onChange={e => setStaffName(e.target.value)} />
                    <Input label="PIN (4 chiffres)" type="password" maxLength={4} placeholder="••••" value={staffPin} onChange={e => setStaffPin(e.target.value.replace(/[^0-9]/g, ''))} />
                  </motion.div>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={handleBack} className="flex-1">Retour</Button>
                <Button onClick={handleFinish} className="flex-[2]" isLoading={isLoading}>Terminer</Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center">
              <div className="flex justify-center"><div className="w-20 h-20 rounded-full bg-success-dim border-2 border-success/30 flex items-center justify-center text-success"><CheckCircle className="w-10 h-10" /></div></div>
              <h2 className="text-2xl font-bold text-text mb-1">{t('wizard.step4.title')}</h2>
              <div className="p-6 bg-surface2 border border-border rounded-card space-y-4">
                <p className="text-[11px] font-bold text-text3 uppercase tracking-widest">Code d'invitation</p>
                <div className="text-3xl font-mono font-bold tracking-[0.3em] text-accent pl-[0.3em]">{inviteCode}</div>
                <Button variant="ghost" className="w-full" leftIcon={<Copy className="w-4 h-4" />} onClick={() => { navigator.clipboard.writeText(inviteCode); addToast({ type: 'success', message: 'Code copié !' }) }}>Copier le code</Button>
              </div>
              <Button onClick={() => navigate('/dashboard')} className="w-full h-14 text-lg" rightIcon={<ArrowRight className="w-5 h-5" />}>{t('wizard.step4.finish')}</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
