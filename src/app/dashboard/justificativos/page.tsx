'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText, Search, Printer, Plus, X, Edit, Trash2,
  Calendar, User, Stethoscope, AlertCircle, CheckCircle,
  ChevronLeft, ChevronRight, Clock, FileWarning
} from 'lucide-react';

interface Paciente {
  id: number;
  nome: string;
  telefone?: string;
  nif?: string;
  email?: string;
}

interface Justificativo {
  id: number;
  numero_justificativo: string;
  paciente_id: number;
  consulta_id?: number;
  atendimento_id?: number;
  optometrista_id: number;
  data_emissao: string;
  data_inicio_ausencia: string;
  data_fim_ausencia: string;
  motivo: string;
  diagnostico?: string;
  recomendacoes?: string;
  cid_code?: string;
  status: 'ativo' | 'cancelado' | 'expirado';
  paciente?: Paciente;
  optometrista?: { id: number; nome: string };
}

const ITEMS_PER_PAGE = 10;

export default function JustificativosPage() {
  const { user } = useAuth();
  const [justificativos, setJustificativos] = useState<Justificativo[]>([]);
  const [filteredJustificativos, setFilteredJustificativos] = useState<Justificativo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Justificativo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSearchTerm, setPacienteSearchTerm] = useState('');
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
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
    paciente_id: '',
    consulta_id: '',
    atendimento_id: '',
    data_inicio_ausencia: '',
    data_fim_ausencia: '',
    motivo: '',
    diagnostico: '',
    recomendacoes: '',
    cid_code: ''
  });

  const userPerfil = user?.perfil?.toLowerCase() || '';
  const isAdmin = userPerfil === 'admin';
  const isOptometrista = userPerfil === 'optometrista';
  const canEdit = isAdmin || isOptometrista;

  // Filtrar pacientes baseado no termo de busca
  const filteredPacientes = pacientes.filter(paciente => {
    const searchLower = pacienteSearchTerm.toLowerCase();
    return (
      paciente.nome.toLowerCase().includes(searchLower) ||
      (paciente.nif && paciente.nif.toLowerCase().includes(searchLower))
    );
  });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    filtrarJustificativos();
  }, [searchTerm, justificativos]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarJustificativos(),
        carregarPacientes()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarJustificativos = async () => {
    try {
      const res = await fetch(getApiUrl('/justificativos-medicos'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setJustificativos(data);
        setFilteredJustificativos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar justificativos:', error);
    }
  };

  const carregarPacientes = async () => {
    try {
      const res = await fetch(getApiUrl('/pacientes'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setPacientes(data.data || data);
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    }
  };

  const filtrarJustificativos = () => {
    if (!searchTerm.trim()) {
      setFilteredJustificativos(justificativos);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = justificativos.filter(j =>
        j.numero_justificativo.toLowerCase().includes(term) ||
        j.paciente?.nome.toLowerCase().includes(term) ||
        j.paciente?.nif?.toLowerCase().includes(term) ||
        j.motivo.toLowerCase().includes(term)
      );
      setFilteredJustificativos(filtered);
    }
    setCurrentPage(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePacienteSelect = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setFormData(prev => ({ ...prev, paciente_id: String(paciente.id) }));
    setPacienteSearchTerm(`${paciente.nome}${paciente.nif ? ` - ${paciente.nif}` : ''}`);
    setShowPacienteDropdown(false);
  };

  const resetForm = () => {
    setFormData({
      paciente_id: '',
      consulta_id: '',
      atendimento_id: '',
      data_inicio_ausencia: '',
      data_fim_ausencia: '',
      motivo: '',
      diagnostico: '',
      recomendacoes: '',
      cid_code: ''
    });
    setSelectedPaciente(null);
    setPacienteSearchTerm('');
    setEditando(null);
  };

  const abrirModalCriar = () => {
    resetForm();
    setModalOpen(true);
  };

  const abrirModalEditar = (justificativo: Justificativo) => {
    setEditando(justificativo);
    const paciente = pacientes.find(p => p.id === justificativo.paciente_id);
    if (paciente) {
      setSelectedPaciente(paciente);
      setPacienteSearchTerm(`${paciente.nome}${paciente.nif ? ` - ${paciente.nif}` : ''}`);
    }
    setFormData({
      paciente_id: String(justificativo.paciente_id),
      consulta_id: justificativo.consulta_id ? String(justificativo.consulta_id) : '',
      atendimento_id: justificativo.atendimento_id ? String(justificativo.atendimento_id) : '',
      data_inicio_ausencia: justificativo.data_inicio_ausencia.split('T')[0],
      data_fim_ausencia: justificativo.data_fim_ausencia.split('T')[0],
      motivo: justificativo.motivo,
      diagnostico: justificativo.diagnostico || '',
      recomendacoes: justificativo.recomendacoes || '',
      cid_code: justificativo.cid_code || ''
    });
    setModalOpen(true);
  };

  const salvarJustificativo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paciente_id) {
      mostrarMensagem('error', 'Selecione um paciente');
      return;
    }

    if (!formData.data_inicio_ausencia || !formData.data_fim_ausencia) {
      mostrarMensagem('error', 'Informe as datas de início e fim da ausência');
      return;
    }

    if (!formData.motivo) {
      mostrarMensagem('error', 'Informe o motivo da ausência');
      return;
    }

    setSubmitting(true);

    try {
      const url = editando
        ? `/justificativos-medicos/${editando.id}`
        : '/justificativos-medicos';
      const method = editando ? 'PUT' : 'POST';

      const res = await fetch(getApiUrl(url), {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: Number(formData.paciente_id),
          consulta_id: formData.consulta_id ? Number(formData.consulta_id) : null,
          atendimento_id: formData.atendimento_id ? Number(formData.atendimento_id) : null,
          data_inicio_ausencia: formData.data_inicio_ausencia,
          data_fim_ausencia: formData.data_fim_ausencia,
          motivo: formData.motivo,
          diagnostico: formData.diagnostico || null,
          recomendacoes: formData.recomendacoes || null,
          cid_code: formData.cid_code || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar justificativo');

      mostrarMensagem('success', editando ? 'Justificativo atualizado!' : 'Justificativo criado com sucesso!');
      setModalOpen(false);
      resetForm();
      await carregarJustificativos();

    } catch (error) {
      console.error(error);
      mostrarMensagem('error', error instanceof Error ? error.message : 'Erro ao salvar justificativo');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmarCancelar = (justificativo: Justificativo) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancelar Justificativo',
      message: `Tem certeza que deseja cancelar o justificativo ${justificativo.numero_justificativo}?`,
      onConfirm: () => cancelarJustificativo(justificativo.id)
    });
  };

  const cancelarJustificativo = async (id: number) => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    try {
      const res = await fetch(getApiUrl(`/justificativos-medicos/${id}/cancelar`), {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao cancelar justificativo');
      }

      mostrarMensagem('success', 'Justificativo cancelado com sucesso!');
      await carregarJustificativos();

    } catch (error) {
      console.error(error);
      mostrarMensagem('error', error instanceof Error ? error.message : 'Erro ao cancelar justificativo');
    }
  };

  const imprimirJustificativo = (justificativo: Justificativo) => {
    const empresaNome = 'Óptica';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Justificativo Médico - ${justificativo.numero_justificativo}</title>
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
            td { padding: 5px; vertical-align: top; }
            .assinatura { margin-top: 40px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
            .rodape { margin-top: 30px; text-align: center; font-size: 10px; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>${empresaNome}</h1></div>
            <div class="titulo">JUSTIFICATIVO MÉDICO</div>
            <div class="info"><strong>Nº:</strong> ${justificativo.numero_justificativo}<br><strong>Data de Emissão:</strong> ${new Date(justificativo.data_emissao).toLocaleDateString('pt-AO')}</div>
            <table>
              <tr><td style="width:150px;"><strong>Paciente:</strong></td><td>${justificativo.paciente?.nome || '-'}</td></tr>
              ${justificativo.paciente?.nif ? `<tr><td><strong>NIF:</strong></td><td>${justificativo.paciente.nif}</td></tr>` : ''}
              <tr><td><strong>Período de Ausência:</strong></td><td>${new Date(justificativo.data_inicio_ausencia).toLocaleDateString('pt-AO')} a ${new Date(justificativo.data_fim_ausencia).toLocaleDateString('pt-AO')}</td></tr>
              <tr><td><strong>Motivo:</strong></td><td>${justificativo.motivo}</td></tr>
              ${justificativo.diagnostico ? `<tr><td><strong>Diagnóstico:</strong></td><td>${justificativo.diagnostico}</td></tr>` : ''}
              ${justificativo.cid_code ? `<tr><td><strong>CID:</strong></td><td>${justificativo.cid_code}</td></tr>` : ''}
              ${justificativo.recomendacoes ? `<tr><td><strong>Recomendações:</strong></td><td>${justificativo.recomendacoes}</td></tr>` : ''}
            </table>
            <div class="assinatura"><p>_________________________________</p><p>${justificativo.optometrista?.nome || 'Optometrista'}</p><p>Optometrista / Médico</p></div>
            <div class="rodape"><p>Documento emitido eletronicamente - Válido para fins de justificativa de ausência</p></div>
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
      case 'ativo': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle size={12} /> Ativo</span>;
      case 'cancelado': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><X size={12} /> Cancelado</span>;
      case 'expirado': return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><Clock size={12} /> Expirado</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  const totalPages = Math.ceil(filteredJustificativos.length / ITEMS_PER_PAGE);
  const paginatedData = filteredJustificativos.slice(
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
              <FileWarning size={28} className="text-indigo-600" />
              Justificativos Médicos
            </h1>
            <p className="text-gray-500 mt-1">Gestão de justificativos de ausência por motivos de saúde</p>
          </div>
          {canEdit && (
            <button onClick={abrirModalCriar} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors">
              <Plus size={18} /> Novo Justificativo
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
              placeholder="Pesquisar por número, paciente, NIF ou motivo..."
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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nº Justificativo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Paciente</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Período</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Motivo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        Nenhum justificativo encontrado
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((j) => (
                      <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono">{j.numero_justificativo}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-800">{j.paciente?.nome || '-'}</p>
                            {j.paciente?.nif && <p className="text-xs text-gray-400">NIF: {j.paciente.nif}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(j.data_inicio_ausencia).toLocaleDateString('pt-AO')}<br />
                          <span className="text-xs text-gray-400">até</span><br />
                          {new Date(j.data_fim_ausencia).toLocaleDateString('pt-AO')}
                        </td>
                        <td className="px-4 py-3 text-sm max-w-xs truncate">{j.motivo}</td>
                        <td className="px-4 py-3">{getStatusBadge(j.status)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => imprimirJustificativo(j)} className="text-blue-600 hover:text-blue-800 transition-colors p-1" title="Imprimir">
                              <Printer size={18} />
                            </button>
                            {canEdit && j.status === 'ativo' && (
                              <>
                                <button onClick={() => abrirModalEditar(j)} className="text-yellow-600 hover:text-yellow-800 transition-colors p-1" title="Editar">
                                  <Edit size={18} />
                                </button>
                                {isAdmin && (
                                  <button onClick={() => confirmarCancelar(j)} className="text-red-600 hover:text-red-800 transition-colors p-1" title="Cancelar">
                                    <Trash2 size={18} />
                                  </button>
                                )}
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

      {/* Modal de Criar/Editar Justificativo */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileWarning size={20} /> {editando ? 'Editar Justificativo' : 'Novo Justificativo'}
              </h2>
              <button onClick={() => { setModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={salvarJustificativo} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={pacienteSearchTerm}
                    onChange={(e) => {
                      setPacienteSearchTerm(e.target.value);
                      setShowPacienteDropdown(true);
                      setSelectedPaciente(null);
                      setFormData(prev => ({ ...prev, paciente_id: '' }));
                    }}
                    onFocus={() => setShowPacienteDropdown(true)}
                    placeholder="Pesquisar paciente por nome ou NIF..."
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                {showPacienteDropdown && pacienteSearchTerm && filteredPacientes.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredPacientes.map(paciente => (
                      <button
                        key={paciente.id}
                        type="button"
                        onClick={() => handlePacienteSelect(paciente)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                      >
                        <div className="font-medium text-gray-800">{paciente.nome}</div>
                        {paciente.nif && (
                          <div className="text-xs text-gray-500">NIF: {paciente.nif}</div>
                        )}
                        {paciente.telefone && (
                          <div className="text-xs text-gray-400">{paciente.telefone}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {showPacienteDropdown && pacienteSearchTerm && filteredPacientes.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500">
                    Nenhum paciente encontrado
                  </div>
                )}

                {selectedPaciente && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-blue-800">Paciente selecionado:</span>
                      <div className="text-sm text-blue-700">{selectedPaciente.nome}</div>
                      {selectedPaciente.nif && (
                        <div className="text-xs text-blue-600">NIF: {selectedPaciente.nif}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPaciente(null);
                        setPacienteSearchTerm('');
                        setFormData(prev => ({ ...prev, paciente_id: '' }));
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Início Ausência *</label>
                  <input
                    type="date"
                    name="data_inicio_ausencia"
                    value={formData.data_inicio_ausencia}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim Ausência *</label>
                  <input
                    type="date"
                    name="data_fim_ausencia"
                    value={formData.data_fim_ausencia}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
                <textarea
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Descreva o motivo da ausência..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                <textarea
                  name="diagnostico"
                  value={formData.diagnostico}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Diagnóstico médico (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recomendações</label>
                <textarea
                  name="recomendacoes"
                  value={formData.recomendacoes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Recomendações médicas (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código CID</label>
                <input
                  type="text"
                  name="cid_code"
                  value={formData.cid_code}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: H52.1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : (editando ? 'Atualizar' : 'Criar')}
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