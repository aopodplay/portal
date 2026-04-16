'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  X, CheckCircle, Lock, Mail, User, Eye, EyeOff, Upload, 
  Camera, Save, AlertCircle, Phone, Calendar, 
  Shield, LogOut, Trash2, ChevronRight
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

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
          created_at: data.created_at || ''
        });
        setNomeTemp(data.nome);
        setEmailTemp(data.email);
      } catch (err: any) { 
        setErro(err.message || 'Erro inesperado'); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchUser();
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
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFotoFile(null);
    setRemoverFoto(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      if (removerFoto) formData.append('removerFoto', 'true');

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
        foto: data.foto || ''
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
    return new Date(data).toLocaleDateString('pt-AO', {
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

  const fotoUrl = preview || (user.foto ? `${process.env.NEXT_PUBLIC_API_URL || 'https://api.apisemsaida.co.ao'}/uploads/${user.foto}` : null);
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
                  className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700"
                >
                  <Camera size={16} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800 mt-4">{user.nome}</h2>
              <div className="mt-2">{getPerfilBadge(user.perfil)}</div>
              <p className="text-gray-500 text-sm mt-2">{user.email}</p>
              
              {(user.foto || preview) && (
                <button onClick={handleRemoverFoto} className="text-red-500 text-sm mt-3 hover:text-red-700 flex items-center gap-1">
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
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNomeTemp(user.nome);
                              setEditandoNome(false);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                            className="text-gray-400 hover:text-indigo-600"
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
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEmailTemp(user.email);
                              setEditandoEmail(false);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                            className="text-gray-400 hover:text-indigo-600"
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
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
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
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {mostrarConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                  onClick={() => {
                    if (confirm('Tem certeza que deseja sair?')) logout();
                  }}
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