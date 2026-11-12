// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Lock,
  LogIn,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Headphones,
  Music,
  BookOpen,
  Radio,
  Shield,
  AtSign,
  Loader2,
  Sparkles,
  Mail,
} from 'lucide-react';

// Modal de Reenviar Verificação
const ResendVerificationModal = ({ 
  isOpen, 
  onClose, 
  onResend,
  isLoading,
  countdown,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onResend: (identifier: string) => Promise<void>;
  isLoading: boolean;
  countdown: number;
}) => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Digite seu email ou nome de usuário');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await onResend(identifier);
      setSuccess(`Código enviado para ${identifier}!`);
      setTimeout(() => {
        onClose();
        setIdentifier('');
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/10">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Mail size={20} className="text-white" />
            <h2 className="text-lg font-bold text-white">Reenviar código de verificação</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <p className="text-green-400 font-medium">{success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-gray-400 text-sm mb-4">
                Digite seu email ou nome de usuário para receber um novo código de verificação.
              </p>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Email ou Nome de Usuário
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder:text-gray-500"
                  placeholder="seu@email.com / usuario"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-400 text-sm hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || countdown > 0}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Enviando...
                    </>
                  ) : countdown > 0 ? (
                    `Aguarde ${countdown}s`
                  ) : (
                    'Enviar código'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default function LoginPage() {
  const { login, resendVerificationCode, loading: authLoading } = useAuth();
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Modal de reenvio de verificação
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Carregar credenciais salvas
  useEffect(() => {
    const savedIdentifier = localStorage.getItem('rememberedIdentifier');
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }
    setMounted(true);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!identifier.trim()) {
      setError('Por favor, insira seu email, telefone ou nome de usuário');
      setIsLoading(false);
      return;
    }
    if (!password.trim()) {
      setError('Por favor, insira sua senha');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(identifier, password);

      if (rememberMe) {
        localStorage.setItem('rememberedIdentifier', identifier);
      } else {
        localStorage.removeItem('rememberedIdentifier');
      }

      router.push('/');
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('verifique') || 
          err.message?.toLowerCase().includes('verificar')) {
        setError(`${err.message}`);
      } else {
        setError(err.message || 'Credenciais inválidas. Por favor, tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (userIdentifier: string) => {
    setIsResending(true);
    try {
      await resendVerificationCode(userIdentifier);
      setResendCountdown(60);
    } finally {
      setIsResending(false);
    }
  };

  const openResendModal = () => {
    setShowResendModal(true);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
        <div className="w-full max-w-5xl px-4">
          {/* Logo e Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Headphones size={22} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">PodFéPlay</h1>
            </div>
            <p className="text-purple-200 text-sm">Sua plataforma de fé, música e conhecimento</p>
          </div>

          {/* Card Principal */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="grid md:grid-cols-2">
              {/* Lado Esquerdo - Info */}
              <div className="bg-gradient-to-br from-purple-800/50 to-purple-900/50 p-8 text-white hidden md:flex flex-col justify-between backdrop-blur-sm">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-purple-200 text-sm">Plataforma Cristã</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Bem-vindo de volta!</h2>
                  <p className="text-purple-200 text-sm mb-8">
                    Milhares de músicas, pregações e podcasts para fortalecer sua fé.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Music size={14} className="text-purple-300" />
                      </div>
                      <span className="text-sm text-purple-100">Música Gospel</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={14} className="text-purple-300" />
                      </div>
                      <span className="text-sm text-purple-100">Pregações e Estudos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Radio size={14} className="text-purple-300" />
                      </div>
                      <span className="text-sm text-purple-100">Podcasts Exclusivos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Shield size={14} className="text-purple-300" />
                      </div>
                      <span className="text-sm text-purple-100">Transmissões ao Vivo</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-xs text-purple-300">
                    Ao fazer login, você concorda com nossos Termos de Uso
                  </p>
                </div>
              </div>

              {/* Lado Direito - Formulário de Login */}
              <div className="p-6 md:p-8">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white">Acesse sua conta</h2>
                  <p className="text-purple-200 text-sm mt-1">
                    Ouça seus conteúdos favoritos onde estiver
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg text-red-300 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span>{error}</span>
                        {error.toLowerCase().includes('verifique') && (
                          <button
                            onClick={openResendModal}
                            className="block mt-1 text-purple-400 hover:text-purple-300 hover:underline font-medium"
                          >
                            Não recebeu o código? Reenviar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">
                      Email, Telefone ou Usuário
                    </label>
                    <div className="relative">
                      <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white placeholder:text-gray-400"
                        placeholder="exemplo@email.com / @usuario / +244..."
                        required
                        disabled={isLoading || authLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white placeholder:text-gray-400"
                        placeholder="Digite sua senha"
                        required
                        disabled={isLoading || authLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-white/30 bg-white/10 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-xs text-purple-200 group-hover:text-white transition-colors">
                        Lembrar-me
                      </span>
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-purple-300 hover:text-white transition-colors hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={isLoading || authLoading}
                  >
                    {isLoading || authLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        <LogIn size={16} />
                        Entrar
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 pt-4 border-t border-white/10 text-center">
                  <p className="text-xs text-purple-200">
                    Não tem uma conta?{' '}
                    <Link
                      href="/register"
                      className="text-white font-medium hover:underline"
                    >
                      Cadastre-se
                    </Link>
                  </p>
                  <p className="text-xs text-purple-300/70 mt-3 flex items-center justify-center gap-2">
                    <Shield size={12} />
                    Conteúdo seguro e adequado para toda família
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-purple-300/50 mt-6">
            © {new Date().getFullYear()} PodFéPlay - Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* Modal de Reenviar Verificação */}
      <ResendVerificationModal
        isOpen={showResendModal}
        onClose={() => setShowResendModal(false)}
        onResend={handleResendCode}
        isLoading={isResending}
        countdown={resendCountdown}
      />
    </>
  );
}