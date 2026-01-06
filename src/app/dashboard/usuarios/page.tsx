'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, X } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface User {
  id?: number;
  nome: string;
  email: string;
  perfil: 'admin' | 'recepcao' | 'optometrista' | 'caixa';
  ativo: boolean;
  senha?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'success'
  });

  const [newUser, setNewUser] = useState<User>({
    nome: '',
    email: '',
    senha: '',
    perfil: 'admin',
    ativo: true
  });

  // Buscar usuários
  const fetchUsers = async () => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.USUARIOS), { headers: getAuthHeaders() });
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Criar usuário
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${getApiUrl(API_ENDPOINTS.USUARIOS)}/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newUser)
      });

      if (!response.ok) throw new Error('Erro ao criar usuário');

      await fetchUsers();
      setIsModalOpen(false);
      setNewUser({ nome: '', email: '', senha: '', perfil: 'admin', ativo: true });
      setNotification({ show: true, message: 'Usuário criado com sucesso!', type: 'success' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);

    } catch (error) {
      console.error(error);
      setNotification({ show: true, message: 'Erro ao criar usuário', type: 'error' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    }
  };

  // Atualizar usuário
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.id) return;

    try {
      const response = await fetch(`${getApiUrl(API_ENDPOINTS.USUARIOS)}/${editingUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingUser)
      });

      if (!response.ok) throw new Error('Erro ao atualizar usuário');

      await fetchUsers();
      setIsEditModalOpen(false);
      setNotification({ show: true, message: 'Usuário atualizado com sucesso!', type: 'success' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);

    } catch (error) {
      console.error(error);
      setNotification({ show: true, message: 'Erro ao atualizar usuário', type: 'error' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    }
  };

  // Deletar usuário
  const handleDeleteUser = async () => {
    if (!userToDelete?.id) return;

    try {
      const response = await fetch(`${getApiUrl(API_ENDPOINTS.USUARIOS)}/${userToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Erro ao excluir usuário');

      await fetchUsers();
      setIsDeleteModalOpen(false);
      setNotification({ show: true, message: 'Usuário deletado com sucesso!', type: 'success' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);

    } catch (error) {
      console.error(error);
      setNotification({ show: true, message: 'Erro ao excluir usuário', type: 'error' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    }
  };

  // Filtragem e paginação
  const filteredUsers = users.filter(user => user.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6">

      {/* Notificação */}
      {notification.show && (
        <div className={`mb-4 p-3 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <PlusCircle size={20} /> Novo Usuário
        </button>
      </div>

      {/* Busca */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar usuários..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Nome</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Perfil</th>
              <th className="p-4 text-left">Ativo</th>
              <th className="p-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((user, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-4">{user.nome}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user.perfil}</td>
                <td className="p-4">{user.ativo ? 'Sim' : 'Não'}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => { setEditingUser(user); setIsEditModalOpen(true); }} className="p-1 hover:text-blue-600"><Edit2 size={18} /></button>
                  <button onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }} className="p-1 hover:text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Mostrando {indexOfFirstItem + 1} até {Math.min(indexOfLastItem, filteredUsers.length)} de {filteredUsers.length}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Prev</button>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
        </div>
      </div>

      {/* Modal Criar Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4">Novo Usuário</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input type="text" required placeholder="Nome" value={newUser.nome} onChange={e => setNewUser({ ...newUser, nome: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              <input type="email" required placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              <input type="password" required placeholder="Senha" value={newUser.senha} onChange={e => setNewUser({ ...newUser, senha: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              <select value={newUser.perfil} onChange={e => setNewUser({ ...newUser, perfil: e.target.value as User['perfil'] })} className="w-full px-4 py-2 border rounded-lg">
                <option value="admin">Admin</option>
                <option value="recepcao">Recepção</option>
                <option value="optometrista">Optometrista</option>
                <option value="caixa">Caixa</option>
              </select>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={newUser.ativo} onChange={e => setNewUser({ ...newUser, ativo: e.target.checked })} />
                <span>Ativo</span>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuário */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4">Editar Usuário</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <input type="text" required value={editingUser.nome} onChange={e => setEditingUser({ ...editingUser, nome: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              <input type="email" required value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              <select value={editingUser.perfil} onChange={e => setEditingUser({ ...editingUser, perfil: e.target.value as User['perfil'] })} className="w-full px-4 py-2 border rounded-lg">
                <option value="admin">Admin</option>
                <option value="recepcao">Recepção</option>
                <option value="optometrista">Optometrista</option>
                <option value="caixa">Caixa</option>
              </select>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editingUser.ativo} onChange={e => setEditingUser({ ...editingUser, ativo: e.target.checked })} />
                <span>Ativo</span>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Excluir Usuário */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
            <p>Tem certeza que deseja excluir <strong>{userToDelete.nome}</strong>?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
              <button onClick={handleDeleteUser} className="px-4 py-2 rounded-lg bg-red-600 text-white">Excluir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
