'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, Edit2, Trash2, X } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Receita {
  id?: number;
  paciente_id: number;
  paciente_nome?: string;
  medicamento: string;
  dosagem: string;
  observacoes?: string;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function ReceitaPage() {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingReceita, setEditingReceita] = useState<Receita | null>(null);
  const [receitaToDelete, setReceitaToDelete] = useState<Receita | null>(null);

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'success',
  });

  const [newReceita, setNewReceita] = useState<Receita>({
    paciente_id: 0,
    medicamento: '',
    dosagem: '',
    observacoes: '',
  });

  // ====================== BUSCAR RECEITAS ======================
  const fetchReceitas = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.RECEITA), { headers: getAuthHeaders() });
      const data = await res.json();
      setReceitas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceitas();
  }, []);

  // ====================== CRIAR RECEITA ======================
  const handleCreateReceita = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.RECEITA), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newReceita),
      });
      if (!res.ok) throw new Error('Erro ao criar receita');
      await fetchReceitas();
      setIsModalOpen(false);
      setNewReceita({ paciente_id: 0, medicamento: '', dosagem: '', observacoes: '' });
      setNotification({ show: true, message: 'Receita criada com sucesso!', type: 'success' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    } catch (err) {
      console.error(err);
      setNotification({ show: true, message: 'Erro ao criar receita', type: 'error' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    }
  };

  // ====================== EDITAR RECEITA ======================
  const handleUpdateReceita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceita?.id) return;
    try {
      const res = await fetch(`${getApiUrl(API_ENDPOINTS.RECEITA)}/${editingReceita.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingReceita),
      });
      if (!res.ok) throw new Error('Erro ao atualizar receita');
      await fetchReceitas();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ====================== DELETAR RECEITA ======================
  const handleDeleteReceita = async () => {
    if (!receitaToDelete?.id) return;
    try {
      const res = await fetch(`${getApiUrl(API_ENDPOINTS.RECEITA)}/${receitaToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao excluir receita');
      await fetchReceitas();
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ====================== IMPRIMIR RECEITA ======================
  const handlePrintReceita = (receita: Receita) => {
    const printContent = `
      <html>
        <head>
          <title>Receita do Paciente</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #333; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          <h2>Receita Médica</h2>
          <p><strong>Paciente ID:</strong> ${receita.paciente_id}</p>
          ${receita.paciente_nome ? `<p><strong>Paciente Nome:</strong> ${receita.paciente_nome}</p>` : ''}
          <table>
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Dosagem</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${receita.medicamento}</td>
                <td>${receita.dosagem}</td>
                <td>${receita.observacoes || '-'}</td>
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

  if (loading) return <div className="p-6">Carregando receitas...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Receitas</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusCircle size={20} /> Nova Receita
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
              <th className="p-4 text-left">Medicamento</th>
              <th className="p-4 text-left">Dosagem</th>
              <th className="p-4 text-left">Observações</th>
              <th className="p-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {receitas.map((receita, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-4">{receita.paciente_nome || receita.paciente_id}</td>
                <td className="p-4">{receita.medicamento}</td>
                <td className="p-4">{receita.dosagem}</td>
                <td className="p-4">{receita.observacoes}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => { setEditingReceita(receita); setIsEditModalOpen(true); }} className="p-1 hover:text-blue-600"><Edit2 size={18} /></button>
                  <button onClick={() => { setReceitaToDelete(receita); setIsDeleteModalOpen(true); }} className="p-1 hover:text-red-600"><Trash2 size={18} /></button>
                  <button onClick={() => handlePrintReceita(receita)} className="p-1 hover:text-green-600" title="Imprimir Receita">🖨️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ====================== MODAL NOVA RECEITA ====================== */}
      {isModalOpen && (
        <Modal title="Nova Receita" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleCreateReceita} className="space-y-4">
            <input type="number" required placeholder="ID do Paciente" value={newReceita.paciente_id} onChange={e => setNewReceita({...newReceita, paciente_id: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" />
            <input type="text" required placeholder="Medicamento" value={newReceita.medicamento} onChange={e => setNewReceita({...newReceita, medicamento:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            <input type="text" required placeholder="Dosagem" value={newReceita.dosagem} onChange={e => setNewReceita({...newReceita, dosagem:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            <textarea placeholder="Observações" value={newReceita.observacoes} onChange={e => setNewReceita({...newReceita, observacoes:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ====================== MODAL EDITAR RECEITA ====================== */}
      {isEditModalOpen && editingReceita && (
        <Modal title="Editar Receita" onClose={() => setIsEditModalOpen(false)}>
          <form onSubmit={handleUpdateReceita} className="space-y-4">
            <input type="number" required placeholder="ID do Paciente" value={editingReceita.paciente_id} onChange={e => setEditingReceita({...editingReceita, paciente_id:Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" />
            <input type="text" required placeholder="Medicamento" value={editingReceita.medicamento} onChange={e => setEditingReceita({...editingReceita, medicamento:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            <input type="text" required placeholder="Dosagem" value={editingReceita.dosagem} onChange={e => setEditingReceita({...editingReceita, dosagem:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            <textarea placeholder="Observações" value={editingReceita.observacoes} onChange={e => setEditingReceita({...editingReceita, observacoes:e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={()=>setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ====================== MODAL DELETAR ====================== */}
      {isDeleteModalOpen && receitaToDelete && (
        <Modal title="Confirmar Exclusão" onClose={() => setIsDeleteModalOpen(false)}>
          <p>Tem certeza que deseja excluir a receita do paciente <strong>{receitaToDelete.paciente_nome || receitaToDelete.paciente_id}</strong>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={()=>setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
            <button onClick={handleDeleteReceita} className="px-4 py-2 rounded-lg bg-red-600 text-white">Excluir</button>
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
