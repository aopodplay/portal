'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, X } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Venda {
    id?: number;
    cliente: string;
    produto: string;
    quantidade: number;
    valor: number;
    data: string;
    criadoEm?: string;
    atualizadoEm?: string;
}

interface NotificationState {
    show: boolean;
    message: string;
    type: 'success' | 'error';
}

export default function VendasPage() {
    const [vendas, setVendas] = useState<Venda[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [vendaToDelete, setVendaToDelete] = useState<Venda | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [notification, setNotification] = useState<NotificationState>({
        show: false,
        message: '',
        type: 'success'
    });

    const [newVenda, setNewVenda] = useState<Venda>({
        cliente: '',
        produto: '',
        quantidade: 1,
        valor: 0,
        data: ''
    });

    // Buscar vendas
    const fetchVendas = async () => {
        try {
            const response = await fetch(getApiUrl(API_ENDPOINTS.VENDAS), { headers: getAuthHeaders() });
            const data = await response.json();
            setVendas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchVendas(); }, []);

    // Criar venda
    const handleCreateVenda = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${getApiUrl(API_ENDPOINTS.VENDAS)}/register`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newVenda)
            });
            if (!response.ok) throw new Error('Erro ao criar venda');
            await fetchVendas();
            setIsModalOpen(false);
            setNotification({ show: true, message: 'Venda criada com sucesso!', type: 'success' });
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
        } catch (error) {
            console.error(error);
            setNotification({ show: true, message: 'Erro ao criar venda', type: 'error' });
        }
    };

    // Atualizar venda
    const handleUpdateVenda = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingVenda) return;
        try {
            const response = await fetch(`${getApiUrl(API_ENDPOINTS.VENDAS)}/update/${editingVenda.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(editingVenda)
            });
            if (!response.ok) throw new Error('Erro ao atualizar venda');
            await fetchVendas();
            setIsEditModalOpen(false);
        } catch (error) {
            console.error(error);
            setNotification({ show: true, message: 'Erro ao atualizar venda', type: 'error' });
        }
    };

    // Deletar venda
    const handleDeleteVenda = async () => {
        if (!vendaToDelete?.id) return;
        try {
            const response = await fetch(`${getApiUrl(API_ENDPOINTS.VENDAS)}/delete/${vendaToDelete.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Erro ao excluir venda');
            await fetchVendas();
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error(error);
            setNotification({ show: true, message: 'Erro ao excluir venda', type: 'error' });
        }
    };

    // Filtragem e paginação
    const filteredVendas = vendas.filter(v =>
        v.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.produto.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredVendas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredVendas.length / itemsPerPage);

    if (loading) return <div className="p-6">Carregando...</div>;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Vendas</h1>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <PlusCircle size={20} /> Nova Venda
                </button>
            </div>

            {/* Busca */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar por cliente ou produto..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 text-left">Cliente</th>
                            <th className="p-4 text-left">Produto</th>
                            <th className="p-4 text-left">Quantidade</th>
                            <th className="p-4 text-left">Valor</th>
                            <th className="p-4 text-left">Data</th>
                            <th className="p-4 text-left">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((v, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="p-4">{v.cliente}</td>
                                <td className="p-4">{v.produto}</td>
                                <td className="p-4">{v.quantidade}</td>
                                <td className="p-4">{v.valor.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</td>
                                <td className="p-4">{v.data}</td>
                                <td className="p-4 flex gap-2">
                                    <button onClick={() => { setEditingVenda(v); setIsEditModalOpen(true); }} className="p-1 hover:text-blue-600"><Edit2 size={18} /></button>
                                    <button onClick={() => { setVendaToDelete(v); setIsDeleteModalOpen(true); }} className="p-1 hover:text-red-600"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginação */}
            <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">Mostrando {indexOfFirstItem + 1} até {Math.min(indexOfLastItem, filteredVendas.length)} de {filteredVendas.length}</div>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev-1,1))} disabled={currentPage === 1}>Prev</button>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev+1,totalPages))} disabled={currentPage === totalPages}>Next</button>
                </div>
            </div>

            {/* Modal Criar Venda */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4"><X size={24} /></button>
                        <h2 className="text-xl font-bold mb-4">Nova Venda</h2>
                        <form onSubmit={handleCreateVenda} className="space-y-4">
                            <input type="text" required placeholder="Cliente" value={newVenda.cliente} onChange={e => setNewVenda({...newVenda, cliente:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                            <input type="text" required placeholder="Produto" value={newVenda.produto} onChange={e => setNewVenda({...newVenda, produto:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                            <input type="number" required placeholder="Quantidade" value={newVenda.quantidade} onChange={e => setNewVenda({...newVenda, quantidade:Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" />
                            <input type="number" required placeholder="Valor" value={newVenda.valor} onChange={e => setNewVenda({...newVenda, valor:Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" />
                            <input type="date" required value={newVenda.data} onChange={e => setNewVenda({...newVenda, data:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Editar Venda */}
            {isEditModalOpen && editingVenda && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                        <button onClick={()=>setIsEditModalOpen(false)} className="absolute top-4 right-4"><X size={24}/></button>
                        <h2 className="text-xl font-bold mb-4">Editar Venda</h2>
                        <form onSubmit={handleUpdateVenda} className="space-y-4">
                            <input type="text" required value={editingVenda.cliente} onChange={e=>setEditingVenda({...editingVenda, cliente:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                            <input type="text" required value={editingVenda.produto} onChange={e=>setEditingVenda({...editingVenda, produto:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                            <input type="number" required value={editingVenda.quantidade} onChange={e=>setEditingVenda({...editingVenda, quantidade:Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" />
                            <input type="number" required value={editingVenda.valor} onChange={e=>setEditingVenda({...editingVenda, valor:Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" />
                            <input type="date" required value={editingVenda.data} onChange={e=>setEditingVenda({...editingVenda, data:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={()=>setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Excluir Venda */}
            {isDeleteModalOpen && vendaToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                        <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
                        <p>Tem certeza que deseja excluir a venda de <strong>{vendaToDelete.cliente}</strong>?</p>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={()=>setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
                            <button onClick={handleDeleteVenda} className="px-4 py-2 rounded-lg bg-red-600 text-white">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
