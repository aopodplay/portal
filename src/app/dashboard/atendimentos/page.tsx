'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Paciente {
  id?: number;
  nome: string;
  nif?: string;
}

interface Atendimento {
  id?: number;
  paciente_id: number;
  usuario_id?: number;
  status: 'aguardando' | 'em_consulta' | 'consulta_concluida' | 'em_faturacao' | 'finalizado';
  data_entrada: string;
  data_saida?: string;
  paciente?: Paciente;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function AtendimentosPage() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | undefined>(undefined);
  const [pacienteSearch, setPacienteSearch] = useState('');

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'success',
  });

  /* ---------------- BUSCAR PACIENTES ---------------- */
  const fetchPacientes = async () => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.PACIENTES), {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setPacientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  /* ---------------- BUSCAR ATENDIMENTOS ---------------- */
  const fetchAtendimentos = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.ATENDIMENTOS), {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setAtendimentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacientes();
    fetchAtendimentos();
  }, []);

  /* ---------------- CRIAR ATENDIMENTO ---------------- */
  const handleCreateAtendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPacienteId) return;

    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.ATENDIMENTOS + '/abrir'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente_id: selectedPacienteId }),
      });

      if (!response.ok) throw new Error();

      await fetchAtendimentos();
      setIsModalOpen(false);
      setSelectedPacienteId(undefined);
      setPacienteSearch('');
      setNotification({ show: true, message: 'Atendimento aberto com sucesso!', type: 'success' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    } catch {
      setNotification({ show: true, message: 'Erro ao abrir atendimento', type: 'error' });
    }
  };

  /* ---------------- ALTERAR STATUS ---------------- */
  const handleChangeStatus = async (id: number, novoStatus: Atendimento['status']) => {
    try {
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.ATENDIMENTOS}/${id}/status`), {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (!response.ok) throw new Error();

      await fetchAtendimentos();
      setNotification({ show: true, message: 'Status atualizado com sucesso!', type: 'success' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    } catch {
      setNotification({ show: true, message: 'Erro ao atualizar status', type: 'error' });
    }
  };

  /* ---------------- ENVIAR PARA FATURA ---------------- */
  const handleEnviarParaFaturacao = async (atendimento: Atendimento) => {
    try {
      // 1️⃣ Atualiza status do atendimento
      const statusResponse = await fetch(getApiUrl(`${API_ENDPOINTS.ATENDIMENTOS}/${atendimento.id}/status`), {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'em_faturacao' }),
      });
      if (!statusResponse.ok) throw new Error();

      // 2️⃣ Cria fatura
      const faturaResponse = await fetch(getApiUrl(API_ENDPOINTS.FATURAS), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atendimento_id: atendimento.id,
          paciente_id: atendimento.paciente_id,
          valor: 0 // Pode ajustar o valor conforme sua regra
        }),
      });
      if (!faturaResponse.ok) throw new Error();

      await fetchAtendimentos();
      setNotification({ show: true, message: 'Atendimento enviado para faturação!', type: 'success' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    } catch {
      setNotification({ show: true, message: 'Erro ao enviar para faturação', type: 'error' });
    }
  };

  /* ---------------- FILTRAGEM E PAGINAÇÃO ---------------- */
  const filteredAtendimentos = useMemo(
    () =>
      atendimentos.filter(a =>
        a.paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [atendimentos, searchTerm]
  );

  const totalPages = Math.ceil(filteredAtendimentos.length / itemsPerPage);
  const currentItems = filteredAtendimentos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredPacientes = useMemo(() => {
    if (!pacienteSearch) return pacientes;
    return pacientes.filter(
      p =>
        p.nome.toLowerCase().includes(pacienteSearch.toLowerCase()) ||
        (p.nif && p.nif.includes(pacienteSearch))
    );
  }, [pacientes, pacienteSearch]);

  if (loading) return <div className="p-6">Carregando atendimentos...</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Atendimentos</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <PlusCircle size={20} /> Novo Atendimento
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
        <input type="text" placeholder="Buscar por paciente..." value={searchTerm}
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
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Data Entrada</th>
              <th className="p-4 text-left">Data Saída</th>
              <th className="p-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="p-4">{a.paciente?.nome}</td>
                <td className="p-4">{a.status}</td>
                <td className="p-4">{a.data_entrada?.split('T')[0]}</td>
                <td className="p-4">{a.data_saida ? a.data_saida.split('T')[0] : '-'}</td>
                <td className="p-4 flex gap-2">
                  {a.status === 'aguardando' && (
                    <button onClick={() => handleChangeStatus(a.id!, 'em_consulta')} className="px-2 py-1 bg-yellow-400 text-white rounded">Iniciar Consulta</button>
                  )}
                  {a.status === 'em_consulta' && (
                    <button onClick={() => handleChangeStatus(a.id!, 'consulta_concluida')} className="px-2 py-1 bg-blue-500 text-white rounded">Concluir Consulta</button>
                  )}
                  {a.status === 'consulta_concluida' && (
                    <button onClick={() => handleEnviarParaFaturacao(a)} className="px-2 py-1 bg-purple-500 text-white rounded">Enviar para Faturação</button>
                  )}
                  {a.status === 'em_faturacao' && (
                    <button onClick={() => handleChangeStatus(a.id!, 'finalizado')} className="px-2 py-1 bg-green-600 text-white rounded">Finalizar Atendimento</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Mostrando {(currentPage - 1) * itemsPerPage + 1} até {Math.min(currentPage * itemsPerPage, filteredAtendimentos.length)} de {filteredAtendimentos.length}
        </div>
        <div className="flex gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Próxima</button>
        </div>
      </div>

      {/* Modal Criar Atendimento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4">Novo Atendimento</h2>
            <form onSubmit={handleCreateAtendimento} className="space-y-3">
              <input
                type="text"
                placeholder="Buscar paciente por nome ou NIF..."
                value={pacienteSearch}
                onChange={e => setPacienteSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
              <select required value={selectedPacienteId || ''} onChange={e => setSelectedPacienteId(Number(e.target.value))} className="w-full px-3 py-2 border rounded">
                <option value="">Selecione o paciente</option>
                {filteredPacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} {p.nif ? `- ${p.nif}` : ''}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Abrir Atendimento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
