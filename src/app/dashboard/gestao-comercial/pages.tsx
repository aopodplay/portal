'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, Minus, Search, Printer,
  CreditCard, Users, FileText,
  ShoppingCart, DollarSign, X,
  CheckCircle, AlertCircle, UserPlus,
  Calendar, Phone, MapPin, Hash, User,
  Trash2, Edit, Eye, Stethoscope, FlaskConical
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

/* ================= TYPES ================= */

interface VendaItemCarrinho {
  produto_id?: number;
  servico_id?: number;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

interface ProdutoVenda {
  id: number;
  nome: string;
  tipo: 'produto' | 'servico';
  preco: number;
  estoque: number;
}

interface VendaRegistro {
  id: number;
  itens: VendaItemCarrinho[];
  total: number;
  desconto: number;
  forma_pagamento: string;
  created_at: string;
  fatura?: { numero: string; id: number };
  atendimento?: { paciente?: { nome: string } };
  usuario?: { nome: string };
}

interface Fatura {
  id: number;
  numero: string;
  total: number;
  saldo: number;
  status: string;
  forma_pagamento: string;
  venda?: {
    itens?: Array<{ nome: string; quantidade: number; preco_unitario: number; subtotal: number }>;
    atendimento?: { paciente?: { nome: string; telefone?: string; nif?: string } };
  };
  pagamentos?: { valor_total?: number; forma_pagamento?: string }[];
  usuario?: { nome: string };
  created_at?: string;
}

interface Paciente {
  id: number;
  nome: string;
  telefone?: string;
  nif?: string;
  data_nascimento?: string;
  endereco?: string;
  sexo?: string;
  created_at?: string;
}

interface ConfiguracaoSistema {
  nome_empresa?: string;
  nif_empresa?: string;
  telefone_empresa?: string;
  email_empresa?: string;
  endereco_empresa?: string;
  logo_url?: string;
}

interface PacienteFormData {
  nome: string;
  telefone: string;
  nif: string;
  data_nascimento: string;
  endereco: string;
  sexo: string;
}

interface AtendimentoPaciente {
  id: number;
  nome: string;
  nif?: string;
}

interface Atendimento {
  id: number;
  status: 'aguardando' | 'em_consulta' | 'consulta_concluida' | 'finalizado';
  data_entrada: string;
  data_saida?: string;
  paciente?: AtendimentoPaciente | null;
}

interface Consulta {
  id: number;
  paciente_id: number;
  atendimento_id: number;
  optometrista_id: number;
  od_esferico?: string;
  od_cilindrico?: string;
  od_eixo?: string;
  oe_esferico?: string;
  oe_cilindrico?: string;
  oe_eixo?: string;
  adicao?: string;
  dnp?: string;
  diagnostico?: string;
  observacoes?: string;
  medicacao?: string;
  created_at: string;
  paciente?: {
    id: number;
    nome: string;
    nif?: string;
    telefone?: string;
  };
  optometrista?: {
    id: number;
    nome: string;
  };
  atendimento?: {
    id: number;
    status: string;
  };
}

interface EncomendaOculos {
  id: number;
  paciente_id: number;
  atendimento_id?: number;
  usuario_id?: number;
  tipo_servico: 'oculos_novo' | 'troca_lente' | 'reparacao' | 'ajuste' | 'garantia';
  status: 'pedido_criado' | 'enviado_laboratorio' | 'em_producao' | 'montagem' | 'pronto' | 'entregue' | 'cancelado';
  data_pedido: string;
  data_prevista?: string;
  data_entrega?: string;
  observacao?: string;
  created_at: string;
  paciente?: {
    id: number;
    nome: string;
    nif?: string;
    telefone?: string;
  };
  usuario?: {
    id: number;
    nome: string;
  };
}

const STATUS_FLOW_ATENDIMENTO = {
  aguardando: {
    label: 'Iniciar Consulta',
    next: 'em_consulta',
    color: 'bg-yellow-500',
    title: '🟡 Aguardando'
  },
  em_consulta: {
    label: 'Concluir Consulta',
    next: 'consulta_concluida',
    color: 'bg-blue-500',
    title: '🔵 Em Consulta'
  },
  consulta_concluida: {
    label: 'Finalizar',
    next: 'finalizado',
    color: 'bg-purple-500',
    title: '🟣 Concluída'
  },
  finalizado: {
    label: '',
    next: '',
    color: 'bg-gray-400',
    title: '⚫ Finalizado'
  },
} as const;

const STATUS_FLOW_LABORATORIO = {
  pedido_criado: {
    label: 'Enviar ao Laboratório',
    next: 'enviado_laboratorio',
    color: 'bg-yellow-500',
    title: '📦 Pedido Criado'
  },
  enviado_laboratorio: {
    label: 'Iniciar Produção',
    next: 'em_producao',
    color: 'bg-blue-500',
    title: '🚚 Enviado'
  },
  em_producao: {
    label: 'Montagem',
    next: 'montagem',
    color: 'bg-purple-500',
    title: '⚙️ Em Produção'
  },
  montagem: {
    label: 'Pronto para Entrega',
    next: 'pronto',
    color: 'bg-indigo-500',
    title: '🔧 Montagem'
  },
  pronto: {
    label: 'Entregar',
    next: 'entregue',
    color: 'bg-green-500',
    title: '✅ Pronto'
  },
  entregue: {
    label: '',
    next: '',
    color: 'bg-gray-400',
    title: '📋 Entregue'
  },
  cancelado: {
    label: '',
    next: '',
    color: 'bg-red-400',
    title: '❌ Cancelado'
  },
} as const;

const ITEMS_PER_PAGE = 4;

/* ================== COMPONENTE ================== */

export default function GestaoComercialPage() {
  const { user: authUser } = useAuth();

  /* ======= ESTADOS EXISTENTES ======= */
  const [produtosVenda, setProdutosVenda] = useState<ProdutoVenda[]>([]);
  const [busca, setBusca] = useState('');
  const [itensVenda, setItensVenda] = useState<VendaItemCarrinho[]>([]);
  const [descontoVenda, setDescontoVenda] = useState<number>(0);
  const [formaPagamentoVenda, setFormaPagamentoVenda] = useState('dinheiro');
  const [pacienteSelecionado, setPacienteSelecionado] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [vendas, setVendas] = useState<VendaRegistro[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 4;

  const [faturasPendentes, setFaturasPendentes] = useState<Fatura[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState<Paciente[]>([]);
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [faturaId, setFaturaId] = useState('');
  const [valorPagamento, setValorPagamento] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ConfiguracaoSistema | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'vendas' | 'pagamentos' | 'pacientes' | 'atendimentos' | 'consultas' | 'laboratorio'>('atendimentos');
  const [excluindoPaciente, setExcluindoPaciente] = useState<number | null>(null);
  const [editandoPaciente, setEditandoPaciente] = useState<Paciente | null>(null);

  const [pacienteForm, setPacienteForm] = useState<PacienteFormData>({
    nome: '',
    telefone: '',
    nif: '',
    data_nascimento: '',
    endereco: '',
    sexo: ''
  });
  const [submittingPaciente, setSubmittingPaciente] = useState(false);

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

  /* ======= ESTADOS PARA ATENDIMENTOS ======= */
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [pacientesParaAtendimento, setPacientesParaAtendimento] = useState<Paciente[]>([]);
  const [modalAtendimentoOpen, setModalAtendimentoOpen] = useState(false);
  const [pacienteIdAtendimento, setPacienteIdAtendimento] = useState<number | ''>('');
  const [searchPacienteAtendimento, setSearchPacienteAtendimento] = useState('');
  const [filtroGlobalAtendimento, setFiltroGlobalAtendimento] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [paginaAtendimento, setPaginaAtendimento] = useState<Record<string, number>>({});
  const [removendoAtendimento, setRemovendoAtendimento] = useState(false);

  /* ======= ESTADOS PARA CONSULTAS ======= */
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [filtroConsultas, setFiltroConsultas] = useState('');
  const [filtroConsultasData, setFiltroConsultasData] = useState('');
  const [modalConsultaOpen, setModalConsultaOpen] = useState(false);
  const [atendimentosEmConsulta, setAtendimentosEmConsulta] = useState<Atendimento[]>([]);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<number | ''>('');
  const [buscaAtendimento, setBuscaAtendimento] = useState('');
  const [loadingConsulta, setLoadingConsulta] = useState(false);
  const [editandoConsulta, setEditandoConsulta] = useState<Consulta | null>(null);
  const [formConsulta, setFormConsulta] = useState({
    od_esferico: '',
    od_cilindrico: '',
    od_eixo: '',
    oe_esferico: '',
    oe_cilindrico: '',
    oe_eixo: '',
    adicao: '',
    dnp: '',
    diagnostico: '',
    observacoes: '',
    medicacao: ''
  });

  /* ======= ESTADOS PARA LABORATÓRIO ======= */
  const [encomendas, setEncomendas] = useState<EncomendaOculos[]>([]);
  const [modalEncomendaOpen, setModalEncomendaOpen] = useState(false);
  const [pacienteIdEncomenda, setPacienteIdEncomenda] = useState<number | ''>('');
  const [tipoServico, setTipoServico] = useState('oculos_novo');
  const [dataPrevista, setDataPrevista] = useState('');
  const [observacaoEncomenda, setObservacaoEncomenda] = useState('');
  const [filtroEncomendas, setFiltroEncomendas] = useState('');
  const [paginaEncomenda, setPaginaEncomenda] = useState<Record<string, number>>({});

  /* ================== FUNÇÕES DE PERFIL ================== */
  const userPerfil = authUser?.perfil?.toLowerCase() || '';
  const isAdmin = userPerfil === 'admin';
  const isOptometrista = userPerfil === 'optometrista';
  const isCaixa = userPerfil === 'caixa';
  const isRecepcao = userPerfil === 'recepcao';

  const getPaginaAtendimento = (status: string) => paginaAtendimento[status] || 1;
  const setPaginaAtendimentoFn = (status: string, page: number) =>
    setPaginaAtendimento(prev => ({ ...prev, [status]: page }));

  const getPaginaEncomenda = (status: string) => paginaEncomenda[status] || 1;
  const setPaginaEncomendaFn = (status: string, page: number) =>
    setPaginaEncomenda(prev => ({ ...prev, [status]: page }));

  /* ================== FETCH ================== */
  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    const filtrarPacientes = () => {
      if (!buscaPaciente.trim()) {
        setPacientesFiltrados(pacientes);
      } else {
        const termo = buscaPaciente.toLowerCase();
        const filtrados = pacientes.filter(p =>
          p.nome.toLowerCase().includes(termo) ||
          (p.telefone && p.telefone.includes(termo)) ||
          (p.nif && p.nif.includes(termo))
        );
        setPacientesFiltrados(filtrados);
      }
    };
    filtrarPacientes();
  }, [buscaPaciente, pacientes]);

  const carregarDadosIniciais = async () => {
    try {
      await Promise.all([
        fetchProdutosServicos(),
        fetchPacientes(),
        fetchConfig(),
        fetchAtendimentos(),
        fetchConsultas(),
        fetchAtendimentosEmConsulta(),
        fetchEncomendas()
      ]);

      if (isCaixa || isAdmin) {
        await Promise.all([
          fetchVendas(),
          fetchFaturasPendentes()
        ]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const fetchProdutosServicos = async () => {
    try {
      // Verifica se o usuário tem permissão para acessar produtos/serviços
      // Apenas caixa e admin precisam desses dados para a aba de vendas
      if (!isCaixa && !isAdmin) {
        console.log('Usuário sem permissão para produtos/serviços, ignorando...');
        return;
      }

      const [prodRes, servRes] = await Promise.all([
        fetch(getApiUrl('/produtos'), { headers: getAuthHeaders() }),
        fetch(getApiUrl('/servicos'), { headers: getAuthHeaders() })
      ]);

      // Se não tiver permissão (403), apenas retorna sem erro
      if (prodRes.status === 403 || servRes.status === 403) {
        console.log('Acesso negado a produtos/serviços');
        return;
      }

      if (!prodRes.ok || !servRes.ok) throw new Error('Erro ao carregar produtos/serviços');

      const produtos = await prodRes.json();
      const servicos = await servRes.json();

      const listaProdutos = (produtos.data || produtos).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        tipo: 'produto' as const,
        preco: Number(p.preco),
        estoque: Number(p.estoque || 0)
      }));

      const listaServicos = (servicos.data || servicos).map((s: any) => ({
        id: s.id,
        nome: s.nome,
        tipo: 'servico' as const,
        preco: Number(s.valor),
        estoque: Infinity
      }));

      setProdutosVenda([...listaProdutos, ...listaServicos]);
    } catch (err) {
      console.error('Erro ao carregar produtos/serviços:', err);
      // Não mostra mensagem de erro para o usuário, apenas log
      // mostrarMensagem('error', 'Erro ao carregar produtos e serviços');
    }
  };

  const fetchVendas = async () => {
    try {
      const res = await fetch(getApiUrl('/vendas'), { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setVendas(data.data || data);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
    }
  };

  const fetchFaturasPendentes = async () => {
    try {
      const res = await fetch(getApiUrl('/faturas'), { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.data || []);

      const pendentes = arr
        .filter((f: any) => ['pendente', 'parcial'].includes(f.status?.toLowerCase()))
        .map((f: any) => {
          const totalPago = f.pagamentos?.reduce((sum: number, p: any) => sum + Number(p.valor_total ?? p.valor ?? 0), 0) || 0;
          const saldo = Number(f.total || 0) - totalPago;
          return { ...f, saldo };
        })
        .filter((f: any) => f.saldo > 0.01);

      setFaturasPendentes(pendentes);
    } catch (err) {
      console.error('Erro ao carregar faturas pendentes:', err);
    }
  };

  const fetchPacientes = async () => {
    try {
      const res = await fetch(getApiUrl('/pacientes'), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Erro ao carregar pacientes');
      const data = await res.json();
      const pacientesData = data.data || data;
      setPacientes(pacientesData);
      setPacientesFiltrados(pacientesData);
      setPacientesParaAtendimento(pacientesData);
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(getApiUrl('/configuracoes-sistema'), { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    }
  };

  const fetchAtendimentos = async () => {
    try {
      const res = await fetch(getApiUrl('/atendimentos'), { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAtendimentos(data.data || data);
      }
    } catch (err) {
      console.error('Erro ao carregar atendimentos:', err);
    }
  };

  const fetchConsultas = async () => {
    try {
      const res = await fetch(getApiUrl('/consultas'), { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setConsultas(data.data || data);
      }
    } catch (err) {
      console.error('Erro ao carregar consultas:', err);
    }
  };

  const fetchAtendimentosEmConsulta = async () => {
    try {
      const res = await fetch(getApiUrl('/atendimentos'), { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const atendimentosLista = data.data || data;
        const emConsulta = atendimentosLista.filter((a: Atendimento) => a.status === 'em_consulta');
        setAtendimentosEmConsulta(emConsulta);
      }
    } catch (err) {
      console.error('Erro ao carregar atendimentos:', err);
    }
  };

  const fetchEncomendas = async () => {
    try {
      const res = await fetch(getApiUrl('/encomendas-oculos'), { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEncomendas(data.data || data);
      }
    } catch (err) {
      console.error('Erro ao carregar encomendas:', err);
    }
  };

  const mostrarMensagem = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  /* ================== CARRINHO ================== */
  const addItemVenda = (p: ProdutoVenda) => {
    if (itensVenda.find(i => i.nome === p.nome)) {
      mostrarMensagem('error', 'Item já adicionado ao carrinho');
      return;
    }
    setItensVenda([...itensVenda, {
      produto_id: p.tipo === 'produto' ? p.id : undefined,
      servico_id: p.tipo === 'servico' ? p.id : undefined,
      nome: p.nome,
      quantidade: 1,
      preco_unitario: p.preco,
      subtotal: p.preco
    }]);
  };

  const alterarQtd = (index: number, delta: number) => {
    const item = itensVenda[index];
    const novaQtd = item.quantidade + delta;
    if (novaQtd < 1) return;
    setItensVenda(itensVenda.map((it, i) =>
      i === index ? { ...it, quantidade: novaQtd, subtotal: novaQtd * it.preco_unitario } : it
    ));
  };

  const removerItemVenda = (index: number) => setItensVenda(itensVenda.filter((_, i) => i !== index));
  const limparCarrinho = () => {
    setItensVenda([]);
    setDescontoVenda(0);
    setPacienteSelecionado('');
  };

  const totalVenda = itensVenda.reduce((s, i) => s + i.subtotal, 0) - descontoVenda;

  /* ================== CRIAR VENDA ================== */
  const criarVenda = async () => {
    if (!itensVenda.length) {
      mostrarMensagem('error', 'Adicione itens à venda');
      return;
    }

    const body = {
      paciente_id: pacienteSelecionado ? Number(pacienteSelecionado) : null,
      forma_pagamento: formaPagamentoVenda,
      desconto: descontoVenda,
      itens: itensVenda.map(i => ({
        produto_id: i.produto_id,
        servico_id: i.servico_id,
        quantidade: i.quantidade
      }))
    };

    try {
      const res = await fetch(getApiUrl('/vendas'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar venda');

      mostrarMensagem('success', 'Venda registrada com sucesso!');
      limparCarrinho();
      await fetchVendas();
      await fetchFaturasPendentes();

      if (data?.fatura?.id) {
        setAbaAtiva('pagamentos');
        setFaturaId(String(data.fatura.id));
        const fatura = faturasPendentes.find(f => f.id === data.fatura.id);
        if (fatura && fatura.saldo > 0) {
          setValorPagamento(fatura.saldo.toFixed(2));
        }
      }

    } catch (err) {
      console.error(err);
      mostrarMensagem('error', err instanceof Error ? err.message : 'Erro ao registrar venda');
    }
  };

  /* ================== CRIAR PAGAMENTO ================== */
  const handleFaturaChange = (id: string) => {
    setFaturaId(id);
    const fatura = faturasPendentes.find(f => f.id === Number(id));
    if (fatura) {
      setValorPagamento(fatura.saldo.toFixed(2));
      const formaValida = ['dinheiro', 'multicaixa', 'transferencia'].includes(fatura.forma_pagamento?.toLowerCase());
      setFormaPagamento(formaValida ? fatura.forma_pagamento.toLowerCase() : 'dinheiro');
    } else {
      setValorPagamento('');
      setFormaPagamento('dinheiro');
    }
  };

  const criarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faturaId) {
      mostrarMensagem('error', 'Selecione uma fatura');
      return;
    }
    if (!valorPagamento || Number(valorPagamento) <= 0) {
      mostrarMensagem('error', 'Informe um valor válido');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/pagamentos'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fatura_id: Number(faturaId),
          paciente_id: null,
          forma_pagamento: formaPagamento,
          valor: Number(valorPagamento)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar pagamento');

      mostrarMensagem('success', 'Pagamento registrado com sucesso!');
      setFaturaId('');
      setValorPagamento('');
      setFormaPagamento('dinheiro');
      await fetchFaturasPendentes();
      await fetchVendas();

    } catch (err) {
      console.error(err);
      mostrarMensagem('error', err instanceof Error ? err.message : 'Erro ao registrar pagamento');
    } finally {
      setLoading(false);
    }
  };

  /* ================== CRUD PACIENTE ================== */
  const handlePacienteFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPacienteForm(prev => ({ ...prev, [name]: value }));
  };

  const abrirModalEditarPaciente = (paciente: Paciente) => {
    setEditandoPaciente(paciente);
    setPacienteForm({
      nome: paciente.nome,
      telefone: paciente.telefone || '',
      nif: paciente.nif || '',
      data_nascimento: paciente.data_nascimento || '',
      endereco: paciente.endereco || '',
      sexo: paciente.sexo || ''
    });
  };

  const fecharModalEditarPaciente = () => {
    setEditandoPaciente(null);
    setPacienteForm({
      nome: '',
      telefone: '',
      nif: '',
      data_nascimento: '',
      endereco: '',
      sexo: ''
    });
  };

  const atualizarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editandoPaciente) return;

    if (!pacienteForm.nome.trim()) {
      mostrarMensagem('error', 'O nome do paciente é obrigatório');
      return;
    }

    setSubmittingPaciente(true);

    try {
      const res = await fetch(getApiUrl(`/pacientes/${editandoPaciente.id}`), {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: pacienteForm.nome,
          telefone: pacienteForm.telefone || null,
          nif: pacienteForm.nif || null,
          data_nascimento: pacienteForm.data_nascimento || null,
          endereco: pacienteForm.endereco || null,
          sexo: pacienteForm.sexo || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar paciente');

      mostrarMensagem('success', `Paciente ${pacienteForm.nome} atualizado com sucesso!`);
      fecharModalEditarPaciente();
      await fetchPacientes();

    } catch (err) {
      console.error(err);
      mostrarMensagem('error', err instanceof Error ? err.message : 'Erro ao atualizar paciente');
    } finally {
      setSubmittingPaciente(false);
    }
  };

  const criarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pacienteForm.nome.trim()) {
      mostrarMensagem('error', 'O nome do paciente é obrigatório');
      return;
    }

    setSubmittingPaciente(true);

    try {
      const res = await fetch(getApiUrl('/pacientes'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: pacienteForm.nome,
          telefone: pacienteForm.telefone || null,
          nif: pacienteForm.nif || null,
          data_nascimento: pacienteForm.data_nascimento || null,
          endereco: pacienteForm.endereco || null,
          sexo: pacienteForm.sexo || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar paciente');

      mostrarMensagem('success', `Paciente ${pacienteForm.nome} criado com sucesso!`);

      setPacienteForm({
        nome: '',
        telefone: '',
        nif: '',
        data_nascimento: '',
        endereco: '',
        sexo: ''
      });

      await fetchPacientes();

    } catch (err) {
      console.error(err);
      mostrarMensagem('error', err instanceof Error ? err.message : 'Erro ao criar paciente');
    } finally {
      setSubmittingPaciente(false);
    }
  };

  const confirmarExcluirPaciente = (id: number, nome: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o paciente "${nome}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => excluirPaciente(id, nome)
    });
  };

  const excluirPaciente = async (id: number, nome: string) => {
    setExcluindoPaciente(id);
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    try {
      const res = await fetch(getApiUrl(`/pacientes/${id}`), {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao excluir paciente');
      }

      mostrarMensagem('success', `Paciente ${nome} excluído com sucesso!`);
      await fetchPacientes();

    } catch (err) {
      console.error(err);
      mostrarMensagem('error', err instanceof Error ? err.message : 'Erro ao excluir paciente');
    } finally {
      setExcluindoPaciente(null);
    }
  };

  /* ================== ATENDIMENTOS ================== */
  const abrirAtendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteIdAtendimento) return;

    try {
      const res = await fetch(getApiUrl('/atendimentos/abrir'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente_id: pacienteIdAtendimento }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao abrir atendimento');
      }

      mostrarMensagem('success', 'Atendimento aberto com sucesso!');
      setModalAtendimentoOpen(false);
      setPacienteIdAtendimento('');
      setSearchPacienteAtendimento('');
      await fetchAtendimentos();

    } catch (err) {
      console.error(err);
      mostrarMensagem('error', err instanceof Error ? err.message : 'Erro ao abrir atendimento');
    }
  };

  const mudarStatusAtendimento = async (atendimento: Atendimento) => {
    const statusFlow = STATUS_FLOW_ATENDIMENTO[atendimento.status];
    const next = statusFlow?.next;
    if (!next) return;

    try {
      const res = await fetch(getApiUrl(`/atendimentos/${atendimento.id}/status`), {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao alterar status');
      }

      mostrarMensagem('success', `Status alterado para ${next}`);
      await fetchAtendimentos();
      await fetchAtendimentosEmConsulta();

    } catch (err) {
      console.error(err);
      mostrarMensagem('error', err instanceof Error ? err.message : 'Erro ao alterar status');
    }
  };

  const confirmarRemoverAtendimento = (atendimento: Atendimento) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Remoção',
      message: `Deseja realmente remover o atendimento de ${atendimento.paciente?.nome}?`,
      onConfirm: () => removerAtendimento(atendimento.id)
    });
  };

  const removerAtendimento = async (id: number) => {
    setRemovendoAtendimento(true);
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    try {
      const res = await fetch(getApiUrl(`/atendimentos/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao remover atendimento');
      }

      mostrarMensagem('success', 'Atendimento removido com sucesso!');
      await fetchAtendimentos();

    } catch (err) {
      console.error(err);
      mostrarMensagem('error', err instanceof Error ? err.message : 'Erro ao remover atendimento');
    } finally {
      setRemovendoAtendimento(false);
    }
  };

  const pacientesDisponiveis = pacientesParaAtendimento.filter(p =>
    p.nome.toLowerCase().includes(searchPacienteAtendimento.toLowerCase())
  );

  const filtrarAtendimento = (a: Atendimento) => {
    const texto = filtroGlobalAtendimento.toLowerCase();
    const dataEntrada = new Date(a.data_entrada);
    const inicio = filtroDataInicio ? new Date(filtroDataInicio) : null;
    const fim = filtroDataFim ? new Date(filtroDataFim) : null;

    const condGlobal =
      (a.paciente?.nome || '').toLowerCase().includes(texto) ||
      (a.paciente?.nif?.toLowerCase().includes(texto) ?? false) ||
      a.status.replace('_', ' ').toLowerCase().includes(texto);

    const condData =
      (!inicio || dataEntrada >= inicio) &&
      (!fim || dataEntrada <= fim);

    return condGlobal && condData;
  };

  const groupedAtendimentos = Object.keys(STATUS_FLOW_ATENDIMENTO).reduce(
    (acc: Record<string, Atendimento[]>, key) => {
      acc[key] = atendimentos.filter(a => a.status === key);
      return acc;
    }, {} as Record<string, Atendimento[]>
  );

  const paginarListaAtendimentos = (lista: Atendimento[], status: string) => {
    const page = getPaginaAtendimento(status);
    const inicio = (page - 1) * ITEMS_PER_PAGE;
    return lista.slice(inicio, inicio + ITEMS_PER_PAGE);
  };

  const totalPaginasAtendimentos = (lista: Atendimento[]) =>
    Math.max(1, Math.ceil(lista.length / ITEMS_PER_PAGE));

  /* ================== CONSULTAS ================== */
  const handleConsultaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormConsulta({ ...formConsulta, [e.target.name]: e.target.value });
  };

  const abrirModalEditarConsulta = (consulta: Consulta) => {
    setEditandoConsulta(consulta);
    setFormConsulta({
      od_esferico: consulta.od_esferico || '',
      od_cilindrico: consulta.od_cilindrico || '',
      od_eixo: consulta.od_eixo || '',
      oe_esferico: consulta.oe_esferico || '',
      oe_cilindrico: consulta.oe_cilindrico || '',
      oe_eixo: consulta.oe_eixo || '',
      adicao: consulta.adicao || '',
      dnp: consulta.dnp || '',
      diagnostico: consulta.diagnostico || '',
      observacoes: consulta.observacoes || '',
      medicacao: consulta.medicacao || ''
    });
    setModalConsultaOpen(true);
  };

  const fecharModalEditarConsulta = () => {
    setEditandoConsulta(null);
    setFormConsulta({
      od_esferico: '',
      od_cilindrico: '',
      od_eixo: '',
      oe_esferico: '',
      oe_cilindrico: '',
      oe_eixo: '',
      adicao: '',
      dnp: '',
      diagnostico: '',
      observacoes: '',
      medicacao: ''
    });
    setModalConsultaOpen(false);
    setAtendimentoSelecionado('');
    setBuscaAtendimento('');
  };

  const criarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editandoConsulta && !atendimentoSelecionado) {
      mostrarMensagem('error', 'Selecione um atendimento');
      return;
    }

    setLoadingConsulta(true);

    try {
      let url = '/consultas';
      let method = 'POST';
      let body: any = { ...formConsulta };

      if (editandoConsulta) {
        url = `/consultas/${editandoConsulta.id}`;
        method = 'PUT';
      } else {
        const atendimento = atendimentosEmConsulta.find(a => a.id === atendimentoSelecionado);
        if (!atendimento || !atendimento.paciente?.id) {
          throw new Error('Atendimento inválido');
        }
        body.paciente_id = atendimento.paciente.id;
        body.atendimento_id = atendimentoSelecionado;
      }

      const res = await fetch(getApiUrl(url), {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao registrar consulta');
      }

      mostrarMensagem('success', editandoConsulta ? 'Consulta atualizada com sucesso!' : 'Consulta registrada com sucesso!');
      fecharModalEditarConsulta();
      await fetchConsultas();
      await fetchAtendimentosEmConsulta();
      await fetchAtendimentos();

    } catch (err) {
      console.error(err);
      mostrarMensagem('error', err instanceof Error ? err.message : 'Erro ao registrar consulta');
    } finally {
      setLoadingConsulta(false);
    }
  };

  const confirmarExcluirConsulta = (id: number, pacienteNome: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir a consulta do paciente "${pacienteNome}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => excluirConsulta(id)
    });
  };

  const excluirConsulta = async (id: number) => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    try {
      const res = await fetch(getApiUrl(`/consultas/${id}`), {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao excluir consulta');
      }

      mostrarMensagem('success', 'Consulta excluída com sucesso!');
      await fetchConsultas();

    } catch (err) {
      console.error(err);
      mostrarMensagem('error', err instanceof Error ? err.message : 'Erro ao excluir consulta');
    }
  };

  const imprimirReceita = (consulta: Consulta) => {
    const win = window.open('', '_blank');
    if (!win) return;

    const empresaNome = config?.nome_empresa || 'Óptica';
    const empresaNif = config?.nif_empresa || '';
    const empresaTelefone = config?.telefone_empresa || '';
    const empresaEndereco = config?.endereco_empresa || '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receita Médica - ${consulta.paciente?.nome}</title>
          <meta charset="UTF-8">
          <style>
            @page { size: A4; margin: 20mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; padding: 20px; background: #fff; }
            .receita-container { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #333; }
            .header h1 { font-size: 24px; margin-bottom: 5px; }
            .empresa-info { font-size: 11px; color: #555; margin-bottom: 10px; }
            .titulo-receita { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
            .info-paciente { margin: 15px 0; padding: 10px; background: #f5f5f5; font-size: 11px; border-radius: 4px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
            th { background: #f0f0f0; }
            .observacoes { margin-top: 20px; padding: 10px; background: #f9f9f9; border-radius: 4px; }
            .assinatura { margin-top: 40px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
            .rodape { margin-top: 30px; text-align: center; font-size: 10px; color: #777; border-top: 1px solid #ddd; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="receita-container">
            <div class="header">
              <h1>${empresaNome}</h1>
              <div class="empresa-info">${empresaNif ? `NIF: ${empresaNif} | ` : ''}${empresaTelefone ? `Tel: ${empresaTelefone}` : ''}${empresaEndereco ? `<br>${empresaEndereco}` : ''}</div>
            </div>
            <div class="titulo-receita">RECEITA DE ÓCULOS</div>
            <div class="info-paciente">
              <p><strong>Paciente:</strong> ${consulta.paciente?.nome || '-'}</p>
              ${consulta.paciente?.nif ? `<p><strong>NIF:</strong> ${consulta.paciente.nif}</p>` : ''}
              ${consulta.paciente?.telefone ? `<p><strong>Telefone:</strong> ${consulta.paciente.telefone}</p>` : ''}
              <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-AO')}</p>
            </div>
            <table>
              <thead><tr><th>Olho</th><th>Esférico</th><th>Cilíndrico</th><th>Eixo</th></tr></thead>
              <tbody>
                <tr><td><strong>Direito (OD)</strong></td><td>${consulta.od_esferico || '-'}</td><td>${consulta.od_cilindrico || '-'}</td><td>${consulta.od_eixo || '-'}</td></tr>
                <tr><td><strong>Esquerdo (OE)</strong></td><td>${consulta.oe_esferico || '-'}</td><td>${consulta.oe_cilindrico || '-'}</td><td>${consulta.oe_eixo || '-'}</td></tr>
              </tbody>
            </table>
            <div style="margin: 10px 0;"><p><strong>Adição:</strong> ${consulta.adicao || '-'}</p><p><strong>DNP:</strong> ${consulta.dnp || '-'}</p></div>
            ${consulta.diagnostico ? `<div class="observacoes"><p><strong>Diagnóstico:</strong></p><p>${consulta.diagnostico}</p></div>` : ''}
            ${consulta.observacoes ? `<div class="observacoes"><p><strong>Observações:</strong></p><p>${consulta.observacoes}</p></div>` : ''}
            ${consulta.medicacao ? `<div class="observacoes"><p><strong>Medicação:</strong></p><p>${consulta.medicacao}</p></div>` : ''}
            <div class="assinatura"><p>_________________________________</p><p><strong>${consulta.optometrista?.nome || 'Optometrista'}</strong></p><p>Optometrista</p></div>
            <div class="rodape"><p>Receita gerada eletronicamente - Válida para fins de aquisição de óculos</p><p>Consulta #${consulta.id} - ${new Date(consulta.created_at).toLocaleString('pt-AO')}</p></div>
          </div>
          <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  const consultasFiltradas = consultas.filter(c => {
    const nome = c.paciente?.nome?.toLowerCase() || '';
    const nif = c.paciente?.nif?.toLowerCase() || '';
    const busca = filtroConsultas.toLowerCase();
    const matchTexto = nome.includes(busca) || nif.includes(busca);

    if (filtroConsultasData) {
      const dataConsulta = new Date(c.created_at).toLocaleDateString('pt-AO');
      const dataFiltro = new Date(filtroConsultasData).toLocaleDateString('pt-AO');
      return matchTexto && dataConsulta === dataFiltro;
    }

    return matchTexto;
  });

  /* ================== LABORATÓRIO ================== */
  const criarEncomenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteIdEncomenda) return;

    try {
      const res = await fetch(getApiUrl('/encomendas-oculos'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: pacienteIdEncomenda,
          tipo_servico: tipoServico,
          data_prevista: dataPrevista || null,
          observacao: observacaoEncomenda || null
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao criar encomenda');
      }

      mostrarMensagem('success', 'Encomenda criada com sucesso!');
      setModalEncomendaOpen(false);
      setPacienteIdEncomenda('');
      setTipoServico('oculos_novo');
      setDataPrevista('');
      setObservacaoEncomenda('');
      await fetchEncomendas();

    } catch (err) {
      console.error(err);
      mostrarMensagem('error', err instanceof Error ? err.message : 'Erro ao criar encomenda');
    }
  };

  const mudarStatusEncomenda = async (encomenda: EncomendaOculos) => {
    const statusFlow = STATUS_FLOW_LABORATORIO[encomenda.status as keyof typeof STATUS_FLOW_LABORATORIO];
    const next = statusFlow?.next;
    if (!next) return;

    try {
      const res = await fetch(getApiUrl(`/encomendas-oculos/${encomenda.id}/status`), {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao alterar status');
      }

      mostrarMensagem('success', `Status alterado para ${next}`);
      await fetchEncomendas();

    } catch (err) {
      console.error(err);
      mostrarMensagem('error', err instanceof Error ? err.message : 'Erro ao alterar status');
    }
  };

  const confirmarRemoverEncomenda = (encomenda: EncomendaOculos) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Remoção',
      message: `Deseja realmente remover a encomenda de ${encomenda.paciente?.nome}? (Apenas pedidos criados podem ser removidos)`,
      onConfirm: () => removerEncomenda(encomenda.id)
    });
  };

  const removerEncomenda = async (id: number) => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    try {
      const res = await fetch(getApiUrl(`/encomendas-oculos/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao remover encomenda');
      }

      mostrarMensagem('success', 'Encomenda removida com sucesso!');
      await fetchEncomendas();

    } catch (err) {
      console.error(err);
      mostrarMensagem('error', err instanceof Error ? err.message : 'Erro ao remover encomenda');
    }
  };

  const filtrarEncomenda = (e: EncomendaOculos) => {
    const texto = filtroEncomendas.toLowerCase();
    return (
      (e.paciente?.nome?.toLowerCase().includes(texto) || false) ||
      e.tipo_servico.toLowerCase().includes(texto) ||
      e.status.toLowerCase().includes(texto)
    );
  };

  const groupedEncomendas = Object.keys(STATUS_FLOW_LABORATORIO).reduce(
    (acc: Record<string, EncomendaOculos[]>, key) => {
      acc[key] = encomendas.filter(e => e.status === key);
      return acc;
    }, {} as Record<string, EncomendaOculos[]>
  );

  const paginarListaEncomendas = (lista: EncomendaOculos[], status: string) => {
    const page = getPaginaEncomenda(status);
    const inicio = (page - 1) * ITEMS_PER_PAGE;
    return lista.slice(inicio, inicio + ITEMS_PER_PAGE);
  };

  const totalPaginasEncomendas = (lista: EncomendaOculos[]) =>
    Math.max(1, Math.ceil(lista.length / ITEMS_PER_PAGE));

  /* ================== IMPRESSÃO DE FATURA ================== */
  const imprimirFatura = async (vendaId: number) => {
    try {
      const res = await fetch(getApiUrl(`/vendas/${vendaId}`), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Erro ao carregar venda');
      const venda = await res.json();
      if (!venda) return;

      const empresaNome = config?.nome_empresa || 'Óptica';
      const empresaNif = config?.nif_empresa || '';
      const empresaTelefone = config?.telefone_empresa || '';
      const empresaEndereco = config?.endereco_empresa || '';

      const pacienteNome = venda.atendimento?.paciente?.nome || venda.paciente?.nome || 'Cliente Avulso';
      const pacienteNif = venda.atendimento?.paciente?.nif || venda.paciente?.nif || '';
      const pacienteTelefone = venda.atendimento?.paciente?.telefone || venda.paciente?.telefone || '';

      const dataVenda = venda.created_at ? new Date(venda.created_at).toLocaleString('pt-AO') : new Date().toLocaleString('pt-AO');
      const numeroFatura = venda.fatura?.numero || `FAT-${String(venda.id).padStart(5, '0')}`;

      const linhasProdutos = venda.itens?.map((item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.nome || '-'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantidade}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${Number(item.preco_unitario).toLocaleString('pt-AO')} Kz</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${Number(item.subtotal).toLocaleString('pt-AO')} Kz</td>
        </tr>
      `).join('') || '<tr><td colspan="4" style="padding: 8px; text-align: center;">Sem itens</td></tr>';

      const win = window.open('', '_blank');
      if (!win) return;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Fatura ${numeroFatura}</title>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Courier New', Courier, monospace; font-size: 12px; padding: 20px; background: #fff; }
              .fatura-container { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #333; }
              .header h1 { font-size: 24px; margin-bottom: 5px; }
              .empresa-info { font-size: 11px; color: #555; margin-bottom: 10px; }
              .titulo-fatura { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
              .info-cliente { margin: 15px 0; padding: 10px; background: #f5f5f5; font-size: 11px; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th { background: #f0f0f0; padding: 8px; text-align: center; border-bottom: 2px solid #ddd; }
              .totais { margin-top: 15px; text-align: right; border-top: 1px solid #ddd; padding-top: 10px; }
              .rodape { margin-top: 30px; text-align: center; font-size: 10px; color: #777; border-top: 1px solid #ddd; padding-top: 15px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="fatura-container">
              <div class="header">
                <h1>${empresaNome}</h1>
                <div class="empresa-info">
                  ${empresaNif ? `NIF: ${empresaNif} | ` : ''}
                  ${empresaTelefone ? `Tel: ${empresaTelefone}` : ''}
                  ${empresaEndereco ? `<br>${empresaEndereco}` : ''}
                </div>
              </div>
              <div class="titulo-fatura">FATURA Nº ${numeroFatura}</div>
              <div class="info-cliente">
                <p><strong>Cliente:</strong> ${pacienteNome}</p>
                ${pacienteNif ? `<p><strong>NIF:</strong> ${pacienteNif}</p>` : ''}
                ${pacienteTelefone ? `<p><strong>Telefone:</strong> ${pacienteTelefone}</p>` : ''}
                <p><strong>Data:</strong> ${dataVenda}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th style="width:60px;">Qtd</th>
                    <th style="width:100px;">Preço Unit.</th>
                    <th style="width:100px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${linhasProdutos}
                </tbody>
              </table>
              <div class="totais">
                ${venda.desconto > 0 ? `<p><strong>Subtotal:</strong> ${(Number(venda.total) + Number(venda.desconto)).toLocaleString('pt-AO')} Kz</p>` : ''}
                ${venda.desconto > 0 ? `<p><strong>Desconto:</strong> ${Number(venda.desconto).toLocaleString('pt-AO')} Kz</p>` : ''}
                <p><strong>TOTAL:</strong> ${Number(venda.total).toLocaleString('pt-AO')} Kz</p>
                <p><strong>Forma de Pagamento:</strong> ${venda.forma_pagamento || formaPagamentoVenda}</p>
              </div>
              <div class="rodape">
                <p>Obrigado pela preferência!</p>
                <p>Este documento é comprovativo de venda.</p>
              </div>
            </div>
            <script>
              window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
            </script>
          </body>
        </html>
      `;

      win.document.write(html);
      win.document.close();
    } catch (err) {
      console.error('Erro ao imprimir fatura:', err);
      mostrarMensagem('error', 'Erro ao imprimir fatura');
    }
  };

  /* ================== UTILITÁRIOS ================== */
  const produtosFiltrados = produtosVenda.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));
  const totalVendasHoje = vendas
    .filter(v => v.created_at && new Date(v.created_at).toDateString() === new Date().toDateString())
    .reduce((s, v) => s + Number(v.total), 0);

  const totalPaginasVendas = Math.ceil(vendas.length / itensPorPagina);
  const vendasPaginadas = vendas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const totalFaturasPendentes = faturasPendentes.reduce((sum, f) => sum + f.saldo, 0);

  // Abas disponíveis por perfil
  const abasDisponiveis = [
    { id: 'vendas', nome: 'Nova Venda', icone: <ShoppingCart size={18} />, perfis: ['caixa', 'admin'] },
    { id: 'pagamentos', nome: 'Registrar Pagamento', icone: <CreditCard size={18} />, perfis: ['caixa', 'admin'] },
    { id: 'pacientes', nome: 'Cadastrar Paciente', icone: <UserPlus size={18} />, perfis: ['caixa', 'admin', 'recepcao'] },
    { id: 'atendimentos', nome: 'Atendimentos', icone: <Stethoscope size={18} />, perfis: ['optometrista', 'caixa', 'admin', 'recepcao'] },
    { id: 'consultas', nome: 'Consultas', icone: <FileText size={18} />, perfis: ['optometrista', 'admin'] },
    { id: 'laboratorio', nome: 'Laboratório', icone: <FlaskConical size={18} />, perfis: ['caixa', 'admin', 'recepcao', 'optometrista'] },
  ];

  const abasPermitidas = abasDisponiveis.filter(aba =>
    isAdmin || aba.perfis.includes(userPerfil)
  );

  /* ================== RENDER ================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="container mx-auto px-6 py-5">
          <h1 className="text-3xl font-bold">Gestão Comercial</h1>
          <p className="text-indigo-100 mt-1">Gestão de atendimentos, consultas e laboratório</p>
          {authUser && (
            <div className="mt-2 text-sm text-indigo-200">
              Logado como: <strong>{authUser.nome}</strong> ({authUser.perfil})
              {isAdmin && <span className="ml-2 bg-green-500 px-2 py-0.5 rounded text-xs">Admin ✓</span>}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Mensagem de feedback */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'
            }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Dashboard Cards - Apenas para caixa/admin */}
        {(isCaixa || isAdmin) && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div><p className="text-gray-500 text-sm">Vendas Hoje</p><p className="text-2xl font-bold text-green-600">{totalVendasHoje.toLocaleString('pt-AO')} Kz</p></div>
                <DollarSign className="text-green-500" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div><p className="text-gray-500 text-sm">Total de Vendas</p><p className="text-2xl font-bold text-blue-600">{vendas.length}</p></div>
                <ShoppingCart className="text-blue-500" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div><p className="text-gray-500 text-sm">Faturas Pendentes</p><p className="text-2xl font-bold text-yellow-600">{faturasPendentes.length}</p></div>
                <FileText className="text-yellow-500" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div><p className="text-gray-500 text-sm">Valor Pendente</p><p className="text-2xl font-bold text-purple-600">{totalFaturasPendentes.toLocaleString('pt-AO')} Kz</p></div>
                <CreditCard className="text-purple-500" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between">
                <div><p className="text-gray-500 text-sm">Em Atendimento</p><p className="text-2xl font-bold text-indigo-600">{atendimentos.filter(a => a.status !== 'finalizado').length}</p></div>
                <Stethoscope className="text-indigo-500" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-teal-500">
              <div className="flex items-center justify-between">
                <div><p className="text-gray-500 text-sm">Encomendas Ativas</p><p className="text-2xl font-bold text-teal-600">{encomendas.filter(e => e.status !== 'entregue' && e.status !== 'cancelado').length}</p></div>
                <FlaskConical className="text-teal-500" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Cards simplificado para optometrista */}
        {!isCaixa && !isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between">
                <div><p className="text-gray-500 text-sm">Em Atendimento</p><p className="text-2xl font-bold text-indigo-600">{atendimentos.filter(a => a.status !== 'finalizado').length}</p></div>
                <Stethoscope className="text-indigo-500" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-teal-500">
              <div className="flex items-center justify-between">
                <div><p className="text-gray-500 text-sm">Encomendas Ativas</p><p className="text-2xl font-bold text-teal-600">{encomendas.filter(e => e.status !== 'entregue' && e.status !== 'cancelado').length}</p></div>
                <FlaskConical className="text-teal-500" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="flex border-b overflow-x-auto">
            {abasPermitidas.map(aba => (
              <button key={aba.id} onClick={() => setAbaAtiva(aba.id as any)} className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${abaAtiva === aba.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {aba.icone} {aba.nome}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ================== ABA DE VENDAS ================== */}
            {abaAtiva === 'vendas' && (isCaixa || isAdmin) && (
              <div className="grid lg:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Search size={18} /> Produtos / Serviços</h3>
                  <div className="relative mb-3">
                    <input type="text" placeholder="Buscar item..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full border rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {produtosFiltrados.length === 0 ? <p className="text-center text-gray-500 py-8">Nenhum item encontrado</p> : produtosFiltrados.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 border-b hover:bg-indigo-50 transition-colors">
                        <div><p className="font-medium">{p.nome}</p><p className="text-green-600 text-sm">{p.preco.toLocaleString('pt-AO')} Kz</p>{p.tipo === 'produto' && p.estoque < 10 && <p className="text-xs text-orange-500">Estoque: {p.estoque}</p>}</div>
                        <button onClick={() => addItemVenda(p)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm">Adicionar</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><ShoppingCart size={18} /> Carrinho de Vendas</h3>
                  {itensVenda.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-12 text-center text-gray-400"><ShoppingCart size={48} className="mx-auto mb-3 opacity-50" /><p>Carrinho vazio. Adicione itens ao lado.</p></div>
                  ) : (
                    <>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                        {itensVenda.map((i, index) => (
                          <div key={index} className="flex justify-between items-center mb-2 p-3 bg-white rounded-lg shadow-sm">
                            <div className="flex-1"><p className="font-medium">{i.nome}</p><p className="text-gray-500 text-sm">{i.preco_unitario.toLocaleString('pt-AO')} Kz</p></div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => alterarQtd(index, -1)} className="bg-gray-200 p-1 rounded hover:bg-gray-300 transition-colors"><Minus size={16} /></button>
                              <span className="w-8 text-center font-medium">{i.quantidade}</span>
                              <button onClick={() => alterarQtd(index, 1)} className="bg-gray-200 p-1 rounded hover:bg-gray-300 transition-colors"><Plus size={16} /></button>
                            </div>
                            <div className="w-28 text-right font-medium">{i.subtotal.toLocaleString('pt-AO')} Kz</div>
                            <button onClick={() => removerItemVenda(index)} className="ml-3 text-red-500 hover:text-red-700"><X size={18} /></button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 bg-white border rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div><label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label><select value={pacienteSelecionado} onChange={e => setPacienteSelecionado(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Cliente Avulso</option>{pacientes.map(p => (<option key={p.id} value={p.id}>{p.nome}</option>))}</select></div>
                          <div><label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label><select value={formaPagamentoVenda} onChange={e => setFormaPagamentoVenda(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="dinheiro">Dinheiro</option><option value="multicaixa">Multicaixa</option><option value="transferencia">Transferência</option><option value="seguro">Seguro</option></select></div>
                        </div>
                        <div className="flex justify-between items-center mb-3"><label className="text-sm font-medium text-gray-700">Desconto:</label><input type="number" value={descontoVenda} onChange={e => setDescontoVenda(Number(e.target.value))} className="w-32 border rounded-lg px-3 py-1 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" step="100" /></div>
                        <div className="border-t pt-3"><div className="flex justify-between text-lg font-bold"><span>Total:</span><span className="text-green-600">{totalVenda.toLocaleString('pt-AO')} Kz</span></div></div>
                        <div className="flex gap-3 mt-4"><button onClick={limparCarrinho} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">Limpar Carrinho</button><button onClick={criarVenda} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">Finalizar Venda</button></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ================== ABA DE PAGAMENTOS ================== */}
            {abaAtiva === 'pagamentos' && (isCaixa || isAdmin) && (
              <div>
                <form onSubmit={criarPagamento} className="max-w-2xl mx-auto">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4">Registrar Pagamento</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fatura *</label>
                        <select value={faturaId} onChange={e => handleFaturaChange(e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                          <option value="">Selecione uma fatura</option>
                          {faturasPendentes.map(f => (<option key={f.id} value={f.id}>{f.numero} - {f.total.toLocaleString('pt-AO')} Kz (Saldo: {f.saldo.toLocaleString('pt-AO')} Kz)</option>))}
                        </select>
                        {faturasPendentes.length === 0 && <p className="text-sm text-green-600 mt-1">✓ Todas as faturas estão pagas!</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                        <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="dinheiro">Dinheiro</option>
                          <option value="multicaixa">Multicaixa</option>
                          <option value="transferencia">Transferência</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                        <input type="number" step="0.01" value={valorPagamento} onChange={e => setValorPagamento(e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Valor do pagamento" required />
                      </div>
                      <button type="submit" disabled={loading || faturasPendentes.length === 0} className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {loading ? 'Processando...' : 'Registrar Pagamento'}
                      </button>
                    </div>
                  </div>
                </form>
                {faturasPendentes.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-700 mb-3">Faturas Pendentes</h4>
                    <div className="space-y-2">
                      {faturasPendentes.slice(0, 5).map(f => (
                        <div key={f.id} className="bg-white border rounded-lg p-3 flex justify-between items-center">
                          <div><p className="font-medium">{f.numero}</p><p className="text-sm text-gray-500">Total: {f.total.toLocaleString('pt-AO')} Kz</p></div>
                          <div className="text-right"><p className="text-yellow-600 font-medium">Saldo: {f.saldo.toLocaleString('pt-AO')} Kz</p><p className="text-xs text-gray-400">Status: {f.status}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================== ABA DE PACIENTES ================== */}
            {abaAtiva === 'pacientes' && (
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><UserPlus size={20} /> {editandoPaciente ? 'Editar Paciente' : 'Novo Paciente'}</h3>
                    <form onSubmit={editandoPaciente ? atualizarPaciente : criarPaciente} className="space-y-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label><div className="relative"><Users className="absolute left-3 top-2.5 text-gray-400" size={18} /><input type="text" name="nome" value={pacienteForm.nome} onChange={handlePacienteFormChange} className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Digite o nome completo" required /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label><div className="relative"><Phone className="absolute left-3 top-2.5 text-gray-400" size={18} /><input type="tel" name="telefone" value={pacienteForm.telefone} onChange={handlePacienteFormChange} className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="+244 900-000-000" /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">NIF</label><div className="relative"><Hash className="absolute left-3 top-2.5 text-gray-400" size={18} /><input type="text" name="nif" value={pacienteForm.nif} onChange={handlePacienteFormChange} className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Número de identificação fiscal" /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label><div className="relative"><User className="absolute left-3 top-2.5 text-gray-400" size={18} /><select name="sexo" value={pacienteForm.sexo} onChange={handlePacienteFormChange} className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option></select></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label><div className="relative"><Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} /><input type="date" name="data_nascimento" value={pacienteForm.data_nascimento} onChange={handlePacienteFormChange} className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label><div className="relative"><MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} /><input type="text" name="endereco" value={pacienteForm.endereco} onChange={handlePacienteFormChange} className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Endereço completo" /></div></div>
                      <div className="flex gap-3">
                        {editandoPaciente && (<button type="button" onClick={fecharModalEditarPaciente} className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors">Cancelar</button>)}
                        <button type="submit" disabled={submittingPaciente} className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                          {submittingPaciente ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>{editandoPaciente ? 'Salvando...' : 'Cadastrando...'}</>) : (<>{editandoPaciente ? <Edit size={18} /> : <UserPlus size={18} />}{editandoPaciente ? 'Atualizar Paciente' : 'Cadastrar Paciente'}</>)}
                        </button>
                      </div>
                    </form>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Users size={20} /> Pacientes Cadastrados</h3>
                    <div className="relative mb-4"><Search className="absolute left-3 top-2.5 text-gray-400" size={18} /><input type="text" placeholder="Buscar por nome, telefone ou NIF..." value={buscaPaciente} onChange={e => setBuscaPaciente(e.target.value)} className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {pacientesFiltrados.length === 0 ? (<p className="text-center text-gray-400 py-8">{buscaPaciente ? 'Nenhum paciente encontrado com essa busca' : 'Nenhum paciente cadastrado'}</p>) : (pacientesFiltrados.map(p => (
                        <div key={p.id} className="bg-white rounded-lg p-3 border hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{p.nome}</p>
                              <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                                {p.telefone && (<span className="flex items-center gap-1"><Phone size={12} /> {p.telefone}</span>)}
                                {p.nif && (<span className="flex items-center gap-1"><Hash size={12} /> {p.nif}</span>)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {p.sexo && (<span className={`text-xs px-2 py-1 rounded ${p.sexo === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{p.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>)}
                              {isAdmin && (
                                <>
                                  <button onClick={() => abrirModalEditarPaciente(p)} className="text-blue-600 hover:text-blue-800 transition-colors p-1" title="Editar paciente"><Edit size={16} /></button>
                                  <button onClick={() => confirmarExcluirPaciente(p.id, p.nome)} disabled={excluindoPaciente === p.id} className="text-red-600 hover:text-red-800 transition-colors p-1" title="Excluir paciente">
                                    {excluindoPaciente === p.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div> : <Trash2 size={16} />}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {p.endereco && (<p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><MapPin size={12} /> {p.endereco}</p>)}
                          {p.data_nascimento && (<p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Calendar size={12} /> {new Date(p.data_nascimento).toLocaleDateString('pt-AO')}</p>)}
                        </div>
                      )))}
                    </div>
                    {pacientesFiltrados.length > 0 && (<p className="text-center text-sm text-gray-500 mt-3">Total: {pacientesFiltrados.length} paciente(s)</p>)}
                  </div>
                </div>
              </div>
            )}

            {/* ================== ABA DE ATENDIMENTOS ================== */}
            {abaAtiva === 'atendimentos' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Stethoscope size={24} /> Dashboard de Atendimentos</h2>
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <input type="text" placeholder="Pesquisar paciente..." value={filtroGlobalAtendimento} onChange={e => setFiltroGlobalAtendimento(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                    <input type="date" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                    <input type="date" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                    {(isCaixa || isRecepcao || isAdmin) && (<button onClick={() => setModalAtendimentoOpen(true)} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md"><UserPlus size={18} /> Novo Atendimento</button>)}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(STATUS_FLOW_ATENDIMENTO).map(([statusKey, status]) => {
                    const listaFiltrada = (groupedAtendimentos[statusKey] || []).filter(filtrarAtendimento);
                    const lista = paginarListaAtendimentos(listaFiltrada, statusKey);
                    const page = getPaginaAtendimento(statusKey);
                    return (
                      <div key={statusKey} className="bg-white rounded-xl shadow-md p-4 flex flex-col">
                        <h2 className={`font-bold mb-3 p-2 rounded-lg ${status.color} text-white text-center`}>{status.title} ({listaFiltrada.length})</h2>
                        <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto">
                          {lista.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nenhum atendimento</p>}
                          {lista.map(a => (
                            <div key={a.id} className="bg-gray-50 p-3 rounded-lg border hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start">
                                <div className="flex-1"><span className="font-semibold text-gray-800">{a.paciente?.nome || 'Sem paciente'}</span>{a.paciente?.nif && <p className="text-gray-500 text-xs">NIF: {a.paciente.nif}</p>}</div>
                                <span className="text-xs text-gray-400">#{a.id}</span>
                              </div>
                              <p className="text-gray-500 text-xs mt-1">Entrada: {new Date(a.data_entrada).toLocaleString()}</p>
                              {a.data_saida && <p className="text-gray-500 text-xs">Saída: {new Date(a.data_saida).toLocaleString()}</p>}
                              <div className="flex flex-wrap gap-2 mt-3">
                                {a.status === 'aguardando' && (isOptometrista || isAdmin) && (<button onClick={() => mudarStatusAtendimento(a)} className="flex-1 py-1.5 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-colors">Iniciar Consulta</button>)}
                                {a.status === 'em_consulta' && (isOptometrista || isAdmin) && (<button onClick={() => mudarStatusAtendimento(a)} className="flex-1 py-1.5 rounded-lg bg-purple-500 text-white font-medium text-sm hover:bg-purple-600 transition-colors">Concluir Consulta</button>)}
                                {a.status === 'consulta_concluida' && (isCaixa || isAdmin) && (<button onClick={() => mudarStatusAtendimento(a)} className="flex-1 py-1.5 rounded-lg bg-green-500 text-white font-medium text-sm hover:bg-green-600 transition-colors">Finalizar Atendimento</button>)}
                                {a.status === 'aguardando' && (isCaixa || isAdmin) && (<button onClick={() => confirmarRemoverAtendimento(a)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors flex items-center gap-1"><Trash2 size={14} /> Remover</button>)}
                              </div>
                            </div>
                          ))}
                        </div>
                        {listaFiltrada.length > ITEMS_PER_PAGE && (
                          <div className="flex justify-between mt-3 items-center pt-2 border-t">
                            <button disabled={page === 1} onClick={() => setPaginaAtendimentoFn(statusKey, page - 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={18} /></button>
                            <span className="text-sm">Pág. {page}/{totalPaginasAtendimentos(listaFiltrada)}</span>
                            <button disabled={page === totalPaginasAtendimentos(listaFiltrada)} onClick={() => setPaginaAtendimentoFn(statusKey, page + 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={18} /></button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {modalAtendimentoOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <form onSubmit={abrirAtendimento} className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                      <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><UserPlus size={20} /> Novo Atendimento</h2><button type="button" onClick={() => setModalAtendimentoOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
                      <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Buscar Paciente</label><input type="text" placeholder="Digite o nome do paciente..." value={searchPacienteAtendimento} onChange={e => setSearchPacienteAtendimento(e.target.value)} className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus /></div>
                      <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Paciente</label><select required value={pacienteIdAtendimento} onChange={e => setPacienteIdAtendimento(Number(e.target.value))} className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" size={5}><option value="">-- Selecione um paciente --</option>{pacientesDisponiveis.map(p => (<option key={p.id} value={p.id}>{p.nome} {p.telefone && `- 📞 ${p.telefone}`} {p.nif && `- 🆔 ${p.nif}`}</option>))}</select></div>
                      <div className="flex gap-3"><button type="button" onClick={() => setModalAtendimentoOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button><button type="submit" disabled={!pacienteIdAtendimento} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"><UserPlus size={18} /> Abrir Atendimento</button></div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* ================== ABA DE CONSULTAS ================== */}
            {abaAtiva === 'consultas' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <h2 className="text-xl font-bold flex items-center gap-2"><FileText size={24} /> Gestão de Consultas</h2>
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <input type="text" placeholder="Pesquisar paciente ou NIF..." value={filtroConsultas} onChange={e => setFiltroConsultas(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-64" />
                    <input type="date" value={filtroConsultasData} onChange={e => setFiltroConsultasData(e.target.value)} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                    {(isOptometrista || isAdmin) && (<button onClick={() => setModalConsultaOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"><Plus size={18} /> Nova Consulta</button>)}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {consultasFiltradas.length === 0 ? (<div className="col-span-full text-center py-12 text-gray-400"><FileText size={48} className="mx-auto mb-3 opacity-50" /><p>Nenhuma consulta encontrada</p></div>) : (consultasFiltradas.map(consulta => (
                    <div key={consulta.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="bg-gradient-to-r from-teal-500 to-indigo-600 px-4 py-3 text-white"><div className="flex justify-between items-center"><span className="font-bold">Consulta #{consulta.id}</span><span className="text-xs bg-white/20 px-2 py-1 rounded">{new Date(consulta.created_at).toLocaleDateString('pt-AO')}</span></div></div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3"><div><h3 className="font-semibold text-gray-800">{consulta.paciente?.nome || 'Paciente não encontrado'}</h3>{consulta.paciente?.nif && <p className="text-xs text-gray-500">NIF: {consulta.paciente.nif}</p>}{consulta.paciente?.telefone && <p className="text-xs text-gray-500">📞 {consulta.paciente.telefone}</p>}</div><div className="text-right"><span className={`text-xs px-2 py-1 rounded ${consulta.atendimento?.status === 'consulta_concluida' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{consulta.atendimento?.status === 'consulta_concluida' ? 'Concluída' : 'Pendente'}</span></div></div>
                        <div className="bg-gray-50 rounded-lg p-3 mb-3"><div className="grid grid-cols-2 gap-2 text-sm"><div><p className="text-gray-500 text-xs">Olho Direito</p><p className="font-medium">{consulta.od_esferico || '-'} {consulta.od_cilindrico ? `${consulta.od_cilindrico}` : ''} {consulta.od_eixo ? `x${consulta.od_eixo}` : ''}</p></div><div><p className="text-gray-500 text-xs">Olho Esquerdo</p><p className="font-medium">{consulta.oe_esferico || '-'} {consulta.oe_cilindrico ? `${consulta.oe_cilindrico}` : ''} {consulta.oe_eixo ? `x${consulta.oe_eixo}` : ''}</p></div>{consulta.adicao && (<div><p className="text-gray-500 text-xs">Adição</p><p className="font-medium">{consulta.adicao}</p></div>)}{consulta.dnp && (<div><p className="text-gray-500 text-xs">DNP</p><p className="font-medium">{consulta.dnp}</p></div>)}</div></div>
                        {consulta.diagnostico && (<div className="mb-2"><p className="text-gray-500 text-xs">Diagnóstico</p><p className="text-sm text-gray-700 line-clamp-2">{consulta.diagnostico}</p></div>)}
                        <div className="flex justify-between items-center mt-3 pt-3 border-t"><div><p className="text-xs text-gray-400">Optometrista: {consulta.optometrista?.nome || '-'}</p></div><div className="flex gap-2"><button onClick={() => imprimirReceita(consulta)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"><Printer size={14} /> Receita</button>{(isOptometrista || isAdmin) && (<button onClick={() => abrirModalEditarConsulta(consulta)} className="flex items-center gap-1 bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700 transition-colors text-sm"><Edit size={14} /> Editar</button>)}{isAdmin && (<button onClick={() => confirmarExcluirConsulta(consulta.id, consulta.paciente?.nome || '')} className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors text-sm"><Trash2 size={14} /> Excluir</button>)}</div></div>
                      </div>
                    </div>
                  )))}
                </div>
                {modalConsultaOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <form onSubmit={criarConsulta} className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2"><h2 className="text-xl font-bold flex items-center gap-2"><FileText size={20} /> {editandoConsulta ? 'Editar Consulta' : 'Nova Consulta'}</h2><button type="button" onClick={fecharModalEditarConsulta} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
                      {!editandoConsulta && (<><div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Buscar Atendimento</label><input type="text" placeholder="Digite nome do paciente..." value={buscaAtendimento} onChange={e => setBuscaAtendimento(e.target.value)} className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div><div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Atendimento em Consulta *</label><select required value={atendimentoSelecionado} onChange={e => setAtendimentoSelecionado(Number(e.target.value))} className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">-- Selecione um atendimento --</option>{atendimentosEmConsulta.filter(a => a.paciente?.nome?.toLowerCase().includes(buscaAtendimento.toLowerCase())).length === 0 && (<option disabled>Nenhum atendimento em consulta disponível</option>)}{atendimentosEmConsulta.filter(a => a.paciente?.nome?.toLowerCase().includes(buscaAtendimento.toLowerCase())).map(a => (<option key={a.id} value={a.id}>#{a.id} - {a.paciente?.nome} {a.paciente?.nif && `- ${a.paciente.nif}`}</option>))}</select>{atendimentosEmConsulta.length === 0 && (<p className="text-xs text-yellow-600 mt-1">⚠️ Não há atendimentos em consulta. É necessário ter um atendimento com status "em_consulta".</p>)}</div></>)}
                      <div className="border-t pt-4 mb-4"><h3 className="font-semibold text-gray-700 mb-3">Dados da Consulta</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div className="col-span-full"><label className="block text-sm font-medium text-gray-700 mb-1">Olho Direito</label><div className="grid grid-cols-3 gap-2"><input name="od_esferico" placeholder="Esférico" value={formConsulta.od_esferico} onChange={handleConsultaChange} className="border rounded-lg p-2 text-sm" /><input name="od_cilindrico" placeholder="Cilíndrico" value={formConsulta.od_cilindrico} onChange={handleConsultaChange} className="border rounded-lg p-2 text-sm" /><input name="od_eixo" placeholder="Eixo" value={formConsulta.od_eixo} onChange={handleConsultaChange} className="border rounded-lg p-2 text-sm" /></div></div><div className="col-span-full"><label className="block text-sm font-medium text-gray-700 mb-1">Olho Esquerdo</label><div className="grid grid-cols-3 gap-2"><input name="oe_esferico" placeholder="Esférico" value={formConsulta.oe_esferico} onChange={handleConsultaChange} className="border rounded-lg p-2 text-sm" /><input name="oe_cilindrico" placeholder="Cilíndrico" value={formConsulta.oe_cilindrico} onChange={handleConsultaChange} className="border rounded-lg p-2 text-sm" /><input name="oe_eixo" placeholder="Eixo" value={formConsulta.oe_eixo} onChange={handleConsultaChange} className="border rounded-lg p-2 text-sm" /></div></div></div>
                        <div className="grid grid-cols-2 gap-4 mb-4"><input name="adicao" placeholder="Adição" value={formConsulta.adicao} onChange={handleConsultaChange} className="border rounded-lg p-2 text-sm" /><input name="dnp" placeholder="DNP" value={formConsulta.dnp} onChange={handleConsultaChange} className="border rounded-lg p-2 text-sm" /></div>
                        <textarea name="diagnostico" placeholder="Diagnóstico" value={formConsulta.diagnostico} onChange={handleConsultaChange} className="w-full border rounded-lg p-2 text-sm mb-3" rows={3} />
                        <textarea name="observacoes" placeholder="Observações" value={formConsulta.observacoes} onChange={handleConsultaChange} className="w-full border rounded-lg p-2 text-sm mb-3" rows={2} />
                        <textarea name="medicacao" placeholder="Medicação" value={formConsulta.medicacao} onChange={handleConsultaChange} className="w-full border rounded-lg p-2 text-sm" rows={2} />
                      </div>
                      <div className="flex gap-3 sticky bottom-0 bg-white pt-3 border-t"><button type="button" onClick={fecharModalEditarConsulta} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button><button type="submit" disabled={loadingConsulta || (!editandoConsulta && !atendimentoSelecionado)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">{loadingConsulta ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Salvando...</>) : (<><FileText size={18} /> {editandoConsulta ? 'Atualizar Consulta' : 'Registrar Consulta'}</>)}</button></div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* ================== ABA DE LABORATÓRIO ================== */}
            {abaAtiva === 'laboratorio' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <h2 className="text-xl font-bold flex items-center gap-2"><FlaskConical size={24} /> Gestão de Laboratório - Encomendas de Óculos</h2>
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <input type="text" placeholder="Pesquisar paciente, serviço ou status..." value={filtroEncomendas} onChange={e => setFiltroEncomendas(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-64" />
                    {(isCaixa || isRecepcao || isAdmin) && (<button onClick={() => setModalEncomendaOpen(true)} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md"><Plus size={18} /> Nova Encomenda</button>)}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(STATUS_FLOW_LABORATORIO).map(([statusKey, status]) => {
                    const listaFiltrada = (groupedEncomendas[statusKey] || []).filter(filtrarEncomenda);
                    const lista = paginarListaEncomendas(listaFiltrada, statusKey);
                    const page = getPaginaEncomenda(statusKey);
                    return (
                      <div key={statusKey} className="bg-white rounded-xl shadow-md p-4 flex flex-col">
                        <h2 className={`font-bold mb-3 p-2 rounded-lg ${status.color} text-white text-center`}>{status.title} ({listaFiltrada.length})</h2>
                        <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto">
                          {lista.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nenhuma encomenda</p>}
                          {lista.map(e => {
                            const atrasado = e.data_prevista && new Date(e.data_prevista) < new Date() && e.status !== 'entregue' && e.status !== 'cancelado';
                            return (
                              <div key={e.id} className="bg-gray-50 p-3 rounded-lg border hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start"><div className="flex-1"><span className="font-semibold text-gray-800">{e.paciente?.nome || 'Paciente'}</span><p className="text-xs text-gray-500">{e.tipo_servico.replace('_', ' ')}</p></div><span className="text-xs text-gray-400">#{e.id}</span></div>
                                <p className="text-gray-500 text-xs mt-1">Pedido: {new Date(e.data_pedido).toLocaleDateString()}</p>
                                {e.data_prevista && (<p className={`text-xs ${atrasado ? 'text-red-600 font-bold' : 'text-orange-500'}`}>Previsto: {new Date(e.data_prevista).toLocaleDateString()}{atrasado && ' ⚠️ ATRASADO'}</p>)}
                                {e.data_entrega && <p className="text-xs text-green-600">Entregue: {new Date(e.data_entrega).toLocaleDateString()}</p>}
                                {e.observacao && <p className="text-xs text-gray-400 mt-1">Obs: {e.observacao}</p>}
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {e.status !== 'entregue' && e.status !== 'cancelado' && status.next && (isCaixa || isRecepcao || isAdmin || (isOptometrista && e.status !== 'entregue')) && (<button onClick={() => mudarStatusEncomenda(e)} className={`flex-1 py-1.5 rounded-lg text-white font-medium text-sm ${status.color} hover:opacity-80`}>{status.label}</button>)}
                                  {e.status === 'pedido_criado' && (isCaixa || isAdmin) && (<button onClick={() => confirmarRemoverEncomenda(e)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors flex items-center gap-1"><Trash2 size={14} /> Remover</button>)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {listaFiltrada.length > ITEMS_PER_PAGE && (<div className="flex justify-between mt-3 items-center pt-2 border-t"><button disabled={page === 1} onClick={() => setPaginaEncomendaFn(statusKey, page - 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={18} /></button><span className="text-sm">Pág. {page}/{totalPaginasEncomendas(listaFiltrada)}</span><button disabled={page === totalPaginasEncomendas(listaFiltrada)} onClick={() => setPaginaEncomendaFn(statusKey, page + 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={18} /></button></div>)}
                      </div>
                    );
                  })}
                </div>
                {modalEncomendaOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <form onSubmit={criarEncomenda} className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                      <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><FlaskConical size={20} /> Nova Encomenda</h2><button type="button" onClick={() => setModalEncomendaOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
                      <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label><select required value={pacienteIdEncomenda} onChange={e => setPacienteIdEncomenda(Number(e.target.value))} className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">-- Selecione um paciente --</option>{pacientes.map(p => (<option key={p.id} value={p.id}>{p.nome} {p.telefone && `- 📞 ${p.telefone}`} {p.nif && `- 🆔 ${p.nif}`}</option>))}</select></div>
                      <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Serviço</label><select value={tipoServico} onChange={e => setTipoServico(e.target.value)} className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="oculos_novo">Óculos novo</option><option value="troca_lente">Troca de lente</option><option value="reparacao">Reparação</option><option value="ajuste">Ajuste</option><option value="garantia">Garantia</option></select></div>
                      <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Data Prevista</label><input type="date" value={dataPrevista} onChange={e => setDataPrevista(e.target.value)} className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                      <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Observação</label><textarea value={observacaoEncomenda} onChange={e => setObservacaoEncomenda(e.target.value)} className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3} placeholder="Observações sobre a encomenda..."></textarea></div>
                      <div className="flex gap-3"><button type="button" onClick={() => setModalEncomendaOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button><button type="submit" disabled={!pacienteIdEncomenda} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"><FlaskConical size={18} /> Criar Encomenda</button></div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Vendas Recentes - Apenas para caixa/admin */}
        {(abaAtiva === 'vendas' || abaAtiva === 'pagamentos') && (isCaixa || isAdmin) && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText size={18} /> Vendas Recentes
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Fatura</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Cliente</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Data</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vendasPaginadas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        Nenhuma venda registrada
                      </td>
                    </tr>
                  ) : (
                    vendasPaginadas.map(v => {
                      const dataVenda = v.created_at ? new Date(v.created_at) : null;
                      const dataFormatada = dataVenda ? dataVenda.toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
                      const clienteNome = v.atendimento?.paciente?.nome || v.paciente?.nome || 'Cliente Avulso';
                      return (
                        <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm">#{v.id}</td>
                          <td className="px-4 py-3 text-sm font-mono">{v.fatura?.numero || '-'}</td>
                          <td className="px-4 py-3 text-sm">{clienteNome}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                            {v.total.toLocaleString('pt-AO')} Kz
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{dataFormatada}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => imprimirFatura(v.id)}
                              className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              <Printer size={14} /> Imprimir
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {totalPaginasVendas > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-center gap-2">
                {Array.from({ length: totalPaginasVendas }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPaginaAtual(i + 1)}
                    className={`px-3 py-1 rounded-lg transition-colors ${paginaAtual === i + 1
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmação Global */}
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
              <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}