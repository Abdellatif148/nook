// @ts-nocheck
import * as React from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { useTranslation } from '../i18n'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const { setAuth } = useAuthStore()
  const { addToast } = useUIStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const passwordStrength = React.useMemo(() => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })

      if (error) throw error

      setAuth('owner', data.user, null, null)
      addToast({ type: 'success', message: 'Compte créé avec succès' })
      navigate('/wizard')
    } catch (err: any) {
      setError(err.message)
      addToast({ type: 'error', message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 grid-pattern">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[420px] bg-surface border border-border rounded-card-lg p-8 shadow-lg"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center shadow-accent">
            <span className="text-white font-black text-xl">N</span>
          </div>
          <h1 className="text-xl font-bold text-text">Rejoindre Nook OS</h1>
          <p className="text-text2 text-[13px]">Créez votre compte propriétaire</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom complet"
            placeholder="Ahmed Alaoui"
            icon={<User className="w-4 h-4" />}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email"
            placeholder="votre@email.com"
            icon={<Mail className="w-4 h-4" />}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="space-y-2">
            <div className="relative">
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-[34px] text-text3 hover:text-text2 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-1.5 px-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    s <= passwordStrength
                      ? passwordStrength === 1 ? 'bg-error' : passwordStrength === 2 ? 'bg-warning' : passwordStrength === 3 ? 'bg-yellow-400' : 'bg-success'
                      : 'bg-border'
                  }`}
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full h-12 mt-6"
            disabled={password.length < 8}
          >
            Créer mon compte
          </Button>

          <div className="text-center pt-2">
            <span className="text-[13px] text-text3">Vous avez déjà un compte ? </span>
            <Link to="/login" className="text-[13px] text-accent2 hover:underline font-semibold">
              Se connecter
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
