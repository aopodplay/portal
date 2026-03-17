'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, Lock, Mail, User, Eye, EyeOff, Upload } from 'lucide-react';
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
  const { user: authUser, updateUser } = useAuth();
  const [user, setUser] = useState({ id: 0, nome: '', email: '', foto: '' });
  const [senha, setSenha] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removerFoto, setRemoverFoto] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) { setErro('Usuário não autenticado'); setLoading(false); return; }
    const payload = parseJwt(token);
    if (!payload?.id) { setErro('Token inválido'); setLoading(false); return; }

    const fetchUser = async () => {
      try {
        const res = await fetch(getApiUrl(`${API_ENDPOINTS.USUARIOS}/${payload.id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) return setErro(data.error || 'Erro ao carregar perfil');
        setUser({ id: data.id, nome: data.nome, email: data.email, foto: data.foto || '' });
      } catch (err: any) { setErro(err.message || 'Erro inesperado'); }
      finally { setLoading(false); }
    };
    fetchUser();
  }, [token]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setPreview(URL.createObjectURL(file));
    setRemoverFoto(false);
  };

  const handleRemoverFoto = () => {
    setPreview(null);
    setFotoFile(null);
    setRemoverFoto(true);
    setUser({ ...user, foto: '' });
    updateUser({ foto: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null); setSucesso(null);
    if (!token) return setErro('Usuário não autenticado');
    const payload = parseJwt(token);
    if (!payload?.id) return setErro('Token inválido');

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
      try { data = await res.json(); } catch { data = { error: 'O arquivo é muito grande. Máx 2MB.' }; }

      if (!res.ok) return setErro(data.error || 'Erro ao salvar alterações');

      setUser({ ...user, nome: data.nome, email: data.email, foto: data.foto || '' });
      setSenha('');
      setFotoFile(null);
      setPreview(null);
      setRemoverFoto(false);
      setSucesso('Perfil atualizado com sucesso!');

      updateUser({ nome: data.nome, foto: data.foto || '' }); 
    } catch (err: any) { setErro(err.message || 'Erro inesperado'); }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Carregando perfil...</div>;

  const fotoUrl = preview || (user.foto ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/uploads/${user.foto}` : null);
  const inicial = user.nome ? user.nome.charAt(0).toUpperCase() : 'U';

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {erro && (<div className="bg-red-100 text-red-700 p-4 rounded mb-6 flex justify-between items-center shadow">
        <span>{erro}</span>
        <button onClick={() => setErro(null)}><X size={18} /></button>
      </div>)}

      {sucesso && (<div className="bg-green-100 text-green-700 p-4 rounded mb-6 flex justify-between items-center shadow">
        <span>{sucesso}</span>
        <button onClick={() => setSucesso(null)}><CheckCircle size={18} /></button>
      </div>)}

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Perfil do Utilizador</h1>
        <p className="text-gray-500 mt-1">Gerencie suas informações pessoais e segurança da conta</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center">
          {fotoUrl ? (
            <img src={fotoUrl} className="w-24 h-24 rounded-full object-cover mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold mb-4">
              {inicial}
            </div>
          )}
          <h2 className="text-xl font-semibold text-gray-800">{user.nome}</h2>
          <p className="text-gray-500 text-sm mt-1">{user.email}</p>
          <div className="border-t w-full mt-6 pt-4 text-sm text-gray-500">
            <p>ID do utilizador</p>
            <p className="font-semibold text-gray-700">{user.id}</p>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSave} className="space-y-6">

            <h3 className="text-lg font-semibold text-gray-700">Informações Pessoais</h3>
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                <Upload size={18}/> Foto do perfil
              </label>
              <input type="file" accept="image/*" onChange={handleFotoChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
              {(user.foto || preview) && (
                <button type="button" onClick={handleRemoverFoto} className="text-red-600 text-sm mt-2 hover:underline">
                  Remover foto atual
                </button>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-1"><User size={18}/> Nome</label>
              <input type="text" value={user.nome} onChange={(e)=>setUser({...user, nome:e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none" required/>
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-1"><Mail size={18}/> Email</label>
              <input type="email" value={user.email} onChange={(e)=>setUser({...user, email:e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none" required/>
            </div>

            <h3 className="text-lg font-semibold text-gray-700 pt-4 border-t">Segurança</h3>
            <div className="relative">
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-1"><Lock size={18}/> Nova senha</label>
              <input type={mostrarSenha?'text':'password'} value={senha} onChange={e=>setSenha(e.target.value)} placeholder="Deixe vazio para não alterar" className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-400 outline-none"/>
              <button type="button" onClick={()=>setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-11 text-gray-400 hover:text-gray-700">
                {mostrarSenha?<EyeOff size={20}/>:<Eye size={20}/>}
              </button>
            </div>

            <div className="pt-4">
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">
                Salvar alterações
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}