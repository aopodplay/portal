'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import Cookies from 'js-cookie';
import {
  FileText,
  Download,
  AlertTriangle,
  Printer,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  FileBarChart,
  PieChart,
  BarChart3,
  Filter,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Package,
  CreditCard,
  FileSpreadsheet,
  Database,
  HardDrive,
  Clock,
  Trash2,
  Settings,
  Upload
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import * as XLSX from 'xlsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// ========== MODAL DE CONFIRMAÇÃO ==========
function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar",
  type = "warning"
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
  confirmText?: string; 
  cancelText?: string;
  type?: "warning" | "danger" | "info";
}) {
  if (!isOpen) return null;

  const colors = {
    warning: "bg-yellow-100 text-yellow-600",
    danger: "bg-red-100 text-red-600",
    info: "bg-blue-100 text-blue-600"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full ${colors[type]} flex items-center justify-center`}>
            {type === "danger" && <Trash2 size={20} />}
            {type === "warning" && <AlertTriangle size={20} />}
            {type === "info" && <AlertCircle size={20} />}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-colors ${
              type === "danger" 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : type === "warning"
                ? "bg-yellow-600 text-white hover:bg-yellow-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== COMPONENTE DE BACKUP ==========
interface Backup {
  nome: string;
  tamanhoFormatado: string;
  dataFormatada: string;
  data: Date;
}

interface BackupStatus {
  configuracao: {
    horario: string;
    frequencia: string;
    retencaoDias: number;
    ativo: boolean;
  };
  ultimoBackup: { data: string; mensagem: string } | null;
  backupsDisponiveis: Backup[];
  estatisticas: {
    totalBackups: number;
    espacoUsado: string;
  };
}

function BackupManager() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [gerando, setGerando] = useState(false);
  const [restaurando, setRestaurando] = useState<string | null>(null);
  const [baixando, setBaixando] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState<{ isOpen: boolean; backupNome: string | null }>({ isOpen: false, backupNome: null });
  const [config, setConfig] = useState({
    horario: '02:00',
    frequencia: 'diario',
    retencaoDias: 30,
    ativo: true
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const carregarStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/backups/status'), { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setStatus(data);
        setConfig({
          horario: data.configuracao.horario || '02:00',
          frequencia: data.configuracao.frequencia || 'diario',
          retencaoDias: data.configuracao.retencaoDias || 30,
          ativo: data.configuracao.ativo !== undefined ? data.configuracao.ativo : true
        });
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar status dos backups' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarStatus();
  }, []);

  const gerarBackup = async () => {
    setGerando(true);
    setMessage(null);

    try {
      const res = await fetch(getApiUrl('/backups/gerar'), {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Backup gerado com sucesso!' });
        carregarStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao gerar backup' });
      }
    } catch (error) {
      console.error('Erro:', error);
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
    } finally {
      setGerando(false);
    }
  };

  const baixarBackup = async (nome: string) => {
    setBaixando(nome);
    setMessage(null);

    try {
      const cookieToken: string | undefined = Cookies.get("token");
      const storageToken: string | null = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const token: string | undefined = cookieToken || storageToken || undefined;

      if (!token) {
        throw new Error('Token não encontrado. Faça login novamente.');
      }

      const url = getApiUrl(`/backups/download/${encodeURIComponent(nome)}?token=${encodeURIComponent(token)}`);
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        throw new Error('Popup bloqueado. Permita popups para este site.');
      }

      setMessage({ type: 'success', text: `Download do backup "${nome}" iniciado!` });
    } catch (error) {
      console.error('Erro:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao baixar backup' });
    } finally {
      setBaixando(null);
    }
  };

  const restaurarBackup = async (nome: string) => {
    setRestaurando(nome);
    setMessage(null);

    try {
      const res = await fetch(getApiUrl('/backups/restaurar'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ arquivo: nome })
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Backup restaurado com sucesso! O sistema será recarregado em instantes.' });
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao restaurar backup' });
      }
    } catch (error) {
      console.error('Erro:', error);
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
    } finally {
      setRestaurando(null);
      setShowRestoreModal({ isOpen: false, backupNome: null });
    }
  };

  const limparBackupsAntigos = async () => {
    setShowCleanModal(false);
    setMessage(null);

    try {
      console.log('Enviando requisição para limpar backups com dias:', config.retencaoDias);
      
      const res = await fetch(getApiUrl('/backups/limpar'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ dias: config.retencaoDias })
      });
      
      const data = await res.json();
      console.log('Resposta da limpeza:', data);

      if (data.success) {
        setMessage({ type: 'success', text: data.message || `${data.removidos || 0} backups removidos com sucesso!` });
        carregarStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao limpar backups' });
      }
    } catch (error) {
      console.error('Erro ao limpar backups:', error);
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
    }
  };

  const salvarConfig = async () => {
    try {
      const res = await fetch(getApiUrl('/backups/configurar'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Configuração salva com sucesso!' });
        setShowConfig(false);
        carregarStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao salvar configuração' });
      }
    } catch (error) {
      console.error('Erro:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configuração' });
    }
  };

  const handleRestoreClick = (nome: string) => {
    setShowRestoreModal({ isOpen: true, backupNome: nome });
  };

  const handleCleanClick = () => {
    setShowCleanModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={showCleanModal}
        onClose={() => setShowCleanModal(false)}
        onConfirm={limparBackupsAntigos}
        title="Limpar Backups Antigos"
        message={`Tem certeza que deseja remover todos os backups com mais de ${config.retencaoDias} dias? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Remover"
        cancelText="Cancelar"
        type="danger"
      />

      <ConfirmModal
        isOpen={showRestoreModal.isOpen}
        onClose={() => setShowRestoreModal({ isOpen: false, backupNome: null })}
        onConfirm={() => showRestoreModal.backupNome && restaurarBackup(showRestoreModal.backupNome)}
        title="Restaurar Backup"
        message={`ATENÇÃO: Restaurar o backup "${showRestoreModal.backupNome}" irá substituir TODOS os dados atuais. Esta ação não pode ser desfeita! Tem certeza que deseja continuar?`}
        confirmText="Sim, Restaurar"
        cancelText="Cancelar"
        type="danger"
      />

      {message && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-4"><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm">Total Backups</p>
              <p className="text-3xl font-bold">{status?.estatisticas.totalBackups || 0}</p>
            </div>
            <Database size={28} className="text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm">Espaço Usado</p>
              <p className="text-3xl font-bold">{status?.estatisticas.espacoUsado || '0 MB'}</p>
            </div>
            <HardDrive size={28} className="text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 text-sm">Último Backup</p>
              <p className="text-lg font-bold">
                {status?.ultimoBackup?.data ? new Date(status.ultimoBackup.data).toLocaleDateString('pt-AO') : 'Nunca'}
              </p>
            </div>
            <Clock size={28} className="text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-100 text-sm">Retenção</p>
              <p className="text-3xl font-bold">{config.retencaoDias} dias</p>
            </div>
            <Trash2 size={28} className="text-orange-200" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={gerarBackup} disabled={gerando} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
          {gerando ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
          {gerando ? 'Gerando...' : 'Gerar Backup Agora'}
        </button>
        <button onClick={() => setShowConfig(!showConfig)} className="flex items-center gap-2 bg-gray-600 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors">
          <Settings size={18} /> Configurar Backup
        </button>
        <button onClick={handleCleanClick} className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition-colors">
          <Trash2 size={18} /> Limpar Backups Antigos
        </button>
      </div>

      {showConfig && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Settings size={18} /> Configuração de Backup Automático
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
              <input type="time" value={config.horario} onChange={(e) => setConfig({ ...config, horario: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
              <select value={config.frequencia} onChange={(e) => setConfig({ ...config, frequencia: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dias de Retenção</label>
              <input type="number" min="1" max="365" value={config.retencaoDias} onChange={(e) => setConfig({ ...config, retencaoDias: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" checked={config.ativo} onChange={(e) => setConfig({ ...config, ativo: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded" />
                Ativar Backup Automático
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setShowConfig(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={salvarConfig} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Salvar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="font-semibold text-lg flex items-center gap-2"><Database size={18} /> Backups Disponíveis</h3>
        </div>
        {status?.backupsDisponiveis && status.backupsDisponiveis.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Arquivo</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Data</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Tamanho</th>
                  <th className="p-3 text-center text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {status.backupsDisponiveis.map((backup, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 text-sm font-mono break-all">{backup.nome}</td>
                    <td className="p-3 text-sm whitespace-nowrap">{backup.dataFormatada}</td>
                    <td className="p-3 text-sm whitespace-nowrap">{backup.tamanhoFormatado}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => baixarBackup(backup.nome)}
                          disabled={baixando === backup.nome}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                          title="Baixar"
                        >
                          {baixando === backup.nome ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                        </button>
                        <button
                          onClick={() => handleRestoreClick(backup.nome)}
                          disabled={restaurando === backup.nome}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                          title="Restaurar"
                        >
                          {restaurando === backup.nome ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Database size={48} className="mx-auto mb-3 text-gray-300" />
            <p>Nenhum backup disponível</p>
            <button onClick={gerarBackup} className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm">Gerar primeiro backup</button>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500 border">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={14} />
          <span className="font-medium">Informações de Segurança</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Backups são armazenados localmente no servidor</li>
          <li>Todas as operações de backup/restauração são registradas em log fiscal</li>
          <li>Antes de restaurar, um backup automático é criado para segurança</li>
          <li>Apenas usuários com perfil ADMIN podem gerenciar backups</li>
        </ul>
      </div>
    </div>
  );
}

// ========== COMPONENTE PRINCIPAL COM AS DUAS ABAS ==========
export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'relatorios' | 'backups'>('relatorios');

  const fetchRelatorios = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      const url = `/relatorios${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(getApiUrl(url), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Erro ao carregar relatórios');
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Erro:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'relatorios') fetchRelatorios();
  }, [dataInicio, dataFim, activeTab]);

  const limparFiltros = () => { setDataInicio(''); setDataFim(''); };
  const formatarValor = (valor: number) => !valor && valor !== 0 ? '0 Kz' : valor.toLocaleString('pt-AO') + ' Kz';
  const formatarNumero = (valor: number) => !valor && valor !== 0 ? '0' : valor.toLocaleString('pt-AO');
  const formatarPercentual = (valor: number) => !valor && valor !== 0 ? '0%' : valor.toFixed(1) + '%';

  const exportToExcel = () => {
    if (!data) return;
    setExporting(true);
    try {
      const workbookData = [
        { sheet: 'Resumo', data: [['Métrica', 'Valor'], ['Total Faturado', formatarValor(data.resumo?.totalFaturado || 0)], ['Total de Vendas', formatarNumero(data.resumo?.totalVendas || 0)], ['Ticket Médio', formatarValor(data.resumo?.ticketMedio || 0)], ['Total Clientes', formatarNumero(data.resumo?.totalClientes || 0)], ['Total Produtos', formatarNumero(data.resumo?.totalProdutos || 0)]] },
        { sheet: 'Vendas Mensais', data: (data.vendasMensais || []).map((v: any) => ({ Mês: v.mes, 'Valor Total (Kz)': v.total, Quantidade: v.quantidade })) },
        { sheet: 'Produtos Mais Vendidos', data: (data.produtosMaisVendidos || []).map((p: any) => ({ Produto: p.nome, Quantidade: p.quantidade, 'Total (Kz)': p.total })) },
        { sheet: 'Top Clientes', data: (data.clientesTop || []).map((c: any) => ({ Cliente: c.nome, 'Nº Compras': c.totalCompras, 'Valor Total (Kz)': c.valorTotal, 'Ticket Médio': formatarValor(c.valorTotal / (c.totalCompras || 1)) })) },
        { sheet: 'Formas de Pagamento', data: (data.pagamentosPorForma || []).map((p: any) => ({ 'Forma de Pagamento': p.forma, 'Total (Kz)': p.total, Percentual: p.percentual?.toFixed(1) + '%' })) },
        { sheet: 'Vendas por Categoria', data: (data.vendasPorCategoria || []).map((c: any) => ({ Categoria: c.categoria, 'Total (Kz)': c.total })) }
      ];
      const wb = XLSX.utils.book_new();
      workbookData.forEach(({ sheet, data }) => { const ws = XLSX.utils.json_to_sheet(data); ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }]; XLSX.utils.book_append_sheet(wb, ws, sheet); });
      XLSX.writeFile(wb, `relatorio_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) { console.error('Erro ao exportar Excel:', err); alert('Erro ao gerar arquivo Excel'); } finally { setExporting(false); }
  };

  const renderRelatorios = () => {
    if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    if (error) return <div className="bg-white rounded-xl shadow-lg p-8 text-center"><AlertCircle className="text-red-600 mx-auto mb-4" size={48} /><p className="text-gray-500 mb-4">{error}</p><button onClick={fetchRelatorios} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Tentar novamente</button></div>;
    if (!data) return null;

    return (
      <>
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-2 mb-4"><Filter size={18} /><h2 className="font-semibold">Filtros de Período</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="border rounded-lg px-3 py-2" placeholder="Data Início" />
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="border rounded-lg px-3 py-2" placeholder="Data Fim" />
            <button onClick={limparFiltros} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"><X size={16} className="inline mr-1" /> Limpar</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500"><div className="flex justify-between"><div><p className="text-gray-500 text-sm">Total Faturado</p><p className="text-2xl font-bold text-blue-600">{formatarValor(data.resumo?.totalFaturado)}</p></div><DollarSign className="text-blue-500" size={28} /></div></div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500"><div className="flex justify-between"><div><p className="text-gray-500 text-sm">Total de Vendas</p><p className="text-2xl font-bold text-green-600">{formatarNumero(data.resumo?.totalVendas)}</p></div><ShoppingCart className="text-green-500" size={28} /></div></div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500"><div className="flex justify-between"><div><p className="text-gray-500 text-sm">Ticket Médio</p><p className="text-2xl font-bold text-purple-600">{formatarValor(data.resumo?.ticketMedio)}</p></div><TrendingUp className="text-purple-500" size={28} /></div></div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-500"><div className="flex justify-between"><div><p className="text-gray-500 text-sm">Total Clientes</p><p className="text-2xl font-bold text-orange-600">{formatarNumero(data.resumo?.totalClientes)}</p></div><Users className="text-orange-500" size={28} /></div></div>
        </div>

        {data.vendasMensais?.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="font-semibold text-lg mb-6 flex items-center gap-2"><BarChart3 size={20} /> Vendas Mensais</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.vendasMensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value: any, name?: string) => name === 'total' ? formatarValor(value) : formatarNumero(value)} />
                <Legend />
                <Bar yAxisId="left" dataKey="total" name="Valor Total (Kz)" fill="#3b82f6" />
                <Bar yAxisId="right" dataKey="quantidade" name="Quantidade" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {data.vendasPorCategoria?.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="font-semibold text-lg mb-6 flex items-center gap-2"><PieChart size={20} /> Vendas por Categoria</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie data={data.vendasPorCategoria} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="total" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                    {data.vendasPorCategoria.map((_: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatarValor(value)} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          )}
          {data.pagamentosPorForma?.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="font-semibold text-lg mb-6 flex items-center gap-2"><CreditCard size={20} /> Formas de Pagamento</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie data={data.pagamentosPorForma} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="total" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                    {data.pagamentosPorForma.map((_: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[(i + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatarValor(value)} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {data.produtosMaisVendidos?.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="px-6 py-4 bg-blue-50 border-b"><h2 className="font-semibold flex items-center gap-2"><Package size={20} /> Produtos Mais Vendidos</h2></div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr><th className="p-3 text-left">Produto</th><th className="p-3 text-center">Qtd</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">%</th></tr>
              </thead>
              <tbody>
                {data.produtosMaisVendidos.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-3">{p.nome}</td>
                    <td className="p-3 text-center">{formatarNumero(p.quantidade)}</td>
                    <td className="p-3 text-right text-green-600">{formatarValor(p.total)}</td>
                    <td className="p-3 text-right text-gray-500">{formatarPercentual((p.total / (data.resumo?.totalFaturado || 1)) * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.clientesTop?.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b"><h2 className="font-semibold flex items-center gap-2"><Users size={20} /> Top Clientes</h2></div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr><th className="p-3 text-left">Cliente</th><th className="p-3 text-center">Compras</th><th className="p-3 text-right">Valor Total</th><th className="p-3 text-right">Ticket Médio</th></tr>
              </thead>
              <tbody>
                {data.clientesTop.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-3">{c.nome}</td>
                    <td className="p-3 text-center">{formatarNumero(c.totalCompras)}</td>
                    <td className="p-3 text-right text-green-600">{formatarValor(c.valorTotal)}</td>
                    <td className="p-3 text-right text-gray-500">{formatarValor(c.valorTotal / (c.totalCompras || 1))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2"><FileBarChart size={28} /> Relatórios e Backups</h1>
              <p className="text-indigo-100 mt-1">Análise de dados e gestão de segurança da base de dados</p>
            </div>
            {activeTab === 'relatorios' && (
              <button onClick={exportToExcel} disabled={exporting} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                <FileSpreadsheet size={18} className="inline mr-1" /> {exporting ? 'Exportando...' : 'Exportar Excel'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6 border-b bg-white rounded-t-xl px-4">
          <button onClick={() => setActiveTab('relatorios')} className={`px-5 py-3 font-medium transition-all flex items-center gap-2 ${activeTab === 'relatorios' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700'}`}>
            <FileBarChart size={18} /> Relatórios Fiscais
          </button>
          <button onClick={() => setActiveTab('backups')} className={`px-5 py-3 font-medium transition-all flex items-center gap-2 ${activeTab === 'backups' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700'}`}>
            <Database size={18} /> Backup da Base de Dados
          </button>
        </div>

        {activeTab === 'relatorios' ? renderRelatorios() : <BackupManager />}

        {activeTab === 'relatorios' && (
          <div className="mt-6 text-center text-xs text-gray-400">
            Última atualização: {lastUpdate.toLocaleString('pt-AO')}
          </div>
        )}
      </div>
    </div>
  );
}