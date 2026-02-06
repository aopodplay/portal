'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

interface Produto {
    id: number;
    nome: string;
    tipo: string;
    preco: number;
    estoque: number;
}

interface VendaItem {
    produto_id: number;
    nome: string;
    quantidade: number;
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
    const [formaPagamento, setFormaPagamento] = useState<string>('Dinheiro');
    const [vendas, setVendas] = useState<Venda[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // ================= BUSCAR PRODUTOS =================
    const fetchProdutos = async () => {
        try {
            const res = await fetch(getApiUrl('/produtos/venda'), { headers: getAuthHeaders() });
            const data = await res.json();

            if (!Array.isArray(data)) {
                console.error('Formato inválido de produtos:', data);
                setMessage('Erro ao carregar produtos');
                return;
            }

            const produtosDisponiveis = data
                .filter((p: any) => p.tipo === 'servico' || Number(p.estoque) > 0)
                .map((p: any) => ({
                    id: p.id,
                    nome: p.nome,
                    tipo: p.tipo,
                    preco: Number(p.preco),
                    estoque: Number(p.estoque)
                }));

            setProdutos(produtosDisponiveis);
        } catch (err) {
            console.error('Erro ao buscar produtos:', err);
            setMessage('Erro ao buscar produtos');
        }
    };

    // ================= BUSCAR VENDAS =================
    const fetchVendas = async () => {
        try {
            const res = await fetch(getApiUrl('/vendas'), { headers: getAuthHeaders() });
            const data = await res.json();
            setVendas(data);
        } catch (err) {
            console.error('Erro ao buscar vendas:', err);
            setMessage('Erro ao buscar vendas');
        }
    };

    useEffect(() => {
        fetchProdutos();
        fetchVendas();
    }, []);

    // ================= ADICIONAR ITEM =================
    const addItem = (produto: Produto) => {
        if (itens.find(i => i.produto_id === produto.id)) {
            setMessage('Produto já adicionado');
            return;
        }
        setItens([
            ...itens,
            {
                produto_id: produto.id,
                nome: produto.nome,
                quantidade: 1,
                subtotal: produto.preco
            }
        ]);
    };

    // ================= REMOVER ITEM =================
    const removeItem = (produto_id: number) => {
        setItens(itens.filter(i => i.produto_id !== produto_id));
    };

    // ================= ATUALIZAR QUANTIDADE =================
    const updateQuantidade = (produto_id: number, quantidade: number) => {
        if (quantidade <= 0) return;
        const precoProduto = produtos.find(p => p.id === produto_id)?.preco || 0;
        setItens(
            itens.map(i =>
                i.produto_id === produto_id
                    ? { ...i, quantidade, subtotal: quantidade * precoProduto }
                    : i
            )
        );
    };

    // ================= TOTAL =================
    const total = itens.reduce((sum, i) => sum + i.subtotal, 0) - desconto;

    // ================= CRIAR VENDA =================
    const criarVenda = async () => {
        if (itens.length === 0) {
            setMessage('Adicione pelo menos um produto');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const res = await fetch(getApiUrl('/vendas'), {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paciente_id: null,
                    forma_pagamento: formaPagamento,
                    desconto,
                    itens: itens.map(i => ({
                        produto_id: i.produto_id,
                        quantidade: i.quantidade
                    }))
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erro ao criar venda');
            }

            const vendaCriada = await res.json();

            // Atualiza estoque local
            const novosProdutos = produtos.map(p => {
                const itemVendido = itens.find(i => i.produto_id === p.id);
                if (itemVendido && p.tipo !== 'servico') {
                    return { ...p, estoque: p.estoque - itemVendido.quantidade };
                }
                return p;
            });

            setProdutos(novosProdutos);

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
        <div className="p-6 w-full flex flex-col md:flex-row gap-6">
            {/* PRODUTOS */}
            <div className="w-full md:w-1/3 bg-white p-4 rounded shadow flex flex-col gap-3">
                <h2 className="text-xl font-semibold">Produtos</h2>
                {produtos.length === 0 && <p>Nenhum produto disponível</p>}
                {produtos.map(p => (
                    <div key={p.id} className="flex justify-between items-center border-b py-2">
                        <div>
                            <p className="font-medium">{p.nome}</p>
                            <p className="text-sm text-gray-600">Kz {p.preco.toFixed(2)}</p>
                            {p.tipo !== 'servico' && <p className="text-xs text-gray-500">Estoque: {p.estoque}</p>}
                        </div>
                        <button
                            onClick={() => addItem(p)}
                            disabled={p.tipo !== 'servico' && p.estoque <= 0}
                            className={`px-2 py-1 rounded text-white ${p.tipo !== 'servico' && p.estoque <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'}`}
                        >
                            Adicionar
                        </button>
                    </div>
                ))}
            </div>

            {/* VENDA */}
            <div className="flex-1 bg-white p-4 rounded shadow flex flex-col gap-3">
                <h2 className="text-xl font-semibold">Venda</h2>
                {itens.length === 0 && <p>Adicione produtos para criar a venda</p>}
                {itens.map(i => (
                    <div key={i.produto_id} className="flex justify-between items-center border-b py-2">
                        <div>
                            <p className="font-medium">{i.nome}</p>
                            <p className="text-sm text-gray-600">
                                Kz {produtos.find(p => p.id === i.produto_id)?.preco.toFixed(2)} x
                                <input
                                    type="number"
                                    min={1}
                                    value={i.quantidade}
                                    onChange={e => updateQuantidade(i.produto_id, Number(e.target.value))}
                                    className="w-16 ml-2 border px-2 py-1 rounded"
                                /> = Kz {i.subtotal.toFixed(2)}
                            </p>
                        </div>
                        <button onClick={() => removeItem(i.produto_id)} className="px-2 py-1 bg-red-600 text-white rounded">
                            Remover
                        </button>
                    </div>
                ))}

                <div className="flex gap-3 items-center mt-4">
                    <input type="number" min={0} value={desconto} onChange={e => setDesconto(Number(e.target.value))} placeholder="Desconto" className="border px-3 py-2 rounded" />
                    <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className="border px-3 py-2 rounded">
                        <option value="dinheiro">Dinheiro</option>
                        <option value="multicaixa">Multicaixa</option>
                        <option value="transferencia">Transferência</option>
                    </select>
                </div>

                <div className="mt-4 flex justify-between items-center">
                    <p className="text-lg font-semibold">Total: Kz {total.toFixed(2)}</p>
                    <button onClick={criarVenda} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">
                        {loading ? 'Salvando...' : 'Criar Venda'}
                    </button>
                </div>
            </div>

            {/* VENDAS */}
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
