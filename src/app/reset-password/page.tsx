'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, KeyRound, Shield } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  // Função para validar senha forte (mínimo 6 caracteres)
  const validateStrongPassword = (pass: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return regex.test(pass);
  };

  // Validar força da senha em tempo real
  useEffect(() => {
    if (password) {
      setPasswordStrength({
        hasMinLength: password.length >= 6,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[@$!%*?&]/.test(password)
      });
    } else {
      setPasswordStrength({
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
      });
    }
  }, [password]);

  // Calcular força da senha (0-100)
  const calculatePasswordStrength = () => {
    const requirements = Object.values(passwordStrength);
    const metCount = requirements.filter(Boolean).length;
    return (metCount / 5) * 100;
  };

  // Obter nível da força da senha
  const getStrengthLevel = () => {
    const strength = calculatePasswordStrength();
    const metCount = Object.values(passwordStrength).filter(Boolean).length;
    
    if (metCount === 0) return { text: '', color: 'bg-gray-500', textColor: 'text-gray-400' };
    if (metCount <= 2) return { text: 'Fraca', color: 'bg-red-500', textColor: 'text-red-400' };
    if (metCount <= 3) return { text: 'Média', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
    if (metCount <= 4) return { text: 'Forte', color: 'bg-blue-500', textColor: 'text-blue-400' };
    return { text: 'Muito Forte', color: 'bg-green-500', textColor: 'text-green-400' };
  };

  // Obter cor da barra de força
  const getStrengthColor = () => {
    const level = getStrengthLevel();
    return level.color;
  };

  // Verificar se o botão deve estar desabilitado
  const isSubmitDisabled = (): boolean => {
    if (isLoading) return true;
    if (!password || !confirmPassword) return true;
    if (password !== confirmPassword) return true;
    if (!validateStrongPassword(password)) return true;
    return false;
  };

  // Log do token para debug
  useEffect(() => {
    if (!token) {
      setError('Token inválido ou expirado. Solicite uma nova recuperação de senha.');
    } else if (token === 'token123') {
      setError('Token de exemplo inválido. Solicite uma nova recuperação de senha para gerar um token válido.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
      setError('Token não encontrado. Solicite uma nova recuperação de senha.');
      return;
    }
    
    if (token === 'token123') {
      setError('Token de exemplo inválido. Por favor, solicite uma nova recuperação de senha.');
      return;
    }
    
    if (!validateStrongPassword(password)) {
      setError('A senha deve ter no mínimo 6 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&)');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token,
          newPassword: password 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha');
      }
      
      setSuccess(true);
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const strengthLevel = getStrengthLevel();
  const strengthPercent = calculatePasswordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <KeyRound size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Redefinir Senha</h2>
            <p className="text-blue-200 text-sm mt-1">
              Digite sua nova senha segura
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-lg text-red-100 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Senha Redefinida!</h2>
              <p className="text-blue-200 text-sm mb-4">
                Sua senha foi alterada com sucesso.
              </p>
              <p className="text-xs text-blue-200/70 mb-4">
                Redirecionando para o login...
              </p>
              <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div className="bg-green-500 h-1.5 rounded-full animate-progress"></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Nova Senha */}
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-white placeholder:text-blue-200/50 outline-none text-sm"
                    placeholder="Digite sua nova senha"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-all"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Indicador de força da senha */}
                {password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-200">Força da senha:</span>
                      <span className={`font-semibold ${strengthLevel.textColor}`}>
                        {strengthLevel.text}
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${strengthPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Campo Confirmar Senha */}
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={16} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-white placeholder:text-blue-200/50 outline-none text-sm"
                    placeholder="Confirme sua senha"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-all"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">As senhas não coincidem</p>
                )}
                {confirmPassword && password === confirmPassword && validateStrongPassword(password) && (
                  <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle size={12} /> Senhas coincidem
                  </p>
                )}
              </div>

              {/* Requisitos de segurança - versão compacta */}
              <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-blue-200 text-xs mb-1.5">
                  <Shield size={12} />
                  <span className="font-semibold">Requisitos de segurança:</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.hasMinLength ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className={passwordStrength.hasMinLength ? 'text-green-300' : 'text-gray-400'}>
                      Mínimo 6 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.hasUpperCase ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className={passwordStrength.hasUpperCase ? 'text-green-300' : 'text-gray-400'}>
                      Letra maiúscula
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.hasLowerCase ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className={passwordStrength.hasLowerCase ? 'text-green-300' : 'text-gray-400'}>
                      Letra minúscula
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.hasNumber ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className={passwordStrength.hasNumber ? 'text-green-300' : 'text-gray-400'}>
                      Número
                    </span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.hasSpecialChar ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className={passwordStrength.hasSpecialChar ? 'text-green-300' : 'text-gray-400'}>
                      Caractere especial (@$!%*?&)
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <button
                type="submit"
                disabled={isSubmitDisabled()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Redefinindo...</span>
                  </div>
                ) : (
                  <span>Redefinir Senha</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full text-center text-xs text-blue-200 hover:text-white transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft size={14} />
                Voltar para o Login
              </button>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-white/20 text-center">
            <p className="text-[11px] text-blue-200/70">
              © {new Date().getFullYear()} Sistema Óptica
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-progress {
          animation: progress 3s linear forwards;
        }
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}