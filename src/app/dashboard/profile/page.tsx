'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  X, CheckCircle, Lock, Mail, User, Eye, EyeOff, Upload, 
  Camera, Save, AlertCircle, Phone, Calendar, 
  Shield, LogOut, Trash2, ChevronRight, KeyRound
} from 'lucide-react';
import { API_ENDPOINTS, getApiUrl } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

function parseJwt(token: string) {
  try {
    const base64Payload = token.split('.')[1];
    return JSON.parse(atob(base64Payload));
  } catch {
    return null;
  }
}

export default function UserProfile() {
  const { user: authUser, updateUser, logout } = useAuth();
  const [user, setUser] = useState({ 
    id: 0, 
    nome: '', 
    email: '', 
    foto: '',
    perfil: '',
    created_at: ''
  });
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removerFoto, setRemoverFoto] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [editandoNome, setEditandoNome] = useState(false);
  const [editandoEmail, setEditandoEmail] = useState(false);
  const [nomeTemp, setNomeTemp] = useState('');
  const [emailTemp, setEmailTemp] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // 2FA States
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [is2FALoading, setIs2FALoading] = useState(false);
  
  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Buscar dados do usuário
  useEffect(() => {
    if (!token) { 
      setErro('Usuário não autenticado'); 
      setLoading(false); 
      return; 
    }
    
    const payload = parseJwt(token);
    if (!payload?.id) { 
      setErro('Token inválido'); 
      setLoading(false); 
      return; 
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(getApiUrl(`${API_ENDPOINTS.USUARIOS}/${payload.id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) return setErro(data.error || 'Erro ao carregar perfil');
        setUser({ 
          id: data.id, 
          nome: data.nome, 
          email: data.email, 
          foto: data.foto || '',
          perfil: data.perfil || '',
          created_at: data.created_at || data.createdAt || ''
        });
        setNomeTemp(data.nome);
        setEmailTemp(data.email);
        setForgotEmail(data.email);
      } catch (err: any) { 
        setErro(err.message || 'Erro inesperado'); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchUser();
  }, [token]);

  // Buscar status do 2FA
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl('/auth/2fa-status'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setTwoFactorEnabled(data.twoFactorEnabled);
        }
      } catch (err) {
        console.error('Erro ao buscar status 2FA:', err);
      }
    };
    
    if (token) {
      fetch2FAStatus();
    }
  }, [token]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      setErro('A imagem deve ter no máximo 2MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setErro('Por favor, selecione uma imagem válida');
      return;
    }
    
    setFotoFile(file);
    setPreview(URL.createObjectURL(file));
    setRemoverFoto(false);
  };

  const handleRemoverFoto = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setFotoFile(null);
    setRemoverFoto(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUser(prev => ({ ...prev, foto: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null); 
    setSucesso(null);
    
    if (!token) return setErro('Usuário não autenticado');
    const payload = parseJwt(token);
    if (!payload?.id) return setErro('Token inválido');

    if (senha && senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }
    
    if (senha && senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('nome', user.nome);
      formData.append('email', user.email);
      if (senha) formData.append('senha', senha);
      if (fotoFile) formData.append('foto', fotoFile);
      if (removerFoto) {
        formData.append('removerFoto', 'true');
      }

      const res = await fetch(getApiUrl(`${API_ENDPOINTS.USUARIOS}/${payload.id}`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      let data;
      try { 
        data = await res.json(); 
      } catch { 
        data = { error: 'Erro ao processar resposta' }; 
      }

      if (!res.ok) return setErro(data.error || 'Erro ao salvar alterações');

      setUser({ 
        ...user, 
        nome: data.nome, 
        email: data.email, 
        foto: data.foto || '',
        created_at: data.created_at || user.created_at
      });
      setSenha('');
      setConfirmarSenha('');
      setFotoFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setRemoverFoto(false);
      setSucesso('Perfil atualizado com sucesso!');

      updateUser({ nome: data.nome, foto: data.foto || '' });
      
      setEditandoNome(false);
      setEditandoEmail(false);
      
    } catch (err: any) { 
      setErro(err.message || 'Erro inesperado'); 
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  // Funções de Recuperação de Senha
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotLoading(true);
    setErro(null);

    try {
      const response = await fetch(getApiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar email');
      }

      setSucesso('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Funções 2FA
  const handleEnable2FA = async () => {
    setIs2FALoading(true);
    setErro(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/auth/enable-2fa'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setShow2FAModal(true);
      } else {
        setErro(data.error || 'Erro ao habilitar 2FA');
      }
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setErro('Digite o código de 6 dígitos');
      return;
    }
    
    setIs2FALoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/auth/verify-2fa'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token: twoFactorCode })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSucesso('2FA ativado com sucesso!');
        setShow2FAModal(false);
        setTwoFactorEnabled(true);
        setTwoFactorCode('');
      } else {
        setErro(data.error || 'Erro ao verificar código');
      }
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    const code = prompt('Digite o código do seu aplicativo autenticador para desativar o 2FA:');
    if (!code || code.length !== 6) {
      setErro('Código inválido');
      return;
    }
    
    setIs2FALoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/auth/disable-2fa'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token: code })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSucesso('2FA desativado com sucesso!');
        setTwoFactorEnabled(false);
      } else {
        setErro(data.error || 'Erro ao desativar 2FA');
      }
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setIs2FALoading(false);
    }
  };

  const getPerfilBadge = (perfil: string) => {
    const perfis: Record<string, { label: string; color: string }> = {
      admin: { label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
      optometrista: { label: 'Optometrista', color: 'bg-blue-100 text-blue-700' },
      caixa: { label: 'Caixa', color: 'bg-green-100 text-green-700' },
      recepcao: { label: 'Receção', color: 'bg-yellow-100 text-yellow-700' }
    };
    const p = perfis[perfil?.toLowerCase()] || { label: perfil || 'Usuário', color: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.color}`}>{p.label}</span>;
  };

  const formatarData = (data: string) => {
    if (!data) return 'Não disponível';
    const date = new Date(data);
    if (isNaN(date.getTime())) return 'Não disponível';
    return date.toLocaleDateString('pt-AO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const fotoUrl = preview || (user.foto ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/uploads/${user.foto}` : null);
  const inicial = user.nome ? user.nome.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-800">Meu Perfil</h1>
          <p className="text-gray-500 mt-1">Gerencie suas informações pessoais e segurança da conta</p>
        </div>

        {/* Mensagens */}
        {erro && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 flex justify-between items-center">
            <div className="flex items-center gap-2"><AlertCircle size={18} /> <span>{erro}</span></div>
            <button onClick={() => setErro(null)} className="hover:bg-red-200 rounded-lg p-1"><X size={18} /></button>
          </div>
        )}

        {sucesso && (
          <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6 flex justify-between items-center">
            <div className="flex items-center gap-2"><CheckCircle size={18} /> <span>{sucesso}</span></div>
            <button onClick={() => setSucesso(null)} className="hover:bg-green-200 rounded-lg p-1"><X size={18} /></button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Coluna da Foto */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center">
              <div className="relative group">
                {fotoUrl ? (
                  <img src={fotoUrl} alt={user.nome} className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100" />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-3xl font-bold border-4 border-indigo-100">
                    {inicial}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
                >
                  <Camera size={16} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800 mt-4">{user.nome}</h2>
              <div className="mt-2">{getPerfilBadge(user.perfil)}</div>
              <p className="text-gray-500 text-sm mt-2">{user.email}</p>
              
              {(user.foto || preview) && (
                <button 
                  onClick={handleRemoverFoto} 
                  className="text-red-500 text-sm mt-3 hover:text-red-700 flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={14} /> Remover foto
                </button>
              )}
              
              <div className="border-t w-full mt-6 pt-4">
                <div className="text-sm text-gray-500">ID do utilizador</div>
                <div className="font-semibold text-gray-700">#{user.id}</div>
              </div>
              
              <div className="border-t w-full mt-4 pt-4">
                <div className="text-sm text-gray-500">Membro desde</div>
                <div className="font-semibold text-gray-700 flex items-center gap-1">
                  <Calendar size={14} /> {formatarData(user.created_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna do Formulário */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSave} className="space-y-8">
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User size={20} /> Informações Pessoais
                </h3>
                <div className="space-y-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Nome completo</label>
                    <div className="flex items-center gap-2">
                      {editandoNome ? (
                        <>
                          <input
                            type="text"
                            value={nomeTemp}
                            onChange={(e) => setNomeTemp(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUser({ ...user, nome: nomeTemp });
                              setEditandoNome(false);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNomeTemp(user.nome);
                              setEditandoNome(false);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                          <span className="text-gray-800">{user.nome}</span>
                          <button
                            type="button"
                            onClick={() => setEditandoNome(true)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Email</label>
                    <div className="flex items-center gap-2">
                      {editandoEmail ? (
                        <>
                          <input
                            type="email"
                            value={emailTemp}
                            onChange={(e) => setEmailTemp(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUser({ ...user, email: emailTemp });
                              setEditandoEmail(false);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEmailTemp(user.email);
                              setEditandoEmail(false);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                          <span className="text-gray-800">{user.email}</span>
                          <button
                            type="button"
                            onClick={() => setEditandoEmail(true)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Segurança */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield size={20} /> Segurança
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-gray-700 font-medium mb-2">Nova senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Deixe vazio para não alterar"
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {senha && (
                    <div className="relative">
                      <label className="block text-gray-700 font-medium mb-2">Confirmar nova senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                          type={mostrarConfirmarSenha ? 'text' : 'password'}
                          value={confirmarSenha}
                          onChange={(e) => setConfirmarSenha(e.target.value)}
                          placeholder="Confirme sua nova senha"
                          className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {mostrarConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Botão Esqueceu a Senha */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <Lock size={14} />
                      Esqueceu a senha?
                    </button>
                  </div>
                </div>
              </div>

              {/* Seção 2FA */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <KeyRound size={20} /> Autenticação de Dois Fatores (2FA)
                </h3>
                
                {!twoFactorEnabled ? (
                  <div className="space-y-4">
                    <p className="text-gray-600 text-sm">
                      Aumente a segurança da sua conta habilitando a autenticação de dois fatores.
                      Você precisará de um aplicativo como Google Authenticator ou Microsoft Authenticator.
                    </p>
                    <button
                      type="button"
                      onClick={handleEnable2FA}
                      disabled={is2FALoading}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {is2FALoading ? 'Processando...' : 'Ativar 2FA'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-700 text-sm flex items-center gap-2">
                        <CheckCircle size={16} />
                        2FA está ativado na sua conta. Toda vez que fizer login, precisará do código do seu aplicativo autenticador.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisable2FA}
                      disabled={is2FALoading}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {is2FALoading ? 'Processando...' : 'Desativar 2FA'}
                    </button>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Salvar alterações
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="px-6 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={18} /> Sair
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                As alterações serão aplicadas imediatamente após salvar.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Confirmar saída</h3>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600">
                Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente para acessar o sistema.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <LogOut size={18} /> Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recuperação de Senha */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Recuperar Senha</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="text-blue-600" size={28} />
                </div>
                <p className="text-gray-600 text-sm">
                  Digite seu email para receber instruções de recuperação de senha.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isForgotLoading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isForgotLoading ? 'Enviando...' : 'Enviar Instruções'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Configuração 2FA */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Configurar 2FA</h3>
              <button
                onClick={() => {
                  setShow2FAModal(false);
                  setTwoFactorCode('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                1. Instale o Google Authenticator ou Microsoft Authenticator no seu celular.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">2. Escaneie o QR Code abaixo:</p>
                {qrCode && (
                  <img src={qrCode} alt="QR Code para 2FA" className="mx-auto w-48 h-48" />
                )}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">3. Ou digite este código manualmente:</p>
                <code className="block text-center font-mono text-lg font-bold bg-white p-2 rounded border">
                  {secret}
                </code>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  4. Digite o código de verificação:
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-center text-2xl tracking-widest focus:ring-2 focus:ring-indigo-400 outline-none"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </div>
              
              <button
                onClick={handleVerify2FA}
                disabled={is2FALoading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {is2FALoading ? 'Verificando...' : 'Ativar 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

// Componente Edit (ícone de edição)
function Edit({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 3l4 4-7 7H10v-4l7-7z" />
      <path d="M4 20h16" />
    </svg>
  );
}