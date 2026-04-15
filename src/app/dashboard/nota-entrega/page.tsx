'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText, Search, Printer, Plus, X, Edit, Trash2,
  Calendar, User, Truck, CheckCircle, AlertCircle,
  ChevronLeft, ChevronRight, Package, Phone, Mail, Hash,
  ClipboardList, Signature, UserCheck
} from 'lucide-react';

interface Paciente {
  id: number;
  nome: string;
  telefone?: string;
  nif?: string;
  email?: string;
  endereco?: string;
}

interface Venda {
  id: number;
  total: number;
  created_at: string;
  paciente?: Paciente;
}

interface NotaEntrega {
  id: number;
  numero_nota: string;
  paciente_id: number;
  venda_id: number;
  usuario_id: number;
  data_emissao: string;
  data_entrega: string | null;
  status: 'pendente' | 'entregue' | 'cancelada';
  observacoes: string | null;
  itens: Array<{
    nome: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
  }>;
  assinatura_recebedor: string | null;
  nome_recebedor: string | null;
  documento_recebedor: string | null;
  paciente?: Paciente;
  venda?: Venda;
}

const ITEMS_PER_PAGE = 10;

export default function NotaEntregaPage() {
  const { user } = useAuth();
  const [notas, setNotas] = useState<NotaEntrega[]>([]);
  const [filteredNotas, setFilteredNotas] = useState<NotaEntrega[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNota, setSelectedNota] = useState<NotaEntrega | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  const [formData, setFormData] = useState({
    venda_id: '',
    observacoes: '',
    nome_recebedor: '',
    documento_recebedor: ''
  });

  const [entregaData, setEntregaData] = useState({
    nome_recebedor: '',
    documento_recebedor: '',
    assinatura_recebedor: ''
  });

  const userPerfil = user?.perfil?.toLowerCase() || '';
  const isAdmin = userPerfil === 'admin';
  const isCaixa = userPerfil === 'caixa';
  const canEdit = isAdmin || isCaixa;

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    filtrarNotas();
  }, [searchTerm, notas]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarNotas(),
        carregarVendas()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarNotas = async () => {
    try {
      const res = await fetch(getApiUrl('/notas-entrega'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setNotas(data);
        setFilteredNotas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
    }
  };

  const carregarVendas = async () => {
    try {
      const res = await fetch(getApiUrl('/vendas'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        // Filtrar apenas vendas que não têm nota de entrega
        const vendasComNota = notas.map(n => n.venda_id);
        const vendasDisponiveis = (data.data || data).filter((v: Venda) => !vendasComNota.includes(v.id));
        setVendas(vendasDisponiveis);
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    }
  };

  const filtrarNotas = () => {
    if (!searchTerm.trim()) {
      setFilteredNotas(notas);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = notas.filter(n =>
        n.numero_nota.toLowerCase().includes(term) ||
        n.paciente?.nome.toLowerCase().includes(term) ||
        n.paciente?.nif?.toLowerCase().includes(term) ||
        n.status.toLowerCase().includes(term)
      );
      setFilteredNotas(filtered);
    }
    setCurrentPage(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEntregaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEntregaData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      venda_id: '',
      observacoes: '',
      nome_recebedor: '',
      documento_recebedor: ''
    });
    setEntregaData({
      nome_recebedor: '',
      documento_recebedor: '',
      assinatura_recebedor: ''
    });
    setSelectedNota(null);
  };

  const abrirModalCriar = () => {
    resetForm();
    setModalOpen(true);
  };

  const abrirModalEntrega = (nota: NotaEntrega) => {
    setSelectedNota(nota);
    setEntregaData({
      nome_recebedor: nota.nome_recebedor || nota.paciente?.nome || '',
      documento_recebedor: nota.documento_recebedor || '',
      assinatura_recebedor: ''
    });
    setModalOpen(true);
  };

  const criarNotaEntrega = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.venda_id) {
      mostrarMensagem('error', 'Selecione uma venda');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(getApiUrl('/notas-entrega'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venda_id: Number(formData.venda_id),
          observacoes: formData.observacoes || null,
          nome_recebedor: formData.nome_recebedor || null,
          documento_recebedor: formData.documento_recebedor || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar nota de entrega');

      mostrarMensagem('success', `Nota de Entrega ${data.numero_nota} criada com sucesso!`);
      setModalOpen(false);
      resetForm();
      await carregarDados();

    } catch (error) {
      console.error(error);
      mostrarMensagem('error', error instanceof Error ? error.message : 'Erro ao criar nota');
    } finally {
      setSubmitting(false);
    }
  };

  const registrarEntrega = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedNota) return;

    if (!entregaData.nome_recebedor) {
      mostrarMensagem('error', 'Informe o nome do recebedor');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(getApiUrl(`/notas-entrega/${selectedNota.id}/entregar`), {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_recebedor: entregaData.nome_recebedor,
          documento_recebedor: entregaData.documento_recebedor || null,
          assinatura_recebedor: entregaData.assinatura_recebedor || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar entrega');

      mostrarMensagem('success', 'Entrega registrada com sucesso!');
      setModalOpen(false);
      resetForm();
      await carregarDados();

    } catch (error) {
      console.error(error);
      mostrarMensagem('error', error instanceof Error ? error.message : 'Erro ao registrar entrega');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmarCancelar = (nota: NotaEntrega) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancelar Nota de Entrega',
      message: `Tem certeza que deseja cancelar a nota ${nota.numero_nota}?`,
      onConfirm: () => cancelarNota(nota.id)
    });
  };

  const cancelarNota = async (id: number) => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    try {
      const res = await fetch(getApiUrl(`/notas-entrega/${id}/cancelar`), {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao cancelar nota');
      }

      mostrarMensagem('success', 'Nota de entrega cancelada com sucesso!');
      await carregarDados();

    } catch (error) {
      console.error(error);
      mostrarMensagem('error', error instanceof Error ? error.message : 'Erro ao cancelar nota');
    }
  };

  const imprimirNota = (nota: NotaEntrega) => {
    const empresaNome = 'Óptica';
    const empresaEndereco = 'Endereço da Empresa';
    const empresaTelefone = '+244 900 000 000';
    const empresaNif = '123456789';

    const itensHtml = nota.itens?.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.nome}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantidade}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.preco_unitario.toLocaleString('pt-AO')} Kz</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.subtotal.toLocaleString('pt-AO')} Kz</td>
      </tr>
    `).join('') || '<tr><td colspan="4" style="padding: 8px; text-align: center;">Sem itens</td></tr>';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nota de Entrega - ${nota.numero_nota}</title>
          <meta charset="UTF-8">
          <style>
            @page { size: A4; margin: 20mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #333; }
            .header h1 { font-size: 24px; }
            .titulo { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
            .info { margin: 15px 0; padding: 10px; background: #f5f5f5; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background: #f0f0f0; padding: 8px; text-align: center; border-bottom: 2px solid #ddd; }
            td { padding: 8px; }
            .status-entregue { color: green; font-weight: bold; }
            .status-pendente { color: orange; font-weight: bold; }
            .assinatura { margin-top: 40px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
            .rodape { margin-top: 30px; text-align: center; font-size: 10px; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${empresaNome}</h1>
              <p>${empresaEndereco} | Tel: ${empresaTelefone} | NIF: ${empresaNif}</p>
            </div>
            <div class="titulo">NOTA DE ENTREGA</div>
            <div class="info">
              <p><strong>Nº:</strong> ${nota.numero_nota}</p>
              <p><strong>Data de Emissão:</strong> ${new Date(nota.data_emissao).toLocaleString('pt-AO')}</p>
              <p><strong>Status:</strong> <span class="${nota.status === 'entregue' ? 'status-entregue' : 'status-pendente'}">${nota.status === 'entregue' ? 'ENTREGUE' : 'PENDENTE'}</span></p>
            </div>
            <div class="info">
              <p><strong>Cliente:</strong> ${nota.paciente?.nome || '-'}</p>
              ${nota.paciente?.nif ? `<p><strong>NIF:</strong> ${nota.paciente.nif}</p>` : ''}
              ${nota.paciente?.telefone ? `<p><strong>Telefone:</strong> ${nota.paciente.telefone}</p>` : ''}
              ${nota.paciente?.endereco ? `<p><strong>Endereço:</strong> ${nota.paciente.endereco}</p>` : ''}
            </div>
            <table>
              <thead>
                <tr><th>Descrição</th><th style="width:60px;">Qtd</th><th style="width:100px;">Preço Unit.</th><th style="width:100px;">Subtotal</th></tr>
              </thead>
              <tbody>${itensHtml}</tbody>
            </table>
            ${nota.observacoes ? `<div class="info"><p><strong>Observações:</strong> ${nota.observacoes}</p></div>` : ''}
            ${nota.status === 'entregue' ? `
              <div class="info">
                <p><strong>Recebedor:</strong> ${nota.nome_recebedor || '-'}</p>
                ${nota.documento_recebedor ? `<p><strong>Documento:</strong> ${nota.documento_recebedor}</p>` : ''}
                <p><strong>Data de Entrega:</strong> ${nota.data_entrega ? new Date(nota.data_entrega).toLocaleString('pt-AO') : '-'}</p>
              </div>
              <div class="assinatura">
                <p>_________________________________</p>
                <p>Assinatura do Recebedor</p>
              </div>
            ` : ''}
            <div class="rodape"><p>Este documento comprova a entrega dos produtos acima listados.</p></div>
          </div>
          <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const mostrarMensagem = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'entregue': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle size={12} /> Entregue</span>;
      case 'pendente': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><Clock size={12} /> Pendente</span>;
      case 'cancelada': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><X size={12} /> Cancelada</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  const totalPages = Math.ceil(filteredNotas.length / ITEMS_PER_PAGE);
  const paginatedData = filteredNotas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Truck size={28} className="text-indigo-600" />
              Notas de Entrega
            </h1>
            <p className="text-gray-500 mt-1">Gestão de notas de entrega de produtos</p>
          </div>
          {canEdit && (
            <button onClick={abrirModalCriar} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors">
              <Plus size={18} /> Nova Nota de Entrega
            </button>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por número, paciente, NIF ou status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nº Nota</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Paciente</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Data Emissão</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        Nenhuma nota de entrega encontrada
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((nota) => (
                      <tr key={nota.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono">{nota.numero_nota}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-800">{nota.paciente?.nome || '-'}</p>
                            {nota.paciente?.nif && <p className="text-xs text-gray-400">NIF: {nota.paciente.nif}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{new Date(nota.data_emissao).toLocaleString('pt-AO')}</td>
                        <td className="px-4 py-3">{getStatusBadge(nota.status)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => imprimirNota(nota)} className="text-blue-600 hover:text-blue-800 transition-colors p-1" title="Imprimir">
                              <Printer size={18} />
                            </button>
                            {canEdit && nota.status === 'pendente' && (
                              <>
                                <button onClick={() => abrirModalEntrega(nota)} className="text-green-600 hover:text-green-800 transition-colors p-1" title="Registrar Entrega">
                                  <CheckCircle size={18} />
                                </button>
                                <button onClick={() => confirmarCancelar(nota)} className="text-red-600 hover:text-red-800 transition-colors p-1" title="Cancelar">
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50">
                  <ChevronLeft size={18} />
                </button>
                <span className="px-3 py-1 text-gray-600">Pág. {currentPage} de {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50">
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Criar Nota de Entrega */}
      {modalOpen && !selectedNota && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Truck size={20} /> Nova Nota de Entrega
              </h2>
              <button onClick={() => { setModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={criarNotaEntrega} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venda *</label>
                <select
                  name="venda_id"
                  value={formData.venda_id}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Selecione uma venda</option>
                  {vendas.map(v => (
                    <option key={v.id} value={v.id}>
                      Venda #{v.id} - {v.paciente?.nome || 'Cliente Avulso'} - {v.total.toLocaleString('pt-AO')} Kz
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Recebedor</label>
                <input
                  type="text"
                  name="nome_recebedor"
                  value={formData.nome_recebedor}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nome de quem irá receber (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento do Recebedor</label>
                <input
                  type="text"
                  name="documento_recebedor"
                  value={formData.documento_recebedor}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="BI/NIF/Passaporte (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Observações adicionais (opcional)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Criar Nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Registrar Entrega */}
      {modalOpen && selectedNota && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle size={20} /> Registrar Entrega
              </h2>
              <button onClick={() => { setModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm"><strong>Nota:</strong> {selectedNota.numero_nota}</p>
              <p className="text-sm"><strong>Cliente:</strong> {selectedNota.paciente?.nome}</p>
            </div>

            <form onSubmit={registrarEntrega} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Recebedor *</label>
                <input
                  type="text"
                  name="nome_recebedor"
                  value={entregaData.nome_recebedor}
                  onChange={handleEntregaChange}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento de Identificação</label>
                <input
                  type="text"
                  name="documento_recebedor"
                  value={entregaData.documento_recebedor}
                  onChange={handleEntregaChange}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="BI/NIF/Passaporte"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assinatura (Base64)</label>
                <textarea
                  name="assinatura_recebedor"
                  value={entregaData.assinatura_recebedor}
                  onChange={handleEntregaChange}
                  rows={2}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  placeholder="Assinatura digital em Base64 (opcional)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Confirmar Entrega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="text-red-600" size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">{confirmModal.title}</h2>
            </div>
            <p className="text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={confirmModal.onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Clock({ size, className }: { size: number; className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}