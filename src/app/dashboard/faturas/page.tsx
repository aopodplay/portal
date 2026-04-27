'use client';

import { useEffect, useState, useMemo } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import {
  FileText, Search, Filter, X, Printer, Edit, Trash2,
  CheckCircle, AlertCircle, Clock, DollarSign, Calendar,
  User, CreditCard, Eye, RefreshCw, ArrowLeft, ArrowRight,
  Download, TrendingUp, TrendingDown, Package, Wrench, Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/* Tipagens */
interface Paciente {
  id: number;
  nome: string;
  nif?: string;
  telefone?: string;
}
interface Produto {
  id: number;
  nome: string;
  preco: number;
  tipo?: string;
}
interface Servico {
  id: number;
  nome: string;
  valor: number;
}
interface VendaItem {
  id?: number;
  descricao?: string; 
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produto?: Produto;
  servico?: Servico;
  produto_id?: number;
  servico_id?: number
}
interface Atendimento {
  id: number;
  status: string;
  paciente: Paciente
}
interface Venda {
  id: number;
  atendimento?: Atendimento;
  itens: VendaItem[];
  usuario?: { id: number; nome: string };
}
interface Pagamento {
  id: number;
  valor_total: number;
  forma_pagamento: string;
  paciente?: Paciente;
  data_pagamento?: string;
}
type StatusFatura = 'pendente' | 'pago' | 'cancelada' | 'parcial';

interface Fatura {
  id: number;
  numero: string;
  total: number;
  status: StatusFatura;
  data_emissao: string;
  venda?: Venda;
  pagamentos: Pagamento[];
  forma_pagamento?: string;
  usuario?: { id: number; nome: string };
  created_at?: string;
}

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock, borderColor: 'border-yellow-400' },
  pago: { label: 'Pago', color: 'bg-green-100 text-green-800', icon: CheckCircle, borderColor: 'border-green-400' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: X, borderColor: 'border-red-400' },
  parcial: { label: 'Parcial', color: 'bg-blue-100 text-blue-800', icon: TrendingUp, borderColor: 'border-blue-400' }
};

const CLINICA = {
  nome: 'Prestígio Óptica',
  endereco: 'Via camama-fubu junto ao primeiro retorno, rua 14.',
  telefone: '+244 937482426',
  nif: '5000511749',
};

const formatarValor = (valor: number | undefined | null): string => {
  if (!valor && valor !== 0) return '0 Kz';
  return valor.toLocaleString('pt-AO') + ' Kz';
};

const calcularTotalPago = (fatura: Fatura): number => {
  if (!fatura.pagamentos || fatura.pagamentos.length === 0) return 0;
  return fatura.pagamentos.reduce((sum, p) => sum + (Number(p.valor_total) || 0), 0);
};

export default function FaturasPage() {
  const { user } = useAuth();
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFatura, setEditingFatura] = useState<Fatura | null>(null);
  const [viewingFatura, setViewingFatura] = useState<Fatura | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [cancelando, setCancelando] = useState(false);

  const [numeroPesquisa, setNumeroPesquisa] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<StatusFatura | ''>('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');

  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; fatura: Fatura | null }>({
    isOpen: false,
    fatura: null
  });

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 12;

  const logoUrl = config?.logo ? getApiUrl(config.logo) : null;
  const isAdmin = user?.perfil?.toLowerCase() === 'admin';

  const faturasFiltradas = useMemo(() => {
    return faturas.filter(f => {
      const matchNumero = numeroPesquisa ? f.numero.toLowerCase().includes(numeroPesquisa.toLowerCase()) : true;
      const matchDataInicio = dataInicio ? new Date(f.data_emissao) >= new Date(dataInicio) : true;
      const matchDataFim = dataFim ? new Date(f.data_emissao) <= new Date(dataFim) : true;
      const matchStatus = statusFiltro ? f.status === statusFiltro : true;
      const matchValorMin = valorMin ? (f.total || 0) >= Number(valorMin) : true;
      const matchValorMax = valorMax ? (f.total || 0) <= Number(valorMax) : true;
      return matchNumero && matchDataInicio && matchDataFim && matchStatus && matchValorMin && matchValorMax;
    });
  }, [faturas, numeroPesquisa, dataInicio, dataFim, statusFiltro, valorMin, valorMax]);

  const totalPaginas = Math.ceil(faturasFiltradas.length / itensPorPagina);
  const faturasPagina = faturasFiltradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  const estatisticas = useMemo(() => {
    const totalFaturado = faturasFiltradas.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
    const totalPendente = faturasFiltradas.filter(f => f.status === 'pendente' || f.status === 'parcial').reduce((sum, f) => sum + (Number(f.total) || 0), 0);
    const totalPago = faturasFiltradas.reduce((sum, f) => sum + calcularTotalPago(f), 0);
    const mediaValor = faturasFiltradas.length > 0 ? totalFaturado / faturasFiltradas.length : 0;
    return { totalFaturado, totalPendente, totalPago, mediaValor };
  }, [faturasFiltradas]);

  const limparFiltros = () => {
    setNumeroPesquisa('');
    setDataInicio('');
    setDataFim('');
    setStatusFiltro('');
    setValorMin('');
    setValorMax('');
    setPaginaAtual(1);
  };

  const imprimirFatura = (f: Fatura) => {
    const pacienteNome = getPacienteNome(f);
    const win = window.open('', '_blank');
    if (!win) return;

    const itens = f.venda?.itens || [];
    const formasPagamento = f.pagamentos?.map(p => p.forma_pagamento.toUpperCase()).join(', ') || f.forma_pagamento?.toUpperCase() || 'DINHEIRO';

    let linhasProdutos = '';
    if (itens.length) {
      itens.forEach(item => {
        const descricao = item.produto?.nome || item.servico?.nome || '-';
        const precoUnit = Number(item.preco_unitario || (item.produto?.preco || item.servico?.valor || 0));
        const subtotal = Number(item.subtotal || 0);
        linhasProdutos += `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${descricao}</td>
            <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantidade}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${precoUnit.toLocaleString('pt-AO')} Kz</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${subtotal.toLocaleString('pt-AO')} Kz</td>
          </tr>
        `;
      });
    } else {
      linhasProdutos = '<tr><td colspan="4" style="padding: 10px; text-align: center;">Sem itens</td></tr>';
    }

    const nomeClinica = config?.nome_sistema || CLINICA.nome;
    const endereco = config?.endereco || CLINICA.endereco;
    const telefone = config?.telefone || CLINICA.telefone;
    const nif = config?.nif_empresa || CLINICA.nif;
    const totalPago = calcularTotalPago(f);
    const saldo = (Number(f.total) || 0) - totalPago;

    const html = `<!DOCTYPE html>
    <html>
    <head>
      <title>Fatura ${f.numero}</title>
      <meta charset="UTF-8">
      <style>
        @page { size: A4; margin: 20mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 12px; padding: 20px; background: #fff; }
        .fatura-container { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #333; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .empresa-info { font-size: 11px; color: #555; margin-bottom: 10px; }
        .titulo-fatura { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
        .info-cliente { margin: 15px 0; padding: 10px; background: #f5f5f5; font-size: 11px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #f0f0f0; padding: 10px; text-align: center; border-bottom: 2px solid #ddd; }
        .totais { margin-top: 15px; text-align: right; border-top: 1px solid #ddd; padding-top: 10px; }
        .totais p { margin: 5px 0; }
        .assinatura { margin-top: 40px; display: flex; justify-content: space-between; }
        .assinatura div { text-align: center; width: 45%; }
        .rodape { margin-top: 30px; text-align: center; font-size: 10px; color: #777; border-top: 1px solid #ddd; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="fatura-container">
        <div class="header">
          <h1>${nomeClinica}</h1>
          <div class="empresa-info">
            ${nif ? `NIF: ${nif} | ` : ''}${telefone ? `Tel: ${telefone}` : ''}${endereco ? `<br>${endereco}` : ''}
          </div>
        </div>
        <div class="titulo-fatura">FATURA Nº ${f.numero}</div>
        <div class="info-cliente">
          <p><strong>Cliente:</strong> ${pacienteNome}</p>
          <p><strong>Data de Emissão:</strong> ${new Date(f.data_emissao).toLocaleDateString('pt-AO')}</p>
          <p><strong>Status:</strong> ${f.status.toUpperCase()}</p>
          <p><strong>Forma de Pagamento:</strong> ${formasPagamento}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Descrição</th>
              <th style="width: 60px;">Qtd</th>
              <th style="width: 100px;">Preço Unit.</th>
              <th style="width: 100px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${linhasProdutos}</tbody>
        </table>
        <div class="totais">
          <p><strong>Subtotal:</strong> ${(Number(f.total) || 0).toLocaleString('pt-AO')} Kz</p>
          <p><strong>Total Pago:</strong> ${totalPago.toLocaleString('pt-AO')} Kz</p>
          <p><strong>Saldo:</strong> ${saldo.toLocaleString('pt-AO')} Kz</p>
          <p><strong>TOTAL:</strong> ${(Number(f.total) || 0).toLocaleString('pt-AO')} Kz</p>
        </div>
        <div class="rodape">
          <p>Documento processado por programa informático certificado • Emitido em ${new Date().toLocaleString()}</p>
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
      </script>
    </body>
    </html>`;

    win.document.write(html);
    win.document.close();
  };

  const getPacienteNome = (fatura: Fatura): string => {
    return fatura.pagamentos?.find(p => p.paciente)?.paciente?.nome || fatura.venda?.atendimento?.paciente?.nome || 'Cliente Avulso';
  };

  const getStatusInfo = (status: StatusFatura) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
  };

  async function fetchFaturas() {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/faturas'), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.data || []);
      const normalizadas = arr.map((f: any) => ({
        ...f,
        total: Number(f.total) || 0,
        status: String(f.status).toLowerCase() as StatusFatura,
        pagamentos: (f.pagamentos || []).map((p: any) => ({ ...p, valor_total: p.valor_total || p.valor || 0 }))
      }));
      setFaturas(normalizadas);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFaturas();
    const fetchExtras = async () => {
      try {
        const [cfg, prods, servs] = await Promise.all([
          fetch(getApiUrl('/configuracoes-sistema'), { headers: getAuthHeaders() }).then(r => r.json()),
          fetch(getApiUrl('/produtos'), { headers: getAuthHeaders() }).then(r => r.json()),
          fetch(getApiUrl('/servicos'), { headers: getAuthHeaders() }).then(r => r.json())
        ]);
        setConfig(cfg);
        setProdutos(prods.data || prods);
        setServicos(servs.data || servs);
      } catch (err) {
        console.error('Erro ao carregar extras:', err);
      }
    };
    fetchExtras();
  }, []);

  const confirmarCancelarFatura = (fatura: Fatura) => {
    setCancelModal({ isOpen: true, fatura });
  };

  const executarCancelamento = async () => {
    if (!cancelModal.fatura) return;
    setCancelando(true);
    try {
      const res = await fetch(getApiUrl(`/faturas/${cancelModal.fatura.id}`), { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Erro ao cancelar a fatura');
      await fetchFaturas();
      setCancelModal({ isOpen: false, fatura: null });
    } catch (err: any) {
      alert('Erro ao cancelar fatura: ' + (err.message || 'Desconhecido'));
      setCancelModal({ isOpen: false, fatura: null });
    } finally {
      setCancelando(false);
    }
  };

  const salvarEdicao = async () => {
    if (!editingFatura) return;
    try {
      const res = await fetch(getApiUrl(`/faturas/${editingFatura.id}`), {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forma_pagamento: editingFatura.forma_pagamento,
          status: editingFatura.status,
          itens: editingFatura.venda?.itens.map(i => ({
            id: i.id,
            produto_id: i.produto?.id || i.produto_id || null,
            servico_id: i.servico?.id || i.servico_id || null,
            quantidade: i.quantidade,
            preco_unitario: i.preco_unitario
          }))
        })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchFaturas();
      setEditingFatura(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando faturas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erro ao carregar faturas</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={fetchFaturas} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto">
            <RefreshCw size={18} /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileText size={28} /> Faturas
              </h1>
              <p className="text-indigo-100 mt-1">Gestão completa de faturas e documentos fiscais</p>
            </div>
            <button onClick={fetchFaturas} className="text-white hover:text-indigo-200 transition-colors flex items-center gap-1">
              <RefreshCw size={16} /> Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Total Faturado</p>
                <p className="text-2xl font-bold text-blue-600">{formatarValor(estatisticas.totalFaturado)}</p>
              </div>
              <DollarSign className="text-blue-500" size={28} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Valor Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">{formatarValor(estatisticas.totalPendente)}</p>
              </div>
              <Clock className="text-yellow-500" size={28} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Valor Pago</p>
                <p className="text-2xl font-bold text-green-600">{formatarValor(estatisticas.totalPago)}</p>
              </div>
              <CheckCircle className="text-green-500" size={28} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Ticket Médio</p>
                <p className="text-2xl font-bold text-purple-600">{formatarValor(estatisticas.mediaValor)}</p>
              </div>
              <TrendingUp className="text-purple-500" size={28} />
            </div>
          </div>
        </div>

        {/* Filtros Avançados */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-700">Filtros Avançados</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número da Fatura</label>
              <input type="text" placeholder="Buscar por número..." value={numeroPesquisa} onChange={(e) => setNumeroPesquisa(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value as StatusFatura | '')} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="parcial">Parcial</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mínimo (Kz)</label>
              <input type="number" placeholder="Valor mínimo" value={valorMin} onChange={(e) => setValorMin(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Máximo (Kz)</label>
              <input type="number" placeholder="Valor máximo" value={valorMax} onChange={(e) => setValorMax(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex items-end">
              <button onClick={limparFiltros} className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                <X size={16} /> Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Faturas */}
        {faturasFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FileText size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 text-lg">Nenhuma fatura encontrada</p>
            <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {faturasPagina.map(f => {
                const statusInfo = getStatusInfo(f.status);
                const StatusIcon = statusInfo.icon;
                const pacienteNome = getPacienteNome(f);
                const totalPago = calcularTotalPago(f);
                const percentualPago = (totalPago / (f.total || 1)) * 100;

                return (
                  <div key={f.id} className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-t-4 ${statusInfo.borderColor}`}>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{f.numero}</h3>
                          <p className="text-xs text-gray-400">{new Date(f.data_emissao).toLocaleDateString('pt-AO')}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                          <StatusIcon size={12} /> {statusInfo.label}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User size={14} className="text-gray-400" />
                          <span className="text-gray-600 truncate">{pacienteNome}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign size={14} className="text-gray-400" />
                          <span className="text-gray-600">Total: <strong className="text-gray-800">{(f.total || 0).toLocaleString('pt-AO')} Kz</strong></span>
                        </div>
                        {f.status !== 'pago' && f.status !== 'cancelada' && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Pago: {totalPago.toLocaleString('pt-AO')} Kz</span>
                              <span>Saldo: {((f.total || 0) - totalPago).toLocaleString('pt-AO')} Kz</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(percentualPago, 100)}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard size={14} className="text-gray-400" />
                          <span className="text-gray-500 text-xs">{f.forma_pagamento?.toUpperCase() || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button onClick={() => imprimirFatura(f)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1">
                          <Printer size={14} /> Imprimir
                        </button>
                        <button onClick={() => setViewingFatura(f)} className="flex-1 bg-gray-600 text-white py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors flex items-center justify-center gap-1">
                          <Eye size={14} /> Detalhes
                        </button>
                        {f.status === 'pendente' && (
                          <>
                            <button onClick={() => setEditingFatura(f)} className="bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-yellow-600 transition-colors" title="Editar">
                              <Edit size={14} />
                            </button>
                            {isAdmin && (
                              <button onClick={() => confirmarCancelarFatura(f)} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors" title="Cancelar">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))} disabled={paginaAtual === 1} className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1">
                  <ArrowLeft size={16} /> Anterior
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let pageNum = paginaAtual;
                    if (totalPaginas <= 5) {
                      pageNum = i + 1;
                    } else if (paginaAtual <= 3) {
                      pageNum = i + 1;
                    } else if (paginaAtual >= totalPaginas - 2) {
                      pageNum = totalPaginas - 4 + i;
                    } else {
                      pageNum = paginaAtual - 2 + i;
                    }
                    return (
                      <button key={pageNum} onClick={() => setPaginaAtual(pageNum)} className={`w-10 h-10 rounded-lg transition-colors ${paginaAtual === pageNum ? 'bg-indigo-600 text-white' : 'border hover:bg-gray-50'}`}>
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))} disabled={paginaAtual === totalPaginas} className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1">
                  Próxima <ArrowRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal de Visualização */}
        {viewingFatura && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Detalhes da Fatura {viewingFatura.numero}</h2>
                <button onClick={() => setViewingFatura(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Paciente</p>
                    <p className="font-medium">{getPacienteNome(viewingFatura)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data de Emissão</p>
                    <p className="font-medium">{new Date(viewingFatura.data_emissao).toLocaleDateString('pt-AO')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(viewingFatura.status).color}`}>
                      {getStatusInfo(viewingFatura.status).label}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Forma de Pagamento</p>
                    <p className="font-medium">{viewingFatura.forma_pagamento?.toUpperCase() || 'N/A'}</p>
                  </div>
                </div>

                <h3 className="font-semibold mb-3">Itens da Fatura</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Descrição</th>
                        <th className="p-2 text-center">Qtd</th>
                        <th className="p-2 text-right">Preço Unit.</th>
                        <th className="p-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingFatura.venda?.itens.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{item.descricao || item.produto?.nome || item.servico?.nome || '-'}</td>
                          <td className="p-2 text-center">{item.quantidade}</td>
                          <td className="p-2 text-right">{(item.preco_unitario || 0).toLocaleString('pt-AO')} Kz</td>
                          <td className="p-2 text-right">{(item.subtotal || 0).toLocaleString('pt-AO')} Kz</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 text-right border-t pt-4">
                  <p className="text-lg font-bold">Total: {(viewingFatura.total || 0).toLocaleString('pt-AO')} Kz</p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => imprimirFatura(viewingFatura)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Printer size={18} /> Imprimir
                  </button>
                  <button onClick={() => setViewingFatura(null)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição */}
        {editingFatura && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Editar Fatura {editingFatura.numero}</h2>
                <button onClick={() => setEditingFatura(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <h3 className="font-semibold mb-3">Itens da Fatura</h3>
                {editingFatura.venda?.itens.map((item, index) => (
                  <div key={item.id || index} className="flex flex-wrap gap-3 mb-3 items-center">
                    <select
                      className="flex-1 border rounded-lg p-2 text-sm"
                      value={item.produto?.id || item.servico?.id || ''}
                      onChange={(e) => {
                        const novaLista = [...(editingFatura.venda?.itens || [])];
                        const produtoSelecionado = produtos.find(p => p.id === Number(e.target.value));
                        const servicoSelecionado = servicos.find(s => s.id === Number(e.target.value));
                        if (produtoSelecionado) {
                          novaLista[index].produto = produtoSelecionado;
                          novaLista[index].servico = undefined;
                          novaLista[index].preco_unitario = produtoSelecionado.preco;
                        } else if (servicoSelecionado) {
                          novaLista[index].servico = servicoSelecionado;
                          novaLista[index].produto = undefined;
                          novaLista[index].preco_unitario = servicoSelecionado.valor;
                        }
                        novaLista[index].subtotal = novaLista[index].quantidade * novaLista[index].preco_unitario;
                        const novoTotal = novaLista.reduce((acc, i) => acc + (i.subtotal || 0), 0);
                        setEditingFatura({ ...editingFatura, total: novoTotal, venda: { ...editingFatura.venda!, itens: novaLista } });
                      }}
                    >
                      <option value="">Selecionar Produto/Serviço</option>
                      <optgroup label="Produtos">
                        {produtos.map(p => <option key={p.id} value={p.id}>📦 {p.nome} - {(p.preco || 0).toLocaleString('pt-AO')} Kz</option>)}
                      </optgroup>
                      <optgroup label="Serviços">
                        {servicos.map(s => <option key={s.id} value={s.id}>🔧 {s.nome} - {(s.valor || 0).toLocaleString('pt-AO')} Kz</option>)}
                      </optgroup>
                    </select>

                    <input
                      type="number"
                      className="border rounded-lg p-2 w-20 text-center"
                      min={1}
                      value={item.quantidade}
                      onChange={(e) => {
                        const novaLista = [...(editingFatura.venda?.itens || [])];
                        novaLista[index].quantidade = Number(e.target.value);
                        novaLista[index].subtotal = novaLista[index].quantidade * novaLista[index].preco_unitario;
                        const novoTotal = novaLista.reduce((acc, i) => acc + (i.subtotal || 0), 0);
                        setEditingFatura({ ...editingFatura, total: novoTotal, venda: { ...editingFatura.venda!, itens: novaLista } });
                      }}
                    />

                    <input
                      type="number"
                      className="border rounded-lg p-2 w-28 text-right"
                      min={0}
                      step={100}
                      value={item.preco_unitario}
                      onChange={(e) => {
                        const novaLista = [...(editingFatura.venda?.itens || [])];
                        novaLista[index].preco_unitario = Number(e.target.value);
                        novaLista[index].subtotal = novaLista[index].quantidade * novaLista[index].preco_unitario;
                        const novoTotal = novaLista.reduce((acc, i) => acc + (i.subtotal || 0), 0);
                        setEditingFatura({ ...editingFatura, total: novoTotal, venda: { ...editingFatura.venda!, itens: novaLista } });
                      }}
                    />

                    <span className="w-32 text-right font-medium">
                      {(item.subtotal || item.quantidade * item.preco_unitario || 0).toLocaleString('pt-AO')} Kz
                    </span>

                    <button
                      className="bg-red-500 text-white px-2 py-2 rounded-lg hover:bg-red-600"
                      onClick={() => {
                        const novaLista = (editingFatura.venda?.itens || []).filter((_, i) => i !== index);
                        const novoTotal = novaLista.reduce((acc, i) => acc + (i.subtotal || 0), 0);
                        setEditingFatura({ ...editingFatura, total: novoTotal, venda: { ...editingFatura.venda!, itens: novaLista } });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  onClick={() => {
                    const novaLista = [...(editingFatura.venda?.itens || []), { quantidade: 1, preco_unitario: 0, subtotal: 0 } as VendaItem];
                    setEditingFatura({ ...editingFatura, venda: { ...editingFatura.venda!, itens: novaLista } });
                  }}
                >
                  <Plus size={16} /> Adicionar Item
                </button>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                    <select
                      value={editingFatura.forma_pagamento}
                      onChange={e => setEditingFatura({ ...editingFatura, forma_pagamento: e.target.value })}
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="multicaixa">Multicaixa</option>
                      <option value="transferencia">Transferência</option>
                      <option value="seguro">Seguro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editingFatura.status}
                      onChange={e => setEditingFatura({ ...editingFatura, status: e.target.value as StatusFatura })}
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                      <option value="parcial">Parcial</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between mt-4 pt-4 border-t">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="font-bold text-xl text-green-600">{(editingFatura.total || 0).toLocaleString('pt-AO')} Kz</span>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setEditingFatura(null)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button onClick={salvarEdicao} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Salvar Alterações</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Cancelamento */}
        {cancelModal.isOpen && cancelModal.fatura && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
              <div className="flex items-center gap-3 p-6 border-b">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Confirmar Cancelamento</h2>
                  <p className="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-600 mb-2">
                  Tem certeza que deseja cancelar a fatura <strong className="text-red-600">{cancelModal.fatura.numero}</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  Valor total: <strong>{formatarValor(cancelModal.fatura.total)}</strong>
                </p>
              </div>

              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => setCancelModal({ isOpen: false, fatura: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={cancelando}
                >
                  Não, Voltar
                </button>
                <button
                  onClick={executarCancelamento}
                  disabled={cancelando}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 flex items-center justify-center gap-2"
                >
                  {cancelando ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    'Sim, Cancelar Fatura'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}