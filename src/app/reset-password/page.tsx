'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Log do token para debug
  useEffect(() => {
    console.log('🔍 Token recebido na URL:', token);
    console.log('🔍 Tamanho do token:', token?.length);
    
    if (!token) {
      setError('Token inválido ou expirado. Solicite uma nova recuperação de senha.');
    } else if (token === 'token123') {
      setError('Token de exemplo inválido. Solicite uma nova recuperação de senha para gerar um token válido.');
    }
  }, [token]);

  const validatePassword = (pass: string) => {
    if (pass.length < 6) {
      return 'A senha deve ter no mínimo 6 caracteres';
    }
    return null;
  };

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
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('🔍 Enviando requisição com token:', token);
      
      const response = await fetch('http://localhost:3000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token,
          newPassword: password 
        })
      });
      
      const data = await response.json();
      console.log('🔍 Resposta do servidor:', data);
      
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <KeyRound size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Redefinir Senha</h2>
            <p className="text-blue-200 mt-2">
              Digite sua nova senha
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-lg text-red-100 text-sm flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Senha Redefinida!</h2>
              <p className="text-blue-200 mb-4">
                Sua senha foi alterada com sucesso.
              </p>
              <p className="text-sm text-blue-200/70 mb-6">
                Redirecionando para o login...
              </p>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div className="bg-green-500 h-2 rounded-full animate-progress"></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Nova Senha
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
                    placeholder="Mínimo 6 caracteres"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-all"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  A senha deve ter no mínimo 6 caracteres
                </p>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Confirmar Nova Senha
                </label>
                <div className={`relative transition-all duration-300 ${focusedField === 'confirm' ? 'transform scale-105' : ''}`}>
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${focusedField === 'confirm' ? 'text-white scale-110' : 'text-blue-300'}`} size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-white placeholder:text-blue-200/50 outline-none"
                    placeholder="Confirme sua nova senha"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-all"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Redefinindo...
                    </>
                  ) : (
                    <>
                      <KeyRound size={18} />
                      Redefinir Senha
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full text-center text-sm text-blue-200 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Voltar para o Login
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-white/20 text-center">
            <p className="text-xs text-blue-200/70">
              © {new Date().getFullYear()} Sistema Óptica - Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}