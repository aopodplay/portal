'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlusCircle, X, Trash2, Edit, Search } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

interface Servico {
  id: number;
  nome: string;
  descricao?: string;
  valor: number;
  created_at?: string;
  updated_at?: string;
}

interface Usuario {
  id: number;
  nome: string;
  role: 'admin' | 'caixa' | 'recepcao' | 'optometrista';
}

export default function ServicosDashboard() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number | ''>('');
  const [editarServico, setEditarServico] = useState<Servico | null>(null);
  const [pesquisa, setPesquisa] = useState('');
  const [modalExcluir, setModalExcluir] = useState<Servico | null>(null);

  const usuario: Usuario = {
    id: 1,
    nome: 'Administrador',
    role: 'admin',
  };

  const isAdmin = (usuario: Usuario) => usuario.role.toLowerCase() === 'admin';
  const podeEditar = isAdmin(usuario);

  useEffect(() => {
    async function fetchServicos() {
      setLoading(true);
      try {
        const res = await fetch(getApiUrl('/servicos'), { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Erro ao listar serviços');
        const data: Servico[] = await res.json();
        setServicos(data);
      } catch (err: any) {
        setErroModal(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchServicos();
  }, []);

  const servicosFiltrados = useMemo(() => {
    return servicos.filter(s =>
      s.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
      s.descricao?.toLowerCase().includes(pesquisa.toLowerCase())
    );
  }, [servicos, pesquisa]);

  const abrirModalCriar = () => {
    if (!podeEditar) return;
    setEditarServico(null);
    setNome('');
    setDescricao('');
    setValor('');
    setModalOpen(true);
  };

  const abrirModalEditar = (s: Servico) => {
    if (!podeEditar) return;
    setEditarServico(s);
    setNome(s.nome);
    setDescricao(s.descricao || '');
    setValor(s.valor);
    setModalOpen(true);
  };

  const salvarServico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEditar) return;
    if (!nome || valor === '') {
      setErroModal('Nome e valor são obrigatórios');
      return;
    }
    try {
      const body = { nome, descricao, valor: Number(valor) };
      const url = editarServico
        ? getApiUrl(`/servicos/${editarServico.id}`)
        : getApiUrl('/servicos');
      const method = editarServico ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Erro ao salvar serviço');
      const data: Servico = await res.json();
      if (editarServico) {
        setServicos(prev => prev.map(s => s.id === data.id ? data : s));
      } else {
        setServicos(prev => [data, ...prev]);
      }
      setModalOpen(false);
    } catch (err: any) {
      setErroModal(err.message);
    }
  };

  const abrirModalExcluir = (s: Servico) => {
    if (!podeEditar) return;
    setModalExcluir(s);
  };

  const confirmarExcluir = async () => {
    if (!modalExcluir || !podeEditar) return;
    try {
      const res = await fetch(getApiUrl(`/servicos/${modalExcluir.id}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao remover serviço');
      setServicos(prev => prev.filter(x => x.id !== modalExcluir.id));
    } catch (err: any) {
      setErroModal(err.message);
    } finally {
      setModalExcluir(null);
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Carregando serviços...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">

      {/* ERRO */}
      {erroModal && <div className="bg-red-100 text-red-700 p-4 rounded shadow">{erroModal}</div>}

      {/* CARD TOTAL DE SERVIÇOS */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white p-6 rounded-xl shadow-lg flex items-center justify-between max-w-sm transition-transform hover:scale-105">
        <div>
          <p className="text-sm font-medium">Total de Serviços</p>
          <h2 className="text-3xl font-bold">{servicos.length}</h2>
        </div>
        {podeEditar && <PlusCircle size={32} className="text-white" />}
      </div>

      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Serviços</h1>
          <p className="text-gray-500 text-sm">Gestão completa de serviços da óptica</p>
        </div>
        {podeEditar && (
          <button
            onClick={abrirModalCriar}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg shadow-lg transition-transform hover:scale-105"
          >
            <PlusCircle size={18} />
            Novo Serviço
          </button>
        )}
      </div>

      {/* PESQUISA */}
      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Pesquisar serviço..."
          value={pesquisa}
          onChange={e => setPesquisa(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
        />
      </div>

      {/* TABELA ESTILIZADA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicosFiltrados.length === 0 ? (
          <p className="col-span-full text-center text-gray-400 py-8">Nenhum serviço encontrado</p>
        ) : (
          servicosFiltrados.map(s => (
            <div key={s.id} className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{s.nome}</h3>
                <p className="text-gray-600 text-sm mb-2">{s.descricao || 'Sem descrição'}</p>
                <p className="font-semibold text-indigo-600">Kz {s.valor.toLocaleString()}</p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {podeEditar && (
                  <>
                    <button onClick={() => abrirModalEditar(s)} className="text-yellow-600 hover:text-yellow-800 transition">
                      <Edit size={20} />
                    </button>
                    <button onClick={() => abrirModalExcluir(s)} className="text-red-600 hover:text-red-800 transition">
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL CRIAR/EDITAR */}
      {modalOpen && podeEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={salvarServico} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">{editarServico ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X />
              </button>
            </div>
            <input type="text" placeholder="Nome do serviço" value={nome} onChange={e => setNome(e.target.value)} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 transition" required />
            <textarea placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 transition" />
            <input type="number" placeholder="Valor (Kz)" value={valor} onChange={e => setValor(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 transition" required />
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-transform hover:scale-105">{editarServico ? 'Salvar Alterações' : 'Criar Serviço'}</button>
          </form>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO EXCLUIR */}
      {modalExcluir && podeEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <h2 className="text-lg font-bold">Confirmação</h2>
            <p>Deseja realmente remover o serviço "<strong>{modalExcluir.nome}</strong>"?</p>
            <div className="flex justify-center gap-4">
              <button onClick={confirmarExcluir} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Sim, remover</button>
              <button onClick={() => setModalExcluir(null)} className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 transition">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}