'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, Edit2, Trash2, X } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Fatura {
  id?: number;
  atendimento_id?: number;
  paciente_id: number;
  paciente_nome?: string;
  valor: number;
  descricao: string;
  data?: string;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function FaturasPage() {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingFatura, setEditingFatura] = useState<Fatura | null>(null);
  const [faturaToDelete, setFaturaToDelete] = useState<Fatura | null>(null);

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'success',
  });

  const [newFatura, setNewFatura] = useState<Fatura>({
    paciente_id: 0,
    valor: 0,
    descricao: '',
  });

  // ====================== BUSCAR FATURAS ======================
  const fetchFaturas = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.FATURAS), { headers: getAuthHeaders() });
      const data = await res.json();
      setFaturas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaturas();

    // Polling para atualizar automaticamente novas faturas (opcional)
    const interval = setInterval(fetchFaturas, 5000);
    return () => clearInterval(interval);
  }, []);

  // ====================== CRIAR FATURA ======================
  const handleCreateFatura = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.FATURAS), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newFatura),
      });
      if (!res.ok) throw new Error('Erro ao criar fatura');
      await fetchFaturas();
      setIsModalOpen(false);
      setNewFatura({ paciente_id: 0, valor: 0, descricao: '' });
      setNotification({ show: true, message: 'Fatura criada com sucesso!', type: 'success' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    } catch (err) {
      console.error(err);
      setNotification({ show: true, message: 'Erro ao criar fatura', type: 'error' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    }
  };

  // ====================== EDITAR FATURA ======================
  const handleUpdateFatura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFatura?.id) return;
    try {
      const res = await fetch(`${getApiUrl(API_ENDPOINTS.FATURAS)}/${editingFatura.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingFatura),
      });
      if (!res.ok) throw new Error('Erro ao atualizar fatura');
      await fetchFaturas();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ====================== DELETAR FATURA ======================
  const handleDeleteFatura = async () => {
    if (!faturaToDelete?.id) return;
    try {
      const res = await fetch(`${getApiUrl(API_ENDPOINTS.FATURAS)}/${faturaToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao excluir fatura');
      await fetchFaturas();
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ====================== IMPRIMIR FATURA ======================
  const handlePrintFatura = (fatura: Fatura) => {
    const printContent = `
      <html>
        <head>
          <title>Fatura do Paciente</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #333; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          <h2>Fatura</h2>
          <p><strong>Paciente:</strong> ${fatura.paciente_nome || fatura.paciente_id}</p>
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${fatura.descricao}</td>
                <td>${Number(fatura.valor).toFixed(2)}</td>
                <td>${fatura.data || '-'}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  if (loading) return <div className="p-6">Carregando faturas...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Faturas</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusCircle size={20} /> Nova Fatura
        </button>
      </div>

      {notification.show && (
        <div className={`p-3 mb-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.message}
        </div>
      )}

      {/* ====================== TABELA ====================== */}
      <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Paciente</th>
              <th className="p-4 text-left">Descrição</th>
              <th className="p-4 text-left">Valor</th>
              <th className="p-4 text-left">Data</th>
              <th className="p-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {faturas.map((fatura, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-4">{fatura.paciente_nome || fatura.paciente_id}</td>
                <td className="p-4">{fatura.descricao}</td>
                <td className="p-4">{Number(fatura.valor).toFixed(2)}</td>
                <td className="p-4">{fatura.data || '-'}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => { setEditingFatura(fatura); setIsEditModalOpen(true); }} className="p-1 hover:text-blue-600"><Edit2 size={18} /></button>
                  <button onClick={() => { setFaturaToDelete(fatura); setIsDeleteModalOpen(true); }} className="p-1 hover:text-red-600"><Trash2 size={18} /></button>
                  <button onClick={() => handlePrintFatura(fatura)} className="p-1 hover:text-green-600" title="Imprimir Fatura">🖨️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ====================== MODAL NOVA FATURA ====================== */}
      {isModalOpen && (
        <Modal title="Nova Fatura" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleCreateFatura} className="space-y-4">
            <input type="number" required placeholder="ID do Paciente" value={newFatura.paciente_id} onChange={e => setNewFatura({...newFatura, paciente_id:Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" />
            <input type="text" required placeholder="Descrição" value={newFatura.descricao} onChange={e => setNewFatura({...newFatura, descricao:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            <input type="number" required placeholder="Valor" value={newFatura.valor} onChange={e => setNewFatura({...newFatura, valor:Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ====================== MODAL EDITAR FATURA ====================== */}
      {isEditModalOpen && editingFatura && (
        <Modal title="Editar Fatura" onClose={() => setIsEditModalOpen(false)}>
          <form onSubmit={handleUpdateFatura} className="space-y-4">
            <input type="number" required placeholder="ID do Paciente" value={editingFatura.paciente_id} onChange={e => setEditingFatura({...editingFatura, paciente_id:Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" />
            <input type="text" required placeholder="Descrição" value={editingFatura.descricao} onChange={e => setEditingFatura({...editingFatura, descricao:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            <input type="number" required placeholder="Valor" value={editingFatura.valor} onChange={e => setEditingFatura({...editingFatura, valor:Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={()=>setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ====================== MODAL DELETAR ====================== */}
      {isDeleteModalOpen && faturaToDelete && (
        <Modal title="Confirmar Exclusão" onClose={() => setIsDeleteModalOpen(false)}>
          <p>Tem certeza que deseja excluir a fatura do paciente <strong>{faturaToDelete.paciente_nome || faturaToDelete.paciente_id}</strong>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={()=>setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
            <button onClick={handleDeleteFatura} className="px-4 py-2 rounded-lg bg-red-600 text-white">Excluir</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ====================== COMPONENTE MODAL ======================
interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const Modal = ({ title, children, onClose }: ModalProps) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
      <button onClick={onClose} className="absolute top-4 right-4"><X size={24} /></button>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  </div>
);
