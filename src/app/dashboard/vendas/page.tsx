'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

interface Produto {
  id: number;
  nome: string;
  tipo: 'produto' | 'servico';
  preco: number;
  estoque: number;
}

interface VendaItem {
  produto_id?: number;
  servico_id?: number;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

interface Venda {
  id: number;
  itens: VendaItem[];
  total: number;
  desconto: number;
  forma_pagamento: string;
  created_at: string;
}

export default function VendasPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itens, setItens] = useState<VendaItem[]>([]);
  const [desconto, setDesconto] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState<string>('dinheiro');
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch produtos e serviços
  const fetchItensDisponiveis = async () => {
    try {
      const [produtosRes, servicosRes] = await Promise.all([
        fetch(getApiUrl('/produtos/venda'), { headers: getAuthHeaders() }),
        fetch(getApiUrl('/servicos'), { headers: getAuthHeaders() })
      ]);

      if (!produtosRes.ok) throw new Error('Erro ao carregar produtos');
      if (!servicosRes.ok) throw new Error('Erro ao carregar serviços');

      const produtosData = await produtosRes.json();
      const servicosData = await servicosRes.json();

      const listaProdutos: Produto[] = produtosData.map(p => ({
        id: p.id,
        nome: p.nome,
        tipo: 'produto',
        preco: Number(p.preco),
        estoque: Number(p.estoque || 0),
      }));

      const listaServicos: Produto[] = servicosData.map(s => ({
        id: s.id,
        nome: s.nome,
        tipo: 'servico',
        preco: Number(s.valor),
        estoque: Infinity
      }));

      setProdutos([...listaProdutos, ...listaServicos]);
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Erro ao carregar produtos/serviços');
    }
  };

  // Fetch vendas
  const fetchVendas = async () => {
    try {
      const res = await fetch(getApiUrl('/vendas'), { headers: getAuthHeaders() });
      const data = await res.json();
      setVendas(data);
    } catch (err: any) {
      console.error(err);
      setMessage('Erro ao buscar vendas');
    }
  };

  useEffect(() => {
    fetchItensDisponiveis();
    fetchVendas();
  }, []);

  const addItem = (produto: Produto) => {
    if (itens.find(i => (i.produto_id === produto.id || i.servico_id === produto.id))) {
      setMessage('Item já adicionado');
      return;
    }

    setItens([
      ...itens,
      {
        produto_id: produto.tipo === 'produto' ? produto.id : undefined,
        servico_id: produto.tipo === 'servico' ? produto.id : undefined,
        nome: produto.nome,
        quantidade: 1,
        preco_unitario: produto.preco,
        subtotal: produto.preco,
      }
    ]);
  };

  const removeItem = (index: number) => setItens(itens.filter((_, i) => i !== index));
  const updateQuantidade = (index: number, quantidade: number) => {
    if (quantidade <= 0) return;
    const item = itens[index];
    setItens(itens.map((i, idx) =>
      idx === index ? { ...i, quantidade, subtotal: i.preco_unitario * quantidade } : i
    ));
  };

  const total = itens.reduce((sum, i) => sum + i.subtotal, 0) - desconto;

  const criarVenda = async () => {
    if (!itens.length) { setMessage('Adicione pelo menos um item'); return; }
    setLoading(true);
    try {
      const body = {
        paciente_id: null,
        forma_pagamento: formaPagamento,
        desconto,
        itens: itens.map(i => ({
          produto_id: i.produto_id,
          servico_id: i.servico_id,
          quantidade: i.quantidade
        }))
      };

      const res = await fetch(getApiUrl('/vendas'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar venda');
      }

      const vendaCriada = await res.json();
      setVendas([vendaCriada, ...vendas]);
      setItens([]);
      setDesconto(0);
      setMessage('Venda criada com sucesso');
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Erro ao criar venda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col md:flex-row gap-6">
      {/* Produtos/Serviços */}
      <div className="w-full md:w-1/3 bg-white p-4 rounded shadow flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Produtos / Serviços</h2>
        {produtos.length === 0 && <p>Nenhum item disponível</p>}
        {produtos.map(p => (
          <div key={p.id} className="flex justify-between items-center border-b py-2">
            <div>
              <p className="font-medium">{p.nome}</p>
              <p className="text-sm text-gray-600">
                Kz {p.preco.toFixed(2)} {p.tipo === 'servico' && '(Serviço)'}
              </p>
              {p.tipo === 'produto' && <p className="text-xs text-gray-500">Estoque: {p.estoque}</p>}
            </div>
            <button
              onClick={() => addItem(p)}
              disabled={p.tipo === 'produto' && p.estoque <= 0}
              className={`px-2 py-1 rounded text-white ${p.tipo === 'produto' && p.estoque <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'}`}
            >
              Adicionar
            </button>
          </div>
        ))}
      </div>

      {/* Carrinho */}
      <div className="flex-1 bg-white p-4 rounded shadow flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Venda</h2>
        {itens.length === 0 && <p>Adicione itens para criar a venda</p>}
        {itens.map((i, index) => (
          <div key={index} className="flex justify-between items-center border-b py-2">
            <div>
              <p className="font-medium">{i.nome} {i.servico_id ? '(Serviço)' : ''}</p>
              <p className="text-sm text-gray-600">
                Kz {i.preco_unitario.toFixed(2)} x
                <input
                  type="number"
                  min={1}
                  value={i.quantidade}
                  onChange={e => updateQuantidade(index, Number(e.target.value))}
                  className="w-16 ml-2 border px-2 py-1 rounded"
                /> = Kz {i.subtotal.toFixed(2)}
              </p>
            </div>
            <button onClick={() => removeItem(index)} className="px-2 py-1 bg-red-600 text-white rounded">Remover</button>
          </div>
        ))}
        <div className="mt-4 flex justify-between items-center">
          <input type="number" min={0} value={desconto} onChange={e => setDesconto(Number(e.target.value))} placeholder="Desconto" className="border px-3 py-2 rounded w-32"/>
          <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className="border px-3 py-2 rounded">
            <option value="dinheiro">Dinheiro</option>
            <option value="multicaixa">Multicaixa</option>
            <option value="transferencia">Transferência</option>
          </select>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-lg font-semibold">Total: Kz {total.toFixed(2)}</p>
          <button onClick={criarVenda} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">{loading ? 'Salvando...' : 'Criar Venda'}</button>
        </div>
      </div>

      {/* Vendas recentes */}
      <div className="w-full md:w-1/3 bg-white p-4 rounded shadow flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Vendas Recentes</h2>
        {vendas.length === 0 && <p>Nenhuma venda realizada</p>}
        {vendas.map(v => (
          <div key={v.id} className="border-b py-2">
            <p className="font-medium">Venda #{v.id}</p>
            <p>Total: Kz {Number(v.total).toFixed(2)}</p>
            <p>Itens: {v.itens.length}</p>
            <p>Pagamento: {v.forma_pagamento}</p>
          </div>
        ))}
      </div>

      {message && <div className="fixed top-6 right-6 p-3 bg-gray-100 rounded border shadow-lg">{message}</div>}
    </div>
  );
}