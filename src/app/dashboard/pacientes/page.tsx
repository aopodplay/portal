'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Search, X } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Paciente {
  id?: number;
  nome: string;
  nif?: string;
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPaciente, setNewPaciente] = useState<Partial<Paciente>>({
    nome: '',
    nif: '',
    telefone: '',
    data_nascimento: '',
    endereco: ''
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  /* ---------------- FETCH ---------------- */
  const fetchPacientes = async () => {
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.PACIENTES), {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Erro ao carregar pacientes');

      const data = await res.json();

      if (Array.isArray(data)) setPacientes(data);
      else if (Array.isArray(data.data)) setPacientes(data.data);
      else setPacientes([]);

    } catch (err) {
      console.error(err);
      setError('Erro ao carregar pacientes');
      setPacientes([]);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  /* ---------------- CREATE ---------------- */
  const handleCreatePaciente = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setError(null);
    setDuplicateError(null);

    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.PACIENTES), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPaciente),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error?.toLowerCase().includes('nome')) {
          setDuplicateError('Já existe um paciente com este nome.');
          return;
        }
        if (data?.error?.toLowerCase().includes('nif')) {
          setDuplicateError('Já existe um paciente com este NIF.');
          return;
        }
        throw new Error(data?.error || 'Erro ao criar paciente');
      }

      setPacientes(prev => (prev ? [data.data, ...prev] : [data.data]));
      setIsModalOpen(false);
      setCurrentPage(1);

      setNewPaciente({
        nome: '',
        nif: '',
        telefone: '',
        data_nascimento: '',
        endereco: ''
      });

      setMessage('Paciente criado com sucesso');
      setTimeout(() => setMessage(null), 3000);

    } catch (err: any) {
      setError(err.message || 'Erro ao criar paciente');
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- FILTRO ---------------- */
  const filtered = useMemo(() => {
    if (!pacientes) return [];
    if (!searchTerm) return pacientes;

    const t = searchTerm.toLowerCase();
    return pacientes.filter(p =>
      p.nome.toLowerCase().includes(t) ||
      p.nif?.includes(t) ||
      p.telefone?.includes(t) ||
      p.endereco?.toLowerCase().includes(t)
    );
  }, [pacientes, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isNifValid = /^[0-9]{9}[A-Z]{2}[0-9]{3}$/.test(newPaciente.nif || '');
  const isTelefoneValid = /^9[0-9]{8}$/.test(newPaciente.telefone || '');

  /* ---------------- LOADING ---------------- */
  if (pacientes === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span>Carregando pacientes...</span>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">

      <h1 className="text-2xl font-bold mb-6">Pacientes</h1>

      {/* ALERTAS */}
      {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{message}</div>}
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {/* BUSCA + BOTÃO */}
      <div className="bg-white p-4 rounded shadow mb-6 flex justify-between items-center">
        <div className="relative w-96">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded"
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          <PlusCircle size={18} />
          Novo Paciente
        </button>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">NIF</th>
              <th className="p-3 text-left">Telefone</th>
              <th className="p-3 text-left">Data Nasc.</th>
              <th className="p-3 text-left">Endereço</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((p, index) => (
              <tr key={p.id ?? index} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{p.nome}</td>
                <td className="p-3">{p.nif || '-'}</td>
                <td className="p-3">{p.telefone || '-'}</td>
                <td className="p-3">
                  {p.data_nascimento
                    ? new Date(p.data_nascimento).toLocaleDateString()
                    : '-'}
                </td>
                <td className="p-3">{p.endereco || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINAÇÃO RESTAURADA */}
      <div className="mt-4 bg-white p-4 rounded shadow flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Página {currentPage} de {totalPages}
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

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded p-6 w-full max-w-md relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">Novo Paciente</h2>

            {duplicateError && (
              <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">
                {duplicateError}
              </div>
            )}

            <form onSubmit={handleCreatePaciente} className="space-y-3">

              <input
                placeholder="Nome"
                required
                value={newPaciente.nome}
                onChange={e =>
                  setNewPaciente(p => ({ ...p, nome: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded"
              />

              <input
                type="date"
                value={newPaciente.data_nascimento || ''}
                onChange={e =>
                  setNewPaciente(p => ({
                    ...p,
                    data_nascimento: e.target.value
                  }))
                }
                className="w-full px-3 py-2 border rounded"
              />

              <input
                placeholder="Endereço"
                value={newPaciente.endereco}
                onChange={e =>
                  setNewPaciente(p => ({ ...p, endereco: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded"
              />

              <input
                placeholder="NIF"
                maxLength={14}
                value={newPaciente.nif}
                onChange={e => {
                  let val = e.target.value.toUpperCase();
                  const first = val.slice(0, 9).replace(/[^0-9]/g, '');
                  const letters = val.slice(9, 11).replace(/[^A-Z]/g, '');
                  const last = val.slice(11, 14).replace(/[^0-9]/g, '');

                  setNewPaciente(p => ({
                    ...p,
                    nif: first + letters + last
                  }));
                }}
                className="w-full px-3 py-2 border rounded"
              />

              <input
                placeholder="Telefone"
                maxLength={9}
                value={newPaciente.telefone}
                onChange={e =>
                  setNewPaciente(p => ({
                    ...p,
                    telefone: e.target.value.replace(/[^0-9]/g, '')
                  }))
                }
                className="w-full px-3 py-2 border rounded"
              />

              <button
                type="submit"
                disabled={
                  saving ||
                  !newPaciente.nome ||
                  !isNifValid ||
                  !isTelefoneValid
                }
                className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {saving ? 'Criando...' : 'Criar'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}