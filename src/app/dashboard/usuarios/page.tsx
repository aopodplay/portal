'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: 'admin' | 'recepcao' | 'optometrista' | 'caixa';
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'recepcao',
  ativo: true
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const labelPerfil = (perfil: string) => {
    switch (perfil) {
      case 'admin': return 'Administrador';
      case 'recepcao': return 'Recepção';
      case 'optometrista': return 'Optometrista';
      case 'caixa': return 'Caixa';
      default: return perfil;
    }
  };

  const loadUsuarios = async () => {
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.USUARIOS), { headers: getAuthHeaders() });
      const json = await res.json();
      setUsuarios(json.data || json);
    } catch {
      setMessage('Erro ao carregar usuários');
    }
  };

  useEffect(() => { loadUsuarios(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'ativo' ? e.target.value === '1' : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const url = editId
        ? `${getApiUrl(API_ENDPOINTS.USUARIOS)}/${editId}`
        : getApiUrl(API_ENDPOINTS.USUARIOS);
      const method = editId ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      setMessage(editId ? 'Usuário atualizado' : 'Usuário criado');
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      loadUsuarios();
    } catch {
      setMessage('Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (u: Usuario) => {
    setEditId(u.id);
    setForm({ ...u, senha: '' });
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`${getApiUrl(API_ENDPOINTS.USUARIOS)}/${deleteId}`, {
        method: 'DELETE', headers: getAuthHeaders()
      });
      setDeleteId(null);
      setMessage('Usuário deletado');
      loadUsuarios();
    } catch {
      setMessage('Erro ao eliminar usuário');
    }
  };

  const toggleAtivo = async (u: Usuario) => {
    try {
      const url = `${getApiUrl(API_ENDPOINTS.USUARIOS)}/${u.id}/${u.ativo ? 'desativar' : 'ativar'}`;
      await fetch(url, { method: 'PATCH', headers: getAuthHeaders() });
      loadUsuarios();
    } catch {
      setMessage('Erro ao alterar status');
    }
  };

  return (
    <div className="p-6 w-full flex flex-col md:flex-row gap-6">

      {/* FORM PANEL */}
      {showForm && (
        <div className="w-full md:w-1/3 bg-white p-6 rounded shadow-lg flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{editId ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input name="nome" value={form.nome} onChange={handleChange} placeholder="Nome"
              className="border px-3 py-2 rounded" required />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email"
              className="border px-3 py-2 rounded" required />
            <input name="senha" value={form.senha} onChange={handleChange}
              placeholder={editId ? "Deixe em branco para manter" : "Senha"} type="password"
              className="border px-3 py-2 rounded" {...(!editId && { required: true })} />
            <select name="perfil" value={form.perfil} onChange={handleChange} className="border px-3 py-2 rounded">
              <option value="admin">Administrador</option>
              <option value="recepcao">Recepção</option>
              <option value="optometrista">Optometrista</option>
              <option value="caixa">Caixa</option>
            </select>
            <select name="ativo" value={form.ativo ? '1' : '0'} onChange={handleChange} className="border px-3 py-2 rounded">
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditId(null); }}
                className="px-4 py-2 border rounded">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* USERS GRID */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {usuarios.map(u => (
          <div key={u.id} className="bg-white rounded shadow p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold">{u.nome}</h3>
              <p className="text-sm text-gray-600">{u.email}</p>
              <p className="text-sm">{labelPerfil(u.perfil)}</p>
              <p className={`text-sm font-medium ${u.ativo ? 'text-green-600' : 'text-red-600'}`}>
                {u.ativo ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleEdit(u)} className="flex-1 py-1 bg-blue-600 text-white rounded">Editar</button>
              <button onClick={() => toggleAtivo(u)}
                className={`flex-1 py-1 rounded ${u.ativo ? 'bg-gray-300' : 'bg-green-600 text-white'}`}>
                {u.ativo ? 'Desativar' : 'Ativar'}
              </button>
              <button onClick={() => setDeleteId(u.id)} className="flex-1 py-1 bg-red-600 text-white rounded">Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirmar eliminação</h3>
            <p className="mb-6">Tem certeza que deseja eliminar este usuário?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-6 py-2 border rounded">Cancelar</button>
              <button onClick={confirmDelete} className="px-6 py-2 bg-red-600 text-white rounded">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD BUTTON */}
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg text-lg">
          + Novo Usuário
        </button>
      )}

      {message && (
        <div className="fixed top-6 right-6 p-3 bg-gray-100 rounded border">{message}</div>
      )}
    </div>
  );
}
