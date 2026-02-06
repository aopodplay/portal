'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Paciente {
  id?: number;
  nome: string;
  nif?: string;
  telefone?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPaciente, setNewPaciente] = useState<Partial<Paciente>>({ nome: '', nif: '', telefone: '' });

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'success',
  });

  /* ---------------- BUSCAR PACIENTES ---------------- */
  const fetchPacientes = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.PACIENTES), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setPacientes(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setNotification({ show: true, message: 'Erro ao carregar pacientes', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  /* ---------------- CRIAR PACIENTE ---------------- */
  const handleCreatePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaciente.nome) return;

    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.PACIENTES), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(newPaciente),
      });

      if (!res.ok) throw new Error();

      const created = await res.json();

      setPacientes(prev => [created, ...prev]);
      setIsModalOpen(false);
      setNewPaciente({ nome: '', nif: '', telefone: '' });
      setNotification({ show: true, message: 'Paciente criado com sucesso!', type: 'success' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    } catch (err) {
      console.error(err);
      setNotification({ show: true, message: 'Erro ao criar paciente', type: 'error' });
    }
  };

  /* ---------------- FILTRAGEM E PAGINAÇÃO ---------------- */
  const filteredPacientes = useMemo(() => {
    if (!searchTerm) return pacientes;
    return pacientes.filter(p =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nif && p.nif.includes(searchTerm)) ||
      (p.telefone && p.telefone.includes(searchTerm))
    );
  }, [pacientes, searchTerm]);

  const totalPages = Math.ceil(filteredPacientes.length / itemsPerPage);
  const currentItems = filteredPacientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="p-6">Carregando pacientes...</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <PlusCircle size={20} /> Novo Paciente
        </button>
      </div>

      {/* Notificação */}
      {notification.show && (
        <div className={`p-3 mb-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.message}
        </div>
      )}

      {/* Busca */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nome, NIF ou telefone..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Nome</th>
              <th className="p-4 text-left">NIF</th>
              <th className="p-4 text-left">Telefone</th>
              <th className="p-4 text-left">Criado em</th>
              <th className="p-4 text-left">Atualizado em</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-4">{p.nome}</td>
                <td className="p-4">{p.nif || '-'}</td>
                <td className="p-4">{p.telefone || '-'}</td>
                <td className="p-4">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
                <td className="p-4">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Mostrando {(currentPage - 1) * itemsPerPage + 1} até {Math.min(currentPage * itemsPerPage, filteredPacientes.length)} de {filteredPacientes.length}
        </div>
        <div className="flex gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Próxima</button>
        </div>
      </div>

      {/* Modal Criar Paciente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4">Novo Paciente</h2>
            <form onSubmit={handleCreatePaciente} className="space-y-3">
              <input
                type="text"
                placeholder="Nome"
                required
                value={newPaciente.nome}
                onChange={e => setNewPaciente(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="NIF"
                value={newPaciente.nif}
                onChange={e => setNewPaciente(prev => ({ ...prev, nif: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Telefone"
                value={newPaciente.telefone}
                onChange={e => setNewPaciente(prev => ({ ...prev, telefone: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Criar Paciente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
