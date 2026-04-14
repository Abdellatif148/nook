import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { authApi } from '../api/auth';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { setAuth } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login({ email, password });
      // Based on the prompt, response 200: save token and user
      setAuth(response.token, response.user, response.settings);
      addToast({ type: 'success', message: 'Connexion réussie' });
      navigate('/dashboard');
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Pas de connexion — vérifiez votre WiFi');
      } else {
        setError('Email ou mot de passe incorrect');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-card border border-border rounded-[14px] p-8 shadow-main">
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-main">
            <span className="text-white font-black text-2xl">N</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-text">Nook OS</h1>
            <p className="text-[14px] text-text2">Gérez votre café intelligemment</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-text2 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
              <input
                type="email"
                autoComplete="email"
                placeholder="votre@email.ma"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 bg-black/30 border border-border rounded-input pl-11 pr-4 text-text placeholder:text-text3 focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-text2 uppercase tracking-wider ml-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 bg-black/30 border border-border rounded-input pl-11 pr-12 text-text placeholder:text-text3 focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text3 hover:text-text2"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className={`text-[13px] text-center ${error.includes('WiFi') ? 'text-yellow' : 'text-red'}`}>{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-accent to-accent2 text-white font-bold rounded-button shadow-main active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Se connecter'}
          </button>
        </form>

        <div className="mt-8 text-center text-[14px] text-text2">
          Pas encore de compte ?{' '}
          <a href="mailto:support@nookos.ma" className="text-accent2 font-semibold hover:underline">
            Contactez Nook
          </a>
        </div>
      </div>
    </div>
  );
};
