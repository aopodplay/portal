'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { 
  Settings, Users, Package, Wrench, Shield, 
  FolderTree, Heart, CreditCard, FileText, Plus, 
  Edit, Trash2, X, CheckCircle, AlertCircle, Eye,
  Save, Upload, Printer, DollarSign, Hash, Phone, Mail, MapPin,
  Building, Search
} from 'lucide-react';

// ==================== TIPOS ====================

interface Configuracao {
  id: number;
  nome_sistema?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  moeda?: string;
  desconto_padrao?: number;
  empresa_nome?: string;
  empresa_nif?: string;
  logo?: string;
}

interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: 'admin' | 'recepcao' | 'optometrista' | 'caixa';
  ativo: boolean;
  foto?: string;
}

interface Produto {
  id: number;
  nome: string;
  tipo: 'armacao' | 'lente';
  preco: number;
  estoque: number;
  descricao?: string;
  categoria_id: number;
  categoria?: { id: number; nome: string };
}

interface Servico {
  id: number;
  nome: string;
  descricao?: string;
  valor: number;
}

interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
}

interface Seguradora {
  id: number;
  nome: string;
  nif?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
}

interface PlanoSeguro {
  id: number;
  nome: string;
  seguradora_id: number;
  ativo: boolean;
  seguradora?: Seguradora;
}

interface Cobertura {
  id: number;
  tipo_servico: string;
  percentual_cobertura: number;
  limite_valor?: number;
  plano_seguro_id: number;
}

interface Autorizacao {
  id: number;
  numero_autorizacao: string;
  valor_autorizado: number;
  status: string;
  plano_seguro_id: number;
}

// ==================== COMPONENTE PRINCIPAL ====================

export default function ConfiguracoesPage() {
  const [abaAtiva, setAbaAtiva] = useState<'sistema' | 'usuarios' | 'produtos' | 'servicos' | 'categorias' | 'seguradoras' | 'planos' | 'coberturas' | 'autorizacoes'>('sistema');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ==================== ESTADOS DO SISTEMA ====================
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // ==================== ESTADOS DE USUÁRIOS ====================
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtroUsuarios, setFiltroUsuarios] = useState('');
  const [usuarioForm, setUsuarioForm] = useState({ nome: '', email: '', senha: '', perfil: 'recepcao', ativo: true, foto: null });
  const [editUsuarioId, setEditUsuarioId] = useState<number | null>(null);
  const [showUsuarioForm, setShowUsuarioForm] = useState(false);

  // ==================== ESTADOS DE PRODUTOS ====================
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [showProdutoForm, setShowProdutoForm] = useState(false);
  const [produtoForm, setProdutoForm] = useState({ nome: '', tipo: 'armacao', preco: '', estoque: '', categoria_id: '', descricao: '' });
  const [editProdutoId, setEditProdutoId] = useState<number | null>(null);

  // ==================== ESTADOS DE SERVIÇOS ====================
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [showServicoForm, setShowServicoForm] = useState(false);
  const [servicoForm, setServicoForm] = useState({ nome: '', descricao: '', valor: '' });
  const [editServicoId, setEditServicoId] = useState<number | null>(null);

  // ==================== ESTADOS DE CATEGORIAS ====================
  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  const [categoriaForm, setCategoriaForm] = useState({ nome: '', descricao: '' });
  const [editCategoriaId, setEditCategoriaId] = useState<number | null>(null);

  // ==================== ESTADOS DE SEGURADORAS ====================
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]);
  const [showSeguradoraForm, setShowSeguradoraForm] = useState(false);
  const [seguradoraForm, setSeguradoraForm] = useState({ nome: '', nif: '', telefone: '', email: '', ativo: true });
  const [editSeguradoraId, setEditSeguradoraId] = useState<number | null>(null);

  // ==================== ESTADOS DE PLANOS ====================
  const [planos, setPlanos] = useState<PlanoSeguro[]>([]);
  const [showPlanoForm, setShowPlanoForm] = useState(false);
  const [planoForm, setPlanoForm] = useState({ nome: '', seguradora_id: '', ativo: true });
  const [editPlanoId, setEditPlanoId] = useState<number | null>(null);

  // ==================== ESTADOS DE COBERTURAS ====================
  const [coberturas, setCoberturas] = useState<Cobertura[]>([]);
  const [showCoberturaForm, setShowCoberturaForm] = useState(false);
  const [coberturaForm, setCoberturaForm] = useState({ tipo_servico: 'consulta', percentual_cobertura: '', limite_valor: '', plano_seguro_id: '' });
  const [editCoberturaId, setEditCoberturaId] = useState<number | null>(null);

  // ==================== ESTADOS DE AUTORIZAÇÕES ====================
  const [autorizacoes, setAutorizacoes] = useState<Autorizacao[]>([]);
  const [showAutorizacaoForm, setShowAutorizacaoForm] = useState(false);
  const [autorizacaoForm, setAutorizacaoForm] = useState({ numero_autorizacao: '', valor_autorizado: '', plano_seguro_id: '', status: 'pendente' });

  // ==================== MODAL DELETE ====================
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null; tipo: string; nome: string }>({
    isOpen: false, id: null, tipo: '', nome: ''
  });

  const mostrarMensagem = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // ==================== CONFIGURAÇÕES DO SISTEMA ====================
  const fetchConfig = async () => {
    try {
      const res = await fetch(getApiUrl('/configuracoes-sistema'), { headers: getAuthHeaders() });
      const data = await res.json();
      setConfig(data);
      if (data?.logo) {
        setLogoPreview(getApiUrl(data.logo));
      }
    } catch (err) {
      console.error('Erro ao carregar configuração:', err);
    }
  };

  const updateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setLoading(true);

    try {
      const body = { ...config };
      delete body.id;
      delete body.logo;

      const res = await fetch(getApiUrl(`/configuracoes-sistema/${config.id}`), {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Erro ao atualizar configuração');
      mostrarMensagem('success', 'Configuração atualizada com sucesso');
      fetchConfig();
    } catch (err: any) {
      mostrarMensagem('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile || !config) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('logo', logoFile);

    try {
      const headers = getAuthHeaders() as Record<string, string>;
      const res = await fetch(getApiUrl('/configuracoes-sistema/logo'), {
        method: 'POST',
        headers: { Authorization: headers.Authorization || '' },
        body: formData
      });

      if (!res.ok) throw new Error('Erro ao enviar logo');
      const data = await res.json();
      
      // Atualiza o estado imediatamente
      const newLogoUrl = getApiUrl(data.logo);
      setLogoPreview(newLogoUrl);
      setConfig({ ...config, logo: data.logo });
      
      mostrarMensagem('success', 'Logo atualizada com sucesso');
      setLogoFile(null);
      
      // Dispara evento para atualizar sidebar
      window.dispatchEvent(new Event('configUpdated'));
    } catch (err: any) {
      mostrarMensagem('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== USUÁRIOS ====================
  const fetchUsuarios = async () => {
    try {
      const res = await fetch(getApiUrl('/usuarios'), { headers: getAuthHeaders() });
      const data = await res.json();
      setUsuarios(data.data || data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  const salvarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editUsuarioId ? `/usuarios/${editUsuarioId}` : '/usuarios';
      const method = editUsuarioId ? 'PUT' : 'POST';

      const formData = new FormData();
      formData.append('nome', usuarioForm.nome);
      formData.append('email', usuarioForm.email);
      if (usuarioForm.senha) formData.append('senha', usuarioForm.senha);
      formData.append('perfil', usuarioForm.perfil);
      formData.append('ativo', usuarioForm.ativo ? '1' : '0');
      if (usuarioForm.foto instanceof File) formData.append('foto', usuarioForm.foto);

      const headers = getAuthHeaders() as Record<string, string>;
      const res = await fetch(getApiUrl(url), {
        method,
        headers: { Authorization: headers.Authorization || '' },
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar usuário');
      }
      mostrarMensagem('success', editUsuarioId ? 'Usuário atualizado' : 'Usuário criado');
      resetUsuarioForm();
      fetchUsuarios();
    } catch (err: any) {
      mostrarMensagem('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetUsuarioForm = () => {
    setUsuarioForm({ nome: '', email: '', senha: '', perfil: 'recepcao', ativo: true, foto: null });
    setEditUsuarioId(null);
    setShowUsuarioForm(false);
  };

  const editarUsuario = (usuario: Usuario) => {
    setUsuarioForm({ ...usuario, senha: '', foto: null });
    setEditUsuarioId(usuario.id);
    setShowUsuarioForm(true);
  };

  const ativarDesativarUsuario = async (id: number, ativo: boolean) => {
    try {
      const url = `/usuarios/${id}/${ativo ? 'desativar' : 'ativar'}`;
      const res = await fetch(getApiUrl(url), { method: 'PATCH', headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Erro ao alterar status');
      fetchUsuarios();
      mostrarMensagem('success', ativo ? 'Usuário desativado' : 'Usuário ativado');
    } catch (err) {
      mostrarMensagem('error', 'Erro ao alterar status');
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome.toLowerCase().includes(filtroUsuarios.toLowerCase()) ||
    u.email.toLowerCase().includes(filtroUsuarios.toLowerCase())
  );

  // ==================== PRODUTOS ====================
  const fetchProdutos = async () => {
    try {
      const res = await fetch(getApiUrl('/produtos'), { headers: getAuthHeaders() });
      const data = await res.json();
      setProdutos(data.data || []);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await fetch(getApiUrl('/categorias'), { headers: getAuthHeaders() });
      const data = await res.json();
      setCategorias(data.data || data);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  const salvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editProdutoId ? `/produtos/${editProdutoId}` : '/produtos';
      const method = editProdutoId ? 'PUT' : 'POST';

      const res = await fetch(getApiUrl(url), {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...produtoForm,
          preco: Number(produtoForm.preco),
          estoque: Number(produtoForm.estoque),
          categoria_id: Number(produtoForm.categoria_id)
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar produto');
      }
      mostrarMensagem('success', editProdutoId ? 'Produto atualizado' : 'Produto criado');
      resetProdutoForm();
      fetchProdutos();
    } catch (err: any) {
      mostrarMensagem('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetProdutoForm = () => {
    setProdutoForm({ nome: '', tipo: 'armacao', preco: '', estoque: '', categoria_id: '', descricao: '' });
    setEditProdutoId(null);
    setShowProdutoForm(false);
  };

  const editarProduto = (produto: Produto) => {
    setProdutoForm({
      nome: produto.nome,
      tipo: produto.tipo,
      preco: String(produto.preco),
      estoque: String(produto.estoque),
      categoria_id: String(produto.categoria_id),
      descricao: produto.descricao || ''
    });
    setEditProdutoId(produto.id);
    setShowProdutoForm(true);
  };

  // ==================== SERVIÇOS ====================
  const fetchServicos = async () => {
    try {
      const res = await fetch(getApiUrl('/servicos'), { headers: getAuthHeaders() });
      const data = await res.json();
      setServicos(data.data || data);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
    }
  };

  const salvarServico = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editServicoId ? `/servicos/${editServicoId}` : '/servicos';
      const method = editServicoId ? 'PUT' : 'POST';

      const res = await fetch(getApiUrl(url), {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...servicoForm, valor: Number(servicoForm.valor) })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar serviço');
      }
      mostrarMensagem('success', editServicoId ? 'Serviço atualizado' : 'Serviço criado');
      resetServicoForm();
      fetchServicos();
    } catch (err: any) {
      mostrarMensagem('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetServicoForm = () => {
    setServicoForm({ nome: '', descricao: '', valor: '' });
    setEditServicoId(null);
    setShowServicoForm(false);
  };

  const editarServico = (servico: Servico) => {
    setServicoForm({
      nome: servico.nome,
      descricao: servico.descricao || '',
      valor: String(servico.valor)
    });
    setEditServicoId(servico.id);
    setShowServicoForm(true);
  };

  // ==================== CATEGORIAS ====================
  const salvarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editCategoriaId ? `/categorias/${editCategoriaId}` : '/categorias';
      const method = editCategoriaId ? 'PUT' : 'POST';

      const res = await fetch(getApiUrl(url), {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(categoriaForm)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar categoria');
      }
      mostrarMensagem('success', editCategoriaId ? 'Categoria atualizada' : 'Categoria criada');
      setCategoriaForm({ nome: '', descricao: '' });
      setEditCategoriaId(null);
      setShowCategoriaForm(false);
      fetchCategorias();
    } catch (err: any) {
      mostrarMensagem('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const editarCategoria = (categoria: Categoria) => {
    setCategoriaForm({ nome: categoria.nome, descricao: categoria.descricao || '' });
    setEditCategoriaId(categoria.id);
    setShowCategoriaForm(true);
  };

  // ==================== SEGURADORAS ====================
  const fetchSeguradoras = async () => {
    try {
      const res = await fetch(getApiUrl('/seguradoras'), { headers: getAuthHeaders() });
      const data = await res.json();
      setSeguradoras(data.data || data);
    } catch (err) {
      console.error('Erro ao carregar seguradoras:', err);
    }
  };

  const salvarSeguradora = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editSeguradoraId ? `/seguradoras/${editSeguradoraId}` : '/seguradoras';
      const method = editSeguradoraId ? 'PUT' : 'POST';

      const res = await fetch(getApiUrl(url), {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(seguradoraForm)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar seguradora');
      }
      mostrarMensagem('success', editSeguradoraId ? 'Seguradora atualizada' : 'Seguradora criada');
      resetSeguradoraForm();
      fetchSeguradoras();
    } catch (err: any) {
      mostrarMensagem('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetSeguradoraForm = () => {
    setSeguradoraForm({ nome: '', nif: '', telefone: '', email: '', ativo: true });
    setEditSeguradoraId(null);
    setShowSeguradoraForm(false);
  };

  const editarSeguradora = (seguradora: Seguradora) => {
    setSeguradoraForm(seguradora);
    setEditSeguradoraId(seguradora.id);
    setShowSeguradoraForm(true);
  };

  // ==================== PLANOS ====================
  const fetchPlanos = async () => {
    try {
      const res = await fetch(getApiUrl('/planos'), { headers: getAuthHeaders() });
      const data = await res.json();
      setPlanos(data.data || data);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
    }
  };

  const salvarPlano = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editPlanoId ? `/planos/${editPlanoId}` : '/planos';
      const method = editPlanoId ? 'PUT' : 'POST';

      const res = await fetch(getApiUrl(url), {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...planoForm, seguradora_id: Number(planoForm.seguradora_id) })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar plano');
      }
      mostrarMensagem('success', editPlanoId ? 'Plano atualizado' : 'Plano criado');
      setPlanoForm({ nome: '', seguradora_id: '', ativo: true });
      setEditPlanoId(null);
      setShowPlanoForm(false);
      fetchPlanos();
    } catch (err: any) {
      mostrarMensagem('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const editarPlano = (plano: PlanoSeguro) => {
    setPlanoForm({ nome: plano.nome, seguradora_id: String(plano.seguradora_id), ativo: plano.ativo });
    setEditPlanoId(plano.id);
    setShowPlanoForm(true);
  };

  // ==================== COBERTURAS ====================
  const fetchCoberturas = async () => {
    try {
      const res = await fetch(getApiUrl('/coberturas'), { headers: getAuthHeaders() });
      const data = await res.json();
      setCoberturas(data.data || data);
    } catch (err) {
      console.error('Erro ao carregar coberturas:', err);
    }
  };

  const salvarCobertura = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editCoberturaId ? `/coberturas/${editCoberturaId}` : '/coberturas';
      const method = editCoberturaId ? 'PUT' : 'POST';

      const res = await fetch(getApiUrl(url), {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...coberturaForm,
          percentual_cobertura: Number(coberturaForm.percentual_cobertura),
          limite_valor: coberturaForm.limite_valor ? Number(coberturaForm.limite_valor) : null,
          plano_seguro_id: Number(coberturaForm.plano_seguro_id)
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar cobertura');
      }
      mostrarMensagem('success', editCoberturaId ? 'Cobertura atualizada' : 'Cobertura criada');
      setCoberturaForm({ tipo_servico: 'consulta', percentual_cobertura: '', limite_valor: '', plano_seguro_id: '' });
      setEditCoberturaId(null);
      setShowCoberturaForm(false);
      fetchCoberturas();
    } catch (err: any) {
      mostrarMensagem('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const editarCobertura = (cobertura: Cobertura) => {
    setCoberturaForm({
      tipo_servico: cobertura.tipo_servico,
      percentual_cobertura: String(cobertura.percentual_cobertura),
      limite_valor: String(cobertura.limite_valor || ''),
      plano_seguro_id: String(cobertura.plano_seguro_id)
    });
    setEditCoberturaId(cobertura.id);
    setShowCoberturaForm(true);
  };

  // ==================== AUTORIZAÇÕES ====================
  const fetchAutorizacoes = async () => {
    try {
      const res = await fetch(getApiUrl('/autorizacoes'), { headers: getAuthHeaders() });
      const data = await res.json();
      setAutorizacoes(data.data || data);
    } catch (err) {
      console.error('Erro ao carregar autorizações:', err);
    }
  };

  const salvarAutorizacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/autorizacoes'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...autorizacaoForm,
          valor_autorizado: Number(autorizacaoForm.valor_autorizado),
          plano_seguro_id: Number(autorizacaoForm.plano_seguro_id)
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao criar autorização');
      }
      mostrarMensagem('success', 'Autorização criada');
      setAutorizacaoForm({ numero_autorizacao: '', valor_autorizado: '', plano_seguro_id: '', status: 'pendente' });
      setShowAutorizacaoForm(false);
      fetchAutorizacoes();
    } catch (err: any) {
      mostrarMensagem('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== DELETE ====================
  const confirmarDelete = async () => {
    if (!deleteModal.id) return;

    try {
      let url = '';
      switch (deleteModal.tipo) {
        case 'usuario': url = `/usuarios/${deleteModal.id}`; break;
        case 'produto': url = `/produtos/${deleteModal.id}`; break;
        case 'servico': url = `/servicos/${deleteModal.id}`; break;
        case 'categoria': url = `/categorias/${deleteModal.id}`; break;
        case 'seguradora': url = `/seguradoras/${deleteModal.id}`; break;
        case 'plano': url = `/planos/${deleteModal.id}`; break;
        case 'cobertura': url = `/coberturas/${deleteModal.id}`; break;
      }

      const res = await fetch(getApiUrl(url), { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Erro ao deletar');
      mostrarMensagem('success', `${deleteModal.nome} removido com sucesso`);

      // Recarregar lista
      if (deleteModal.tipo === 'usuario') fetchUsuarios();
      if (deleteModal.tipo === 'produto') fetchProdutos();
      if (deleteModal.tipo === 'servico') fetchServicos();
      if (deleteModal.tipo === 'categoria') fetchCategorias();
      if (deleteModal.tipo === 'seguradora') fetchSeguradoras();
      if (deleteModal.tipo === 'plano') fetchPlanos();
      if (deleteModal.tipo === 'cobertura') fetchCoberturas();

    } catch (err: any) {
      mostrarMensagem('error', err.message);
    } finally {
      setDeleteModal({ isOpen: false, id: null, tipo: '', nome: '' });
    }
  };

  // ==================== LOAD INICIAL ====================
  useEffect(() => {
    fetchConfig();
    fetchUsuarios();
    fetchProdutos();
    fetchServicos();
    fetchCategorias();
    fetchSeguradoras();
    fetchPlanos();
    fetchCoberturas();
    fetchAutorizacoes();
  }, []);

  const logoUrl = logoPreview || (config?.logo ? getApiUrl(config.logo) : null);

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="container mx-auto px-6 py-5">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Settings size={28} /> Configurações do Sistema</h1>
          <p className="text-indigo-100 mt-1">Gerencie usuários, produtos, serviços, seguradoras e muito mais</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Abas */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="flex border-b overflow-x-auto">
            <button onClick={() => setAbaAtiva('sistema')} className={`px-5 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'sistema' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Settings size={18} /> Sistema</button>
            <button onClick={() => setAbaAtiva('usuarios')} className={`px-5 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'usuarios' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Users size={18} /> Usuários</button>
            <button onClick={() => setAbaAtiva('produtos')} className={`px-5 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'produtos' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Package size={18} /> Produtos</button>
            <button onClick={() => setAbaAtiva('servicos')} className={`px-5 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'servicos' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Wrench size={18} /> Serviços</button>
            <button onClick={() => setAbaAtiva('categorias')} className={`px-5 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'categorias' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><FolderTree size={18} /> Categorias</button>
            <button onClick={() => setAbaAtiva('seguradoras')} className={`px-5 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'seguradoras' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Shield size={18} /> Seguradoras</button>
            <button onClick={() => setAbaAtiva('planos')} className={`px-5 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'planos' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Heart size={18} /> Planos</button>
            <button onClick={() => setAbaAtiva('coberturas')} className={`px-5 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'coberturas' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><FileText size={18} /> Coberturas</button>
            <button onClick={() => setAbaAtiva('autorizacoes')} className={`px-5 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'autorizacoes' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><CreditCard size={18} /> Autorizações</button>
          </div>

          <div className="p-6">
            {/* ==================== ABA SISTEMA ==================== */}
            {abaAtiva === 'sistema' && config && (
              <form onSubmit={updateConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Settings size={20} /> Dados do Sistema</h2>
                  <div><label className="block text-sm font-medium mb-1">Nome do Sistema</label><input type="text" value={config.nome_sistema || ''} onChange={e => setConfig({ ...config, nome_sistema: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Endereço</label><input type="text" value={config.endereco || ''} onChange={e => setConfig({ ...config, endereco: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium mb-1">Telefone</label><input type="text" value={config.telefone || ''} onChange={e => setConfig({ ...config, telefone: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={config.email || ''} onChange={e => setConfig({ ...config, email: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium mb-1">Moeda</label><input type="text" value={config.moeda || 'Kz'} onChange={e => setConfig({ ...config, moeda: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium mb-1">Desconto Padrão (%)</label><input type="number" value={config.desconto_padrao || 0} onChange={e => setConfig({ ...config, desconto_padrao: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" /></div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Building size={20} /> Dados da Empresa & Logo</h2>
                  <div><label className="block text-sm font-medium mb-1">Nome da Empresa</label><input type="text" value={config.empresa_nome || ''} onChange={e => setConfig({ ...config, empresa_nome: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium mb-1">NIF da Empresa</label><input type="text" value={config.empresa_nif || ''} onChange={e => setConfig({ ...config, empresa_nif: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium mb-1">Logo</label>
                    <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="w-full border rounded-lg px-3 py-2" />
                    <button type="button" onClick={uploadLogo} disabled={!logoFile} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">Upload Logo</button>
                    {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 mt-2 object-contain" />}
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end"><button type="submit" disabled={loading} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"><Save size={18} /> {loading ? 'Salvando...' : 'Salvar Configuração'}</button></div>
              </form>
            )}

            {/* ==================== ABA USUÁRIOS ==================== */}
            {abaAtiva === 'usuarios' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Users size={24} /> Usuários do Sistema</h2>
                  <button onClick={() => setShowUsuarioForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><Plus size={18} /> Novo Usuário</button>
                </div>
                
                {/* Filtro de Usuários */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input type="text" placeholder="Pesquisar usuário por nome ou email..." value={filtroUsuarios} onChange={e => setFiltroUsuarios(e.target.value)} className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                {showUsuarioForm && (<form onSubmit={salvarUsuario} className="bg-gray-50 rounded-lg p-6 mb-6"><h3 className="font-semibold mb-4">{editUsuarioId ? 'Editar Usuário' : 'Novo Usuário'}</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input name="nome" placeholder="Nome" value={usuarioForm.nome} onChange={e => setUsuarioForm({ ...usuarioForm, nome: e.target.value })} className="border rounded-lg px-3 py-2" required /><input name="email" type="email" placeholder="Email" value={usuarioForm.email} onChange={e => setUsuarioForm({ ...usuarioForm, email: e.target.value })} className="border rounded-lg px-3 py-2" required /><input name="senha" type="password" placeholder={editUsuarioId ? "Nova senha (opcional)" : "Senha"} value={usuarioForm.senha} onChange={e => setUsuarioForm({ ...usuarioForm, senha: e.target.value })} className="border rounded-lg px-3 py-2" {...(!editUsuarioId && { required: true })} /><select name="perfil" value={usuarioForm.perfil} onChange={e => setUsuarioForm({ ...usuarioForm, perfil: e.target.value as any })} className="border rounded-lg px-3 py-2"><option value="admin">Administrador</option><option value="recepcao">Recepção</option><option value="optometrista">Optometrista</option><option value="caixa">Caixa</option></select><select name="ativo" value={usuarioForm.ativo ? '1' : '0'} onChange={e => setUsuarioForm({ ...usuarioForm, ativo: e.target.value === '1' })} className="border rounded-lg px-3 py-2"><option value="1">Ativo</option><option value="0">Inativo</option></select><input type="file" accept="image/*" onChange={e => setUsuarioForm({ ...usuarioForm, foto: e.target.files?.[0] || null })} className="border rounded-lg px-3 py-2" /></div><div className="flex justify-end gap-3 mt-4"><button type="button" onClick={resetUsuarioForm} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Salvando...' : 'Salvar'}</button></div></form>)}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{usuariosFiltrados.map(u => (<div key={u.id} className="bg-white rounded-lg shadow p-4"><div className="flex items-center gap-3 mb-3"><div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">{u.nome[0]?.toUpperCase()}</div><div><h3 className="font-semibold">{u.nome}</h3><p className="text-sm text-gray-500">{u.email}</p><span className={`text-xs px-2 py-0.5 rounded ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.ativo ? 'Ativo' : 'Inativo'}</span></div></div><div className="flex justify-between items-center"><span className="text-sm text-gray-500">{u.perfil === 'admin' ? 'Administrador' : u.perfil === 'recepcao' ? 'Recepção' : u.perfil === 'optometrista' ? 'Optometrista' : 'Caixa'}</span><div className="flex gap-2"><button onClick={() => editarUsuario(u)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button><button onClick={() => ativarDesativarUsuario(u.id, u.ativo)} className={`${u.ativo ? 'text-gray-500' : 'text-green-600'} hover:opacity-80`}>{u.ativo ? 'Desativar' : 'Ativar'}</button><button onClick={() => setDeleteModal({ isOpen: true, id: u.id, tipo: 'usuario', nome: u.nome })} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button></div></div></div>))}</div>
              </div>
            )}

            {/* ==================== ABA PRODUTOS ==================== */}
            {abaAtiva === 'produtos' && (
              <div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex items-center gap-2"><Package size={24} /> Produtos</h2><button onClick={() => { resetProdutoForm(); setShowProdutoForm(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><Plus size={18} /> Novo Produto</button></div>
                {showProdutoForm && (<form onSubmit={salvarProduto} className="bg-gray-50 rounded-lg p-6 mb-6"><h3 className="font-semibold mb-4">{editProdutoId ? 'Editar Produto' : 'Novo Produto'}</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input name="nome" placeholder="Nome" value={produtoForm.nome} onChange={e => setProdutoForm({ ...produtoForm, nome: e.target.value })} className="border rounded-lg px-3 py-2" required /><select name="tipo" value={produtoForm.tipo} onChange={e => setProdutoForm({ ...produtoForm, tipo: e.target.value as any })} className="border rounded-lg px-3 py-2"><option value="armacao">Armação</option><option value="lente">Lente</option></select><input name="preco" type="number" placeholder="Preço" value={produtoForm.preco} onChange={e => setProdutoForm({ ...produtoForm, preco: e.target.value })} className="border rounded-lg px-3 py-2" required /><input name="estoque" type="number" placeholder="Estoque" value={produtoForm.estoque} onChange={e => setProdutoForm({ ...produtoForm, estoque: e.target.value })} className="border rounded-lg px-3 py-2" /><select name="categoria_id" value={produtoForm.categoria_id} onChange={e => setProdutoForm({ ...produtoForm, categoria_id: e.target.value })} className="border rounded-lg px-3 py-2" required><option value="">Selecione a categoria</option>{categorias.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}</select><textarea name="descricao" placeholder="Descrição" value={produtoForm.descricao} onChange={e => setProdutoForm({ ...produtoForm, descricao: e.target.value })} className="border rounded-lg px-3 py-2" rows={2} /></div><div className="flex justify-end gap-3 mt-4"><button type="button" onClick={resetProdutoForm} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Salvando...' : 'Salvar'}</button></div></form>)}
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-100"><tr><th className="p-3 text-left">Nome</th><th>Tipo</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr></thead><tbody>{produtos.map(p => (<tr key={p.id} className="border-t"><td className="p-3">{p.nome}</td><td className="p-3">{p.tipo === 'armacao' ? 'Armação' : 'Lente'}</td><td className="p-3">{p.categoria?.nome || '-'}</td><td className="p-3">{Number(p.preco).toLocaleString('pt-AO')} Kz</td><td className="p-3">{p.estoque}</td><td className="p-3 flex gap-2"><button onClick={() => editarProduto(p)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button><button onClick={() => setDeleteModal({ isOpen: true, id: p.id, tipo: 'produto', nome: p.nome })} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button></td></tr>))}</tbody></table></div>
              </div>
            )}

            {/* ==================== ABA SERVIÇOS ==================== */}
            {abaAtiva === 'servicos' && (
              <div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex items-center gap-2"><Wrench size={24} /> Serviços</h2><button onClick={() => { resetServicoForm(); setShowServicoForm(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><Plus size={18} /> Novo Serviço</button></div>
                {showServicoForm && (<form onSubmit={salvarServico} className="bg-gray-50 rounded-lg p-6 mb-6"><h3 className="font-semibold mb-4">{editServicoId ? 'Editar Serviço' : 'Novo Serviço'}</h3><div className="grid grid-cols-1 gap-4"><input name="nome" placeholder="Nome do Serviço" value={servicoForm.nome} onChange={e => setServicoForm({ ...servicoForm, nome: e.target.value })} className="border rounded-lg px-3 py-2" required /><textarea name="descricao" placeholder="Descrição" value={servicoForm.descricao} onChange={e => setServicoForm({ ...servicoForm, descricao: e.target.value })} className="border rounded-lg px-3 py-2" rows={2} /><input name="valor" type="number" placeholder="Valor" value={servicoForm.valor} onChange={e => setServicoForm({ ...servicoForm, valor: e.target.value })} className="border rounded-lg px-3 py-2" required /></div><div className="flex justify-end gap-3 mt-4"><button type="button" onClick={resetServicoForm} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Salvando...' : 'Salvar'}</button></div></form>)}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{servicos.map(s => (<div key={s.id} className="bg-white rounded-lg shadow p-4"><h3 className="font-semibold">{s.nome}</h3><p className="text-sm text-gray-500 mt-1">{s.descricao || 'Sem descrição'}</p><div className="flex justify-between items-center mt-3"><span className="text-green-600 font-bold">{Number(s.valor).toLocaleString('pt-AO')} Kz</span><div className="flex gap-2"><button onClick={() => editarServico(s)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button><button onClick={() => setDeleteModal({ isOpen: true, id: s.id, tipo: 'servico', nome: s.nome })} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button></div></div></div>))}</div>
              </div>
            )}

            {/* ==================== ABA CATEGORIAS ==================== */}
            {abaAtiva === 'categorias' && (
              <div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex items-center gap-2"><FolderTree size={24} /> Categorias de Produtos</h2><button onClick={() => { setCategoriaForm({ nome: '', descricao: '' }); setEditCategoriaId(null); setShowCategoriaForm(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><Plus size={18} /> Nova Categoria</button></div>
                {showCategoriaForm && (<form onSubmit={salvarCategoria} className="bg-gray-50 rounded-lg p-6 mb-6"><h3 className="font-semibold mb-4">{editCategoriaId ? 'Editar Categoria' : 'Nova Categoria'}</h3><input name="nome" placeholder="Nome da Categoria" value={categoriaForm.nome} onChange={e => setCategoriaForm({ ...categoriaForm, nome: e.target.value })} className="w-full border rounded-lg px-3 py-2 mb-3" required /><textarea name="descricao" placeholder="Descrição" value={categoriaForm.descricao} onChange={e => setCategoriaForm({ ...categoriaForm, descricao: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} /><div className="flex justify-end gap-3 mt-4"><button type="button" onClick={() => { setCategoriaForm({ nome: '', descricao: '' }); setEditCategoriaId(null); setShowCategoriaForm(false); }} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Salvando...' : 'Salvar'}</button></div></form>)}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{categorias.map(c => (<div key={c.id} className="bg-white rounded-lg shadow p-4"><h3 className="font-semibold">{c.nome}</h3><p className="text-sm text-gray-500 mt-1">{c.descricao || 'Sem descrição'}</p><div className="flex justify-end gap-2 mt-3"><button onClick={() => editarCategoria(c)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button><button onClick={() => setDeleteModal({ isOpen: true, id: c.id, tipo: 'categoria', nome: c.nome })} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button></div></div>))}</div>
              </div>
            )}

            {/* ==================== ABA SEGURADORAS ==================== */}
            {abaAtiva === 'seguradoras' && (
              <div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex items-center gap-2"><Shield size={24} /> Seguradoras</h2><button onClick={() => { resetSeguradoraForm(); setShowSeguradoraForm(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><Plus size={18} /> Nova Seguradora</button></div>
                {showSeguradoraForm && (<form onSubmit={salvarSeguradora} className="bg-gray-50 rounded-lg p-6 mb-6"><h3 className="font-semibold mb-4">{editSeguradoraId ? 'Editar Seguradora' : 'Nova Seguradora'}</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input name="nome" placeholder="Nome da Seguradora" value={seguradoraForm.nome} onChange={e => setSeguradoraForm({ ...seguradoraForm, nome: e.target.value })} className="border rounded-lg px-3 py-2" required /><input name="nif" placeholder="NIF" value={seguradoraForm.nif} onChange={e => setSeguradoraForm({ ...seguradoraForm, nif: e.target.value })} className="border rounded-lg px-3 py-2" /><input name="telefone" placeholder="Telefone" value={seguradoraForm.telefone} onChange={e => setSeguradoraForm({ ...seguradoraForm, telefone: e.target.value })} className="border rounded-lg px-3 py-2" /><input name="email" type="email" placeholder="Email" value={seguradoraForm.email} onChange={e => setSeguradoraForm({ ...seguradoraForm, email: e.target.value })} className="border rounded-lg px-3 py-2" /><select name="ativo" value={seguradoraForm.ativo ? '1' : '0'} onChange={e => setSeguradoraForm({ ...seguradoraForm, ativo: e.target.value === '1' })} className="border rounded-lg px-3 py-2"><option value="1">Ativo</option><option value="0">Inativo</option></select></div><div className="flex justify-end gap-3 mt-4"><button type="button" onClick={resetSeguradoraForm} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Salvando...' : 'Salvar'}</button></div></form>)}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{seguradoras.map(s => (<div key={s.id} className="bg-white rounded-lg shadow p-4"><h3 className="font-semibold">{s.nome}</h3><p className="text-sm text-gray-500">{s.nif && `NIF: ${s.nif}`}</p><p className="text-sm text-gray-500">{s.telefone && `Tel: ${s.telefone}`}</p><div className="flex justify-between items-center mt-3"><span className={`text-xs px-2 py-0.5 rounded ${s.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.ativo ? 'Ativo' : 'Inativo'}</span><div className="flex gap-2"><button onClick={() => editarSeguradora(s)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button><button onClick={() => setDeleteModal({ isOpen: true, id: s.id, tipo: 'seguradora', nome: s.nome })} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button></div></div></div>))}</div>
              </div>
            )}

            {/* ==================== ABA PLANOS ==================== */}
            {abaAtiva === 'planos' && (
              <div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex items-center gap-2"><Heart size={24} /> Planos de Saúde</h2><button onClick={() => { setPlanoForm({ nome: '', seguradora_id: '', ativo: true }); setEditPlanoId(null); setShowPlanoForm(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><Plus size={18} /> Novo Plano</button></div>
                {showPlanoForm && (<form onSubmit={salvarPlano} className="bg-gray-50 rounded-lg p-6 mb-6"><h3 className="font-semibold mb-4">{editPlanoId ? 'Editar Plano' : 'Novo Plano'}</h3><div className="grid grid-cols-1 gap-4"><input name="nome" placeholder="Nome do Plano" value={planoForm.nome} onChange={e => setPlanoForm({ ...planoForm, nome: e.target.value })} className="border rounded-lg px-3 py-2" required /><select name="seguradora_id" value={planoForm.seguradora_id} onChange={e => setPlanoForm({ ...planoForm, seguradora_id: e.target.value })} className="border rounded-lg px-3 py-2" required><option value="">Selecione a Seguradora</option>{seguradoras.filter(s => s.ativo).map(s => (<option key={s.id} value={s.id}>{s.nome}</option>))}</select><select name="ativo" value={planoForm.ativo ? '1' : '0'} onChange={e => setPlanoForm({ ...planoForm, ativo: e.target.value === '1' })} className="border rounded-lg px-3 py-2"><option value="1">Ativo</option><option value="0">Inativo</option></select></div><div className="flex justify-end gap-3 mt-4"><button type="button" onClick={() => { setPlanoForm({ nome: '', seguradora_id: '', ativo: true }); setEditPlanoId(null); setShowPlanoForm(false); }} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Salvando...' : 'Salvar'}</button></div></form>)}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{planos.map(p => (<div key={p.id} className="bg-white rounded-lg shadow p-4"><h3 className="font-semibold">{p.nome}</h3><p className="text-sm text-gray-500">{seguradoras.find(s => s.id === p.seguradora_id)?.nome || 'Seguradora não encontrada'}</p><div className="flex justify-between items-center mt-3"><span className={`text-xs px-2 py-0.5 rounded ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.ativo ? 'Ativo' : 'Inativo'}</span><div className="flex gap-2"><button onClick={() => editarPlano(p)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button><button onClick={() => setDeleteModal({ isOpen: true, id: p.id, tipo: 'plano', nome: p.nome })} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button></div></div></div>))}</div>
              </div>
            )}

            {/* ==================== ABA COBERTURAS ==================== */}
            {abaAtiva === 'coberturas' && (
              <div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex items-center gap-2"><FileText size={24} /> Coberturas</h2><button onClick={() => { setCoberturaForm({ tipo_servico: 'consulta', percentual_cobertura: '', limite_valor: '', plano_seguro_id: '' }); setEditCoberturaId(null); setShowCoberturaForm(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><Plus size={18} /> Nova Cobertura</button></div>
                {showCoberturaForm && (<form onSubmit={salvarCobertura} className="bg-gray-50 rounded-lg p-6 mb-6"><h3 className="font-semibold mb-4">{editCoberturaId ? 'Editar Cobertura' : 'Nova Cobertura'}</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><select name="plano_seguro_id" value={coberturaForm.plano_seguro_id} onChange={e => setCoberturaForm({ ...coberturaForm, plano_seguro_id: e.target.value })} className="border rounded-lg px-3 py-2" required><option value="">Selecione o Plano</option>{planos.filter(p => p.ativo).map(p => (<option key={p.id} value={p.id}>{p.nome}</option>))}</select><select name="tipo_servico" value={coberturaForm.tipo_servico} onChange={e => setCoberturaForm({ ...coberturaForm, tipo_servico: e.target.value })} className="border rounded-lg px-3 py-2" required><option value="consulta">Consulta</option><option value="lente">Lente</option><option value="armacao">Armação</option><option value="exame">Exame</option></select><input name="percentual_cobertura" type="number" placeholder="Percentual de Cobertura (%)" value={coberturaForm.percentual_cobertura} onChange={e => setCoberturaForm({ ...coberturaForm, percentual_cobertura: e.target.value })} className="border rounded-lg px-3 py-2" required /><input name="limite_valor" type="number" placeholder="Limite de Valor (opcional)" value={coberturaForm.limite_valor} onChange={e => setCoberturaForm({ ...coberturaForm, limite_valor: e.target.value })} className="border rounded-lg px-3 py-2" /></div><div className="flex justify-end gap-3 mt-4"><button type="button" onClick={() => { setCoberturaForm({ tipo_servico: 'consulta', percentual_cobertura: '', limite_valor: '', plano_seguro_id: '' }); setEditCoberturaId(null); setShowCoberturaForm(false); }} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Salvando...' : 'Salvar'}</button></div></form>)}
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-100"><tr><th className="p-3 text-left">Plano</th><th>Tipo de Serviço</th><th>Percentual</th><th>Limite</th><th>Ações</th></tr></thead><tbody>{coberturas.map(c => (<tr key={c.id} className="border-t"><td className="p-3">{planos.find(p => p.id === c.plano_seguro_id)?.nome || '-'}</td><td className="p-3">{c.tipo_servico}</td><td className="p-3">{c.percentual_cobertura}%</td><td className="p-3">{c.limite_valor ? `${c.limite_valor.toLocaleString('pt-AO')} Kz` : '-'}</td><td className="p-3 flex gap-2"><button onClick={() => editarCobertura(c)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button><button onClick={() => setDeleteModal({ isOpen: true, id: c.id, tipo: 'cobertura', nome: `Cobertura ${c.tipo_servico}` })} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button></td></tr>))}</tbody></table></div>
              </div>
            )}

            {/* ==================== ABA AUTORIZAÇÕES ==================== */}
            {abaAtiva === 'autorizacoes' && (
              <div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex items-center gap-2"><CreditCard size={24} /> Autorizações</h2><button onClick={() => setShowAutorizacaoForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><Plus size={18} /> Nova Autorização</button></div>
                {showAutorizacaoForm && (<form onSubmit={salvarAutorizacao} className="bg-gray-50 rounded-lg p-6 mb-6"><h3 className="font-semibold mb-4">Nova Autorização</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input name="numero_autorizacao" placeholder="Número da Autorização" value={autorizacaoForm.numero_autorizacao} onChange={e => setAutorizacaoForm({ ...autorizacaoForm, numero_autorizacao: e.target.value })} className="border rounded-lg px-3 py-2" required /><input name="valor_autorizado" type="number" placeholder="Valor Autorizado" value={autorizacaoForm.valor_autorizado} onChange={e => setAutorizacaoForm({ ...autorizacaoForm, valor_autorizado: e.target.value })} className="border rounded-lg px-3 py-2" required /><select name="plano_seguro_id" value={autorizacaoForm.plano_seguro_id} onChange={e => setAutorizacaoForm({ ...autorizacaoForm, plano_seguro_id: e.target.value })} className="border rounded-lg px-3 py-2" required><option value="">Selecione o Plano</option>{planos.filter(p => p.ativo).map(p => (<option key={p.id} value={p.id}>{p.nome}</option>))}</select><select name="status" value={autorizacaoForm.status} onChange={e => setAutorizacaoForm({ ...autorizacaoForm, status: e.target.value })} className="border rounded-lg px-3 py-2"><option value="pendente">Pendente</option><option value="aprovado">Aprovado</option><option value="rejeitado">Rejeitado</option></select></div><div className="flex justify-end gap-3 mt-4"><button type="button" onClick={() => setShowAutorizacaoForm(false)} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Salvando...' : 'Criar Autorização'}</button></div></form>)}
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-100"><tr><th className="p-3 text-left">Número</th><th>Plano</th><th>Valor</th><th>Status</th></tr></thead><tbody>{autorizacoes.map(a => (<tr key={a.id} className="border-t"><td className="p-3">{a.numero_autorizacao}</td><td className="p-3">{planos.find(p => p.id === a.plano_seguro_id)?.nome || '-'}</td><td className="p-3">{Number(a.valor_autorizado).toLocaleString('pt-AO')} Kz</td><td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${a.status === 'aprovado' ? 'bg-green-100 text-green-700' : a.status === 'rejeitado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.status}</span></td></tr>))}</tbody></table></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Delete */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertCircle className="text-red-600" size={20} /></div><h2 className="text-xl font-bold text-gray-800">Confirmar Exclusão</h2></div>
            <p className="text-gray-600 mb-6">Tem certeza que deseja excluir "{deleteModal.nome}"? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3"><button onClick={() => setDeleteModal({ isOpen: false, id: null, tipo: '', nome: '' })} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button><button onClick={confirmarDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Confirmar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}