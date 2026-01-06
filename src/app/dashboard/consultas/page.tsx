'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, X } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Paciente {
  id: number;
  nome: string;
  nif?: string;
}

interface Consulta {
  id?: number;
  paciente: Paciente;
  atendimento_id?: number | null;
  od_esferico?: string;
  od_cilindrico?: string;
  od_eixo?: string;
  oe_esferico?: string;
  oe_cilindrico?: string;
  oe_eixo?: string;
  adicao?: string;
  dnp?: string;
  diagnostico?: string;
  observacoes?: string;
  data_consulta?: string;
  created_at?: string;
  updated_at?: string;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function ConsultasPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null);
  const [consultaToDelete, setConsultaToDelete] = useState<Consulta | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'success',
  });

  const [newConsulta, setNewConsulta] = useState<Consulta>({
    paciente: { id: 0, nome: '', nif: '' },
    atendimento_id: null,
    od_esferico: '',
    od_cilindrico: '',
    od_eixo: '',
    oe_esferico: '',
    oe_cilindrico: '',
    oe_eixo: '',
    adicao: '',
    dnp: '',
    diagnostico: '',
    observacoes: '',
    data_consulta: '',
  });

  /* ---------------- FETCH CONSULTAS ---------------- */
  const fetchConsultas = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.CONSULTAS), { headers: getAuthHeaders() });
      const data = await res.json();
      setConsultas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setNotification({ show: true, message: 'Erro ao carregar consultas', type: 'error' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FETCH PACIENTES ---------------- */
  const fetchPacientes = async () => {
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.PACIENTES), { headers: getAuthHeaders() });
      const data = await res.json();
      setPacientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setNotification({ show: true, message: 'Erro ao carregar pacientes', type: 'error' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    }
  };

  useEffect(() => {
    fetchConsultas();
    fetchPacientes();
  }, []);

  /* ---------------- CREATE ---------------- */
  const handleCreateConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newConsulta.paciente.id) {
        setNotification({ show: true, message: 'Selecione um paciente', type: 'error' });
        return;
      }

      const payload = { ...newConsulta, paciente_id: newConsulta.paciente.id };
      const res = await fetch(getApiUrl(API_ENDPOINTS.CONSULTAS), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao criar consulta');

      await fetchConsultas();
      setIsModalOpen(false);
      setNewConsulta({ paciente: { id: 0, nome: '', nif: '' } });
      setNotification({ show: true, message: 'Consulta criada com sucesso!', type: 'success' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    } catch (error) {
      console.error(error);
      setNotification({ show: true, message: 'Erro ao criar consulta', type: 'error' });
    }
  };

  /* ---------------- UPDATE ---------------- */
  const handleUpdateConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConsulta?.id) return;

    try {
      const payload = { ...editingConsulta, paciente_id: editingConsulta.paciente.id };
      const res = await fetch(`${getApiUrl(API_ENDPOINTS.CONSULTAS)}/${editingConsulta.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao atualizar consulta');

      await fetchConsultas();
      setIsEditModalOpen(false);
      setEditingConsulta(null);
      setNotification({ show: true, message: 'Consulta atualizada com sucesso!', type: 'success' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    } catch (error) {
      console.error(error);
      setNotification({ show: true, message: 'Erro ao atualizar consulta', type: 'error' });
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDeleteConsulta = async () => {
    if (!consultaToDelete?.id) return;
    try {
      const res = await fetch(`${getApiUrl(API_ENDPOINTS.CONSULTAS)}/${consultaToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok && res.status !== 204) throw new Error('Erro ao deletar');

      await fetchConsultas();
      setIsDeleteModalOpen(false);
      setConsultaToDelete(null);
      setNotification({ show: true, message: 'Consulta excluída com sucesso!', type: 'success' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    } catch (error) {
      console.error(error);
      setNotification({ show: true, message: 'Erro ao excluir consulta', type: 'error' });
    }
  };

  /* ---------------- FILTRAGEM E PAGINAÇÃO ---------------- */
  const filteredConsultas = consultas.filter(c =>
    c.paciente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.diagnostico ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredConsultas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredConsultas.length / itemsPerPage);

  if (loading) return <div className="p-6">Carregando consultas...</div>;

  /* ---------------- FUNÇÃO AUXILIAR PACIENTES FILTRADOS ---------------- */
  const filteredPacientes = (query: string) => {
    return pacientes.filter(p =>
      p.nome.toLowerCase().includes(query.toLowerCase()) ||
      (p.nif ?? '').includes(query)
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Consultas</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusCircle size={20} /> Nova Consulta
        </button>
      </div>

      {/* Notificação */}
      {notification.show && (
        <div
          className={`p-3 mb-4 rounded ${
            notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Busca global */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por paciente ou diagnóstico..."
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
              <th className="p-4 text-left">Paciente</th>
              <th className="p-4 text-left">Data</th>
              <th className="p-4 text-left">Diagnóstico</th>
              <th className="p-4 text-left">Observações</th>
              <th className="p-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((c, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-4">{c.paciente.nome}</td>
                <td className="p-4">{c.data_consulta?.split('T')[0]}</td>
                <td className="p-4">{c.diagnostico}</td>
                <td className="p-4">{c.observacoes}</td>
                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => { setEditingConsulta({ ...c, paciente: c.paciente }); setIsEditModalOpen(true); }}
                    className="p-1 hover:text-blue-600"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => { setConsultaToDelete({ ...c, paciente: c.paciente }); setIsDeleteModalOpen(true); }}
                    className="p-1 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Mostrando {indexOfFirstItem + 1} até {Math.min(indexOfLastItem, filteredConsultas.length)} de {filteredConsultas.length}
        </div>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      </div>

      {/* ---------------- MODAL CRIAR ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold mb-4">Nova Consulta</h2>
            <form onSubmit={handleCreateConsulta} className="space-y-3">
              {/* Input de busca paciente */}
              <input
                type="text"
                placeholder="Digite nome ou NIF do paciente..."
                value={newConsulta.paciente.nome}
                onChange={e => setNewConsulta({ ...newConsulta, paciente: { id: 0, nome: e.target.value } })}
                className="w-full px-3 py-2 border rounded"
              />
              {/* Lista filtrada */}
              {newConsulta.paciente.nome && (
                <ul className="border rounded max-h-40 overflow-auto mt-1 bg-white">
                  {filteredPacientes(newConsulta.paciente.nome).map(p => (
                    <li
                      key={p.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setNewConsulta({ ...newConsulta, paciente: p })}
                    >
                      {p.nome} {p.nif ? `(${p.nif})` : ''}
                    </li>
                  ))}
                </ul>
              )}

              <select
                value={newConsulta.paciente.id}
                onChange={e => {
                  const selected = pacientes.find(p => p.id === Number(e.target.value));
                  if (selected) setNewConsulta({ ...newConsulta, paciente: selected });
                }}
                className="w-full px-3 py-2 border rounded"
              >
                <option value={0}>Selecione o paciente</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} {p.nif ? `(${p.nif})` : ''}</option>
                ))}
              </select>

              <input
                type="date"
                value={newConsulta.data_consulta?.split('T')[0] || ''}
                onChange={e => setNewConsulta({ ...newConsulta, data_consulta: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Diagnóstico"
                value={newConsulta.diagnostico}
                onChange={e => setNewConsulta({ ...newConsulta, diagnostico: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Observações"
                value={newConsulta.observacoes}
                onChange={e => setNewConsulta({ ...newConsulta, observacoes: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL EDITAR ---------------- */}
      {isEditModalOpen && editingConsulta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold mb-4">Editar Consulta</h2>
            <form onSubmit={handleUpdateConsulta} className="space-y-3">
              <input
                type="text"
                placeholder="Digite nome ou NIF do paciente..."
                value={editingConsulta.paciente.nome}
                onChange={e => setEditingConsulta({ ...editingConsulta, paciente: { id: 0, nome: e.target.value } })}
                className="w-full px-3 py-2 border rounded"
              />
              {editingConsulta.paciente.nome && (
                <ul className="border rounded max-h-40 overflow-auto mt-1 bg-white">
                  {filteredPacientes(editingConsulta.paciente.nome).map(p => (
                    <li
                      key={p.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setEditingConsulta({ ...editingConsulta, paciente: p })}
                    >
                      {p.nome} {p.nif ? `(${p.nif})` : ''}
                    </li>
                  ))}
                </ul>
              )}

              <select
                value={editingConsulta.paciente.id}
                onChange={e => {
                  const selected = pacientes.find(p => p.id === Number(e.target.value));
                  if (selected) setEditingConsulta({ ...editingConsulta, paciente: selected });
                }}
                className="w-full px-3 py-2 border rounded"
              >
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} {p.nif ? `(${p.nif})` : ''}</option>
                ))}
              </select>

              <input
                type="date"
                value={editingConsulta.data_consulta?.split('T')[0] || ''}
                onChange={e => setEditingConsulta({ ...editingConsulta, data_consulta: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Diagnóstico"
                value={editingConsulta.diagnostico}
                onChange={e => setEditingConsulta({ ...editingConsulta, diagnostico: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Observações"
                value={editingConsulta.observacoes}
                onChange={e => setEditingConsulta({ ...editingConsulta, observacoes: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL EXCLUIR ---------------- */}
      {isDeleteModalOpen && consultaToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
            <p>
              Tem certeza que deseja excluir a consulta de <strong>{consultaToDelete.paciente.nome}</strong>?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 border rounded">
                Cancelar
              </button>
              <button onClick={handleDeleteConsulta} className="px-4 py-2 bg-red-600 text-white rounded">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
