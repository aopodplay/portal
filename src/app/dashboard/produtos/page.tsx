'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Categoria {
  id: number;
  nome: string;
}

interface Produto {
  id: number;
  nome: string;
  tipo: 'armacao' | 'lente' | 'servico';
  preco: number;
  estoque: number;
  descricao?: string;
  categoria_id: number;
  categoria?: Categoria;
}

const emptyForm = {
  nome: '',
  tipo: 'armacao',
  preco: '',
  estoque: '',
  categoria_id: '',
  descricao: ''
};

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // modal delete
  const [deleteId, setDeleteId] = useState<number | null>(null);

  /* ---------------- HELPERS ---------------- */
  const labelTipo = (tipo: string) => {
    if (tipo === 'armacao') return 'Armação';
    if (tipo === 'lente') return 'Lente';
    if (tipo === 'servico') return 'Serviço';
    return tipo;
  };

  /* ---------------- LOAD ---------------- */
  const loadProdutos = async () => {
    const res = await fetch(getApiUrl(API_ENDPOINTS.PRODUTOS), {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    setProdutos(json.data || []);
  };

  const loadCategorias = async () => {
    const res = await fetch(getApiUrl(API_ENDPOINTS.CATEGORIAS), {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    setCategorias(json.data || json);
  };

  useEffect(() => {
    loadProdutos();
    loadCategorias();
  }, []);

  /* ---------------- FORM ---------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const url = editId
        ? `${getApiUrl(API_ENDPOINTS.PRODUTOS)}/${editId}`
        : getApiUrl(API_ENDPOINTS.PRODUTOS);

      const method = editId ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          preco: Number(form.preco),
          estoque: Number(form.estoque),
          categoria_id: Number(form.categoria_id),
          ativo: true
        })
      });

      setMessage(editId ? 'Produto atualizado' : 'Produto criado');
      setForm(emptyForm);
      setEditId(null);
      loadProdutos();
    } catch {
      setMessage('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: Produto) => {
    setEditId(p.id);
    setForm({
      nome: p.nome,
      tipo: p.tipo,
      preco: p.preco,
      estoque: p.estoque,
      categoria_id: p.categoria_id,
      descricao: p.descricao || ''
    });
  };

  /* ---------------- DELETE ---------------- */
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await fetch(`${getApiUrl(API_ENDPOINTS.PRODUTOS)}/${deleteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setDeleteId(null);
      loadProdutos();
    } catch {
      setMessage('Erro ao eliminar produto');
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="max-w-7xl mx-auto space-y-8">

        <h1 className="text-2xl font-bold">Produtos</h1>

        {message && (
          <div className="p-3 bg-gray-100 rounded border">{message}</div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded border space-y-4">
          <h2 className="font-semibold">
            {editId ? 'Editar Produto' : 'Novo Produto'}
          </h2>

          <input
            name="nome"
            placeholder="Nome"
            value={form.nome}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            >
              <option value="armacao">Armação</option>
              <option value="lente">Lente</option>
              <option value="servico">Serviço</option>
            </select>

            <select
              name="categoria_id"
              value={form.categoria_id}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
              required
            >
              <option value="">Categoria</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="number" name="preco" placeholder="Preço"
              value={form.preco} onChange={handleChange}
              className="border px-3 py-2 rounded" />

            <input type="number" name="estoque" placeholder="Estoque"
              value={form.estoque} onChange={handleChange}
              className="border px-3 py-2 rounded" />
          </div>

          <textarea
            name="descricao"
            placeholder="Descrição"
            value={form.descricao}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          />

          <div className="flex justify-end gap-3">
            {editId && (
              <button
                type="button"
                onClick={() => { setEditId(null); setForm(emptyForm); }}
                className="px-6 py-2 border rounded"
              >
                Cancelar
              </button>
            )}
            <button className="bg-blue-600 text-white px-8 py-2 rounded">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>

        {/* LIST */}
        <div className="bg-white rounded border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Nome</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.nome}</td>
                  <td>{labelTipo(p.tipo)}</td>
                  <td>{p.categoria?.nome}</td>
                  <td>{p.preco}</td>
                  <td>{p.estoque}</td>
                  <td className="flex gap-3 p-3">
                    <button onClick={() => handleEdit(p)} className="text-blue-600">
                      Editar
                    </button>
                    <button onClick={() => setDeleteId(p.id)} className="text-red-600">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {produtos.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    Nenhum produto encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL DELETE */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Confirmar eliminação
              </h3>
              <p className="mb-6">
                Tem certeza que deseja eliminar este produto?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-6 py-2 border rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
