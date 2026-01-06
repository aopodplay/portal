'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlusCircle, Edit2, Trash2, X, Search } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Produto {
  id?: number;
  nome: string;
  tipo: 'armacao' | 'lente' | 'servico';
  preco: number;
  estoque: number;
  ativo: boolean;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  /* Pesquisa */
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | Produto['tipo']>('todos');

  /* Paginação */
  const ITEMS_PER_PAGE = 7;
  const [currentPage, setCurrentPage] = useState(1);

  /* Modais */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [produtoToDelete, setProdutoToDelete] = useState<Produto | null>(null);

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'success',
  });

  const [newProduto, setNewProduto] = useState<Produto>({
    nome: '',
    tipo: 'armacao',
    preco: 0,
    estoque: 0,
    ativo: true,
  });

  /* ---------------- BUSCAR PRODUTOS ---------------- */
  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.PRODUTOS), {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setProdutos(
        Array.isArray(data)
          ? data.map((p: any) => ({
            ...p,
            preco: Number(p.preco) || 0,
            estoque: Number(p.estoque) || 0,
          }))
          : []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  /* ---------------- PESQUISA + FILTRO ---------------- */
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const matchNome = p.nome.toLowerCase().includes(search.toLowerCase());
      const matchTipo = tipoFiltro === 'todos' || p.tipo === tipoFiltro;
      return matchNome && matchTipo;
    });
  }, [produtos, search, tipoFiltro]);

  /* ---------------- PAGINAÇÃO ---------------- */
  const totalPages = Math.ceil(produtosFiltrados.length / ITEMS_PER_PAGE);

  const produtosPaginados = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return produtosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [produtosFiltrados, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, tipoFiltro]);

  /* ---------------- CRUD ---------------- */
  const handleCreateProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.PRODUTOS), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newProduto),
      });
      if (!response.ok) throw new Error();
      await fetchProdutos();
      setIsModalOpen(false);
      setNewProduto({ nome: '', tipo: 'armacao', preco: 0, estoque: 0, ativo: true });
    } catch {
      setNotification({ show: true, message: 'Erro ao criar produto', type: 'error' });
    }
  };

  const handleUpdateProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduto?.id) return;
    try {
      const response = await fetch(
        `${getApiUrl(API_ENDPOINTS.PRODUTOS)}/${editingProduto.id}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(editingProduto),
        }
      );
      if (!response.ok) throw new Error();
      await fetchProdutos();
      setIsEditModalOpen(false);
      setEditingProduto(null);
    } catch {
      setNotification({ show: true, message: 'Erro ao atualizar produto', type: 'error' });
    }
  };

  const handleDeleteProduto = async () => {
    if (!produtoToDelete?.id) return;
    try {
      const response = await fetch(
        `${getApiUrl(API_ENDPOINTS.PRODUTOS)}/${produtoToDelete.id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok) throw new Error();
      await fetchProdutos();
      setIsDeleteModalOpen(false);
      setProdutoToDelete(null);
    } catch {
      setNotification({ show: true, message: 'Erro ao excluir produto', type: 'error' });
    }
  };

  if (loading) return <div className="p-6">Carregando produtos...</div>;

  /* ---------------- RENDER ---------------- */
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusCircle size={20} /> Novo Produto
        </button>
      </div>

      {/* Pesquisa */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            placeholder="Pesquisar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 w-full border rounded px-3 py-2"
          />
        </div>
        <select
          value={tipoFiltro}
          onChange={e => setTipoFiltro(e.target.value as any)}
          className="border rounded px-3 py-2"
        >
          <option value="todos">Todos</option>
          <option value="armacao">Armação</option>
          <option value="lente">Lente</option>
          <option value="servico">Serviço</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Nome</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Preço</th>
              <th className="p-4">Estoque</th>
              <th className="p-4">Ativo</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosPaginados.map(produto => (
              <tr key={produto.id} className="hover:bg-gray-50">
                <td className="p-4">{produto.nome}</td>
                <td className="p-4">{produto.tipo}</td>
                <td className="p-4">{produto.preco.toFixed(2)}</td>
                <td className="p-4">{produto.estoque}</td>
                <td className="p-4">{produto.ativo ? 'Sim' : 'Não'}</td>
                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingProduto(produto);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setProdutoToDelete(produto);
                      setIsDeleteModalOpen(true);
                    }}
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
        <span>Página {currentPage} de {totalPages || 1}</span>
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

      {/* ---------------- MODAIS ---------------- */}
      {/* Criar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4">
              <X />
            </button>
            <h2 className="text-xl font-bold mb-4">Novo Produto</h2>
            <form onSubmit={handleCreateProduto} className="space-y-4">
              <input required placeholder="Nome" className="w-full border p-2"
                value={newProduto.nome}
                onChange={e => setNewProduto({ ...newProduto, nome: e.target.value })}
              />
              <select className="w-full border p-2"
                value={newProduto.tipo}
                onChange={e => setNewProduto({ ...newProduto, tipo: e.target.value as any })}
              >
                <option value="armacao">Armação</option>
                <option value="lente">Lente</option>
                <option value="servico">Serviço</option>
              </select>
              <input type="number" className="w-full border p-2"
                value={newProduto.preco}
                onChange={e => setNewProduto({ ...newProduto, preco: Number(e.target.value) })}
              />
              <input type="number" className="w-full border p-2"
                value={newProduto.estoque}
                onChange={e => setNewProduto({ ...newProduto, estoque: Number(e.target.value) })}
              />
              <button className="bg-blue-600 text-white px-4 py-2 rounded">Salvar</button>
            </form>
          </div>
        </div>
      )}

      {/* Editar */}
      {isEditModalOpen && editingProduto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4"
            >
              <X />
            </button>

            <h2 className="text-xl font-bold mb-4">Editar Produto</h2>

            <form onSubmit={handleUpdateProduto} className="space-y-4">
              {/* Nome */}
              <input
                required
                className="w-full border p-2 rounded"
                placeholder="Nome"
                value={editingProduto.nome}
                onChange={e =>
                  setEditingProduto({ ...editingProduto, nome: e.target.value })
                }
              />

              {/* Tipo */}
              <select
                className="w-full border p-2 rounded"
                value={editingProduto.tipo}
                onChange={e =>
                  setEditingProduto({
                    ...editingProduto,
                    tipo: e.target.value as Produto['tipo'],
                  })
                }
              >
                <option value="armacao">Armação</option>
                <option value="lente">Lente</option>
                <option value="servico">Serviço</option>
              </select>

              {/* Preço */}
              <input
                type="number"
                className="w-full border p-2 rounded"
                placeholder="Preço"
                value={editingProduto.preco}
                onChange={e =>
                  setEditingProduto({
                    ...editingProduto,
                    preco: Number(e.target.value),
                  })
                }
              />

              {/* Estoque */}
              <input
                type="number"
                className="w-full border p-2 rounded"
                placeholder="Estoque"
                value={editingProduto.estoque}
                onChange={e =>
                  setEditingProduto({
                    ...editingProduto,
                    estoque: Number(e.target.value),
                  })
                }
              />

              {/* Ativo */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingProduto.ativo}
                  onChange={e =>
                    setEditingProduto({
                      ...editingProduto,
                      ativo: e.target.checked,
                    })
                  }
                />
                Produto ativo
              </label>

              {/* Botões */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Excluir */}
      {isDeleteModalOpen && produtoToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <p>Excluir <strong>{produtoToDelete.nome}</strong>?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
              <button onClick={handleDeleteProduto} className="bg-red-600 text-white px-4 py-2 rounded">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
