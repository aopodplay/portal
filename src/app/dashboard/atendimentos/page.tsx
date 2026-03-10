'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from '@/config/api';
import { io, Socket } from 'socket.io-client';

interface Paciente {
  id: number;
  nome: string;
  nif?: string;
}

interface Atendimento {
  id: number;
  status: 'aguardando' | 'em_consulta' | 'consulta_concluida' | 'finalizado';
  data_entrada: string;
  data_saida?: string;
  paciente?: Paciente | null;
}

const STATUS_FLOW = {
  aguardando: { label: 'Iniciar Consulta', next: 'em_consulta', color: 'bg-yellow-400', title: 'Aguardando' },
  em_consulta: { label: 'Concluir Consulta', next: 'consulta_concluida', color: 'bg-blue-400', title: 'Em Consulta' },
  consulta_concluida: { label: 'Enviar para Faturação', next: 'finalizado', color: 'bg-purple-400', title: 'Concluída' },
  finalizado: { label: '', next: '', color: 'bg-gray-300', title: 'Finalizado' },
} as const;

const ITEMS_PER_PAGE = 4;

export default function AtendimentosDashboard() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pacienteId, setPacienteId] = useState<number | ''>('');
  const [searchPaciente, setSearchPaciente] = useState('');
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [paginaAtual, setPaginaAtual] = useState<Record<string, number>>({});
  const [removerModalOpen, setRemoverModalOpen] = useState(false);
  const [atendimentoParaRemover, setAtendimentoParaRemover] = useState<Atendimento | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const userPerfil = (localStorage.getItem('perfil') || 'caixa') as 'admin' | 'recepcao' | 'optometrista' | 'caixa';

  const getPagina = (status: string) => paginaAtual[status] || 1;
  const setPagina = (status: string, page: number) =>
    setPaginaAtual(prev => ({ ...prev, [status]: page }));

  const tratarErroPermissao = async (res: Response) => {
    if (res.status === 401 || res.status === 403) {
      try {
        const data = await res.json();
        setErroModal(data.error || 'Acesso negado');
      } catch {
        setErroModal('Acesso negado');
      }
    }
  };

  // FETCH INICIAL + SOCKET
useEffect(() => {
  if (typeof window === "undefined") return;

  const token = localStorage.getItem("token");
  let s: ReturnType<typeof io> | null = null;

  async function fetchData() {
    try {
      setLoading(true);
      setErroModal(null);
      const headers = getAuthHeaders();

      const [atendRes, pacRes] = await Promise.all([
        fetch(getApiUrl(API_ENDPOINTS.ATENDIMENTOS), { headers }),
        fetch(getApiUrl(API_ENDPOINTS.PACIENTES), { headers })
      ]);

      if (atendRes.ok) {
        const data = await atendRes.json();
        setAtendimentos(data.data || data);
      } else {
        await tratarErroPermissao(atendRes);
      }

      if (pacRes.ok) {
        const data = await pacRes.json();
        setPacientes(data.data || data);
      }

    } catch (err) {
      console.warn("Erro geral:", err);
    } finally {
      setLoading(false);
    }
  }

  if (token) {
    fetchData();

    // SOCKET.IO REALTIME
    s = io(getApiUrl(""), {
      path: "/socket.io",
      transports: ["websocket"],
      auth: { token }
    });

    setSocket(s);

    s.on("connect", () => console.log("Socket conectado:", s?.id));

    s.on("novo-atendimento", (atendimento: Atendimento) => {
      setAtendimentos(prev =>
        prev.find(a => a.id === atendimento.id)
          ? prev
          : [atendimento, ...prev]
      );
    });

    s.on("atendimento-atualizado", (atendimento: Atendimento) => {
      setAtendimentos(prev =>
        prev.map(a => (a.id === atendimento.id ? atendimento : a))
      );
    });

    s.on("atendimento-removido", ({ id }: { id: number }) => {
      setAtendimentos(prev => prev.filter(a => a.id !== id));
    });
  }

  return () => {
    if (s) {
      s.disconnect();
    }
  };

}, []);

  //  FUNÇÕES 
  const abrirAtendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) return;

    const res = await fetch(getApiUrl(`${API_ENDPOINTS.ATENDIMENTOS}/abrir`), {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ paciente_id: pacienteId }),
    });

    if (!res.ok) {
      await tratarErroPermissao(res);
      return;
    }

    setModalOpen(false);
    setPacienteId('');
    setSearchPaciente('');
  };

  const mudarStatus = async (a: Atendimento) => {
    const next = STATUS_FLOW[a.status].next;
    if (!next) return;

    const res = await fetch(getApiUrl(`${API_ENDPOINTS.ATENDIMENTOS}/${a.id}/status`), {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      await tratarErroPermissao(res);
      return;
    }
  };

  const abrirModalRemover = (a: Atendimento) => {
    setAtendimentoParaRemover(a);
    setRemoverModalOpen(true);
  };

  const confirmarRemoverAtendimento = async () => {
    if (!atendimentoParaRemover) return;
    setRemovendo(true);

    const res = await fetch(getApiUrl(`${API_ENDPOINTS.ATENDIMENTOS}/${atendimentoParaRemover.id}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    setRemovendo(false);
    setRemoverModalOpen(false);
  };

  const pacientesDisponiveis = pacientes.filter(p =>
    p.nome.toLowerCase().includes(searchPaciente.toLowerCase())
  );

  const groupedAtendimentos = Object.keys(STATUS_FLOW).reduce(
    (acc: Record<string, Atendimento[]>, key) => {
      acc[key] = atendimentos.filter(a => a.status === key);
      return acc;
    }, {} as Record<string, Atendimento[]>
  );

  const filtrarAtendimento = (a: Atendimento) => {
    const texto = filtroGlobal.toLowerCase();
    const dataEntrada = new Date(a.data_entrada);
    const inicio = filtroDataInicio ? new Date(filtroDataInicio) : null;
    const fim = filtroDataFim ? new Date(filtroDataFim) : null;

    const condGlobal =
      (a.paciente?.nome || '').toLowerCase().includes(texto) ||
      (a.paciente?.nif?.toLowerCase().includes(texto) ?? false) ||
      a.status.replace('_', ' ').toLowerCase().includes(texto);

    const condData =
      (!inicio || dataEntrada >= inicio) &&
      (!fim || dataEntrada <= fim);

    return condGlobal && condData;
  };

  const paginarLista = (lista: Atendimento[], status: string) => {
    const page = getPagina(status);
    const inicio = (page - 1) * ITEMS_PER_PAGE;
    return lista.slice(inicio, inicio + ITEMS_PER_PAGE);
  };

  const totalPaginas = (lista: Atendimento[]) =>
    Math.max(1, Math.ceil(lista.length / ITEMS_PER_PAGE));

  if (loading) return <div className="p-6">Carregando...</div>;

  // JSX 
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {erroModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
            <h2 className="text-lg font-bold mb-2">Sem permissão!</h2>
            <p className="mb-4">{erroModal}</p>
            <button onClick={() => setErroModal(null)} className="bg-red-600 text-white px-4 py-2 rounded">Fechar</button>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Dashboard de Atendimentos</h1>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <input type="text" placeholder="Pesquisar..." value={filtroGlobal} onChange={e => setFiltroGlobal(e.target.value)} className="flex-1 border rounded px-3 py-2" />
          <input type="date" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} className="border rounded px-3 py-2" />
          <input type="date" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} className="border rounded px-3 py-2" />
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded"><PlusCircle /> Novo</button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.keys(STATUS_FLOW).map(statusKey => {
          const status = STATUS_FLOW[statusKey as keyof typeof STATUS_FLOW];
          const listaFiltrada = (groupedAtendimentos[statusKey] || []).filter(filtrarAtendimento);
          const lista = paginarLista(listaFiltrada, statusKey);
          const page = getPagina(statusKey);

          return (
            <div key={statusKey} className="bg-white rounded shadow p-4 flex flex-col">
              <h2 className="font-bold mb-3">{status.title} ({listaFiltrada.length})</h2>

              <div className="flex flex-col gap-3">
                {lista.length === 0 && <p className="text-gray-400 text-sm">Nenhum atendimento</p>}
                {lista.map(a => (
                  <div key={a.id} className="bg-gray-50 p-3 rounded flex flex-col">
                    <span className="font-semibold">{a.paciente?.nome || 'Sem paciente'}</span>
                    {a.paciente?.nif && <span className="text-gray-500 text-sm">NIF: {a.paciente.nif}</span>}
                    <span className="text-gray-500 text-sm">Entrada: {new Date(a.data_entrada).toLocaleString()}</span>
                    {a.data_saida && <span className="text-gray-500 text-sm">Saída: {new Date(a.data_saida).toLocaleString()}</span>}

                    <div className="flex flex-col gap-1 mt-2">
                      {a.status !== 'finalizado' && (
                        <button onClick={() => mudarStatus(a)} className={`w-full py-1 rounded text-white font-medium ${a.status === 'consulta_concluida' ? 'bg-green-500' : status.color}`}>
                          {a.status === 'consulta_concluida' ? 'Finalizar Atendimento' : status.label}
                        </button>
                      )}

                      {a.status === 'aguardando' && ['caixa','admin'].includes(userPerfil) && (
                        <button onClick={() => abrirModalRemover(a)} className="w-full py-1 mt-1 rounded bg-red-600 text-white font-medium flex items-center justify-center gap-1">
                          <Trash2 size={16} /> Remover
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {listaFiltrada.length > ITEMS_PER_PAGE && (
                <div className="flex justify-between mt-3 items-center">
                  <button disabled={page === 1} onClick={() => setPagina(statusKey, page - 1)}><ChevronLeft /></button>
                  <span className="text-sm">{page}/{totalPaginas(listaFiltrada)}</span>
                  <button disabled={page === totalPaginas(listaFiltrada)} onClick={() => setPagina(statusKey, page + 1)}><ChevronRight /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modais */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={abrirAtendimento} className="bg-white rounded shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Novo Atendimento</h2>
              <button type="button" onClick={() => setModalOpen(false)}><X /></button>
            </div>

            <input type="text" placeholder="Pesquisar paciente..." value={searchPaciente} onChange={e => setSearchPaciente(e.target.value)} className="w-full border rounded p-2 mb-3" />

            <select required value={pacienteId} onChange={e => setPacienteId(Number(e.target.value))} className="w-full border rounded p-2 mb-4">
              <option value="">Selecione o paciente</option>
              {pacientesDisponiveis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>

            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded">Abrir Atendimento</button>
          </form>
        </div>
      )}

      {removerModalOpen && atendimentoParaRemover && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg w-full max-w-sm p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Confirmar remoção</h2>
            <p className="mb-6">Deseja realmente remover o atendimento de <strong>{atendimentoParaRemover.paciente?.nome}</strong>?</p>
            <div className="flex justify-between gap-4">
              <button onClick={() => setRemoverModalOpen(false)} className="flex-1 py-2 rounded border border-gray-300" disabled={removendo}>Cancelar</button>
              <button onClick={confirmarRemoverAtendimento} className="flex-1 py-2 rounded bg-red-600 text-white" disabled={removendo}>{removendo ? 'Removendo...' : 'Remover'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}