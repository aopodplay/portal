'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Edit2, Trash2, X } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Paciente {
    id?: number;
    nome: string;
    data_nascimento: string;
    sexo: 'M' | 'F' | '';
    telefone: string;
    endereco: string;
    nif: string;
}

interface NotificationState {
    show: boolean;
    message: string;
    type: 'success' | 'error';
}

export default function PacientesPage() {
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [pacienteToDelete, setPacienteToDelete] = useState<Paciente | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [notification, setNotification] = useState<NotificationState>({
        show: false,
        message: '',
        type: 'success'
    });

    const [newPaciente, setNewPaciente] = useState<Paciente>({
        nome: '',
        data_nascimento: '',
        sexo: '',
        telefone: '',
        endereco: '',
        nif: ''
    });

    /* ---------------- BUSCAR PACIENTES ---------------- */
    const fetchPacientes = async () => {
        setLoading(true);
        try {
            const response = await fetch(getApiUrl(API_ENDPOINTS.PACIENTES), {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            setPacientes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPacientes(); }, []);

    /* ---------------- CRIAR ---------------- */
    const handleCreatePaciente = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(getApiUrl(API_ENDPOINTS.PACIENTES), {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(newPaciente)
            });
            if (!response.ok) throw new Error();
            await fetchPacientes();
            setIsModalOpen(false);
            setNewPaciente({ nome: '', data_nascimento: '', sexo: '', telefone: '', endereco: '', nif: '' });
            setNotification({ show: true, message: 'Paciente criado com sucesso!', type: 'success' });
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
        } catch {
            setNotification({ show: true, message: 'Erro ao criar paciente', type: 'error' });
        }
    };

    /* ---------------- EDITAR ---------------- */
    const handleUpdatePaciente = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPaciente?.id) return;
        try {
            const response = await fetch(`${getApiUrl(API_ENDPOINTS.PACIENTES)}/${editingPaciente.id}`, {
                method: 'PUT',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPaciente)
            });
            if (!response.ok) throw new Error();
            await fetchPacientes();
            setIsEditModalOpen(false);
            setEditingPaciente(null);
            setNotification({ show: true, message: 'Paciente atualizado com sucesso!', type: 'success' });
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
        } catch {
            setNotification({ show: true, message: 'Erro ao atualizar paciente', type: 'error' });
        }
    };

    /* ---------------- DELETAR ---------------- */
    const handleDeletePaciente = async () => {
        if (!pacienteToDelete?.id) return;
        try {
            const response = await fetch(`${getApiUrl(API_ENDPOINTS.PACIENTES)}/${pacienteToDelete.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            // Aceitar 200 ou 204
            if (!response.ok && response.status !== 204) throw new Error();

            await fetchPacientes();
            setIsDeleteModalOpen(false);
            setPacienteToDelete(null);
            setNotification({ show: true, message: 'Paciente excluído com sucesso!', type: 'success' });
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
        } catch {
            setNotification({ show: true, message: 'Erro ao excluir paciente', type: 'error' });
        }
    };

    /* ---------------- FILTRAGEM E PAGINAÇÃO ---------------- */
    const filteredPacientes = useMemo(() =>
        pacientes.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase())),
        [pacientes, searchTerm]);

    const totalPages = Math.ceil(filteredPacientes.length / itemsPerPage);
    const currentItems = filteredPacientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return <div className="p-6">Carregando pacientes...</div>;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Pacientes</h1>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <PlusCircle size={20} /> Novo Paciente
                </button>
            </div>

            {/* Notificação */}
            {notification.show && (
                <div className={`p-3 mb-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {notification.message}
                </div>
            )}

            {/* Busca */}
            <div className="mb-4">
                <input type="text" placeholder="Buscar pacientes..." value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 text-left">Nome</th>
                            <th className="p-4 text-left">Data Nasc.</th>
                            <th className="p-4 text-left">Sexo</th>
                            <th className="p-4 text-left">Telefone</th>
                            <th className="p-4 text-left">Endereço</th>
                            <th className="p-4 text-left">NIF</th>
                            <th className="p-4 text-left">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="p-4">{p.nome}</td>
                                <td className="p-4">{p.data_nascimento?.split('T')[0]}</td>
                                <td className="p-4">{p.sexo}</td>
                                <td className="p-4">{p.telefone}</td>
                                <td className="p-4">{p.endereco}</td>
                                <td className="p-4">{p.nif}</td>
                                <td className="p-4 flex gap-2">
                                    <button onClick={() => {
                                        setEditingPaciente({
                                            ...p, data_nascimento: p.data_nascimento ? p.data_nascimento.split('T')[0]
                                                : ''
                                        });
                                        setIsEditModalOpen(true);
                                    }}
                                        className="p-1 hover:text-blue-600"
                                    >
                                        <Edit2 size={18} />
                                    </button>

                                    <button onClick={() => { setPacienteToDelete(p); setIsDeleteModalOpen(true) }} className="p-1 hover:text-red-600"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginação */}
            <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} até {Math.min(currentPage * itemsPerPage, filteredPacientes.length)} de {filteredPacientes.length}
                </div>
                <div className="flex gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Próxima</button>
                </div>
            </div>

            {/* ---------------- MODAIS ---------------- */}

            {/* Modal Criar */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4"><X size={24} /></button>
                        <h2 className="text-xl font-bold mb-4">Novo Paciente</h2>
                        <form onSubmit={handleCreatePaciente} className="space-y-3">
                            <input type="text" placeholder="Nome" required value={newPaciente.nome} onChange={e => setNewPaciente({ ...newPaciente, nome: e.target.value })} className="w-full px-3 py-2 border rounded" />
                            <input type="date" placeholder="Data Nascimento" required value={newPaciente.data_nascimento} onChange={e => setNewPaciente({ ...newPaciente, data_nascimento: e.target.value })} className="w-full px-3 py-2 border rounded" />
                            <select required value={newPaciente.sexo} onChange={e => setNewPaciente({ ...newPaciente, sexo: e.target.value as 'M' | 'F' })} className="w-full px-3 py-2 border rounded">
                                <option value="">Selecione o sexo</option>
                                <option value="M">Masculino</option>
                                <option value="F">Feminino</option>
                            </select>
                            <input type="text" placeholder="Telefone" value={newPaciente.telefone} onChange={e => setNewPaciente({ ...newPaciente, telefone: e.target.value })} className="w-full px-3 py-2 border rounded" />
                            <input type="text" placeholder="Endereço" value={newPaciente.endereco} onChange={e => setNewPaciente({ ...newPaciente, endereco: e.target.value })} className="w-full px-3 py-2 border rounded" />
                            <input type="text" placeholder="NIF" value={newPaciente.nif} onChange={e => setNewPaciente({ ...newPaciente, nif: e.target.value })} className="w-full px-3 py-2 border rounded" />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Editar */}
            {isEditModalOpen && editingPaciente && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4"><X size={24} /></button>
                        <h2 className="text-xl font-bold mb-4">Editar Paciente</h2>
                        <form onSubmit={handleUpdatePaciente} className="space-y-3">
                            <input type="text" placeholder="Nome" required value={editingPaciente.nome} onChange={e => setEditingPaciente({ ...editingPaciente, nome: e.target.value })} className="w-full px-3 py-2 border rounded" />
                            <input type="date" placeholder="Data Nascimento" required value={editingPaciente.data_nascimento} onChange={e => setEditingPaciente({ ...editingPaciente, data_nascimento: e.target.value })} className="w-full px-3 py-2 border rounded" />
                            <select required value={editingPaciente.sexo} onChange={e => setEditingPaciente({ ...editingPaciente, sexo: e.target.value as 'M' | 'F' })} className="w-full px-3 py-2 border rounded">
                                <option value="">Selecione o sexo</option>
                                <option value="M">Masculino</option>
                                <option value="F">Feminino</option>
                            </select>
                            <input type="text" placeholder="Telefone" value={editingPaciente.telefone} onChange={e => setEditingPaciente({ ...editingPaciente, telefone: e.target.value })} className="w-full px-3 py-2 border rounded" />
                            <input type="text" placeholder="Endereço" value={editingPaciente.endereco} onChange={e => setEditingPaciente({ ...editingPaciente, endereco: e.target.value })} className="w-full px-3 py-2 border rounded" />
                            <input
                                type="text"
                                placeholder="NIF"
                                value={editingPaciente.nif.toUpperCase()} // garante que o valor mostrado seja maiúsculo
                                onChange={(e) =>
                                    setEditingPaciente({
                                        ...editingPaciente,
                                        nif: e.target.value.toUpperCase(), // garante que o estado seja maiúsculo
                                    })
                                }
                                className="w-full px-3 py-2 border rounded uppercase"
                                autoComplete="off"
                            />

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Excluir */}
            {isDeleteModalOpen && pacienteToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
                        <p>Tem certeza que deseja excluir <strong>{pacienteToDelete.nome}</strong>?</p>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                            <button onClick={handleDeletePaciente} className="px-4 py-2 bg-red-600 text-white rounded">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
