// app/register/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Church,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Headphones,
  Shield,
  AtSign,
  Loader2,
  Send,
  RefreshCw,
  Sparkles,
  Search,
  X,
  KeyRound,
  Verified,
} from 'lucide-react';
import { API_ENDPOINTS, getApiUrl } from '@/config/api';

// Função para mascarar email - mostra primeiros 3 e últimos 3 caracteres
const maskEmail = (email: string): string => {
  if (!email) return email;
  
  // Se for email
  if (email.includes('@')) {
    const [localPart, domain] = email.split('@');
    
    // Se a parte local for muito curta, mostra tudo
    if (localPart.length <= 6) {
      return email;
    }
    
    // Pega primeiros 3 e últimos 3 caracteres da parte local
    const firstThree = localPart.substring(0, 3);
    const lastThree = localPart.substring(localPart.length - 3);
    const maskedLocal = `${firstThree}***${lastThree}`;
    
    return `${maskedLocal}@${domain}`;
  }
  
  // Se for username
  if (email.length <= 6) {
    return email;
  }
  
  // Pega primeiros 3 e últimos 3 caracteres
  const firstThree = email.substring(0, 3);
  const lastThree = email.substring(email.length - 3);
  return `${firstThree}***${lastThree}`;
};

// Interface para Igreja
interface Church {
  id: string;
  name: string;
  location?: string;
  city?: string;
  country?: string;
  denomination?: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  email?: string;
  phone?: string;
  website?: string;
  isActive: boolean;
}

// Step indicator
const StepIndicator = ({ currentStep, steps }: { currentStep: number; steps: string[] }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              index + 1 === currentStep
                ? 'bg-purple-600 text-white shadow-lg'
                : index + 1 < currentStep
                ? 'bg-purple-200 text-purple-600'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {index + 1 < currentStep ? <CheckCircle size={16} /> : index + 1}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-1 transition-all ${
                index + 1 < currentStep ? 'bg-purple-400' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// Componente de Select de Igreja
const ChurchSelect = ({ 
  value, 
  onChange, 
  disabled 
}: { 
  value: string; 
  onChange: (id: string) => void; 
  disabled?: boolean;
}) => {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);

  // Carregar igrejas da API
  const loadChurches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.CHURCHES));
      const result = await response.json();
      
      console.log('Resposta da API de igrejas:', result);
      
      let churchesData: Church[] = [];
      
      if (result.success && result.data) {
        if (result.data.churches && Array.isArray(result.data.churches)) {
          churchesData = result.data.churches;
        } 
        else if (Array.isArray(result.data)) {
          churchesData = result.data;
        }
        else if (result.data && typeof result.data === 'object') {
          for (const key in result.data) {
            if (Array.isArray(result.data[key])) {
              churchesData = result.data[key];
              break;
            }
          }
        }
      } 
      else if (Array.isArray(result)) {
        churchesData = result;
      }
      else if (result.churches && Array.isArray(result.churches)) {
        churchesData = result.churches;
      }
      
      setChurches(churchesData);
    } catch (error) {
      console.error('Erro ao carregar igrejas:', error);
      setChurches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChurches();
  }, [loadChurches]);

  const filteredChurches = Array.isArray(churches) ? churches.filter(church =>
    church.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (church.location && church.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (church.city && church.city.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  useEffect(() => {
    if (value && Array.isArray(churches) && churches.length > 0) {
      const found = churches.find(c => c.id === value);
      setSelectedChurch(found || null);
    } else {
      setSelectedChurch(null);
    }
  }, [value, churches]);

  const handleSelect = (church: Church) => {
    setSelectedChurch(church);
    onChange(church.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedChurch(null);
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Church size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
        
        {selectedChurch ? (
          <div className="flex items-center justify-between w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex-1">
              <span className="font-medium text-gray-700">{selectedChurch.name}</span>
              {selectedChurch.location && (
                <span className="text-gray-400 text-xs ml-2">• {selectedChurch.location}</span>
              )}
              {selectedChurch.city && !selectedChurch.location && (
                <span className="text-gray-400 text-xs ml-2">• {selectedChurch.city}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
              disabled={disabled}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-left bg-white flex items-center justify-between"
            disabled={disabled || loading}
          >
            <span className={loading ? "text-gray-400" : "text-gray-500"}>
              {loading ? "Carregando igrejas..." : "Selecione uma igreja (opcional)"}
            </span>
            <Search size={14} className="text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar igreja..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  <Loader2 size={16} className="animate-spin inline mr-2" />
                  Carregando...
                </div>
              ) : filteredChurches.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  {searchTerm ? "Nenhuma igreja encontrada" : "Nenhuma igreja cadastrada"}
                </div>
              ) : (
                filteredChurches.map((church) => (
                  <button
                    key={church.id}
                    type="button"
                    onClick={() => handleSelect(church)}
                    className="w-full px-3 py-2 text-left hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="font-medium text-gray-800 text-sm">{church.name}</div>
                    {(church.location || church.city || church.denomination) && (
                      <div className="text-gray-400 text-xs mt-0.5">
                        {church.location && <span>{church.location}</span>}
                        {church.city && !church.location && <span>{church.city}</span>}
                        {((church.location || church.city) && church.denomination) && <span> • </span>}
                        {church.denomination && <span>{church.denomination}</span>}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Modal de Verificar Conta (para usuários já cadastrados)
const VerifyAccountModal = ({ 
  isOpen, 
  onClose, 
  onVerify,
  onResendCode,
  isLoading,
  resendCountdown,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onVerify: (identifier: string, code: string) => Promise<void>;
  onResendCode: (identifier: string) => Promise<void>;
  isLoading: boolean;
  resendCountdown: number;
}) => {
  const [identifier, setIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Digite seu email ou nome de usuário');
      return;
    }
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Digite o código de 6 dígitos');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await onVerify(identifier, verificationCode);
      setSuccess('Conta verificada com sucesso!');
      setTimeout(() => {
        onClose();
        setIdentifier('');
        setVerificationCode('');
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Código inválido');
    }
  };

  const handleResendCode = async () => {
    if (!identifier.trim()) {
      setError('Digite seu email ou nome de usuário para reenviar o código');
      return;
    }
    setIsResending(true);
    setError('');
    try {
      await onResendCode(identifier);
      setSuccess('Novo código enviado! Verifique seu email.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código');
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Verified size={20} className="text-white" />
            <h2 className="text-lg font-bold text-white">Verificar Conta</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <p className="text-green-600 font-medium">{success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-gray-600 text-sm mb-4">
                Digite seu email/nome de usuário e o código de verificação recebido para ativar sua conta.
              </p>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email ou Nome de Usuário
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="seu@email.com / usuario"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Código de Verificação
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center text-2xl tracking-[0.5em] py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="000000"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Verificar Conta
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending || resendCountdown > 0}
                  className="text-purple-600 hover:text-purple-700 text-sm transition-colors flex items-center justify-center gap-1 mt-2"
                >
                  {isResending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <RefreshCw size={12} />
                  )}
                  {resendCountdown > 0 
                    ? `Reenviar código em ${resendCountdown}s` 
                    : 'Não recebeu o código? Reenviar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default function RegisterPage() {
  const { register, verifyAccount, resendVerificationCode, loading: authLoading } = useAuth();
  const router = useRouter();

  // Steps: 1 = Formulário, 2 = Verificação
  const [currentStep, setCurrentStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [maskedIdentifier, setMaskedIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Modal de verificação para usuários já cadastrados
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyResendCountdown, setVerifyResendCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    churchId: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const steps = ['Dados', 'Verificação'];

  // Atualizar identifier mascarado quando identifier mudar
  useEffect(() => {
    if (identifier) {
      setMaskedIdentifier(maskEmail(identifier));
    } else {
      setMaskedIdentifier('');
    }
  }, [identifier]);

  // Countdown timer for resend code during registration
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Countdown for verify modal
  useEffect(() => {
    if (verifyResendCountdown > 0) {
      const timer = setTimeout(() => setVerifyResendCountdown(verifyResendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [verifyResendCountdown]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleChurchChange = (churchId: string) => {
    setFormData((prev) => ({ ...prev, churchId }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Nome de usuário é obrigatório');
      return false;
    }
    if (formData.username.length < 3) {
      setError('Nome de usuário deve ter pelo menos 3 caracteres');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Use apenas letras, números e underscore');
      return false;
    }
    
    if (!formData.email && !formData.phone) {
      setError('Informe email ou telefone');
      return false;
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email inválido');
      return false;
    }
    
    if (formData.phone && !/^\+?[0-9]{9,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      setError('Telefone inválido (9-15 dígitos)');
      return false;
    }
    
    if (!formData.password) {
      setError('Senha é obrigatória');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Senha deve ter no mínimo 8 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const registerData: {
        username: string;
        email?: string;
        phone?: string;
        password: string;
        fullName?: string;
        churchId?: string;
      } = {
        username: formData.username,
        password: formData.password,
      };

      if (formData.email && formData.email.trim()) {
        registerData.email = formData.email.trim();
      }

      if (formData.phone && formData.phone.trim()) {
        registerData.phone = formData.phone.trim();
      }

      if (formData.fullName && formData.fullName.trim()) {
        registerData.fullName = formData.fullName.trim();
      }

      if (formData.churchId && formData.churchId.trim()) {
        registerData.churchId = formData.churchId.trim();
      }

      const result = await register(registerData);
      
      setIdentifier(formData.email || formData.username);
      setSuccessMessage('Código enviado! Verifique seu email.');
      setCurrentStep(2);
      setCountdown(60);
    } catch (err: any) {
      console.error('Erro no registro:', err);
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Digite o código de 6 dígitos');
      setIsLoading(false);
      return;
    }

    try {
      await verifyAccount(identifier, verificationCode);
      setSuccessMessage('Conta verificada! Redirecionando...');
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Código inválido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || isResending) return;
    
    setIsResending(true);
    setError('');
    
    try {
      await resendVerificationCode(identifier);
      setSuccessMessage('Novo código enviado!');
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar');
    } finally {
      setIsResending(false);
    }
  };

  // Para usuários já cadastrados que precisam verificar a conta
  const handleVerifyExistingUser = async (userIdentifier: string, code: string) => {
    setIsVerifying(true);
    try {
      await verifyAccount(userIdentifier, code);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCodeForExistingUser = async (userIdentifier: string) => {
    await resendVerificationCode(userIdentifier);
    setVerifyResendCountdown(60);
  };

  const handleBackToForm = () => {
    setCurrentStep(1);
    setVerificationCode('');
    setError('');
    setSuccessMessage('');
  };

  const openVerifyModal = () => {
    setShowVerifyModal(true);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 py-8">
        <div className="w-full max-w-5xl px-4">
          {/* Logo e Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Headphones size={22} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">PodFéPlay</h1>
            </div>
            <p className="text-gray-500 text-sm">Crie sua conta e comece a ouvir</p>
          </div>

          {/* Card Principal */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Lado Esquerdo - Info */}
              <div className="bg-gradient-to-br from-purple-700 to-purple-900 p-8 text-white hidden md:flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-purple-200 text-sm">Plataforma Cristã</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Bem-vindo!</h2>
                  <p className="text-purple-200 text-sm mb-8">
                    Milhares de músicas, pregações e podcasts para fortalecer sua fé.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={14} />
                      </div>
                      <span className="text-sm">Música Gospel</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={14} />
                      </div>
                      <span className="text-sm">Pregações e Estudos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={14} />
                      </div>
                      <span className="text-sm">Podcasts Exclusivos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={14} />
                      </div>
                      <span className="text-sm">Transmissões ao Vivo</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/20">
                  <p className="text-xs text-purple-300">
                    Ao criar uma conta, você concorda com nossos Termos de Uso
                  </p>
                </div>
              </div>

              {/* Lado Direito - Formulário */}
              <div className="p-6 md:p-8">
                <StepIndicator currentStep={currentStep} steps={steps} />

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && currentStep === 2 && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Step 1: Registration Form */}
                {currentStep === 1 && (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Usuário *
                        </label>
                        <div className="relative">
                          <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            placeholder="joao_silva"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Nome completo
                        </label>
                        <div className="relative">
                          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            placeholder="João Silva"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            placeholder="seu@email.com"
                            disabled={isLoading}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Email para receber o código</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Telefone
                        </label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            placeholder="+244 923 456 789"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Igreja (opcional)
                      </label>
                      <ChurchSelect
                        value={formData.churchId}
                        onChange={handleChurchChange}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Selecione sua igreja para conectar-se com a comunidade
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Senha *
                        </label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            placeholder="Mínimo 8 caracteres"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Confirmar senha *
                        </label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            placeholder="Digite novamente"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2.5 rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-300 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                      disabled={isLoading || authLoading}
                    >
                      {isLoading || authLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        <>
                          Criar Conta
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Step 2: Verification Code */}
                {currentStep === 2 && (
                  <form onSubmit={handleVerify} className="space-y-5">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Mail size={28} className="text-purple-600" />
                      </div>
                      <p className="text-gray-600 text-sm mb-1">
                        Enviamos um código para
                      </p>
                      <p className="text-gray-800 font-medium text-sm">
                        {maskedIdentifier}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2 text-center">
                        Código de verificação
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full text-center text-2xl tracking-[0.5em] py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        placeholder="000000"
                        maxLength={6}
                        autoFocus
                        disabled={isLoading}
                      />
                      <p className="text-xs text-gray-400 text-center mt-2">
                        Digite o código de 6 dígitos enviado para seu email
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        disabled={isLoading || verificationCode.length !== 6}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Verificar Conta
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleBackToForm}
                          className="text-gray-500 hover:text-purple-600 text-sm transition-colors flex items-center gap-1"
                        >
                          <ArrowLeft size={12} />
                          Voltar
                        </button>

                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={countdown > 0 || isResending}
                          className="text-purple-600 hover:text-purple-700 text-sm transition-colors flex items-center gap-1"
                        >
                          {isResending ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <RefreshCw size={12} />
                          )}
                          {countdown > 0 
                            ? `Reenviar em ${countdown}s` 
                            : 'Reenviar código'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-500">
                    Já tem conta?{' '}
                    <Link
                      href="/login"
                      className="text-purple-600 font-medium hover:underline"
                    >
                      Fazer Login
                    </Link>
                  </p>
                  
                  <button
                    onClick={openVerifyModal}
                    className="mt-2 text-xs text-purple-500 hover:text-purple-700 transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <Verified size={12} />
                    Já se cadastrou? Verificar minha conta
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} PodFéPlay - Todos os direitos reservados
          </p>
        </div>
      </div>

      <VerifyAccountModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onVerify={handleVerifyExistingUser}
        onResendCode={handleResendCodeForExistingUser}
        isLoading={isVerifying}
        resendCountdown={verifyResendCountdown}
      />
    </>
  );
}