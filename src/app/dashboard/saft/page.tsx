'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import {
    FileText, Download, Calendar, Search, CheckCircle, AlertCircle, AlertTriangle,
    Settings, Building, Hash, TrendingUp, RefreshCw, Clock,
    Shield, X, Save, Eye, Printer, Send, Database
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
    certificado_software: boolean;
    ultima_geracao_saf_t?: string;
    taxa_iva_padrao?: number;
}

export default function SAFTPage() {
    const [loading, setLoading] = useState(false);
    const [movimentos, setMovimentos] = useState<MovimentoSAFT[]>([]);
    const [configFiscal, setConfigFiscal] = useState<ConfigFiscal | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [periodo, setPeriodo] = useState({ mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showHashModal, setShowHashModal] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [selectedHash, setSelectedHash] = useState('');
    const [selectedArquivo, setSelectedArquivo] = useState('');
    const [warningMessage, setWarningMessage] = useState('');
    const [formConfig, setFormConfig] = useState({
        regime_iva: 'geral',
        codigo_atividade: '',
        serie_fatura_padrao: 'FT',
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
        } catch (err: any) {
            mostrarMensagem('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Regerar SAF-T (forçar nova geração)
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

            /* if (!res.ok) {
              const error = await res.json();
              throw new Error(error.error || 'Erro ao gerar SAF-T');
            }
       */
            const data = await res.json();
            mostrarMensagem('success', `SAF-T gerado com sucesso! ${data.arquivo}`);
            fetchMovimentos();
            fetchConfigFiscal();
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

    // Formatar tamanho do arquivo
    const formatFileSize = (bytes: number) => {
        if (!bytes) return '-';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // Formatar data de forma robusta
    const formatDateTime = (date: any) => {
        if (!date) return '-';
        try {
            let d;
            if (typeof date === 'string') {
                // Se for string ISO ou YYYY-MM-DD HH:MM:SS
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

    // Formatar data apenas (sem hora)
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

    // Formatar período completo
    const formatPeriodo = (dataInicio: string, dataFim: string) => {
        if (!dataInicio || !dataFim) return '-';
        return `${formatDateOnly(dataInicio)} a ${formatDateOnly(dataFim)}`;
    };

    // Filtrar movimentos
    const movimentosFiltrados = movimentos.filter(m => {
        if (filtroStatus === 'todos') return true;
        return m.status === filtroStatus;
    });

    // Meses para select
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
    }, [fetchConfigFiscal, fetchMovimentos]);

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
                            <Settings size={18} />
                            Configurações Fiscais
                        </button>
                        <button
                            onClick={() => fetchMovimentos()}
                            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <RefreshCw size={18} />
                            Atualizar
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
                                            <p className="text-sm mt-2">Clique em "Gerar SAF-T" para criar o primeiro arquivo</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Informações adicionais */}
                <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                        <Shield size={20} className="text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Sobre o SAF-T (Standard Audit File for Tax)</p>
                            <p>O SAF-T é um formato padronizado para auditoria fiscal exigido pela AGT de Angola. O arquivo gerado segue o schema SAF-T PT 1.04 adaptado para a legislação angolana.</p>
                            <p className="mt-2 text-xs">Período de referência: O SAF-T deve ser gerado mensalmente e enviado à AGT até o dia 15 do mês seguinte.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmação de Regeneração */}
            {showWarningModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                        <div className="flex items-center gap-3 p-6 border-b">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertCircle size={20} className="text-amber-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Aviso</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 mb-4">{warningMessage}</p>
                            <p className="text-sm text-gray-500 mb-4">O arquivo atual será substituído.</p>
                        </div>
                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={() => setShowWarningModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={regerarSAFT}
                                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                            >
                                Sim, Regerar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal do Hash */}
            {showHashModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Hash size={20} className="text-indigo-600" />
                                Hash SHA-256
                            </h2>
                            <button onClick={() => setShowHashModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-2">Arquivo: {selectedArquivo}</p>
                            <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm break-all">
                                {selectedHash}
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                Este hash é único para este arquivo e pode ser usado para verificar sua integridade.
                            </p>
                        </div>
                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={copiarHash}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                            >
                                <Copy size={18} />
                                Copiar Hash
                            </button>
                            <button
                                onClick={() => setShowHashModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Configurações Fiscais */}
            {showConfigModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Settings size={20} className="text-indigo-600" />
                                Configurações Fiscais
                            </h2>
                            <button onClick={() => setShowConfigModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={atualizarConfigFiscal} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa *</label>
                                    <input
                                        type="text"
                                        value={formConfig.empresa_nome}
                                        onChange={e => setFormConfig({ ...formConfig, empresa_nome: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NIF da Empresa *</label>
                                    <input
                                        type="text"
                                        value={formConfig.empresa_nif}
                                        onChange={e => setFormConfig({ ...formConfig, empresa_nif: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Morada da Empresa *</label>
                                    <input
                                        type="text"
                                        value={formConfig.empresa_morada}
                                        onChange={e => setFormConfig({ ...formConfig, empresa_morada: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Regime de IVA</label>
                                    <select
                                        value={formConfig.regime_iva}
                                        onChange={e => setFormConfig({ ...formConfig, regime_iva: e.target.value as any })}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="geral">Geral</option>
                                        <option value="isento">Isento</option>
                                        <option value="nao_sujeito">Não Sujeito</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CAE (Código de Atividade)</label>
                                    <input
                                        type="text"
                                        value={formConfig.codigo_atividade}
                                        onChange={e => setFormConfig({ ...formConfig, codigo_atividade: e.target.value })}
                                        placeholder="Ex: 47770"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Série Padrão para Faturas</label>
                                    <input
                                        type="text"
                                        value={formConfig.serie_fatura_padrao}
                                        onChange={e => setFormConfig({ ...formConfig, serie_fatura_padrao: e.target.value.toUpperCase() })}
                                        placeholder="FT"
                                        maxLength={10}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-lg p-4 mt-4 border border-amber-200">
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                                    <div className="text-sm text-amber-800">
                                        <p className="font-medium mb-1">Informações importantes para o SAF-T</p>
                                        <p>Certifique-se de que os dados acima estão corretos, pois serão utilizados na geração do arquivo fiscal SAF-T conforme exigido pela AGT.</p>
                                        <p className="mt-1 text-xs">Taxa de IVA padrão: 14% (Angola) - Esta taxa é aplicada automaticamente no cálculo dos impostos.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowConfigModal(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                    {loading ? 'Salvando...' : 'Salvar Configurações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Componente Copy (se não tiver no lucide-react)
function Copy(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    );
}