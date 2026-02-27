'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Search, X } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Paciente {
  id?: number;
  nome: string;
  nif?: string;
  telefone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PacientesPage() {
  // null = ainda não carregou
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
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  /* ---------------- FETCH PACIENTES ---------------- */
  const fetchPacientes = async () => {
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.PACIENTES), {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error('Erro ao carregar pacientes');
      }

      const data = await res.json();

      // Blindagem total
      if (Array.isArray(data)) {
        setPacientes(data);
      } else if (Array.isArray(data.data)) {
        setPacientes(data.data);
      } else {
        setPacientes([]);
      }

    } catch (err) {
      console.error(err);
      setError('Erro ao carregar pacientes');
      setPacientes([]);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  /* ---------------- CREATE PACIENTE ---------------- */
  const handleCreatePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaciente.nome) return;

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
        // Verifica duplicidade
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

      // sucesso
      setPacientes(prev => (prev ? [data.data, ...prev] : [data.data]));
      setIsModalOpen(false);
      setNewPaciente({ nome: '', nif: '', telefone: '' });

      setMessage('Paciente criado com sucesso');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao criar paciente');
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- FILTRAGEM ---------------- */
  const filtered = useMemo(() => {
    if (!pacientes) return [];
    if (!searchTerm) return pacientes;
    const t = searchTerm.toLowerCase();
    return pacientes.filter(
      p =>
        p.nome.toLowerCase().includes(t) ||
        p.nif?.includes(t) ||
        p.telefone?.includes(t)
    );
  }, [pacientes, searchTerm]);

  useEffect(() => setCurrentPage(1), [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ---------------- LOADING INICIAL ---------------- */
  if (pacientes === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <svg
          className="animate-spin h-12 w-12 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
        <span className="mt-3 text-gray-600 font-medium">
          Carregando pacientes...
        </span>
      </div>
    );
  }

  /*  RENDER PRINCIPAL */
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <p className="text-gray-600 text-sm">
          Gestão de cadastro de pacientes da ótica
        </p>
      </div>

      {/* ALERTAS */}
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded shadow">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded shadow">
          {error}
        </div>
      )}

      {/* CARDS RESUMO */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total pacientes</div>
          <div className="text-2xl font-bold">{pacientes.length}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Resultados da busca</div>
          <div className="text-2xl font-bold">{filtered.length}</div>
        </div>
      </div>

      {/* AÇÕES */}
      <div className="bg-white p-4 rounded shadow mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            placeholder="Buscar por nome, NIF ou telefone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded focus:ring focus:ring-blue-200"
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <PlusCircle size={18} />
          Novo Paciente
        </button>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded shadow overflow-auto">
        {currentItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum paciente encontrado
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">NIF</th>
                <th className="p-3 text-left">Telefone</th>
                <th className="p-3 text-left">Criado</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((p, index) => (
                <tr key={p.id ?? index} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.nome}</td>
                  <td className="p-3">{p.nif || '-'}</td>
                  <td className="p-3">{p.telefone || '-'}</td>
                  <td className="p-3">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINAÇÃO */}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md shadow-lg relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setDuplicateError(null);
              }}
              className="absolute top-4 right-4"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">Novo Paciente</h2>

            {/* ERRO DE DUPLICIDADE */}
            {duplicateError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded shadow">
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
                placeholder="NIF (9 números + 2 letras + 3 números)"
                maxLength={14}
                value={newPaciente.nif}
                onChange={e => {
                  let val = e.target.value.toUpperCase();
                  const firstNumbers = val.slice(0, 9).replace(/[^0-9]/g, '');
                  const letters = val.slice(9, 11).replace(/[^A-Z]/g, '');
                  const lastNumbers = val.slice(11, 14).replace(/[^0-9]/g, '');
                  setNewPaciente(p => ({
                    ...p,
                    nif: firstNumbers + letters + lastNumbers,
                  }));
                }}
                className="w-full px-3 py-2 border rounded"
              />

              <input
                placeholder="Telefone (começa com 9 + 8 números)"
                maxLength={9}
                value={newPaciente.telefone}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setNewPaciente(p => ({ ...p, telefone: val }));
                }}
                className="w-full px-3 py-2 border rounded"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={
                    saving ||
                    !newPaciente.nome ||
                    !/^[0-9]{9}[A-Z]{2}[0-9]{3}$/.test(newPaciente.nif || '') ||
                    !/^9[0-9]{8}$/.test(newPaciente.telefone || '')
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}