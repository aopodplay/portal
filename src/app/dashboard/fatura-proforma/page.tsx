// app/dashboard/fatura-proforma/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Plus,
  Eye,
  Printer,
  Download,
  Send,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Edit,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Building2,
  Calendar,
  User,
  DollarSign,
  Hash,
  Percent,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Receipt
} from 'lucide-react';
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from '@/config/api';

interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  nif: string;
  endereco?: string;
}

interface ItemProforma {
  id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  tipo: 'consulta' | 'exame' | 'produto' | 'servico';
}

interface FaturaProforma {
  id: number;
  numero: string;
  cliente_id: number;
  cliente_nome: string;
  cliente_documento: string;
  cliente_email?: string;
  cliente_telefone?: string;
  cliente_endereco?: string;
  data_emissao: string;
  data_validade: string;
  status: 'pendente' | 'aprovada' | 'expirada' | 'convertida' | 'cancelada';
  subtotal: number;
  desconto: number;
  total: number;
  observacoes: string;
  itens: ItemProforma[];
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  data: FaturaProforma[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

// Modal de Mensagem (Info, Success, Error, Warning)
const MessageModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info'
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}) => {
  if (!isOpen) return null;

  const config = {
    success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', button: 'bg-green-600 hover:bg-green-700' },
    error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', button: 'bg-red-600 hover:bg-red-700' },
    warning: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100', button: 'bg-yellow-600 hover:bg-yellow-700' },
    info: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', button: 'bg-blue-600 hover:bg-blue-700' }
  };

  const Icon = config[type].icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full ${config[type].bg} flex items-center justify-center`}>
              <Icon className={config[type].color} size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 ${config[type].button} text-white rounded-lg transition-colors`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para impressão/PDF
const FaturaProformaPrint = ({ proforma, empresa }: { proforma: FaturaProforma; empresa: any }) => (
  <div id="fatura-print" style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
    {/* Cabeçalho */}
    <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
      <h1 style={{ margin: 0, color: '#4F46E5' }}>{empresa?.nome || 'Óptica'}</h1>
      <p style={{ margin: '5px 0' }}>{empresa?.endereco || 'Endereço da empresa'}</p>
      <p style={{ margin: '5px 0' }}>Tel: {empresa?.telefone || '(00) 0000-0000'} | Email: {empresa?.email || 'contato@optica.com'}</p>
      <p style={{ margin: '5px 0' }}>CNPJ: {empresa?.cnpj || '00.000.000/0001-00'}</p>
    </div>

    {/* Título */}
    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
      <h2 style={{ margin: 0 }}>FATURA PRÓ-FORMA</h2>
      <p style={{ margin: '5px 0', fontSize: '12px' }}>Nº: {proforma.numero}</p>
    </div>

    {/* Dados do Cliente */}
    <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#4F46E5' }}>DADOS DO CLIENTE</h3>
      <p style={{ margin: '5px 0' }}><strong>Nome:</strong> {proforma.cliente_nome}</p>
      <p style={{ margin: '5px 0' }}><strong>NIF:</strong> {proforma.cliente_documento}</p>
      {proforma.cliente_email && <p style={{ margin: '5px 0' }}><strong>Email:</strong> {proforma.cliente_email}</p>}
      {proforma.cliente_telefone && <p style={{ margin: '5px 0' }}><strong>Telefone:</strong> {proforma.cliente_telefone}</p>}
    </div>

    {/* Datas */}
    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <strong>Data de Emissão:</strong> {new Date(proforma.data_emissao).toLocaleDateString('pt-BR')}
      </div>
      <div>
        <strong>Data de Validade:</strong> {new Date(proforma.data_validade).toLocaleDateString('pt-BR')}
      </div>
    </div>

    {/* Tabela de Itens */}
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
      <thead>
        <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #ddd' }}>
          <th style={{ padding: '10px', textAlign: 'left' }}>Descrição</th>
          <th style={{ padding: '10px', textAlign: 'center' }}>Tipo</th>
          <th style={{ padding: '10px', textAlign: 'center' }}>Qtd</th>
          <th style={{ padding: '10px', textAlign: 'right' }}>Valor Unit.</th>
          <th style={{ padding: '10px', textAlign: 'right' }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {proforma.itens.map((item) => (
          <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '10px' }}>{item.descricao}</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>{item.tipo}</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantidade}</td>
            <td style={{ padding: '10px', textAlign: 'right' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_unitario)}
            </td>
            <td style={{ padding: '10px', textAlign: 'right' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Totais */}
    <div style={{ textAlign: 'right', marginBottom: '20px' }}>
      <div style={{ margin: '5px 0' }}>
        <strong>Subtotal:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proforma.subtotal)}
      </div>
      <div style={{ margin: '5px 0' }}>
        <strong>Desconto:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proforma.desconto)}
      </div>
      <div style={{ margin: '10px 0', fontSize: '18px', borderTop: '2px solid #333', paddingTop: '10px' }}>
        <strong>TOTAL:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proforma.total)}
      </div>
    </div>

    {/* Observações */}
    {proforma.observacoes && (
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '5px' }}>
        <strong>Observações:</strong>
        <p style={{ margin: '5px 0 0 0' }}>{proforma.observacoes}</p>
      </div>
    )}

    {/* Rodapé */}
    <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ddd', fontSize: '12px', color: '#666' }}>
      <p>Este documento é uma pré-fatura e não tem valor fiscal.</p>
      <p>Após a confirmação, será emitida a fatura final.</p>
    </div>
  </div>
);

export default function FaturaProformaPage() {
  const [proformas, setProformas] = useState<FaturaProforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState<FaturaProforma | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Estados para os modais de mensagem
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  });

  const [formData, setFormData] = useState({
    cliente_id: '',
    cliente_nome: '',
    cliente_documento: '',
    cliente_email: '',
    cliente_telefone: '',
    cliente_endereco: '',
    data_validade: '',
    desconto: 0,
    observacoes: '',
    itens: [] as ItemProforma[]
  });

  const [novoItem, setNovoItem] = useState({
    descricao: '',
    quantidade: 1,
    valor_unitario: 0,
    tipo: 'servico' as ItemProforma['tipo']
  });

  const [showClienteModal, setShowClienteModal] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchCliente, setSearchCliente] = useState('');
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'delete' | 'convert' | 'cancel';
    id: number;
  } | null>(null);
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [empresa, setEmpresa] = useState<any>(null);
  const [generatingPDF, setGeneratingPDF] = useState<number | null>(null);
  const [printing, setPrinting] = useState<number | null>(null);

  // Função para mostrar mensagem
  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setMessageModal({ isOpen: true, title, message, type });
  };

  // Carregar dados da empresa
  const loadEmpresa = useCallback(async () => {
    try {
      const response = await fetch(getApiUrl('/configuracoes-sistema/empresa'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setEmpresa(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  }, []);

  // Carregar faturas pró-forma da API
  const loadProformas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'todos' && { status: statusFilter })
      });

      const response = await fetch(
        getApiUrl(`${API_ENDPOINTS.FATURAS_PROFORMA.LISTAR}?${params}`),
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Erro ao carregar faturas');

      const result: ApiResponse = await response.json();

      // Validar e formatar as datas das pró-formas
      const proformasComDatasValidas = result.data.map(proforma => ({
        ...proforma,
        created_at: proforma.created_at && proforma.created_at !== 'Invalid Date' && !isNaN(new Date(proforma.created_at).getTime())
          ? proforma.created_at
          : new Date().toISOString(),
        updated_at: proforma.updated_at && proforma.updated_at !== 'Invalid Date' && !isNaN(new Date(proforma.updated_at).getTime())
          ? proforma.updated_at
          : new Date().toISOString(),
        data_emissao: proforma.data_emissao && proforma.data_emissao !== 'Invalid Date' && !isNaN(new Date(proforma.data_emissao).getTime())
          ? proforma.data_emissao
          : new Date().toISOString(),
        data_validade: proforma.data_validade && proforma.data_validade !== 'Invalid Date' && !isNaN(new Date(proforma.data_validade).getTime())
          ? proforma.data_validade
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }));

      setProformas(proformasComDatasValidas);
      setTotalPages(result.meta.totalPages);
      setTotalItems(result.meta.total);
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
      showMessage('Erro', 'Erro ao carregar faturas pró-forma', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  // Carregar clientes da API
  const loadClientes = useCallback(async () => {
    setLoadingClientes(true);
    try {
      const params = new URLSearchParams({
        ...(searchCliente && { search: searchCliente }),
        limit: '20'
      });

      const response = await fetch(
        getApiUrl(`${API_ENDPOINTS.PACIENTES}?${params}`),
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Erro ao carregar clientes');

      const data = await response.json();
      const pacientesFormatados = (data.data || data).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        email: p.email || '',
        telefone: p.telefone || '',
        nif: p.nif || '',
        endereco: p.endereco
      }));
      setClientes(pacientesFormatados);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      showMessage('Erro', 'Erro ao carregar clientes', 'error');
    } finally {
      setLoadingClientes(false);
    }
  }, [searchCliente]);

  useEffect(() => {
    loadProformas();
    loadEmpresa();
  }, [loadProformas, loadEmpresa]);

  useEffect(() => {
    if (showClienteModal) {
      loadClientes();
    }
  }, [showClienteModal, searchCliente, loadClientes]);

  const getStatusConfig = (status: FaturaProforma['status']) => {
    const configs = {
      pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      aprovada: { label: 'Aprovada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      expirada: { label: 'Expirada', color: 'bg-red-100 text-red-800', icon: XCircle },
      convertida: { label: 'Convertida', color: 'bg-blue-100 text-blue-800', icon: FileCheck },
      cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    return configs[status];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  // Função para imprimir
  const handlePrint = (proforma: FaturaProforma) => {
    setPrinting(proforma.id);

    setTimeout(() => {
      const printContent = document.getElementById('fatura-print');
      if (!printContent) {
        showMessage('Erro', 'Erro ao gerar documento para impressão', 'error');
        setPrinting(null);
        return;
      }

      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();

      setPrinting(null);
    }, 100);
  };

  // Função para gerar PDF
  const handleDownloadPDF = (proforma: FaturaProforma) => {
    setGeneratingPDF(proforma.id);

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0px';
    printFrame.style.height = '0px';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);

    const printContent = document.getElementById('fatura-print');
    if (!printContent) {
      showMessage('Erro', 'Erro ao gerar PDF', 'error');
      setGeneratingPDF(null);
      return;
    }

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Fatura Pro-Forma ${proforma.numero}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body>${printContent.innerHTML}</body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
          setGeneratingPDF(null);
        }, 100);
      }, 100);
    } else {
      setGeneratingPDF(null);
    }
  };

  const handleAddItem = () => {
    if (!novoItem.descricao || novoItem.quantidade <= 0 || novoItem.valor_unitario <= 0) {
      showMessage('Campos Incompletos', 'Preencha todos os campos do item corretamente', 'warning');
      return;
    }

    const newItem: ItemProforma = {
      id: Date.now().toString(),
      descricao: novoItem.descricao,
      quantidade: novoItem.quantidade,
      valor_unitario: novoItem.valor_unitario,
      valor_total: novoItem.quantidade * novoItem.valor_unitario,
      tipo: novoItem.tipo
    };

    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, newItem]
    }));

    setNovoItem({
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      tipo: 'servico'
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter(item => item.id !== itemId)
    }));
  };

  const calcularTotal = () => {
    const subtotal = formData.itens.reduce((sum, item) => sum + item.valor_total, 0);
    const total = subtotal - formData.desconto;
    return { subtotal, total };
  };

  const handleSelectCliente = (cliente: Cliente) => {
    setFormData(prev => ({
      ...prev,
      cliente_id: String(cliente.id),
      cliente_nome: cliente.nome,
      cliente_documento: cliente.nif,
      cliente_email: cliente.email,
      cliente_telefone: cliente.telefone,
      cliente_endereco: cliente.endereco || ''
    }));
    setShowClienteModal(false);
    setSearchCliente('');
  };

  const handleSaveProforma = async () => {
    if (!formData.cliente_id) {
      showMessage('Cliente Obrigatório', 'Selecione um cliente', 'warning');
      return;
    }
    if (formData.itens.length === 0) {
      showMessage('Itens Obrigatórios', 'Adicione pelo menos um item', 'warning');
      return;
    }
    if (!formData.data_validade) {
      showMessage('Data Obrigatória', 'Informe a data de validade', 'warning');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        cliente_id: parseInt(formData.cliente_id),
        data_validade: formData.data_validade,
        desconto: formData.desconto,
        observacoes: formData.observacoes,
        itens: formData.itens.map(item => ({
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          tipo: item.tipo
        }))
      };

      const url = editingId
        ? getApiUrl(API_ENDPOINTS.FATURAS_PROFORMA.ATUALIZAR(editingId))
        : getApiUrl(API_ENDPOINTS.FATURAS_PROFORMA.CRIAR);

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar fatura');
      }

      showMessage(
        'Sucesso',
        editingId ? 'Fatura atualizada com sucesso!' : 'Fatura criada com sucesso!',
        'success'
      );
      resetForm();
      setShowModal(false);
      loadProformas();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showMessage('Erro', error instanceof Error ? error.message : 'Erro ao salvar fatura', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      cliente_nome: '',
      cliente_documento: '',
      cliente_email: '',
      cliente_telefone: '',
      cliente_endereco: '',
      data_validade: '',
      desconto: 0,
      observacoes: '',
      itens: []
    });
    setEditingId(null);
    setNovoItem({
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      tipo: 'servico'
    });
  };

  const handleEdit = (proforma: FaturaProforma) => {
    setEditingId(proforma.id);
    setFormData({
      cliente_id: String(proforma.cliente_id),
      cliente_nome: proforma.cliente_nome,
      cliente_documento: proforma.cliente_documento,
      cliente_email: proforma.cliente_email || '',
      cliente_telefone: proforma.cliente_telefone || '',
      cliente_endereco: proforma.cliente_endereco || '',
      data_validade: proforma.data_validade.split('T')[0],
      desconto: proforma.desconto,
      observacoes: proforma.observacoes,
      itens: [...proforma.itens]
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!confirmModal) return;

    try {
      const response = await fetch(
        getApiUrl(API_ENDPOINTS.FATURAS_PROFORMA.EXCLUIR(confirmModal.id)),
        { method: 'DELETE', headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Erro ao excluir fatura');

      showMessage('Sucesso', 'Fatura removida com sucesso!', 'success');
      setConfirmModal(null);
      loadProformas();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showMessage('Erro', 'Erro ao excluir fatura', 'error');
    }
  };

  const handleConvert = async () => {
    if (!confirmModal) return;

    try {
      const response = await fetch(
        getApiUrl(API_ENDPOINTS.FATURAS_PROFORMA.CONVERTER(confirmModal.id)),
        { method: 'POST', headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Erro ao converter fatura');

      const result = await response.json();
      showMessage('Sucesso', result.message || 'Fatura convertida para fatura final com sucesso!', 'success');
      setConfirmModal(null);
      loadProformas();
    } catch (error) {
      console.error('Erro ao converter:', error);
      showMessage('Erro', 'Erro ao converter fatura', 'error');
    }
  };

  const handleCancel = async () => {
    if (!confirmModal) return;

    try {
      const response = await fetch(
        getApiUrl(API_ENDPOINTS.FATURAS_PROFORMA.CANCELAR(confirmModal.id)),
        { method: 'PUT', headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Erro ao cancelar fatura');

      showMessage('Sucesso', 'Fatura cancelada com sucesso!', 'success');
      setConfirmModal(null);
      loadProformas();
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      showMessage('Erro', 'Erro ao cancelar fatura', 'error');
    }
  };

  const handleSendEmail = async (id: number) => {
    setSendingEmail(id);
    try {
      const response = await fetch(
        getApiUrl(API_ENDPOINTS.FATURAS_PROFORMA.ENVIAR_EMAIL(id)),
        { method: 'POST', headers: getAuthHeaders() }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar e-mail');
      }

      showMessage('Sucesso', 'Fatura enviada por e-mail com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      showMessage('Erro', error instanceof Error ? error.message : 'Erro ao enviar e-mail', 'error');
    } finally {
      setSendingEmail(null);
    }
  };

  const itemsPerPage = 10;
  const { subtotal, total } = calcularTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Componente oculto para impressão/PDF */}
      <div style={{ display: 'none' }}>
        {selectedProforma && (
          <FaturaProformaPrint proforma={selectedProforma} empresa={empresa} />
        )}
      </div>

      {/* Modal de Mensagem */}
      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Faturas Pró-Forma</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gerencie orçamentos e pré-faturas para seus pacientes
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
            >
              <Plus size={20} />
              <span>Nova Fatura Pró-Forma</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por número, cliente ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="aprovada">Aprovada</option>
                <option value="convertida">Convertida</option>
                <option value="expirada">Expirada</option>
                <option value="cancelada">Cancelada</option>
              </select>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Emissão</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Validade</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {proformas.map((proforma) => {
                    const statusConfig = getStatusConfig(proforma.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <tr key={proforma.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-gray-400" />
                            <span className="font-mono text-sm font-medium text-gray-900">{proforma.numero}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{proforma.cliente_nome}</p>
                            <p className="text-xs text-gray-500">{proforma.cliente_documento}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(proforma.data_emissao)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(proforma.data_validade)}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(proforma.total)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedProforma(proforma);
                                setShowDetailsModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="Visualizar"
                            >
                              <Eye size={18} />
                            </button>
                            {proforma.status === 'pendente' && (
                              <>
                                <button
                                  onClick={() => handleEdit(proforma)}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Editar"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleSendEmail(proforma.id)}
                                  disabled={sendingEmail === proforma.id}
                                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                  title="Enviar por e-mail"
                                >
                                  {sendingEmail === proforma.id ? (
                                    <Loader2 size={18} className="animate-spin" />
                                  ) : (
                                    <Send size={18} />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProforma(proforma);
                                    handlePrint(proforma);
                                  }}
                                  disabled={printing === proforma.id}
                                  className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                                  title="Imprimir"
                                >
                                  {printing === proforma.id ? (
                                    <Loader2 size={18} className="animate-spin" />
                                  ) : (
                                    <Printer size={18} />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProforma(proforma);
                                    handleDownloadPDF(proforma);
                                  }}
                                  disabled={generatingPDF === proforma.id}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Download PDF"
                                >
                                  {generatingPDF === proforma.id ? (
                                    <Loader2 size={18} className="animate-spin" />
                                  ) : (
                                    <Download size={18} />
                                  )}
                                </button>
                                <button
                                  onClick={() => setConfirmModal({ type: 'convert', id: proforma.id })}
                                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                  title="Converter para Fatura"
                                >
                                  <FileCheck size={18} />
                                </button>
                                <button
                                  onClick={() => setConfirmModal({ type: 'cancel', id: proforma.id })}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Cancelar"
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                            {(proforma.status === 'pendente' || proforma.status === 'expirada') && (
                              <button
                                onClick={() => setConfirmModal({ type: 'delete', id: proforma.id })}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} resultados
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Editar Fatura Pró-Forma' : 'Nova Fatura Pró-Forma'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Preencha os dados abaixo para {editingId ? 'atualizar' : 'criar'} a fatura
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                {formData.cliente_id ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900">{formData.cliente_nome}</p>
                      <p className="text-sm text-gray-500">{formData.cliente_documento}</p>
                      {formData.cliente_email && <p className="text-xs text-gray-400">{formData.cliente_email}</p>}
                    </div>
                    <button
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          cliente_id: '',
                          cliente_nome: '',
                          cliente_documento: '',
                          cliente_email: '',
                          cliente_telefone: '',
                          cliente_endereco: ''
                        }));
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClienteModal(true)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                  >
                    + Selecionar Cliente
                  </button>
                )}
              </div>

              {/* Data Validade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Validade *
                </label>
                <input
                  type="date"
                  value={formData.data_validade}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_validade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Itens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Itens *
                </label>
                <div className="space-y-3">
                  {/* Lista de itens */}
                  {formData.itens.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{item.descricao}</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full">
                            {item.tipo}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {item.quantidade}x {formatCurrency(item.valor_unitario)} = {formatCurrency(item.valor_total)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  {/* Form de novo item */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="text"
                      placeholder="Descrição"
                      value={novoItem.descricao}
                      onChange={(e) => setNovoItem(prev => ({ ...prev, descricao: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <select
                      value={novoItem.tipo}
                      onChange={(e) => setNovoItem(prev => ({ ...prev, tipo: e.target.value as ItemProforma['tipo'] }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="consulta">Consulta</option>
                      <option value="exame">Exame</option>
                      <option value="produto">Produto</option>
                      <option value="servico">Serviço</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Quantidade"
                      value={novoItem.quantidade}
                      onChange={(e) => setNovoItem(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Valor Unitário"
                        value={novoItem.valor_unitario}
                        onChange={(e) => setNovoItem(prev => ({ ...prev, valor_unitario: parseFloat(e.target.value) || 0 }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddItem}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desconto e Observações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desconto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.desconto}
                    onChange={(e) => setFormData(prev => ({ ...prev, desconto: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    rows={1}
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>

              {/* Totais */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Desconto:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(formData.desconto)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-lg text-indigo-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProforma}
                disabled={submitting}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin inline mr-2" />
                ) : null}
                {editingId ? 'Atualizar' : 'Salvar'} Fatura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Cliente */}
      {showClienteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Selecionar Cliente</h2>
              <button
                onClick={() => setShowClienteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou CPF/CNPJ..."
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loadingClientes ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                  </div>
                ) : clientes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum cliente encontrado
                  </div>
                ) : (
                  clientes.map(cliente => (
                    <button
                      key={cliente.id}
                      onClick={() => handleSelectCliente(cliente)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                    >
                      <p className="font-medium text-gray-900">{cliente.nome}</p>
                      <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
                        <span>📄 {cliente.nif}</span>
                        <span>📞 {cliente.telefone}</span>
                        <span>✉️ {cliente.email}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedProforma && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detalhes da Fatura</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedProforma.numero}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informações da Fatura */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Cliente</label>
                    <p className="font-medium text-gray-900">{selectedProforma.cliente_nome}</p>
                    <p className="text-sm text-gray-600">{selectedProforma.cliente_documento}</p>
                    {selectedProforma.cliente_email && (
                      <p className="text-sm text-gray-500">{selectedProforma.cliente_email}</p>
                    )}
                    {selectedProforma.cliente_telefone && (
                      <p className="text-sm text-gray-500">{selectedProforma.cliente_telefone}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Data de Emissão</label>
                    <p className="text-gray-900">{formatDate(selectedProforma.data_emissao)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Data de Validade</label>
                    <p className="text-gray-900">{formatDate(selectedProforma.data_validade)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Status</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusConfig(selectedProforma.status).color}`}>
                      {getStatusConfig(selectedProforma.status).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itens */}
              <div>
                <label className="text-xs text-gray-500 uppercase mb-2 block">Itens</label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Descrição</th>
                        <th className="text-center px-4 py-2 text-sm font-medium text-gray-700">Tipo</th>
                        <th className="text-center px-4 py-2 text-sm font-medium text-gray-700">Qtd</th>
                        <th className="text-right px-4 py-2 text-sm font-medium text-gray-700">Valor Unit.</th>
                        <th className="text-right px-4 py-2 text-sm font-medium text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedProforma.itens.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.descricao}</td>
                          <td className="px-4 py-2 text-sm text-center">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{item.tipo}</span>
                          </td>
                          <td className="px-4 py-2 text-sm text-center text-gray-600">{item.quantidade}</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-600">{formatCurrency(item.valor_unitario)}</td>
                          <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">{formatCurrency(item.valor_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totais */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(selectedProforma.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Desconto:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(selectedProforma.desconto)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-lg text-indigo-600">{formatCurrency(selectedProforma.total)}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedProforma.observacoes && (
                <div>
                  <label className="text-xs text-gray-500 uppercase mb-1 block">Observações</label>
                  <p className="text-gray-700">{selectedProforma.observacoes}</p>
                </div>
              )}

              {/* Histórico - CORRIGIDO */}
              <div>
                <label className="text-xs text-gray-500 uppercase mb-1 block">Histórico</label>
                <p className="text-sm text-gray-500">
                  Criado em: {selectedProforma.created_at ? formatDateTime(selectedProforma.created_at) : 'Data não disponível'}
                </p>
                <p className="text-sm text-gray-500">
                  Última atualização: {selectedProforma.updated_at ? formatDateTime(selectedProforma.updated_at) : 'Data não disponível'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handlePrint(selectedProforma);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Printer size={18} className="inline mr-2" />
                Imprimir
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleDownloadPDF(selectedProforma);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Download size={18} className="inline mr-2" />
                PDF
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleSendEmail(selectedProforma.id);
                }}
                disabled={sendingEmail === selectedProforma.id}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {sendingEmail === selectedProforma.id ? (
                  <Loader2 size={18} className="animate-spin inline mr-2" />
                ) : (
                  <Send size={18} className="inline mr-2" />
                )}
                Enviar Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertCircle className="text-yellow-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {confirmModal.type === 'delete' && 'Excluir Fatura'}
                    {confirmModal.type === 'convert' && 'Converter para Fatura'}
                    {confirmModal.type === 'cancel' && 'Cancelar Fatura'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {confirmModal.type === 'delete' && 'Tem certeza que deseja excluir esta fatura?'}
                    {confirmModal.type === 'convert' && 'Tem certeza que deseja converter esta fatura pró-forma em fatura final?'}
                    {confirmModal.type === 'cancel' && 'Tem certeza que deseja cancelar esta fatura?'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.type === 'delete') handleDelete();
                    if (confirmModal.type === 'convert') handleConvert();
                    if (confirmModal.type === 'cancel') handleCancel();
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-white ${confirmModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                    confirmModal.type === 'convert' ? 'bg-green-600 hover:bg-green-700' :
                      'bg-gray-600 hover:bg-gray-700'
                    }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}