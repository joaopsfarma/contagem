import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Pill, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function Login() {
  const { user, signInWithGoogle, signInWithEmail, registerWithEmail } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      let msg = err.message;
      if (msg.includes('auth/invalid-credential')) msg = 'E-mail ou senha incorretos.';
      if (msg.includes('auth/email-already-in-use')) msg = 'Este e-mail já está em uso.';
      if (msg.includes('auth/weak-password')) msg = 'A senha deve ter pelo menos 6 caracteres.';
      if (msg.includes('auth/admin-restricted-operation') || msg.includes('auth/operation-not-allowed')) {
        msg = 'O login com E-mail/Senha não está ativado. Vá até o Console do Firebase > Authentication > Sign-in method e ative-o primeiro.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="banner-gradiente p-8 text-center rounded-t-3xl border-b border-gray-100 flex flex-col items-center">
          <div className="bg-white/90 p-4 rounded-2xl shadow-sm mb-4 backdrop-blur-sm">
            <img src="/logo.png" alt="Logo Rede Américas" className="h-16 object-contain" onError={(e) => {
              // Fallback icon if logo not uploaded yet
              e.currentTarget.style.display = 'none';
              const icon = e.currentTarget.nextElementSibling as HTMLElement;
              if (icon) icon.style.display = 'block';
            }} />
            <Pill className="w-12 h-12 text-brand-purple hidden" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Rede Américas</h2>
          <p className="text-white/90 mt-2">Controle Psicotrópico</p>
        </div>
        
        <div className="p-8 space-y-6">
          <p className="text-center text-gray-500 mb-6 font-medium">
            {isRegistering ? 'Crie sua conta para prosseguir' : 'Faça login para prosseguir'}
          </p>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl flex items-start">
              <AlertCircle className="w-4 h-4 shrink-0 mr-2 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-purple hover:bg-brand-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegistering ? 'Criar Conta' : 'Entrar')}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500">
            {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
            <button 
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="ml-1 text-brand-purple font-semibold hover:underline"
            >
              {isRegistering ? 'Faça login' : 'Crie uma'}
            </button>
          </div>

          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Ou use sua conta Google</span>
            </div>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple transition-colors"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar com Google
          </button>
        </div>
      </div>
    </div>
  );
}
