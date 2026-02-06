'use client';
import { useEffect, useState } from 'react';
import { getApiUrl, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Paciente {
  id: number;
  nome: string;
  nif?: string;
}

interface Atendimento {
  id: number;
  paciente_id: number;
  status: string;
  paciente?: Paciente;
}

export default function CriarConsultaPage() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [atendimentoId, setAtendimentoId] = useState<number | ''>('');
  const [searchPaciente, setSearchPaciente] = useState('');
  const [form, setForm] = useState({
    od_esferico: '',
    od_cilindrico: '',
    od_eixo: '',
    oe_esferico: '',
    oe_cilindrico: '',
    oe_eixo: '',
    adicao: '',
    dnp: '',
    diagnostico: '',
    observacoes: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  /* ---------------- BUSCAR ATENDIMENTOS ---------------- */
  useEffect(() => {
    fetch(getApiUrl(API_ENDPOINTS.ATENDIMENTOS), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // apenas atendimentos "em_consulta"
          setAtendimentos(data.filter(a => a.status === 'em_consulta'));
        }
      })
      .catch(() => setMessage('Erro ao carregar atendimentos'));
  }, []);

  /* ---------------- HANDLE INPUT ---------------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ---------------- HANDLE SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const atendimento = atendimentos.find(a => a.id === atendimentoId);
    if (!atendimento) { setMessage('Selecione um atendimento válido'); return; }

    setLoading(true); setMessage('');

    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.CONSULTAS), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente_id: atendimento.paciente_id, atendimento_id: atendimento.id, ...form })
      });
      if (!res.ok) throw new Error();

      setMessage('Consulta registrada com sucesso');
      setForm({
        od_esferico: '', od_cilindrico: '', od_eixo: '',
        oe_esferico: '', oe_cilindrico: '', oe_eixo: '',
        adicao: '', dnp: '', diagnostico: '', observacoes: ''
      });
      setAtendimentoId('');

      // Remove atendimento concluído da lista
      setAtendimentos(prev => prev.filter(a => a.id !== atendimento.id));
    } catch {
      setMessage('Erro ao registrar consulta');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FILTRAR ATENDIMENTOS POR PACIENTE ---------------- */
  const atendimentosFiltrados = atendimentos.filter(a => {
    if (!a.paciente) return false;
    const termo = searchPaciente.toLowerCase();
    return a.paciente.nome.toLowerCase().includes(termo) || (a.paciente.nif?.toLowerCase().includes(termo) ?? false);
  });

  return (
    <div className="p-6 w-full">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Registrar Consulta</h1>

        {message && <div className="mb-4 p-3 rounded bg-gray-100 text-gray-800">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded border">

          {/* Campo de pesquisa de paciente */}
          <div>
            <label className="block mb-1 font-medium">Buscar Paciente (Nome ou NIF)</label>
            <input
              type="text"
              value={searchPaciente}
              onChange={e => setSearchPaciente(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              placeholder="Digite nome ou NIF"
            />
          </div>

          {/* Select de atendimento filtrado */}
          <div>
            <label className="block mb-1 font-medium">Atendimento</label>
            <select
              value={atendimentoId}
              onChange={e => setAtendimentoId(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded"
              required
            >
              <option value="">Selecione o atendimento</option>
              {atendimentosFiltrados.map(a => (
                <option key={a.id} value={a.id}>
                  #{a.id} - {a.paciente?.nome} ({a.status})
                </option>
              ))}
            </select>
          </div>

          {/* Campos de olhos */}
          <div className="grid grid-cols-3 gap-3">
            <input name="od_esferico" placeholder="OD Esférico" value={form.od_esferico} onChange={handleChange} className="border px-3 py-2 rounded" />
            <input name="od_cilindrico" placeholder="OD Cilíndrico" value={form.od_cilindrico} onChange={handleChange} className="border px-3 py-2 rounded" />
            <input name="od_eixo" placeholder="OD Eixo" value={form.od_eixo} onChange={handleChange} className="border px-3 py-2 rounded" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <input name="oe_esferico" placeholder="OE Esférico" value={form.oe_esferico} onChange={handleChange} className="border px-3 py-2 rounded" />
            <input name="oe_cilindrico" placeholder="OE Cilíndrico" value={form.oe_cilindrico} onChange={handleChange} className="border px-3 py-2 rounded" />
            <input name="oe_eixo" placeholder="OE Eixo" value={form.oe_eixo} onChange={handleChange} className="border px-3 py-2 rounded" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input name="adicao" placeholder="Adição" value={form.adicao} onChange={handleChange} className="border px-3 py-2 rounded" />
            <input name="dnp" placeholder="DNP" value={form.dnp} onChange={handleChange} className="border px-3 py-2 rounded" />
          </div>

          <textarea name="diagnostico" placeholder="Diagnóstico" value={form.diagnostico} onChange={handleChange} className="border px-3 py-2 rounded w-full" />
          <textarea name="observacoes" placeholder="Observações" value={form.observacoes} onChange={handleChange} className="border px-3 py-2 rounded w-full" />

          <div className="flex justify-end">
            <button disabled={loading} className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700">
              {loading ? 'Salvando...' : 'Registrar Consulta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
