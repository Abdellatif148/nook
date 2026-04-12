// @ts-nocheck
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Store, Users, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { hashPin } from '../lib/crypto'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { useTranslation } from '../i18n'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { NumPad } from '../components/ui/NumPad'
import { PINDots } from '../components/ui/PINDots'
import type { Staff } from '../types'

export const LoginPage: React.FC = () => {
  const [role, setRole] = React.useState<'owner' | 'staff'>('owner')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [step, setStep] = React.useState(1)
  const [cafeCode, setCafeCode] = React.useState('')
  const [staffList, setStaffList] = React.useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = React.useState<Staff | null>(null)
  const [pin, setPin] = React.useState('')
  const [pinError, setPinError] = React.useState(false)

  const { setAuth } = useAuthStore()
  const { addToast } = useUIStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const { data: cafeData } = await supabase.from('cafes').select('*').eq('owner_id', data.user.id).single()
      setAuth('owner', data.user, null, cafeData as any)
      navigate(!cafeData || !cafeData.setup_complete ? '/wizard' : '/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCafe = async () => {
    setIsLoading(true)
    try {
      const { data: cafeData, error } = await supabase.from('cafes').select('id, name').eq('invite_code', cafeCode).single()
      if (error || !cafeData) throw new Error('Code incorrect')
      const { data: staffData } = await supabase.from('staff').select('*').eq('cafe_id', cafeData.id).eq('active', true)
      setStaffList(staffData as Staff[] || [])
      setStep(2)
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStaffPinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) verifyStaffPin(newPin)
    }
  }

  const verifyStaffPin = async (finalPin: string) => {
    if (!selectedStaff) return
    setIsLoading(true)
    try {
      const hashed = await hashPin(finalPin)
      if (hashed === selectedStaff.pin_hash) {
        const { data: cafeData } = await supabase.from('cafes').select('*').eq('id', selectedStaff.cafe_id).single()
        const session = { type: 'staff', staff_id: selectedStaff.id, cafe_id: selectedStaff.cafe_id, name: selectedStaff.name, permissions: selectedStaff.permissions, expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() }
        localStorage.setItem('nook_staff_session', JSON.stringify(session))
        setAuth('staff', null, selectedStaff, cafeData as any)
        navigate('/dashboard')
      } else {
        setPinError(true)
        setTimeout(() => { setPinError(false); setPin('') }, 500)
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 grid-pattern">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[420px] bg-surface border border-border rounded-card-lg p-8 shadow-lg">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center shadow-accent"><span className="text-white font-black text-xl">N</span></div>
          <h1 className="text-xl font-bold text-text">Nook OS</h1>
          <p className="text-text2 text-[13px]">{t('auth.subtitle')}</p>
        </div>

        {step === 1 && (
          <div className="p-1 bg-surface2 border border-border rounded-btn flex mb-8">
            <button onClick={() => setRole('owner')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-btn text-sm font-medium transition-all ${role === 'owner' ? 'bg-accent-glow text-accent2 border border-accent-border' : 'text-text3'}`}><Store className="w-4 h-4" />{t('auth.owner')}</button>
            <button onClick={() => setRole('staff')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-btn text-sm font-medium transition-all ${role === 'staff' ? 'bg-accent-glow text-accent2 border border-accent-border' : 'text-text3'}`}><Users className="w-4 h-4" />{t('auth.staff')}</button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {role === 'owner' ? (
            <motion.form key="owner" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onSubmit={handleOwnerLogin} className="space-y-4">
              <Input label={t('auth.email')} placeholder="nom@exemple.com" icon={<Mail className="w-4 h-4" />} value={email} onChange={(e) => setEmail(e.target.value)} required />
              <div className="relative">
                <Input label={t('auth.password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" icon={<Lock className="w-4 h-4" />} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-[34px] text-text3 hover:text-text2">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              {error && <p className="text-xs text-error text-center">{error}</p>}
              <Button type="submit" isLoading={isLoading} className="w-full">{t('auth.login')}</Button>
              <div className="text-center pt-2"><span className="text-[13px] text-text3">{t('auth.no_account')} </span><Link to="/register" className="text-[13px] text-accent2 hover:underline font-semibold">{t('auth.register_link')}</Link></div>
            </motion.form>
          ) : (
            <motion.div key="staff" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-semibold text-text3 uppercase tracking-wider pl-1">{t('auth.cafe_code')}</label>
                    <Input placeholder="000000" className="text-center font-mono tracking-widest text-xl" value={cafeCode} onChange={e => setCafeCode(e.target.value.replace(/[^0-9]/g, '').slice(0,6))} />
                    <p className="text-xs text-text3 text-center">{t('auth.cafe_code_hint')}</p>
                  </div>
                  <Button onClick={handleVerifyCafe} className="w-full" isLoading={isLoading} disabled={cafeCode.length !== 6}>{t('common.continue')}</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3"><button onClick={() => setStep(1)} className="p-2 -ml-2 text-text3 hover:text-text"><ArrowLeft className="w-5 h-5" /></button></div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-text3 uppercase tracking-wider pl-1">{t('auth.your_name')}</label>
                    <select className="w-full bg-black/25 border border-border rounded-btn px-3.5 py-2.5 text-text outline-none focus:border-accent h-[44px]" value={selectedStaff?.id || ''} onChange={(e) => setSelectedStaff(staffList.find(s => s.id === e.target.value) || null)}>
                      <option value="">Sélectionner...</option>
                      {staffList.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                    </select>
                  </div>
                  {selectedStaff && (
                    <div className="space-y-6">
                      <PINDots length={pin.length} maxLength={4} error={pinError} />
                      <NumPad onInput={handleStaffPinInput} onDelete={() => setPin(pin.slice(0, -1))} />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
