// app/parcelamentos/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { 
  CreditCard, Search, Eye, DollarSign, Calendar, 
  AlertCircle, CheckCircle, XCircle, Clock, Plus,
  Calculator, Trash2, Edit, X, Printer, FileText,
  Package, Wrench, User, TrendingUp
} from 'lucide-react';

interface Parcela {
  id: number;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  valor_pago?: number;
  multa?: number;
  juros?: number;
  desconto?: number;
}

interface ProdutoItem {
  id: number;
  nome: string;
  preco: number;
  tipo?: string;
}

interface ServicoItem {
  id: number;
  nome: string;
  valor: number;
}

interface ItemParcelado {
  tipo: 'produto' | 'servico';
  id: number;
  nome: string;
  valor: number;
  quantidade: number;
}

interface Parcelamento {
  id: number;
  numero_parcelamento: string;
  cliente: {
    id: number;
    nome: string;
    nif?: string;
    telefone?: string;
  };
  valor_total: number | string;
  valor_entrada: number | string;
  valor_financiado: number | string;
  valor_parcela: number | string;
  quantidade_parcelas: number;
  data_primeira_parcela: string;
  status: string;
  parcelas: Parcela[];
  configuracao?: {
    nome: string;
    taxa_juros_mensal: number;
  };
  itens?: ItemParcelado[];
}

interface ConfiguracaoParcelamento {
  id: number;
  nome: string;
  descricao: string;
  minimo_parcelas: number;
  maximo_parcelas: number;
  taxa_juros_mensal: number;
  desconto_avista: number;
  valor_minimo_parcela: number;
  exige_entrada: boolean;
  percentual_entrada_minimo: number;
}

interface Cliente {
  id: number;
  nome: string;
  nif?: string;
  telefone?: string;
}

interface FaturaInfo {
  id: number;
  numero: string;
  total: number;
  status: 'pendente' | 'pago' | 'cancelada' | 'parcial';
  data_emissao: string;
  data_quitacao?: string;
  forma_pagamento?: string;
}

const formatNumber = (value: number | string | undefined): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

const getStatusFaturaBadge = (status: string) => {
  switch (status) {
    case 'pago':
      return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><CheckCircle size={10} /> Paga</span>;
    case 'parcial':
      return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><TrendingUp size={10} /> Parcial</span>;
    case 'pendente':
      return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><Clock size={10} /> Pendente</span>;
    case 'cancelada':
      return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><XCircle size={10} /> Cancelada</span>;
    default:
      return null;
  }
};

export default function ParcelamentosPage() {
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedParcelamento, setSelectedParcelamento] = useState<Parcelamento | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pagandoParcela, setPagandoParcela] = useState<Parcela | null>(null);
  const [simulacaoModalOpen, setSimulacaoModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [faturaInfo, setFaturaInfo] = useState<FaturaInfo | null>(null);
  const [showFaturaModal, setShowFaturaModal] = useState(false);
  const [faturasMap, setFaturasMap] = useState<Record<number, FaturaInfo>>({});
  
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoParcelamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<ProdutoItem[]>([]);
  const [servicos, setServicos] = useState<ServicoItem[]>([]);
  const [clienteSearchTerm, setClienteSearchTerm] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  
  const [itensParcelados, setItensParcelados] = useState<ItemParcelado[]>([]);
  const [novoItemTipo, setNovoItemTipo] = useState<'produto' | 'servico'>('produto');
  const [novoItemId, setNovoItemId] = useState<number | null>(null);
  const [novoItemQuantidade, setNovoItemQuantidade] = useState(1);
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    config_id: '',
    valor_total: 0,
    entrada: 0,
    quantidade_parcelas: 1,
    data_primeira_parcela: new Date().toISOString().split('T')[0]
  });
  
  const [simulacao, setSimulacao] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [paymentData, setPaymentData] = useState({
    valor_pago: 0,
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'dinheiro',
    desconto: 0
  });

  useEffect(() => {
    carregarParcelamentos();
    carregarConfiguracoes();
    carregarClientes();
    carregarProdutosServicos();
  }, []);

  const carregarProdutosServicos = async () => {
    try {
      const [prodRes, servRes] = await Promise.all([
        fetch(getApiUrl('/produtos'), { headers: getAuthHeaders() }),
        fetch(getApiUrl('/servicos'), { headers: getAuthHeaders() })
      ]);
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProdutos(data.data || data);
      }
      if (servRes.ok) {
        const data = await servRes.json();
        setServicos(data.data || data);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos/serviços:', error);
    }
  };

  const carregarParcelamentos = async () => {
    setLoading(true);
    try {
      let url = '/parcelamentos?';
      if (searchTerm) url += `&search=${searchTerm}`;
      if (selectedStatus) url += `&status=${selectedStatus}`;

      const res = await fetch(getApiUrl(url), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const parcelamentosData = data.data || [];
        setParcelamentos(parcelamentosData);
        
        // Buscar faturas para cada parcelamento
        const faturasTemp: Record<number, FaturaInfo> = {};
        for (const p of parcelamentosData) {
          try {
            const faturaRes = await fetch(getApiUrl(`/faturas?parcelamento_id=${p.id}`), {
              headers: getAuthHeaders()
            });
            if (faturaRes.ok) {
              const faturas = await faturaRes.json();
              if (faturas && faturas.length > 0) {
                faturasTemp[p.id] = faturas[0];
              }
            }
          } catch (err) {
            console.error(`Erro ao buscar fatura para parcelamento ${p.id}:`, err);
          }
        }
        setFaturasMap(faturasTemp);
      }
    } catch (error) {
      console.error('Erro ao carregar parcelamentos:', error);
      mostrarMensagem('error', 'Erro ao carregar parcelamentos');
    } finally {
      setLoading(false);
    }
  };

  const carregarConfiguracoes = async () => {
    try {
      const res = await fetch(getApiUrl('/parcelamentos/configuracoes'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setConfiguracoes(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, config_id: String(data[0].id) }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      mostrarMensagem('error', 'Erro ao carregar configurações');
    }
  };

  const carregarClientes = async () => {
    try {
      const res = await fetch(getApiUrl('/pacientes'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setClientes(data.data || data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const adicionarItem = () => {
    if (!novoItemId) return;
    
    let item: ItemParcelado | null = null;
    if (novoItemTipo === 'produto') {
      const produto = produtos.find(p => p.id === novoItemId);
      if (produto) {
        item = {
          tipo: 'produto',
          id: produto.id,
          nome: produto.nome,
          valor: produto.preco,
          quantidade: novoItemQuantidade
        };
      }
    } else {
      const servico = servicos.find(s => s.id === novoItemId);
      if (servico) {
        item = {
          tipo: 'servico',
          id: servico.id,
          nome: servico.nome,
          valor: servico.valor,
          quantidade: novoItemQuantidade
        };
      }
    }
    
    if (item) {
      setItensParcelados([...itensParcelados, item]);
      const novoTotal = calcularTotalItens([...itensParcelados, item]);
      setFormData(prev => ({ ...prev, valor_total: novoTotal }));
      
      // Reset
      setNovoItemId(null);
      setNovoItemQuantidade(1);
    }
  };

  const removerItem = (index: number) => {
    const novosItens = itensParcelados.filter((_, i) => i !== index);
    setItensParcelados(novosItens);
    const novoTotal = calcularTotalItens(novosItens);
    setFormData(prev => ({ ...prev, valor_total: novoTotal }));
  };

  const calcularTotalItens = (itens: ItemParcelado[]): number => {
    return itens.reduce((total, item) => total + (item.valor * item.quantidade), 0);
  };

  const verDetalhes = async (id: number) => {
    try {
      const res = await fetch(getApiUrl(`/parcelamentos/${id}`), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedParcelamento(data);
        
        // Buscar fatura associada
        const faturaRes = await fetch(getApiUrl(`/faturas?parcelamento_id=${id}`), {
          headers: getAuthHeaders()
        });
        if (faturaRes.ok) {
          const faturas = await faturaRes.json();
          if (faturas && faturas.length > 0) {
            setFaturaInfo(faturas[0]);
          }
        }
        
        setModalOpen(true);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      mostrarMensagem('error', 'Erro ao carregar detalhes');
    }
  };

  const verFatura = (fatura: FaturaInfo) => {
    setFaturaInfo(fatura);
    setShowFaturaModal(true);
  };

  const simularParcelamento = async () => {
    if (!formData.config_id || !formData.valor_total) {
      mostrarMensagem('error', 'Preencha todos os campos obrigatórios');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(getApiUrl('/parcelamentos/simular'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_total: formData.valor_total,
          entrada: formData.entrada,
          quantidade_parcelas: formData.quantidade_parcelas,
          config_id: parseInt(formData.config_id),
          data_primeira_parcela: formData.data_primeira_parcela
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSimulacao(data);
      mostrarMensagem('success', 'Simulação realizada com sucesso!');
    } catch (error: any) {
      mostrarMensagem('error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const criarParcelamento = async () => {
    if (!selectedCliente) {
      mostrarMensagem('error', 'Selecione um cliente');
      return;
    }
    if (!simulacao) {
      mostrarMensagem('error', 'Realize a simulação primeiro');
      return;
    }
    if (itensParcelados.length === 0) {
      mostrarMensagem('error', 'Adicione pelo menos um produto ou serviço');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(getApiUrl('/parcelamentos'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: selectedCliente.id,
          venda_id: null,
          consulta_id: null,
          config_id: parseInt(formData.config_id),
          valor_total: formData.valor_total,
          entrada: formData.entrada,
          quantidade_parcelas: formData.quantidade_parcelas,
          data_primeira_parcela: formData.data_primeira_parcela,
          observacoes: `Parcelamento criado via sistema - Itens: ${itensParcelados.map(i => `${i.nome} (${i.quantidade}x)`).join(', ')}`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      mostrarMensagem('success', 'Parcelamento criado com sucesso!');
      setSimulacaoModalOpen(false);
      resetForm();
      carregarParcelamentos();
    } catch (error: any) {
      mostrarMensagem('error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const registrarPagamento = async (parcelaId: number) => {
    setSubmitting(true);
    try {
      const res = await fetch(getApiUrl(`/parcelamentos/parcelas/${parcelaId}/pagar`), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_pago: paymentData.valor_pago,
          data_pagamento: paymentData.data_pagamento,
          forma_pagamento: paymentData.forma_pagamento,
          desconto: paymentData.desconto
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      mostrarMensagem('success', 'Pagamento registrado com sucesso!');
      setPagandoParcela(null);
      carregarParcelamentos();
      if (selectedParcelamento) {
        verDetalhes(selectedParcelamento.id);
      }
      
      setPaymentData({
        valor_pago: 0,
        data_pagamento: new Date().toISOString().split('T')[0],
        forma_pagamento: 'dinheiro',
        desconto: 0
      });
    } catch (error: any) {
      mostrarMensagem('error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const mostrarMensagem = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      config_id: configuracoes[0]?.id.toString() || '',
      valor_total: 0,
      entrada: 0,
      quantidade_parcelas: 1,
      data_primeira_parcela: new Date().toISOString().split('T')[0]
    });
    setSelectedCliente(null);
    setClienteSearchTerm('');
    setSimulacao(null);
    setItensParcelados([]);
    setNovoItemId(null);
    setNovoItemQuantidade(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><Clock size={12} /> Ativo</span>;
      case 'quitado':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle size={12} /> Quitado</span>;
      case 'cancelado':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle size={12} /> Cancelado</span>;
      case 'atrasado':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><AlertCircle size={12} /> Atrasado</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  const getParcelaStatusBadge = (status: string, dataVencimento: string) => {
    if (status === 'pago') {
      return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Pago</span>;
    }
    if (status === 'cancelado') {
      return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Cancelado</span>;
    }
    if (new Date(dataVencimento) < new Date() && status === 'pendente') {
      return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">Atrasado</span>;
    }
    return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">Pendente</span>;
  };

  const configAtual = configuracoes.find(c => c.id === parseInt(formData.config_id));
  const filteredClientes = clientes.filter(cliente => {
    const searchLower = clienteSearchTerm.toLowerCase();
    return (
      cliente.nome.toLowerCase().includes(searchLower) ||
      (cliente.nif && cliente.nif.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CreditCard size={28} className="text-indigo-600" />
              Parcelamentos
            </h1>
            <p className="text-gray-500 mt-1">Gestão de vendas parceladas e controle de pagamentos</p>
          </div>
          <button
            onClick={() => setSimulacaoModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Calculator size={18} />
            Novo Parcelamento
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar por número, cliente ou NIF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="quitado">Quitado</option>
              <option value="atrasado">Atrasado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <button
              onClick={carregarParcelamentos}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Filtrar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parcelamentos.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow-sm p-12 text-center">
                <CreditCard size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-400 text-lg">Nenhum parcelamento encontrado</p>
              </div>
            ) : (
              parcelamentos.map((p) => {
                const parcelasPagas = p.parcelas?.filter(par => par.status === 'pago').length || 0;
                const totalParcelas = p.quantidade_parcelas;
                const percentualPago = totalParcelas > 0 ? (parcelasPagas / totalParcelas) * 100 : 0;
                const fatura = faturasMap[p.id];
                
                return (
                  <div key={p.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800 font-mono">{p.numero_parcelamento}</h3>
                          <p className="text-xs text-gray-400">{new Date(p.data_primeira_parcela).toLocaleDateString('pt-AO')}</p>
                        </div>
                        {getStatusBadge(p.status)}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User size={14} className="text-gray-400" />
                          <span className="text-gray-600 truncate">{p.cliente.nome}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign size={14} className="text-gray-400" />
                          <span className="text-gray-600">Total: <strong className="text-gray-800">{formatNumber(p.valor_total).toFixed(2)} Kz</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard size={14} className="text-gray-400" />
                          <span className="text-gray-600">Parcela: {formatNumber(p.valor_parcela).toFixed(2)} Kz</span>
                        </div>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progresso</span>
                          <span>{parcelasPagas}/{totalParcelas} ({percentualPago.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentualPago}%` }}
                          />
                        </div>
                      </div>

                      {/* Indicador de Fatura */}
                      {fatura && (
                        <div className="mb-3 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-gray-500" />
                            <span className="text-xs text-gray-600">Fatura: {fatura.numero}</span>
                          </div>
                          {getStatusFaturaBadge(fatura.status)}
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => verDetalhes(p.id)}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye size={14} /> Detalhes
                        </button>
                        {fatura && (
                          <button
                            onClick={() => verFatura(fatura)}
                            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                            title="Ver Fatura"
                          >
                            <FileText size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modal de Simulação/Criação de Parcelamento */}
      {simulacaoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calculator size={20} />
                Novo Parcelamento
              </h2>
              <button onClick={() => { setSimulacaoModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Cliente */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={clienteSearchTerm}
                    onChange={(e) => {
                      setClienteSearchTerm(e.target.value);
                      setShowClienteDropdown(true);
                      setSelectedCliente(null);
                    }}
                    onFocus={() => setShowClienteDropdown(true)}
                    placeholder="Pesquisar cliente por nome ou NIF..."
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                {showClienteDropdown && clienteSearchTerm && filteredClientes.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredClientes.map(cliente => (
                      <button
                        key={cliente.id}
                        type="button"
                        onClick={() => {
                          setSelectedCliente(cliente);
                          setClienteSearchTerm(`${cliente.nome}${cliente.nif ? ` - ${cliente.nif}` : ''}`);
                          setShowClienteDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                      >
                        <div className="font-medium text-gray-800">{cliente.nome}</div>
                        {cliente.nif && <div className="text-xs text-gray-500">NIF: {cliente.nif}</div>}
                      </button>
                    ))}
                  </div>
                )}

                {selectedCliente && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-blue-800">Cliente selecionado:</span>
                      <div className="text-sm text-blue-700">{selectedCliente.nome}</div>
                      {selectedCliente.nif && <div className="text-xs text-blue-600">NIF: {selectedCliente.nif}</div>}
                    </div>
                    <button onClick={() => { setSelectedCliente(null); setClienteSearchTerm(''); }} className="text-blue-600 hover:text-blue-800">
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Produtos/Serviços */}
              <div className="border rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Produtos/Serviços *</label>
                
                {/* Lista de itens adicionados */}
                {itensParcelados.length > 0 && (
                  <div className="mb-3 space-y-2 max-h-40 overflow-y-auto">
                    {itensParcelados.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {item.tipo === 'produto' ? <Package size={14} /> : <Wrench size={14} />}
                          <span className="text-sm">{item.nome}</span>
                          <span className="text-xs text-gray-500">{item.quantidade}x</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{(item.valor * item.quantidade).toFixed(2)} Kz</span>
                          <button onClick={() => removerItem(idx)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Adicionar novo item */}
                <div className="flex gap-2">
                  <select
                    value={novoItemTipo}
                    onChange={(e) => { setNovoItemTipo(e.target.value as 'produto' | 'servico'); setNovoItemId(null); }}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="produto">Produto</option>
                    <option value="servico">Serviço</option>
                  </select>
                  
                  <select
                    value={novoItemId || ''}
                    onChange={(e) => setNovoItemId(Number(e.target.value))}
                    className="flex-1 border rounded-lg px-3 py-2"
                  >
                    <option value="">Selecione...</option>
                    {novoItemTipo === 'produto' 
                      ? produtos.map(p => <option key={p.id} value={p.id}>{p.nome} - {p.preco.toFixed(2)} Kz</option>)
                      : servicos.map(s => <option key={s.id} value={s.id}>{s.nome} - {s.valor.toFixed(2)} Kz</option>)
                    }
                  </select>
                  
                  <input
                    type="number"
                    min="1"
                    value={novoItemQuantidade}
                    onChange={(e) => setNovoItemQuantidade(Number(e.target.value))}
                    className="w-20 border rounded-lg px-2 py-2 text-center"
                  />
                  
                  <button
                    onClick={adicionarItem}
                    disabled={!novoItemId}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Configuração */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Configuração de Parcelamento</label>
                <select
                  value={formData.config_id}
                  onChange={(e) => setFormData({ ...formData, config_id: e.target.value })}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {configuracoes.map(config => (
                    <option key={config.id} value={config.id}>
                      {config.nome} {config.taxa_juros_mensal > 0 ? `(Juros: ${config.taxa_juros_mensal}% a.m.)` : '(Sem juros)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor Total (calculado automaticamente) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (Kz) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor_total}
                  readOnly
                  className="w-full border rounded-lg p-2 bg-gray-100 font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">Total calculado a partir dos itens selecionados</p>
              </div>

              {/* Entrada */}
              {configAtual?.exige_entrada && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor de Entrada (Mínimo: {configAtual.percentual_entrada_minimo}%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.entrada}
                    onChange={(e) => setFormData({ ...formData, entrada: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Quantidade de Parcelas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Parcelas</label>
                <select
                  value={formData.quantidade_parcelas}
                  onChange={(e) => setFormData({ ...formData, quantidade_parcelas: parseInt(e.target.value) })}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {configAtual ? (
                    Array.from(
                      { length: configAtual.maximo_parcelas - configAtual.minimo_parcelas + 1 },
                      (_, i) => configAtual.minimo_parcelas + i
                    ).map(num => <option key={num} value={num}>{num}x</option>)
                  ) : (
                    <option value="1">1x</option>
                  )}
                </select>
              </div>

              {/* Data Primeira Parcela */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data da Primeira Parcela</label>
                <input
                  type="date"
                  value={formData.data_primeira_parcela}
                  onChange={(e) => setFormData({ ...formData, data_primeira_parcela: e.target.value })}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Botão Simular */}
              <button
                onClick={simularParcelamento}
                disabled={submitting || !selectedCliente || !formData.valor_total || !formData.config_id || itensParcelados.length === 0}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Calculator size={18} />}
                Simular
              </button>

              {/* Resultado da Simulação */}
              {simulacao && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-lg mb-3">Resultado da Simulação</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Total:</span>
                      <span className="font-semibold">{formatNumber(simulacao.valor_total).toFixed(2)} Kz</span>
                    </div>
                    {simulacao.entrada > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entrada:</span>
                        <span className="font-semibold text-green-600">{formatNumber(simulacao.entrada).toFixed(2)} Kz</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Financiado:</span>
                      <span>{formatNumber(simulacao.valor_financiado).toFixed(2)} Kz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor da Parcela:</span>
                      <span className="font-semibold text-blue-600">{formatNumber(simulacao.valor_parcela).toFixed(2)} Kz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total a Pagar:</span>
                      <span className="font-semibold">{formatNumber(simulacao.total_pagar).toFixed(2)} Kz</span>
                    </div>
                    {simulacao.total_juros > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Total de Juros:</span>
                        <span>{formatNumber(simulacao.total_juros).toFixed(2)} Kz</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => { setSimulacaoModalOpen(false); resetForm(); }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={criarParcelamento}
                      disabled={submitting}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div> : 'Confirmar Parcelamento'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {modalOpen && selectedParcelamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CreditCard size={20} />
                Detalhes do Parcelamento
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Número</p>
                  <p className="font-mono font-semibold">{selectedParcelamento.numero_parcelamento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-semibold">{selectedParcelamento.cliente.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor Total</p>
                  <p className="font-semibold text-lg">{formatNumber(selectedParcelamento.valor_total).toFixed(2)} Kz</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedParcelamento.status)}
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progresso de Pagamento</span>
                  <span>{selectedParcelamento.parcelas?.filter(p => p.status === 'pago').length || 0} de {selectedParcelamento.quantidade_parcelas} parcelas</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${((selectedParcelamento.parcelas?.filter(p => p.status === 'pago').length || 0) / selectedParcelamento.quantidade_parcelas) * 100}%` }}
                  />
                </div>
              </div>
              
              {faturaInfo && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Fatura Associada</p>
                    <p className="text-sm text-blue-600">Nº: {faturaInfo.numero}</p>
                    <p className="text-sm text-blue-600">Total: {formatNumber(faturaInfo.total).toFixed(2)} Kz</p>
                  </div>
                  {getStatusFaturaBadge(faturaInfo.status)}
                </div>
              )}
            </div>

            <h3 className="font-semibold mb-3">Cronograma de Pagamento</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm">Parcela</th>
                    <th className="px-4 py-2 text-right text-sm">Valor</th>
                    <th className="px-4 py-2 text-center text-sm">Vencimento</th>
                    <th className="px-4 py-2 text-center text-sm">Status</th>
                    <th className="px-4 py-2 text-center text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedParcelamento.parcelas?.map((parcela) => (
                    <tr key={parcela.id} className="border-t">
                      <td className="px-4 py-2 text-sm font-medium">{parcela.numero_parcela}ª</td>
                      <td className="px-4 py-2 text-right">{formatNumber(parcela.valor).toFixed(2)} Kz</td>
                      <td className="px-4 py-2 text-center">
                        {new Date(parcela.data_vencimento).toLocaleDateString('pt-AO')}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {getParcelaStatusBadge(parcela.status, parcela.data_vencimento)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {parcela.status === 'pendente' && selectedParcelamento.status !== 'quitado' && (
                          <button
                            onClick={() => setPagandoParcela(parcela)}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
                          >
                            Pagar
                          </button>
                        )}
                        {parcela.status === 'pago' && parcela.valor_pago && (
                          <div className="text-xs text-gray-500">
                            <div>Pago em: {new Date(parcela.data_pagamento!).toLocaleDateString('pt-AO')}</div>
                            {parcela.multa && parcela.multa > 0 && <div>Multa: {parcela.multa.toFixed(2)} Kz</div>}
                            {parcela.juros && parcela.juros > 0 && <div>Juros: {parcela.juros.toFixed(2)} Kz</div>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pagamento */}
      {pagandoParcela && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Registrar Pagamento</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Parcela</label>
                <p className="text-2xl font-bold text-green-600">{formatNumber(pagandoParcela.valor).toFixed(2)} Kz</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Pago</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.valor_pago}
                  onChange={(e) => setPaymentData({ ...paymentData, valor_pago: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desconto</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.desconto}
                  onChange={(e) => setPaymentData({ ...paymentData, desconto: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data do Pagamento</label>
                <input
                  type="date"
                  value={paymentData.data_pagamento}
                  onChange={(e) => setPaymentData({ ...paymentData, data_pagamento: e.target.value })}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                <select
                  value={paymentData.forma_pagamento}
                  onChange={(e) => setPaymentData({ ...paymentData, forma_pagamento: e.target.value })}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="multicaixa">Multicaixa</option>
                  <option value="transferencia">Transferência</option>
                  <option value="seguro">Seguro</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setPagandoParcela(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => registrarPagamento(pagandoParcela.id)}
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div> : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Fatura */}
      {showFaturaModal && faturaInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText size={20} />
                Detalhes da Fatura
              </h2>
              <button onClick={() => setShowFaturaModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Número</p>
                <p className="font-mono font-semibold">{faturaInfo.numero}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(faturaInfo.total).toFixed(2)} Kz</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                {getStatusFaturaBadge(faturaInfo.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Emissão</p>
                <p>{new Date(faturaInfo.data_emissao).toLocaleDateString('pt-AO')}</p>
              </div>
              {faturaInfo.data_quitacao && (
                <div>
                  <p className="text-sm text-gray-500">Data de Quitação</p>
                  <p>{new Date(faturaInfo.data_quitacao).toLocaleDateString('pt-AO')}</p>
                </div>
              )}
              {faturaInfo.forma_pagamento && (
                <div>
                  <p className="text-sm text-gray-500">Forma de Pagamento</p>
                  <p>{faturaInfo.forma_pagamento.toUpperCase()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}