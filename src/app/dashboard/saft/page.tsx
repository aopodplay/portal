'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import {
    FileText, Download, Calendar, Search, CheckCircle, AlertCircle, AlertTriangle,
    Settings, Building, Hash, TrendingUp, RefreshCw, Clock,
    Shield, X, Save, Eye, Printer, Send, Database, Code, Award, FileCheck, History,
    List, Plus, Edit2, Trash2
} from 'lucide-react';

interface MovimentoSAFT {
    id: number;
    tipo: 'geracao' | 'envio' | 'download';
    data_inicio: string;
    data_fim: string;
    arquivo_nome: string;
    arquivo_hash: string;
    tamanho_arquivo: number;
    status: 'sucesso' | 'erro' | 'processando';
    mensagem_erro?: string;
    usuario?: { id: number; nome: string };
    created_at: string;
}

interface ConfigFiscal {
    empresa_nome: string;
    empresa_nif: string;
    empresa_morada: string;
    regime_iva: 'geral' | 'isento' | 'nao_sujeito';
    codigo_atividade: string;
    serie_fatura_padrao: string;
    serie_recibo_padrao: string;
    serie_proforma_padrao: string;
    saf_t_tipo: 'mensal' | 'trimestral' | 'anual';
    taxa_iva_padrao: number;
    certificado_software: string;
    numero_licenca_software: string;
    ultima_geracao_saf_t?: string;
}

interface LogFiscal {
    id: number;
    tipo_evento: 'criacao_fatura' | 'anulacao_fatura' | 'geracao_saft' | 'envio_agt' | 'erro_validacao';
    entidade_id: number | null;
    entidade_tipo: string | null;
    dados_antes: any;
    dados_depois: any;
    mensagem: string;
    usuario: { id: number; nome: string } | null;
    ip_origem: string | null;
    created_at: string;
}

interface SerieDocumento {
    id: number;
    tipo_documento: string;
    serie: string;
    descricao: string | null;
    proximo_numero: number;
    ativa: boolean;
    ano_fiscal: number | null;
    numero_digitos: number;
    prefixo: string | null;
    sufixo: string | null;
}

export default function SAFTPage() {
    const [loading, setLoading] = useState(false);
    const [movimentos, setMovimentos] = useState<MovimentoSAFT[]>([]);
    const [configFiscal, setConfigFiscal] = useState<ConfigFiscal | null>(null);
    const [logsFiscais, setLogsFiscais] = useState<LogFiscal[]>([]);
    const [series, setSeries] = useState<SerieDocumento[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [periodo, setPeriodo] = useState({ mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [activeTab, setActiveTab] = useState<'saft' | 'series'>('saft');
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showHashModal, setShowHashModal] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [showLogDetailModal, setShowLogDetailModal] = useState(false);
    const [showSerieModal, setShowSerieModal] = useState(false);
    const [selectedHash, setSelectedHash] = useState('');
    const [selectedArquivo, setSelectedArquivo] = useState('');
    const [selectedLog, setSelectedLog] = useState<LogFiscal | null>(null);
    const [editingSerie, setEditingSerie] = useState<SerieDocumento | null>(null);
    const [warningMessage, setWarningMessage] = useState('');
    const [filtroLogEvento, setFiltroLogEvento] = useState('todos');
    const [serieForm, setSerieForm] = useState({
        tipo_documento: 'fatura',
        serie: '',
        descricao: '',
        proximo_numero: 1,
        ativa: true,
        ano_fiscal: new Date().getFullYear(),
        numero_digitos: 6,
        prefixo: '',
        sufixo: ''
    });
    const [formConfig, setFormConfig] = useState({
        regime_iva: 'geral',
        codigo_atividade: '',
        serie_fatura_padrao: 'FT',
        serie_recibo_padrao: 'FR',
        serie_proforma_padrao: 'FP',
        saf_t_tipo: 'mensal',
        taxa_iva_padrao: 14,
        certificado_software: '',
        numero_licenca_software: '',
        empresa_nome: '',
        empresa_nif: '',
        empresa_morada: ''
    });

    const mostrarMensagem = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    // Buscar configurações fiscais
    const fetchConfigFiscal = useCallback(async () => {
        try {
            const res = await fetch(getApiUrl('/saft/configuracoes-fiscais'), { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setConfigFiscal(data);
                setFormConfig({
                    regime_iva: data.regime_iva || 'geral',
                    codigo_atividade: data.codigo_atividade || '',
                    serie_fatura_padrao: data.serie_fatura_padrao || 'FT',
                    serie_recibo_padrao: data.serie_recibo_padrao || 'FR',
                    serie_proforma_padrao: data.serie_proforma_padrao || 'FP',
                    saf_t_tipo: data.saf_t_tipo || 'mensal',
                    taxa_iva_padrao: data.taxa_iva_padrao || 14,
                    certificado_software: data.certificado_software || '',
                    numero_licenca_software: data.numero_licenca_software || '',
                    empresa_nome: data.empresa_nome || '',
                    empresa_nif: data.empresa_nif || '',
                    empresa_morada: data.empresa_morada || ''
                });
            }
        } catch (err) {
            console.error('Erro ao carregar configurações fiscais:', err);
        }
    }, []);

    // Buscar movimentos SAF-T
    const fetchMovimentos = useCallback(async () => {
        try {
            const res = await fetch(getApiUrl('/saft/movimentos'), { headers: getAuthHeaders() });
            const data = await res.json();
            setMovimentos(data);
        } catch (err) {
            console.error('Erro ao carregar movimentos:', err);
        }
    }, []);

    // Buscar logs fiscais
    const fetchLogsFiscais = useCallback(async () => {
        try {
            const res = await fetch(getApiUrl('/saft/logs'), { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setLogsFiscais(data);
            }
        } catch (err) {
            console.error('Erro ao carregar logs fiscais:', err);
        }
    }, []);

    // Buscar séries de documentos
    const fetchSeries = useCallback(async () => {
        try {
            const res = await fetch(getApiUrl('/series-documentos'), { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setSeries(data.data || []);
            }
        } catch (err) {
            console.error('Erro ao carregar séries:', err);
        }
    }, []);

    // Gerar SAF-T
    const gerarSAFT = async () => {
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/saft/gerar'), {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mes: periodo.mes,
                    ano: periodo.ano
                })
            });

            if (res.status === 409) {
                const error = await res.json();
                setWarningMessage(error.warning || 'SAF-T já gerado para este período. Deseja regerar?');
                setSelectedArquivo(`SAFT_${configFiscal?.empresa_nif}_${periodo.ano}${String(periodo.mes).padStart(2, '0')}.xml`);
                setShowWarningModal(true);
                setLoading(false);
                return;
            }

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Erro ao gerar SAF-T');
            }

            const data = await res.json();
            mostrarMensagem('success', `SAF-T gerado com sucesso! ${data.arquivo}`);
            fetchMovimentos();
            fetchConfigFiscal();
            fetchLogsFiscais();
        } catch (err: any) {
            mostrarMensagem('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Regerar SAF-T
    const regerarSAFT = async () => {
        setShowWarningModal(false);
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/saft/gerar'), {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mes: periodo.mes,
                    ano: periodo.ano,
                    forcar: true
                })
            });

            const data = await res.json();
            mostrarMensagem('success', `SAF-T gerado com sucesso! ${data.arquivo}`);
            fetchMovimentos();
            fetchConfigFiscal();
            fetchLogsFiscais();
        } catch (err: any) {
            mostrarMensagem('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Download do arquivo
    const downloadSAFT = async (nomeArquivo: string) => {
        try {
            const token = localStorage.getItem('token');
            const url = getApiUrl(`/saft/download/${nomeArquivo}`);

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erro ao baixar arquivo');

            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = nomeArquivo;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            mostrarMensagem('success', 'Download iniciado');
            fetchLogsFiscais();
        } catch (err: any) {
            mostrarMensagem('error', err.message);
        }
    };

    // Mostrar modal do hash
    const mostrarHash = (hash: string, nomeArquivo: string) => {
        setSelectedHash(hash);
        setSelectedArquivo(nomeArquivo);
        setShowHashModal(true);
    };

    // Copiar hash para clipboard
    const copiarHash = async () => {
        try {
            await navigator.clipboard.writeText(selectedHash);
            mostrarMensagem('success', 'Hash copiado para área de transferência');
        } catch (err) {
            mostrarMensagem('error', 'Erro ao copiar hash');
        }
    };

    // Atualizar configurações fiscais
    const atualizarConfigFiscal = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/saft/configuracoes-fiscais'), {
                method: 'PUT',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(formConfig)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Erro ao atualizar configurações');
            }

            mostrarMensagem('success', 'Configurações fiscais atualizadas');
            setShowConfigModal(false);
            fetchConfigFiscal();
        } catch (err: any) {
            mostrarMensagem('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Salvar série
    const salvarSerie = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = editingSerie
                ? getApiUrl(`/series-documentos/${editingSerie.id}`)
                : getApiUrl('/series-documentos');
            const method = editingSerie ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(serieForm)
            });

            if (res.ok) {
                mostrarMensagem('success', editingSerie ? 'Série atualizada!' : 'Série criada!');
                setShowSerieModal(false);
                resetSerieForm();
                fetchSeries();
            } else {
                const error = await res.json();
                mostrarMensagem('error', error.error || 'Erro ao salvar série');
            }
        } catch (err: any) {
            mostrarMensagem('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Alternar status da série
    const toggleSerieStatus = async (serie: SerieDocumento) => {
        try {
            const res = await fetch(getApiUrl(`/series-documentos/${serie.id}`), {
                method: 'PUT',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...serie, ativa: !serie.ativa })
            });

            if (res.ok) {
                fetchSeries();
                mostrarMensagem('success', `Série ${serie.serie} ${!serie.ativa ? 'ativada' : 'desativada'}`);
            }
        } catch (err) {
            console.error('Erro ao alterar status:', err);
        }
    };

    // Excluir série
    const excluirSerie = async (id: number, serie: string) => {
        if (!confirm(`Tem certeza que deseja excluir a série "${serie}"?`)) return;

        try {
            const res = await fetch(getApiUrl(`/series-documentos/${id}`), {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (res.ok) {
                mostrarMensagem('success', 'Série excluída!');
                fetchSeries();
            } else {
                const error = await res.json();
                mostrarMensagem('error', error.error || 'Erro ao excluir série');
            }
        } catch (err) {
            console.error('Erro ao excluir:', err);
        }
    };

    // Reset formulário de série
    const resetSerieForm = () => {
        setEditingSerie(null);
        setSerieForm({
            tipo_documento: 'fatura',
            serie: '',
            descricao: '',
            proximo_numero: 1,
            ativa: true,
            ano_fiscal: new Date().getFullYear(),
            numero_digitos: 6,
            prefixo: '',
            sufixo: ''
        });
    };

    // Editar série
    const editarSerie = (serie: SerieDocumento) => {
        setEditingSerie(serie);
        setSerieForm({
            tipo_documento: serie.tipo_documento,
            serie: serie.serie,
            descricao: serie.descricao || '',
            proximo_numero: serie.proximo_numero,
            ativa: serie.ativa,
            ano_fiscal: serie.ano_fiscal || new Date().getFullYear(),
            numero_digitos: serie.numero_digitos || 6,
            prefixo: serie.prefixo || '',
            sufixo: serie.sufixo || ''
        });
        setShowSerieModal(true);
    };

    // Formatar tamanho do arquivo
    const formatFileSize = (bytes: number) => {
        if (!bytes) return '-';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // Formatar data
    const formatDateTime = (date: any) => {
        if (!date) return '-';
        try {
            let d;
            if (typeof date === 'string') {
                d = new Date(date.replace(' ', 'T'));
            } else {
                d = new Date(date);
            }
            if (isNaN(d.getTime())) return String(date);
            return d.toLocaleString('pt-AO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return String(date);
        }
    };

    const formatDateOnly = (date: string) => {
        if (!date) return '-';
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return date;
            return d.toLocaleDateString('pt-AO');
        } catch {
            return date;
        }
    };

    const formatPeriodo = (dataInicio: string, dataFim: string) => {
        if (!dataInicio || !dataFim) return '-';
        return `${formatDateOnly(dataInicio)} a ${formatDateOnly(dataFim)}`;
    };

    const getTipoLabel = (tipo: string) => {
        const tipos: Record<string, string> = {
            'fatura': 'Fatura',
            'fatura_proforma': 'Pró-Forma',
            'recibo': 'Recibo',
            'nota_credito': 'N. Crédito',
            'venda': 'Venda'
        };
        return tipos[tipo] || tipo;
    };

    const getEventoStyle = (tipo: string) => {
        switch (tipo) {
            case 'geracao_saft':
                return { bg: 'bg-green-100', text: 'text-green-800', icon: <FileText size={14} />, label: 'Geração SAF-T' };
            case 'envio_agt':
                return { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Send size={14} />, label: 'Envio AGT' };
            case 'criacao_fatura':
                return { bg: 'bg-purple-100', text: 'text-purple-800', icon: <FileText size={14} />, label: 'Criação Fatura' };
            case 'anulacao_fatura':
                return { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertCircle size={14} />, label: 'Anulação Fatura' };
            case 'erro_validacao':
                return { bg: 'bg-orange-100', text: 'text-orange-800', icon: <AlertCircle size={14} />, label: 'Erro Validação' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Info size={14} />, label: tipo };
        }
    };

    function Info(props: any) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        );
    }

    function User(props: any) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        );
    }

    function Copy(props: any) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        );
    }

    const logsFiltrados = logsFiscais.filter(log => {
        if (filtroLogEvento === 'todos') return true;
        return log.tipo_evento === filtroLogEvento;
    });

    const verDetalhesLog = (log: LogFiscal) => {
        setSelectedLog(log);
        setShowLogDetailModal(true);
    };

    const tiposEventoLog = [
        { value: 'todos', label: 'Todos' },
        { value: 'geracao_saft', label: 'Geração SAF-T' },
        { value: 'envio_agt', label: 'Envio AGT' },
        { value: 'criacao_fatura', label: 'Criação Fatura' },
        { value: 'anulacao_fatura', label: 'Anulação Fatura' },
        { value: 'erro_validacao', label: 'Erro Validação' }
    ];

    const tiposDocumento = [
        { value: 'fatura', label: 'Fatura' },
        { value: 'fatura_proforma', label: 'Fatura Pró-Forma' },
        { value: 'recibo', label: 'Recibo' },
        { value: 'nota_credito', label: 'Nota de Crédito' },
        { value: 'venda', label: 'Venda' }
    ];

    const movimentosFiltrados = movimentos.filter(m => {
        if (filtroStatus === 'todos') return true;
        return m.status === filtroStatus;
    });

    const meses = [
        { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
        { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
        { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
        { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
        { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
    ];

    useEffect(() => {
        fetchConfigFiscal();
        fetchMovimentos();
        fetchLogsFiscais();
        fetchSeries();
    }, [fetchConfigFiscal, fetchMovimentos, fetchLogsFiscais, fetchSeries]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
                <div className="px-6 py-5">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Shield size={28} /> SAF-T Fiscal Angola
                    </h1>
                    <p className="text-indigo-100 mt-1">
                        Geração e gestão do arquivo fiscal SAF-T para a AGT (Administração Geral Tributária)
                    </p>
                </div>
            </div>

            <div className="p-6">
                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'}`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Abas */}
                <div className="flex gap-2 mb-6 border-b bg-white rounded-t-xl px-4">
                    <button
                        onClick={() => setActiveTab('saft')}
                        className={`px-5 py-3 font-medium transition-all flex items-center gap-2 ${activeTab === 'saft' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileCheck size={18} /> SAF-T Fiscal
                    </button>
                    <button
                        onClick={() => setActiveTab('series')}
                        className={`px-5 py-3 font-medium transition-all flex items-center gap-2 ${activeTab === 'series' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Hash size={18} /> Séries de Documentos
                    </button>
                </div>

                {/* Conteúdo SAF-T */}
                {activeTab === 'saft' && (
                    <>
                        {/* Cards de Resumo */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-indigo-100 text-sm">Empresa</p>
                                        <p className="font-bold text-lg">{configFiscal?.empresa_nome || 'Não configurada'}</p>
                                        <p className="text-indigo-100 text-xs">NIF: {configFiscal?.empresa_nif || '-'}</p>
                                    </div>
                                    <Building size={32} className="text-indigo-200" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm">Regime IVA</p>
                                        <p className="font-bold text-lg">{configFiscal?.regime_iva === 'geral' ? 'Geral' : configFiscal?.regime_iva === 'isento' ? 'Isento' : 'Não Sujeito'}</p>
                                        <p className="text-green-100 text-xs">Taxa padrão: {configFiscal?.taxa_iva_padrao || 14}%</p>
                                    </div>
                                    <TrendingUp size={32} className="text-green-200" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-sm">Série FAT</p>
                                        <p className="font-bold text-2xl">{configFiscal?.serie_fatura_padrao || 'FT'}</p>
                                        <p className="text-purple-100 text-xs">Série padrão</p>
                                    </div>
                                    <Hash size={32} className="text-purple-200" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-orange-100 text-sm">Última Geração</p>
                                        <p className="font-bold text-sm">{configFiscal?.ultima_geracao_saf_t ? formatDateOnly(configFiscal.ultima_geracao_saf_t) : 'Nunca'}</p>
                                        <p className="text-orange-100 text-xs">Total: {movimentos.length} arquivos</p>
                                    </div>
                                    <Clock size={32} className="text-orange-200" />
                                </div>
                            </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
                                    <select
                                        value={periodo.mes}
                                        onChange={e => setPeriodo({ ...periodo, mes: Number(e.target.value) })}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                                    <input
                                        type="number"
                                        value={periodo.ano}
                                        onChange={e => setPeriodo({ ...periodo, ano: Number(e.target.value) })}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                        min={2020}
                                        max={2030}
                                    />
                                </div>
                                <button
                                    onClick={gerarSAFT}
                                    disabled={loading}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:bg-gray-400"
                                >
                                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <FileText size={18} />}
                                    {loading ? 'Gerando...' : 'Gerar SAF-T'}
                                </button>
                                <button
                                    onClick={() => setShowConfigModal(true)}
                                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <Settings size={18} /> Configurações
                                </button>
                                <button
                                    onClick={() => fetchMovimentos()}
                                    className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <RefreshCw size={18} /> Atualizar
                                </button>
                                <button
                                    onClick={() => {
                                        fetchLogsFiscais();
                                        setShowLogsModal(true);
                                    }}
                                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                                >
                                    <History size={18} /> Logs Fiscais
                                </button>
                            </div>
                        </div>

                        {/* Histórico de Movimentos */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center flex-wrap gap-3">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Database size={20} className="text-indigo-600" />
                                    Histórico de Movimentos SAF-T
                                </h2>
                                <div className="flex gap-2">
                                    <select
                                        value={filtroStatus}
                                        onChange={e => setFiltroStatus(e.target.value)}
                                        className="border rounded-lg px-3 py-1 text-sm"
                                    >
                                        <option value="todos">Todos</option>
                                        <option value="sucesso">Sucesso</option>
                                        <option value="erro">Erro</option>
                                        <option value="processando">Processando</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3 text-left">Data Geração</th>
                                            <th className="p-3 text-left">Período</th>
                                            <th className="p-3 text-left">Arquivo</th>
                                            <th className="p-3 text-left">Tamanho</th>
                                            <th className="p-3 text-left">Status</th>
                                            <th className="p-3 text-left">Usuário</th>
                                            <th className="p-3 text-left">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movimentosFiltrados.map(m => (
                                            <tr key={m.id} className="border-t hover:bg-gray-50">
                                                <td className="p-3 text-sm">{formatDateTime(m.created_at)}</td>
                                                <td className="p-3 text-sm">{formatPeriodo(m.data_inicio, m.data_fim)}</td>
                                                <td className="p-3 text-sm font-mono">{m.arquivo_nome?.substring(0, 40)}...</td>
                                                <td className="p-3 text-sm">{formatFileSize(m.tamanho_arquivo)}</td>
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                                                        ${m.status === 'sucesso' ? 'bg-green-100 text-green-800' :
                                                            m.status === 'erro' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'}`}>
                                                        {m.status === 'sucesso' && <CheckCircle size={12} />}
                                                        {m.status === 'erro' && <AlertCircle size={12} />}
                                                        {m.status === 'processando' && <RefreshCw size={12} className="animate-spin" />}
                                                        {m.status === 'sucesso' ? 'Sucesso' : m.status === 'erro' ? 'Erro' : 'Processando'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-sm">{m.usuario?.nome || '-'}</td>
                                                <td className="p-3">
                                                    <div className="flex gap-2">
                                                        {m.status === 'sucesso' && m.arquivo_nome && (
                                                            <button
                                                                onClick={() => downloadSAFT(m.arquivo_nome)}
                                                                className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                                                title="Download"
                                                            >
                                                                <Download size={18} />
                                                            </button>
                                                        )}
                                                        {m.arquivo_hash && (
                                                            <button
                                                                onClick={() => mostrarHash(m.arquivo_hash, m.arquivo_nome)}
                                                                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                                                                title="Ver Hash"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {movimentosFiltrados.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-gray-500">
                                                    <FileText size={48} className="mx-auto mb-3 text-gray-400" />
                                                    Nenhum movimento SAF-T encontrado
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <div className="flex items-start gap-3">
                                <Shield size={20} className="text-blue-600 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Sobre o SAF-T (Standard Audit File for Tax)</p>
                                    <p>O SAF-T é um formato padronizado para auditoria fiscal exigido pela AGT de Angola.</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Conteúdo Séries de Documentos */}
                {activeTab === 'series' && (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Hash size={20} className="text-indigo-600" />
                                Gestão de Séries de Documentos
                            </h2>
                            <button
                                onClick={() => {
                                    resetSerieForm();
                                    setShowSerieModal(true);
                                }}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                            >
                                <Plus size={18} /> Nova Série
                            </button>
                        </div>

                        <div className="overflow-x-auto p-4">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Série</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Tipo</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Descrição</th>
                                        <th className="p-3 text-center text-sm font-semibold text-gray-600">Nº Atual</th>
                                        <th className="p-3 text-center text-sm font-semibold text-gray-600">Ano Fiscal</th>
                                        <th className="p-3 text-center text-sm font-semibold text-gray-600">Formato</th>
                                        <th className="p-3 text-center text-sm font-semibold text-gray-600">Status</th>
                                        <th className="p-3 text-center text-sm font-semibold text-gray-600">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {series.map((serie) => {
                                        const exemploNumero = `${serie.prefixo || ''}${serie.serie}${String(serie.proximo_numero).padStart(serie.numero_digitos, '0')}${serie.sufixo || ''}`;
                                        return (
                                            <tr key={serie.id} className="hover:bg-gray-50">
                                                <td className="p-3 text-sm font-mono font-bold">{serie.serie}</td>
                                                <td className="p-3 text-sm">{getTipoLabel(serie.tipo_documento)}</td>
                                                <td className="p-3 text-sm text-gray-600">{serie.descricao || '-'}</td>
                                                <td className="p-3 text-sm text-center">{serie.proximo_numero}</td>
                                                <td className="p-3 text-sm text-center">{serie.ano_fiscal || '-'}</td>
                                                <td className="p-3 text-sm text-center font-mono text-xs">{exemploNumero}</td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        onClick={() => toggleSerieStatus(serie)}
                                                        className={`px-2 py-1 rounded text-xs font-medium ${serie.ativa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                                                    >
                                                        {serie.ativa ? 'Ativa' : 'Inativa'}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => editarSerie(serie)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => excluirSerie(serie.id, serie.serie)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {series.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-gray-500">
                                                <Hash size={48} className="mx-auto mb-3 text-gray-300" />
                                                Nenhuma série cadastrada
                                                <p className="text-sm mt-2">Clique em "Nova Série" para criar a primeira</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Configurações Fiscais */}
            {showConfigModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Settings size={20} className="text-indigo-600" />
                                Configurações Fiscais SAF-T
                            </h2>
                            <button onClick={() => setShowConfigModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={atualizarConfigFiscal} className="p-6 space-y-4">
                            <div className="border-b pb-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Building size={18} className="text-indigo-600" />
                                    Dados da Empresa
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa *</label>
                                        <input type="text" value={formConfig.empresa_nome} onChange={e => setFormConfig({ ...formConfig, empresa_nome: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">NIF da Empresa *</label>
                                        <input type="text" value={formConfig.empresa_nif} onChange={e => setFormConfig({ ...formConfig, empresa_nif: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Morada da Empresa *</label>
                                        <input type="text" value={formConfig.empresa_morada} onChange={e => setFormConfig({ ...formConfig, empresa_morada: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                                    </div>
                                </div>
                            </div>

                            <div className="border-b pb-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <FileCheck size={18} className="text-indigo-600" />
                                    Configurações Fiscais
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Regime de IVA</label>
                                        <select value={formConfig.regime_iva} onChange={e => setFormConfig({ ...formConfig, regime_iva: e.target.value as any })} className="w-full border rounded-lg px-3 py-2">
                                            <option value="geral">Geral</option>
                                            <option value="isento">Isento</option>
                                            <option value="nao_sujeito">Não Sujeito</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de IVA Padrão (%)</label>
                                        <input type="number" step="0.01" value={formConfig.taxa_iva_padrao} onChange={e => setFormConfig({ ...formConfig, taxa_iva_padrao: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CAE (Código de Atividade)</label>
                                        <input type="text" value={formConfig.codigo_atividade} onChange={e => setFormConfig({ ...formConfig, codigo_atividade: e.target.value })} placeholder="Ex: 47770" className="w-full border rounded-lg px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de SAF-T</label>
                                        <select value={formConfig.saf_t_tipo} onChange={e => setFormConfig({ ...formConfig, saf_t_tipo: e.target.value as any })} className="w-full border rounded-lg px-3 py-2">
                                            <option value="mensal">Mensal</option>
                                            <option value="trimestral">Trimestral</option>
                                            <option value="anual">Anual</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowConfigModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                    {loading ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Série */}
            {showSerieModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold">{editingSerie ? 'Editar Série' : 'Nova Série'}</h2>
                            <button onClick={() => setShowSerieModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={salvarSerie} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                                    <select value={serieForm.tipo_documento} onChange={e => setSerieForm({ ...serieForm, tipo_documento: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                                        {tiposDocumento.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Série *</label>
                                    <input type="text" value={serieForm.serie} onChange={e => setSerieForm({ ...serieForm, serie: e.target.value.toUpperCase() })} placeholder="Ex: FT" maxLength={10} className="w-full border rounded-lg px-3 py-2 uppercase" required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input type="text" value={serieForm.descricao} onChange={e => setSerieForm({ ...serieForm, descricao: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nº Inicial</label>
                                    <input type="number" value={serieForm.proximo_numero} onChange={e => setSerieForm({ ...serieForm, proximo_numero: parseInt(e.target.value) })} min={1} className="w-full border rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ano Fiscal</label>
                                    <input type="number" value={serieForm.ano_fiscal} onChange={e => setSerieForm({ ...serieForm, ano_fiscal: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" placeholder="Opcional" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prefixo</label>
                                    <input type="text" value={serieForm.prefixo} onChange={e => setSerieForm({ ...serieForm, prefixo: e.target.value })} placeholder="Ex: A-" className="w-full border rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sufixo</label>
                                    <input type="text" value={serieForm.sufixo} onChange={e => setSerieForm({ ...serieForm, sufixo: e.target.value })} placeholder="Ex: /2025" className="w-full border rounded-lg px-3 py-2" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={serieForm.ativa} onChange={e => setSerieForm({ ...serieForm, ativa: e.target.checked })} id="ativa" />
                                <label htmlFor="ativa" className="text-sm font-medium text-gray-700">Série Ativa</label>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                                <p className="font-medium mb-1">Exemplo de formatação:</p>
                                <code className="bg-blue-100 px-2 py-1 rounded">
                                    {serieForm.prefixo || ''}{serieForm.serie || 'FT'}{String(serieForm.proximo_numero).padStart(serieForm.numero_digitos, '0')}{serieForm.sufixo || ''}
                                </code>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowSerieModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                    {editingSerie ? 'Salvar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Logs Fiscais */}
            {showLogsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                            <h2 className="text-xl font-bold flex items-center gap-2"><History size={20} className="text-indigo-600" /> Logs Fiscais</h2>
                            <button onClick={() => setShowLogsModal(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 flex gap-3 items-center">
                                <label className="text-sm font-medium">Filtrar:</label>
                                <select value={filtroLogEvento} onChange={e => setFiltroLogEvento(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
                                    {tiposEventoLog.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr><th className="p-3 text-left">Data/Hora</th><th className="p-3 text-left">Evento</th><th className="p-3 text-left">Mensagem</th><th className="p-3 text-left">Usuário</th><th className="p-3 text-left">Detalhes</th></tr>
                                    </thead>
                                    <tbody>
                                        {logsFiltrados.map(log => {
                                            const estilo = getEventoStyle(log.tipo_evento);
                                            return (
                                                <tr key={log.id} className="border-t hover:bg-gray-50">
                                                    <td className="p-3 text-sm">{formatDateTime(log.created_at)}</td>
                                                    <td className="p-3"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${estilo.bg} ${estilo.text}`}>{estilo.icon}{estilo.label}</span></td>
                                                    <td className="p-3 text-sm">{log.mensagem}</td>
                                                    <td className="p-3 text-sm"><User size={14} className="inline mr-1" />{log.usuario?.nome || 'Sistema'}</td>
                                                    <td className="p-3"><button onClick={() => verDetalhesLog(log)} className="text-indigo-600 hover:text-indigo-800"><Eye size={18} /></button></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Detalhes do Log */}
            {showLogDetailModal && selectedLog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold">Detalhes do Log</h2>
                            <button onClick={() => setShowLogDetailModal(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                                <div><label className="text-xs text-gray-500">ID</label><p className="font-mono text-sm">{selectedLog.id}</p></div>
                                <div><label className="text-xs text-gray-500">Data/Hora</label><p className="text-sm">{formatDateTime(selectedLog.created_at)}</p></div>
                                <div><label className="text-xs text-gray-500">Tipo</label><p className="text-sm">{getEventoStyle(selectedLog.tipo_evento).label}</p></div>
                                <div><label className="text-xs text-gray-500">Usuário</label><p className="text-sm">{selectedLog.usuario?.nome || 'Sistema'}</p></div>
                                <div><label className="text-xs text-gray-500">IP</label><p className="text-sm font-mono">{selectedLog.ip_origem || '-'}</p></div>
                            </div>
                            <div><label className="text-xs text-gray-500">Mensagem</label><div className="bg-gray-50 rounded-lg p-3 text-sm">{selectedLog.mensagem}</div></div>
                            {selectedLog.dados_antes && <div><label className="text-xs text-gray-500">Dados Anteriores</label><pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto">{JSON.stringify(selectedLog.dados_antes, null, 2)}</pre></div>}
                            {selectedLog.dados_depois && <div><label className="text-xs text-gray-500">Dados Posteriores</label><pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto">{JSON.stringify(selectedLog.dados_depois, null, 2)}</pre></div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Hash */}
            {showHashModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold">Hash SHA-256</h2>
                            <button onClick={() => setShowHashModal(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-2">Arquivo: {selectedArquivo}</p>
                            <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm break-all">{selectedHash}</div>
                            <button onClick={copiarHash} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Copiar Hash</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Aviso */}
            {showWarningModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                        <div className="flex items-center gap-3 p-6 border-b">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"><AlertCircle size={20} className="text-amber-600" /></div>
                            <h2 className="text-xl font-bold">Aviso</h2>
                        </div>
                        <div className="p-6"><p className="text-gray-600">{warningMessage}</p></div>
                        <div className="flex gap-3 p-6 pt-0">
                            <button onClick={() => setShowWarningModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                            <button onClick={regerarSAFT} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg">Sim, Regerar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}