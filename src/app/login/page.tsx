'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle, CheckCircle, ArrowRight, Shield, Globe, Clock, X, Phone, Mail as MailIcon, MessageCircle, Copy, Glasses } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [imageVersion, setImageVersion] = useState<number>(Date.now());
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Função para buscar configurações (mesma lógica do sidebar)
  const fetchConfig = async () => {
    try {
      const res = await fetch(getApiUrl('/configuracoes-sistema'), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setConfig(data);
      setImageVersion(Date.now());
    } catch (err) {
      console.error('Erro ao carregar config:', err);
    }
  };

  // Carregar configurações do sistema (mesma lógica do sidebar)
  useEffect(() => {
    fetchConfig();
  }, []);

  // Escutar atualizações de configuração (mesma lógica do sidebar)
  useEffect(() => {
    const handleConfigUpdate = () => {
      fetchConfig();
    };
    window.addEventListener('configUpdated', handleConfigUpdate);
    return () => {
      window.removeEventListener('configUpdated', handleConfigUpdate);
    };
  }, []);

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
      await login(email, password);
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      router.push('/dashboard/gestao-comercial');
    } catch (err) {
      const errorObj = err as Error;
      setError(
        errorObj.message || 
        'Credenciais inválidas. Por favor, tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  // Mesma lógica do sidebar para a logo
  const logoUrl = config?.logo ? `${getApiUrl(config.logo)}?v=${imageVersion}` : null;
  const empresaNome = config?.empresa_nome || config?.nome_sistema || 'Prestígio Óptica';

  const adminContact = {
    name: 'Administrador do Sistema',
    email: 'suporte@prestigioptica.ao',
    phone: '+244 923 456 789',
    whatsapp: '+244 923 456 789'
  };

  // Evitar hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Fundo com partículas animadas */}
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
          {/* Lado Esquerdo - Informações da Empresa */}
          <div className="hidden lg:block text-white space-y-8">
            <div className="animate-fadeInLeft">
              {/* Logo da Empresa - Mesmo estilo do sidebar */}
              <div className="mb-6">
                {logoUrl ? (
                  <div className="flex justify-start">
                    <img
                      src={logoUrl}
                      alt={`Logo ${empresaNome}`}
                      className="h-24 w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Glasses size={48} className="text-white" />
                  </div>
                )}
              </div>
              <p className="text-xl text-blue-200 mb-8">
                Sistema de Gestão Integrada
              </p>
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

            {/* <div className="grid grid-cols-2 gap-4 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 animate-fadeInUp">
                <p className="text-3xl font-bold">500+</p>
                <p className="text-sm text-blue-200">Clientes Ativos</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 animate-fadeInUp delay-100">
                <p className="text-3xl font-bold">10k+</p>
                <p className="text-sm text-blue-200">Consultas Realizadas</p>
              </div>
            </div> */}
          </div>

          {/* Lado Direito - Formulário de Login */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 transform transition-all duration-500 hover:shadow-3xl">
              <div className="text-center mb-8">
                <div className="lg:hidden flex flex-col items-center mb-4">
                  {/* Logo para mobile - mesmo estilo do sidebar */}
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt={`Logo ${empresaNome}`}
                      className="h-16 w-auto object-contain mb-3"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                      <Glasses size={32} className="text-white" />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-white">Bem-vindo de volta!</h2>
                </div>
                <div className="hidden lg:block">
                  <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta!</h2>
                </div>
                <p className="text-blue-200">Acesse sua conta para continuar</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-lg text-red-100 text-sm flex items-center gap-2 animate-shake">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                  <button onClick={clearError} className="ml-auto hover:text-red-200 transition-colors">
                    <span className="text-xs">✕</span>
                  </button>
                </div>
              )}

              {!error && email && password && !isLoading && (
                <div className="mb-4 p-3 bg-green-500/20 backdrop-blur-sm border border-green-400/50 rounded-lg text-green-100 text-sm flex items-center gap-2 animate-pulse">
                  <CheckCircle size={18} />
                  <span>Preencha suas credenciais para continuar</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
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

                <button
                  type="submit"
                  className="relative w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 overflow-hidden group"
                  disabled={isLoading}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Autenticando...
                      </>
                    ) : (
                      <>
                        <LogIn size={18} />
                        Entrar no Sistema
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
                  © {new Date().getFullYear()} {empresaNome} - Todos os direitos reservados
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Esqueceu a Senha */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Lock className="text-white" size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Recuperar Acesso</h2>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="text-yellow-600" size={32} />
                </div>
                <p className="text-gray-600">
                  Para recuperar sua senha, entre em contato com o administrador do sistema através dos canais abaixo:
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MailIcon className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Email do Administrador</p>
                    <a href={`mailto:${adminContact.email}`} className="text-blue-600 font-medium hover:underline">
                      {adminContact.email}
                    </a>
                  </div>
                  <button
                    onClick={() => handleCopy(adminContact.email, 'email')}
                    className="text-gray-400 hover:text-gray-600 transition-colors relative"
                  >
                    <Copy size={18} />
                    {copySuccess === 'email' && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Copiado!
                      </span>
                    )}
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="text-green-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Telefone</p>
                    <a href={`tel:${adminContact.phone}`} className="text-green-600 font-medium hover:underline">
                      {adminContact.phone}
                    </a>
                  </div>
                  <button
                    onClick={() => handleCopy(adminContact.phone, 'phone')}
                    className="text-gray-400 hover:text-gray-600 transition-colors relative"
                  >
                    <Copy size={18} />
                    {copySuccess === 'phone' && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Copiado!
                      </span>
                    )}
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="text-green-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">WhatsApp</p>
                    <a href={`https://wa.me/${adminContact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium hover:underline">
                      {adminContact.whatsapp}
                    </a>
                  </div>
                  <button
                    onClick={() => handleCopy(adminContact.whatsapp, 'whatsapp')}
                    className="text-gray-400 hover:text-gray-600 transition-colors relative"
                  >
                    <Copy size={18} />
                    {copySuccess === 'whatsapp' && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Copiado!
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 text-center">
                  ⚠️ O administrador é a única pessoa autorizada a redefinir senhas por questões de segurança.
                </p>
              </div>

              <button
                onClick={() => setShowForgotModal(false)}
                className="mt-6 w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
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
        .animate-fadeInLeft { animation: fadeInLeft 0.8s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease-out; animation-fill-mode: both; }
        .animate-float { animation: float infinite ease-in-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-1000 { animation-delay: 1s; }
        .shadow-3xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
      `}</style>
    </div>
  );
}