// app/forgot-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Headphones,
  Shield,
  AtSign,
  Loader2,
  Send,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

// Componente de máscara de email
const maskEmail = (email: string): string => {
  if (!email) return email;
  if (email.includes('@')) {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 6) return email;
    const firstThree = localPart.substring(0, 3);
    const lastThree = localPart.substring(localPart.length - 3);
    return `${firstThree}***${lastThree}@${domain}`;
  }
  if (email.length <= 6) return email;
  const firstThree = email.substring(0, 3);
  const lastThree = email.substring(email.length - 3);
  return `${firstThree}***${lastThree}`;
};

export default function ForgotPasswordPage() {
  const { forgotPassword, resetPassword, loading: authLoading } = useAuth();
  const router = useRouter();

  // Steps: 1 = Solicitar código, 2 = Redefinir senha
  const [currentStep, setCurrentStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [maskedIdentifier, setMaskedIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Countdown para reenvio
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Atualizar identifier mascarado
  useEffect(() => {
    if (identifier) {
      setMaskedIdentifier(maskEmail(identifier));
    } else {
      setMaskedIdentifier('');
    }
  }, [identifier]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!identifier.trim()) {
      setError('Por favor, insira seu email, telefone ou nome de usuário');
      setIsLoading(false);
      return;
    }

    try {
      await forgotPassword(identifier);
      setSuccessMessage('Código de recuperação enviado! Verifique seu email.');
      setCurrentStep(2);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar código de recuperação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!resetCode || resetCode.length !== 6) {
      setError('Digite o código de 6 dígitos');
      setIsLoading(false);
      return;
    }

    if (!newPassword) {
      setError('Digite a nova senha');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(identifier, resetCode, newPassword);
      setSuccessMessage('Senha redefinida com sucesso! Redirecionando para o login...');
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await forgotPassword(identifier);
      setSuccessMessage('Novo código enviado! Verifique seu email.');
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToRequest = () => {
    setCurrentStep(1);
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 py-8">
      <div className="w-full max-w-md px-4">
        {/* Logo e Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Headphones size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">PodféPlay</h1>
          </div>
          <p className="text-purple-200 text-sm">Recuperação de senha</p>
        </div>

        {/* Card Principal */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="p-6 md:p-8">
            {/* Step 1: Solicitar Código */}
            {currentStep === 1 && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound size={28} className="text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Esqueceu a senha?</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Digite seu email, telefone ou nome de usuário para receber um código de recuperação.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 p-3 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-lg text-green-300 text-sm flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleRequestCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">
                      Email ou Usuário
                    </label>
                    <div className="relative">
                      <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white placeholder:text-gray-400"
                        placeholder="exemplo@email.com / @usuario"
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={isLoading || authLoading}
                  >
                    {isLoading || authLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Enviar código
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: Redefinir Senha */}
            {currentStep === 2 && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail size={28} className="text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Redefinir senha</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Enviamos um código de recuperação para
                  </p>
                  <p className="text-purple-300 font-medium text-sm mt-1">
                    {maskedIdentifier}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 p-3 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-lg text-green-300 text-sm flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">
                      Código de recuperação
                    </label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full text-center text-2xl tracking-[0.5em] py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white/10 text-white placeholder:text-gray-500"
                      placeholder="000000"
                      maxLength={6}
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">
                      Nova senha
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white placeholder:text-gray-400"
                        placeholder="Mínimo 6 caracteres"
                        disabled={isLoading}
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

                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">
                      Confirmar nova senha
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white placeholder:text-gray-400"
                        placeholder="Digite a senha novamente"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={isLoading || authLoading || resetCode.length !== 6}
                  >
                    {isLoading || authLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Redefinindo...
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        Redefinir senha
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleBackToRequest}
                      className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft size={14} />
                      Voltar
                    </button>

                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={countdown > 0}
                      className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                    >
                      {countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar código'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Link para voltar ao login */}
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <Link
                href="/login"
                className="text-sm text-purple-300 hover:text-white transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft size={14} />
                Voltar para o login
              </Link>
              <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-2">
                <Shield size={12} />
                Conteúdo seguro e adequado para toda família
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} PodféPlay - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}