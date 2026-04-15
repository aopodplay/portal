'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText, Search, Printer, Plus, X,
  CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
  Receipt, User, Phone, Mail, Hash, Calendar as CalendarIcon,
  DollarSign, CreditCard, FileCheck
} from 'lucide-react';

interface Paciente {
  id: number;
  nome: string;
  telefone?: string;
  nif?: string;
  email?: string;
  endereco?: string;
}

interface Fatura {
  id: number;
  numero: string;
  total: number;
}

interface Recibo {
  id: number;
  numero_recibo: string;
  paciente_id: number;
  venda_id: number | null;
  fatura_id: number | null;
  usuario_id: number;
  data_emissao: string;
  valor_total: number;
  valor_pago: number;
  troco: number;
  forma_pagamento: string;
  status: 'emitido' | 'cancelado';
  descricao: string | null;
  pdf_path: string | null;
  paciente?: Paciente;
  fatura?: Fatura;
}

const ITEMS_PER_PAGE = 10;

export default function ReciboPage() {
  const { user } = useAuth();
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [filteredRecibos, setFilteredRecibos] = useState<Recibo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
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
    tipo: 'fatura',
    fatura_id: '',
    venda_id: '',
    valor_pago: '',
    forma_pagamento: 'dinheiro',
    descricao: ''
  });

  const userPerfil = user?.perfil?.toLowerCase() || '';
  const isAdmin = userPerfil === 'admin';
  const isCaixa = userPerfil === 'caixa';
  const canEdit = isAdmin || isCaixa;

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    filtrarRecibos();
  }, [searchTerm, recibos]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarRecibos(),
        carregarFaturas()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarRecibos = async () => {
    try {
      const res = await fetch(getApiUrl('/recibos'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setRecibos(data);
        setFilteredRecibos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar recibos:', error);
    }
  };

  const carregarFaturas = async () => {
    try {
      const res = await fetch(getApiUrl('/faturas'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const faturasLista = data.data || data;
        // Filtrar apenas faturas pendentes ou pagas
        const faturasDisponiveis = faturasLista.filter((f: any) => 
          ['pendente', 'parcial', 'pago'].includes(f.status?.toLowerCase())
        );
        setFaturas(faturasDisponiveis);
      }
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
    }
  };

  const filtrarRecibos = () => {
    if (!searchTerm.trim()) {
      setFilteredRecibos(recibos);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = recibos.filter(r =>
        r.numero_recibo.toLowerCase().includes(term) ||
        r.paciente?.nome.toLowerCase().includes(term) ||
        r.paciente?.nif?.toLowerCase().includes(term) ||
        r.forma_pagamento.toLowerCase().includes(term)
      );
      setFilteredRecibos(filtered);
    }
    setCurrentPage(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      tipo: 'fatura',
      fatura_id: '',
      venda_id: '',
      valor_pago: '',
      forma_pagamento: 'dinheiro',
      descricao: ''
    });
  };

  const getFaturaSelecionada = () => {
    if (formData.tipo === 'fatura' && formData.fatura_id) {
      return faturas.find(f => f.id === Number(formData.fatura_id));
    }
    return null;
  };

  const getValorTotal = () => {
    const fatura = getFaturaSelecionada();
    return fatura ? fatura.total : 0;
  };

  const getSaldoSugerido = () => {
    const total = getValorTotal();
    if (formData.valor_pago) {
      const valorPago = Number(formData.valor_pago);
      return valorPago > total ? valorPago - total : 0;
    }
    return 0;
  };

  const criarRecibo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.tipo === 'fatura' && !formData.fatura_id) {
      mostrarMensagem('error', 'Selecione uma fatura');
      return;
    }

    if (!formData.valor_pago || Number(formData.valor_pago) <= 0) {
      mostrarMensagem('error', 'Informe o valor pago');
      return;
    }

    setSubmitting(true);

    try {
      const body: any = {
        forma_pagamento: formData.forma_pagamento,
        valor_pago: Number(formData.valor_pago),
        descricao: formData.descricao || null
      };

      if (formData.tipo === 'fatura') {
        body.fatura_id = Number(formData.fatura_id);
      } else {
        body.venda_id = Number(formData.venda_id);
      }

      const res = await fetch(getApiUrl('/recibos'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar recibo');

      mostrarMensagem('success', `Recibo ${data.numero_recibo} emitido com sucesso!`);
      setModalOpen(false);
      resetForm();
      await carregarDados();

    } catch (error) {
      console.error(error);
      mostrarMensagem('error', error instanceof Error ? error.message : 'Erro ao criar recibo');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmarCancelar = (recibo: Recibo) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancelar Recibo',
      message: `Tem certeza que deseja cancelar o recibo ${recibo.numero_recibo}? Esta ação não pode ser desfeita.`,
      onConfirm: () => cancelarRecibo(recibo.id)
    });
  };

  const cancelarRecibo = async (id: number) => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    try {
      const res = await fetch(getApiUrl(`/recibos/${id}/cancelar`), {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao cancelar recibo');
      }

      mostrarMensagem('success', 'Recibo cancelado com sucesso!');
      await carregarDados();

    } catch (error) {
      console.error(error);
      mostrarMensagem('error', error instanceof Error ? error.message : 'Erro ao cancelar recibo');
    }
  };

  const imprimirRecibo = (recibo: Recibo) => {
    const empresaNome = 'Óptica';
    const empresaEndereco = 'Endereço da Empresa';
    const empresaTelefone = '+244 900 000 000';
    const empresaNif = '123456789';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo - ${recibo.numero_recibo}</title>
          <meta charset="UTF-8">
          <style>
            @page { size: A4; margin: 20mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #333; }
            .header h1 { font-size: 24px; }
            .titulo { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
            .info { margin: 15px 0; padding: 10px; background: #f5f5f5; }
            .valores { margin: 15px 0; padding: 10px; }
            .linha { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-size: 16px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; }
            .assinatura { margin-top: 40px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
            .rodape { margin-top: 30px; text-align: center; font-size: 10px; color: #777; }
            .status-cancelado { color: red; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${empresaNome}</h1>
              <p>${empresaEndereco} | Tel: ${empresaTelefone} | NIF: ${empresaNif}</p>
            </div>
            <div class="titulo">RECIBO</div>
            <div class="info">
              <p><strong>Nº:</strong> ${recibo.numero_recibo}</p>
              <p><strong>Data de Emissão:</strong> ${new Date(recibo.data_emissao).toLocaleString('pt-AO')}</p>
              ${recibo.status === 'cancelado' ? '<p><strong class="status-cancelado">Status: CANCELADO</strong></p>' : ''}
            </div>
            <div class="info">
              <p><strong>Recebemos de:</strong> ${recibo.paciente?.nome || '-'}</p>
              ${recibo.paciente?.nif ? `<p><strong>NIF:</strong> ${recibo.paciente.nif}</p>` : ''}
              ${recibo.paciente?.endereco ? `<p><strong>Endereço:</strong> ${recibo.paciente.endereco}</p>` : ''}
            </div>
            <div class="valores">
              <div class="linha"><span><strong>Descrição:</strong></span><span>${recibo.descricao || 'Pagamento de serviços/produtos'}</span></div>
              <div class="linha"><span><strong>Valor Total:</strong></span><span>${recibo.valor_total.toLocaleString('pt-AO')} Kz</span></div>
              <div class="linha"><span><strong>Valor Pago:</strong></span><span>${recibo.valor_pago.toLocaleString('pt-AO')} Kz</span></div>
              ${recibo.troco > 0 ? `<div class="linha"><span><strong>Troco:</strong></span><span>${recibo.troco.toLocaleString('pt-AO')} Kz</span></div>` : ''}
              <div class="linha"><span><strong>Forma de Pagamento:</strong></span><span>${recibo.forma_pagamento.charAt(0).toUpperCase() + recibo.forma_pagamento.slice(1)}</span></div>
              <div class="linha total"><span><strong>Total Pago:</strong></span><span><strong>${recibo.valor_pago.toLocaleString('pt-AO')} Kz</strong></span></div>
            </div>
            <div class="assinatura">
              <p>_________________________________</p>
              <p>Assinatura / Carimbo</p>
            </div>
            <div class="rodape">
              <p>Este documento é comprovativo de pagamento.</p>
              <p>Recibo emitido eletronicamente - Válido para todos os efeitos legais.</p>
            </div>
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
      case 'emitido': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle size={12} /> Emitido</span>;
      case 'cancelado': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><X size={12} /> Cancelado</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  const totalPages = Math.ceil(filteredRecibos.length / ITEMS_PER_PAGE);
  const paginatedData = filteredRecibos.slice(
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
              <Receipt size={28} className="text-indigo-600" />
              Recibos
            </h1>
            <p className="text-gray-500 mt-1">Gestão de recibos de pagamento</p>
          </div>
          {canEdit && (
            <button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors">
              <Plus size={18} /> Emitir Recibo
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
              placeholder="Pesquisar por número, paciente, NIF ou forma de pagamento..."
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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nº Recibo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Paciente</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Data</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Valor</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        Nenhum recibo encontrado
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((recibo) => (
                      <tr key={recibo.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono">{recibo.numero_recibo}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-800">{recibo.paciente?.nome || '-'}</p>
                            {recibo.paciente?.nif && <p className="text-xs text-gray-400">NIF: {recibo.paciente.nif}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{new Date(recibo.data_emissao).toLocaleString('pt-AO')}</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">
                          {recibo.valor_pago.toLocaleString('pt-AO')} Kz
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(recibo.status)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => imprimirRecibo(recibo)} className="text-blue-600 hover:text-blue-800 transition-colors p-1" title="Imprimir">
                              <Printer size={18} />
                            </button>
                            {canEdit && recibo.status === 'emitido' && isAdmin && (
                              <button onClick={() => confirmarCancelar(recibo)} className="text-red-600 hover:text-red-800 transition-colors p-1" title="Cancelar">
                                <X size={18} />
                              </button>
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

      {/* Modal de Emitir Recibo */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Receipt size={20} /> Emitir Recibo
              </h2>
              <button onClick={() => { setModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={criarRecibo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referente a *</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="fatura">Fatura</option>
                  <option value="venda">Venda</option>
                </select>
              </div>

              {formData.tipo === 'fatura' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fatura *</label>
                  <select
                    name="fatura_id"
                    value={formData.fatura_id}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Selecione uma fatura</option>
                    {faturas.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.numero} - {f.total.toLocaleString('pt-AO')} Kz
                      </option>
                    ))}
                  </select>
                  {getFaturaSelecionada() && (
                    <p className="text-sm text-gray-500 mt-1">
                      Valor total: {getValorTotal().toLocaleString('pt-AO')} Kz
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Pago *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    type="number"
                    name="valor_pago"
                    value={formData.valor_pago}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                {getValorTotal() > 0 && Number(formData.valor_pago) > getValorTotal() && (
                  <p className="text-sm text-green-600 mt-1">
                    Troco: {getSaldoSugerido().toLocaleString('pt-AO')} Kz
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento *</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <select
                    name="forma_pagamento"
                    value={formData.forma_pagamento}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="multicaixa">Multicaixa</option>
                    <option value="transferencia">Transferência</option>
                    <option value="seguro">Seguro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Descrição do pagamento (opcional)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Emitir Recibo'}
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