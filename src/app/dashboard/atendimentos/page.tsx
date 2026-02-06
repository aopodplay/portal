'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from '@/config/api';

interface Paciente {
  id: number;
  nome: string;
  nif?: string;
}

interface Atendimento {
  id: number;
  status: 'aguardando' | 'em_consulta' | 'consulta_concluida' | 'em_faturacao' | 'finalizado';
  data_entrada: string;
  data_saida?: string;
  paciente: Paciente;
}

const STATUS_FLOW = {
  aguardando: { label: 'Iniciar Consulta', next: 'em_consulta', color: 'bg-yellow-400', title: 'Aguardando' },
  em_consulta: { label: 'Concluir Consulta', next: 'consulta_concluida', color: 'bg-blue-400', title: 'Em Consulta' },
  consulta_concluida: { label: 'Enviar para Faturação', next: 'em_faturacao', color: 'bg-purple-400', title: 'Concluída' },
  em_faturacao: { label: 'Finalizar Atendimento', next: 'finalizado', color: 'bg-green-400', title: 'Em Faturação' },
  finalizado: { label: '', next: '', color: 'bg-gray-300', title: 'Finalizado' },
} as const;

const ITEMS_PER_PAGE = 5; // Quantos atendimentos por página

export default function AtendimentosDashboard() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pacienteId, setPacienteId] = useState<number | ''>('');
  const [searchPaciente, setSearchPaciente] = useState('');
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    async function fetchData() {
      try {
        const atendRes = await fetch(getApiUrl(API_ENDPOINTS.ATENDIMENTOS), { headers: getAuthHeaders() });
        const atendData = await atendRes.json();
        setAtendimentos(atendData.data || atendData);

        const pacRes = await fetch(getApiUrl(API_ENDPOINTS.PACIENTES), { headers: getAuthHeaders() });
        const pacData = await pacRes.json();
        setPacientes(pacData.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  const abrirAtendimento = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!pacienteId) return;

  const res = await fetch(getApiUrl(`${API_ENDPOINTS.ATENDIMENTOS}/abrir`), {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ paciente_id: pacienteId }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Erro ao abrir atendimento:', err);
    return;
  }

  const novo = await res.json();

  if (!novo || !novo.id) {
    console.error('Resposta inválida:', novo);
    return;
  }

  setAtendimentos(prev => [novo, ...prev]);
  setModalOpen(false);
  setPacienteId('');
  setSearchPaciente('');
};


  const mudarStatus = async (a: Atendimento) => {
  const next = STATUS_FLOW[a.status].next;
  if (!next) return;

  const res = await fetch(
    getApiUrl(`${API_ENDPOINTS.ATENDIMENTOS}/${a.id}/status`),
    {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('Erro ao mudar status:', err);
    return;
  }

  const atualizado = await res.json();

  setAtendimentos(prev =>
    prev.map(item => (item.id === atualizado.id ? atualizado : item))
  );
};


  // Agrupa atendimentos por status
  const groupedAtendimentos = Object.keys(STATUS_FLOW).reduce((acc: Record<string, Atendimento[]>, key) => {
    acc[key] = atendimentos.filter(a => a.status === key);
    return acc;
  }, {} as Record<string, Atendimento[]>);

  // Filtra pacientes no modal pelo search
  const pacientesFiltrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(searchPaciente.toLowerCase())
  );

  // Filtra atendimentos globalmente + por data
  const filtrarAtendimento = (a: Atendimento) => {
    const texto = filtroGlobal.toLowerCase();
    const dataEntrada = new Date(a.data_entrada);
    const inicio = filtroDataInicio ? new Date(filtroDataInicio) : null;
    const fim = filtroDataFim ? new Date(filtroDataFim) : null;

    const condGlobal =
      a.paciente.nome.toLowerCase().includes(texto) ||
      (a.paciente.nif?.toLowerCase().includes(texto) ?? false) ||
      a.status.replace('_', ' ').toLowerCase().includes(texto) ||
      dataEntrada.toLocaleDateString().includes(texto);

    const condData =
      (!inicio || dataEntrada >= inicio) &&
      (!fim || dataEntrada <= fim);

    return condGlobal && condData;
  };

  // Paginacao
  const paginarLista = (lista: Atendimento[]) => {
    const inicio = (paginaAtual - 1) * ITEMS_PER_PAGE;
    return lista.slice(inicio, inicio + ITEMS_PER_PAGE);
  };

  const totalPaginas = (lista: Atendimento[]) => Math.ceil(lista.length / ITEMS_PER_PAGE);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Dashboard de Atendimentos</h1>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Pesquisar atendimentos..."
            value={filtroGlobal}
            onChange={e => { setFiltroGlobal(e.target.value); setPaginaAtual(1); }}
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="date"
            value={filtroDataInicio}
            onChange={e => { setFiltroDataInicio(e.target.value); setPaginaAtual(1); }}
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="date"
            value={filtroDataFim}
            onChange={e => { setFiltroDataFim(e.target.value); setPaginaAtual(1); }}
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 transition"
          >
            <PlusCircle /> Novo
          </button>
        </div>
      </div>

      {/* Dashboard por status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {Object.keys(STATUS_FLOW).map(statusKey => {
          const status = STATUS_FLOW[statusKey as keyof typeof STATUS_FLOW];
          const listaFiltrada = (groupedAtendimentos[statusKey] || []).filter(filtrarAtendimento);
          const lista = paginarLista(listaFiltrada);

          return (
            <div key={statusKey} className="bg-white rounded shadow p-4 flex flex-col">
              <h2 className="font-bold mb-3">{status.title} ({listaFiltrada.length})</h2>
              <div className="flex flex-col gap-3">
                {lista.length === 0 && <p className="text-gray-400 text-sm">Nenhum atendimento</p>}
                {lista.map(a => (
                  <div key={a.id} className="bg-gray-50 p-3 rounded flex flex-col">
                    <span className="font-semibold">{a.paciente.nome}</span>
                    {a.paciente.nif && <span className="text-gray-500 text-sm">NIF: {a.paciente.nif}</span>}
                    <span className="text-gray-500 text-sm">Entrada: {new Date(a.data_entrada).toLocaleString()}</span>
                    {a.data_saida && <span className="text-gray-500 text-sm">Saída: {new Date(a.data_saida).toLocaleString()}</span>}
                    {status.label && (
                      <button
                        onClick={() => mudarStatus(a)}
                        className={`mt-2 w-full py-1 rounded text-white font-medium ${status.color} hover:opacity-90 transition`}
                      >
                        {status.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {listaFiltrada.length > ITEMS_PER_PAGE && (
                <div className="flex justify-between mt-3 items-center">
                  <button
                    disabled={paginaAtual === 1}
                    onClick={() => setPaginaAtual(paginaAtual - 1)}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    <ChevronLeft />
                  </button>
                  <span className="text-sm">{paginaAtual}/{totalPaginas(listaFiltrada)}</span>
                  <button
                    disabled={paginaAtual === totalPaginas(listaFiltrada)}
                    onClick={() => setPaginaAtual(paginaAtual + 1)}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    <ChevronRight />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Abrir Atendimento */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={abrirAtendimento} className="bg-white rounded shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Novo Atendimento</h2>
              <button type="button" onClick={() => setModalOpen(false)}><X /></button>
            </div>

            {/* Pesquisa no modal */}
            <input
              type="text"
              placeholder="Pesquisar paciente..."
              value={searchPaciente}
              onChange={e => setSearchPaciente(e.target.value)}
              className="w-full border rounded p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <select
              required
              value={pacienteId}
              onChange={e => setPacienteId(Number(e.target.value))}
              className="w-full border rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Selecione o paciente</option>
              {pacientesFiltrados.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
            >
              Abrir Atendimento
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
