import * as React from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUIStore } from '../stores/uiStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { cn } from '../utils/cn'

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const { addToast } = useUIStore()
  const navigate = useNavigate()

  const passwordStrength = React.useMemo(() => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }, [password])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })
      if (error) throw error

      addToast({ type: 'success', message: 'Compte créé avec succès' })
      navigate('/wizard')
    } catch (err: any) {
      setError(err.message)
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
          <h1 className="text-xl font-bold text-text">Créer un compte</h1>
          <p className="text-text2 text-[13px]">Inscrivez votre café sur Nook OS</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Nom complet"
            placeholder="Jean Dupont"
            icon={<User className="w-4 h-4" />}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email"
            placeholder="nom@exemple.com"
            icon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
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
              className="absolute right-3.5 top-[34px] text-text3 hover:text-text2"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex gap-1.5 px-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full bg-border transition-colors',
                  passwordStrength >= i && [
                    'bg-error',
                    'bg-warning',
                    'bg-yellow-500',
                    'bg-success'
                  ][passwordStrength - 1]
                )}
              />
            ))}
          </div>

          <Input
            label="Confirmer le mot de passe"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className="text-xs text-error text-center">{error}</p>}

          <Button type="submit" isLoading={isLoading} className="w-full">
            Continuer
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
