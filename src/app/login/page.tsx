'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle, CheckCircle, ArrowRight, Shield, Globe, Clock, X, KeyRound } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

// Componente para as bolhas animadas
const FloatingBubbles = () => {
  const [bubbles, setBubbles] = useState<Array<{
    id: number;
    width: string;
    height: string;
    top: string;
    left: string;
    animationDelay: string;
    animationDuration: string;
  }>>([]);

  useEffect(() => {
    const newBubbles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      width: Math.random() * 200 + 50 + 'px',
      height: Math.random() * 200 + 50 + 'px',
      top: Math.random() * 100 + '%',
      left: Math.random() * 100 + '%',
      animationDelay: Math.random() * 5 + 's',
      animationDuration: Math.random() * 10 + 10 + 's',
    }));
    setBubbles(newBubbles);
  }, []);

  return (
    <>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full bg-white/5 animate-float"
          style={{
            width: bubble.width,
            height: bubble.height,
            top: bubble.top,
            left: bubble.left,
            animationDelay: bubble.animationDelay,
            animationDuration: bubble.animationDuration,
          }}
        />
      ))}
    </>
  );
};

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotModalMessage, setForgotModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Carregar credenciais salvas
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim()) {
      setError('Por favor, insira seu email');
      setIsLoading(false);
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Por favor, insira um email válido');
      setIsLoading(false);
      return;
    }
    if (!password.trim()) {
      setError('Por favor, insira sua senha');
      setIsLoading(false);
      return;
    }
    if (password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      // Se estiver no modo 2FA, faz a requisição diretamente
      if (requires2FA) {
        const response = await fetch(getApiUrl('/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            senha: password,
            twoFactorCode: twoFactorCode
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro no login');
        }

        const { token, usuario } = data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(usuario));
        
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        router.push('/dashboard/gestao-comercial');
        return;
      }

      // Login normal usando o context
      await login(email, password);
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      router.push('/dashboard/gestao-comercial');
    } catch (err: any) {
      // Verificar se é erro de 2FA (precisa de código)
      if (err.message?.includes('twoFactor') || err.message?.includes('2FA')) {
        setRequires2FA(true);
        setError('');
      } else {
        setError(err.message || 'Credenciais inválidas. Por favor, tente novamente.');
      }
      setIsLoading(false);
    }
  };

  // Verificar 2FA separadamente
  const handle2FALogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          senha: password,
          twoFactorCode: twoFactorCode
        })
      });

      const data = await response.json();

      if (response.status === 202 && data.requiresTwoFactor) {
        setError('Código inválido. Tente novamente.');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erro no login');
      }

      const { token, usuario } = data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      router.push('/dashboard/gestao-comercial');
      
    } catch (err: any) {
      setError(err.message || 'Erro ao verificar código');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotLoading(true);
    setForgotModalMessage(null);

    if (!forgotEmail.trim()) {
      setForgotModalMessage({ type: 'error', text: 'Por favor, insira seu email' });
      setIsForgotLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar email');
      }

      setForgotModalMessage({ 
        type: 'success', 
        text: '✅ Email de recuperação enviado! Verifique sua caixa de entrada.' 
      });
      
      setForgotEmail('');
      
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotModalMessage(null);
      }, 3000);
      
    } catch (err: any) {
      setForgotModalMessage({ type: 'error', text: err.message });
    } finally {
      setIsForgotLoading(false);
    }
  };

  const resetLogin = () => {
    setRequires2FA(false);
    setTwoFactorCode('');
    setTempUserId(null);
    setError('');
  };

  const clearError = () => {
    setError('');
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotModalMessage(null);
    setForgotEmail('');
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <FloatingBubbles />
        </div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-6xl px-4">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="hidden lg:block text-white space-y-8">
            <div className="animate-fadeInLeft">
              <div className="mb-6 flex justify-start">
                <img 
                  src="/logo.png" 
                  alt="Logo Sistema Óptica" 
                  className="h-18 w-auto object-contain"
                />
              </div>
              <p className="text-xl text-blue-200 mb-8">Sistema de Gestão Integrada</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-blue-100">
                  <Shield size={20} />
                  <span>Segurança de dados garantida</span>
                </div>
                <div className="flex items-center gap-3 text-blue-100">
                  <Globe size={20} />
                  <span>Acesso 24/7 de qualquer lugar</span>
                </div>
                <div className="flex items-center gap-3 text-blue-100">
                  <Clock size={20} />
                  <span>Suporte em tempo real</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 transform transition-all duration-500 hover:shadow-3xl">
              <div className="text-center mb-8">
                <div className="lg:hidden flex flex-col items-center mb-4">
                  <img 
                    src="/logo.png" 
                    alt="Logo Sistema Óptica" 
                    className="h-16 w-auto object-contain mb-3"
                  />
                  <h2 className="text-2xl font-bold text-white">
                    {requires2FA ? 'Código de Verificação' : 'Bem-vindo de volta!'}
                  </h2>
                </div>
                <div className="hidden lg:block">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {requires2FA ? 'Código de Verificação' : 'Bem-vindo de volta!'}
                  </h2>
                </div>
                <p className="text-blue-200">
                  {requires2FA 
                    ? 'Digite o código gerado pelo seu aplicativo autenticador'
                    : 'Acesse sua conta para continuar'}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-lg text-red-100 text-sm flex items-center gap-2 animate-shake">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                  <button onClick={clearError} className="ml-auto hover:text-red-200 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              )}

              <form onSubmit={requires2FA ? handle2FALogin : handleLogin} className="space-y-6">
                {!requires2FA ? (
                  <>
                    <div className="group">
                      <label className="block text-sm font-medium text-blue-100 mb-2 transition-all group-focus-within:text-white">
                        Email
                      </label>
                      <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'transform scale-105' : ''}`}>
                        <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${focusedField === 'email' ? 'text-white scale-110' : 'text-blue-300'}`} size={18} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-white placeholder:text-blue-200/50 outline-none"
                          placeholder="seu@email.com"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-blue-100 mb-2 transition-all group-focus-within:text-white">
                        Senha
                      </label>
                      <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'transform scale-105' : ''}`}>
                        <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${focusedField === 'password' ? 'text-white scale-110' : 'text-blue-300'}`} size={18} />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-white placeholder:text-blue-200/50 outline-none"
                          placeholder="Digite sua senha"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-all hover:scale-110"
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-white/30 bg-white/10 text-blue-600 focus:ring-white/50 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-sm text-blue-100 group-hover:text-white transition-colors">
                          Lembrar-me
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-sm text-blue-100 hover:text-white transition-colors hover:underline"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="group">
                      <label className="block text-sm font-medium text-blue-100 mb-2 transition-all group-focus-within:text-white">
                        Código de Autenticação
                      </label>
                      <div className={`relative transition-all duration-300 ${focusedField === '2fa' ? 'transform scale-105' : ''}`}>
                        <KeyRound className={`absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${focusedField === '2fa' ? 'text-white scale-110' : 'text-blue-300'}`} size={18} />
                        <input
                          type="text"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          onFocus={() => setFocusedField('2fa')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-white placeholder:text-blue-200/50 outline-none text-center text-2xl tracking-widest"
                          placeholder="000000"
                          maxLength={6}
                          required
                          autoFocus
                        />
                      </div>
                      <p className="text-xs text-blue-200 mt-2 text-center">
                        Abra o Google Authenticator e digite o código de 6 dígitos
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={resetLogin}
                      className="text-sm text-blue-100 hover:text-white transition-colors text-center w-full"
                    >
                      ← Voltar ao login
                    </button>
                  </>
                )}

                <button
                  type="submit"
                  className="relative w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 overflow-hidden group"
                  disabled={isLoading}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {requires2FA ? 'Verificando...' : 'Autenticando...'}
                      </>
                    ) : (
                      <>
                        <LogIn size={18} />
                        {requires2FA ? 'Verificar Código' : 'Entrar no Sistema'}
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/20 text-center">
                <p className="text-xs text-blue-200 flex items-center justify-center gap-2">
                  <Shield size={12} />
                  Sistema seguro com criptografia de ponta a ponta
                </p>
                <p className="text-xs text-blue-200/70 mt-2">
                  © {new Date().getFullYear()} Sistema Óptica - Todos os direitos reservados
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Mail className="text-white" size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Recuperar Senha</h2>
              </div>
              <button
                onClick={closeForgotModal}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {forgotModalMessage ? (
                <div className={`text-center p-4 rounded-lg ${
                  forgotModalMessage.type === 'success' 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {forgotModalMessage.type === 'success' ? (
                    <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
                  ) : (
                    <AlertCircle size={48} className="mx-auto mb-3 text-red-500" />
                  )}
                  <p>{forgotModalMessage.text}</p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MailIcon className="text-blue-600" size={32} />
                    </div>
                    <p className="text-gray-600">
                      Digite seu email para receber instruções de recuperação de senha.
                    </p>
                  </div>

                  <div className="mb-6">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="seu@email.com"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isForgotLoading ? 'Enviando...' : 'Enviar Instruções'}
                  </button>

                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="mt-3 w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-fadeInLeft { animation: fadeInLeft 0.8s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease-out; animation-fill-mode: both; }
        .animate-float { animation: float infinite ease-in-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .animate-pulse { animation: pulse 3s ease-in-out infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-1000 { animation-delay: 1s; }
        .shadow-3xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
      `}</style>
    </div>
  );
}

// Ícone de email para o modal
function MailIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 7L2 7" />
    </svg>
  );
}