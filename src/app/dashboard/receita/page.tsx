'use client';
import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

interface Paciente {
  id: number;
  nome: string;
  telefone?: string;
  nif?: string;
}

interface Atendimento {
  id: number;
  status: string;
}

interface Usuario {
  id: number;
  nome: string;
}

interface Consulta {
  id: number;
  paciente: Paciente;
  atendimento: Atendimento;
  optometrista?: Usuario;
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
  receita?: Receita;
}

interface Receita {
  id?: number;
  consulta_id: number;
  numero_receita?: string;
  pdf_path?: string;
  olho_direito?: string;
  olho_esquerdo?: string;
  observacoes?: string;
  od_esferico?: string;
  od_cilindrico?: string;
  od_eixo?: string;
  oe_esferico?: string;
  oe_cilindrico?: string;
  oe_eixo?: string;
  adicao?: string;
  dnp?: string;
  diagnostico?: string;
}

export default function ReceitasPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [search, setSearch] = useState('');
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [receita, setReceita] = useState<Partial<Receita>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchConsultas() {
      try {
        const res = await fetch(getApiUrl('/consultas/concluidas'), {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        setConsultas(Array.isArray(data) ? data : data.data ?? []);
      } catch (err) {
        console.error(err);
        setMessage('Erro ao carregar consultas concluídas');
      }
    }
    fetchConsultas();
  }, []);

  const filteredConsultas = consultas.filter((c) => {
    const nome = c.paciente?.nome.toLowerCase() || '';
    const nif = c.paciente?.nif?.toLowerCase() || '';
    return nome.includes(search.toLowerCase()) || nif.includes(search.toLowerCase());
  });

  const handleSelectConsulta = (c: Consulta) => {
    setSelectedConsulta(c);
    setMessage('');

    const existing = c.receita;
    setReceita({
      consulta_id: c.id,
      id: existing?.id,
      numero_receita: existing?.numero_receita,
      pdf_path: existing?.pdf_path,
      olho_direito:
        existing?.olho_direito ||
        (c.od_esferico ? `${c.od_esferico} ${c.od_cilindrico || ''} ${c.od_eixo || ''}`.trim() : ''),
      olho_esquerdo:
        existing?.olho_esquerdo ||
        (c.oe_esferico ? `${c.oe_esferico} ${c.oe_cilindrico || ''} ${c.oe_eixo || ''}`.trim() : ''),
      observacoes: existing?.observacoes || c.observacoes || '',
      od_esferico: existing?.od_esferico || c.od_esferico || '',
      od_cilindrico: existing?.od_cilindrico || c.od_cilindrico || '',
      od_eixo: existing?.od_eixo || c.od_eixo || '',
      oe_esferico: existing?.oe_esferico || c.oe_esferico || '',
      oe_cilindrico: existing?.oe_cilindrico || c.oe_cilindrico || '',
      oe_eixo: existing?.oe_eixo || c.oe_eixo || '',
      adicao: existing?.adicao || c.adicao || '',
      dnp: existing?.dnp || c.dnp || '',
      diagnostico: existing?.diagnostico || c.diagnostico || '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReceita({ ...receita, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsulta) return;

    setLoading(true);
    setMessage('');

    try {
      const payload = { ...receita };

      let res;
      if (receita.id) {
        res = await fetch(getApiUrl(`/receitas/${receita.id}`), {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(getApiUrl('/receitas'), {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error();

      const data = await res.json();
      setReceita(data);
      setMessage('Receita registrada com sucesso! PDF gerado.');
    } catch (err) {
      console.error(err);
      setMessage('Erro ao registrar receita');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!receita.id || !confirm('Tem certeza que deseja deletar esta receita?')) return;

    try {
      const res = await fetch(getApiUrl(`/receitas/${receita.id}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error();

      setMessage('Receita deletada com sucesso');
      setSelectedConsulta(null);
      setReceita({});
      setConsultas((prev) =>
        prev.map((c) => (c.id === selectedConsulta?.id ? { ...c, receita: undefined } : c))
      );
    } catch (err) {
      console.error(err);
      setMessage('Erro ao deletar receita');
    }
  };

  const pdfUrl = receita.pdf_path
  ? `${process.env.NEXT_PUBLIC_API_URL}${receita.pdf_path.startsWith('/') ? '' : '/'}${receita.pdf_path}`
  : '';


  return (
    <div className="p-6 w-full">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Receitas</h1>

        {message && <div className="mb-4 p-3 rounded bg-gray-100 text-gray-800">{message}</div>}

        <input
          type="text"
          placeholder="Pesquisar por paciente ou NIF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 border px-3 py-2 rounded w-full"
        />

        <div className="bg-white rounded border divide-y">
          {filteredConsultas.length === 0 && (
            <p className="p-4 text-gray-500">Nenhum paciente encontrado</p>
          )}
          {filteredConsultas.map((c) => (
            <div
              key={c.id}
              className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center"
            >
              <div>
                <span className="font-semibold">{c.paciente?.nome}</span>
                {c.paciente?.nif && <span className="text-gray-500 text-sm ml-2">({c.paciente.nif})</span>}
                <div className="text-gray-500 text-sm">Consulta ID: {c.id}</div>
                {c.optometrista && (
                  <div className="text-gray-500 text-sm">Optometrista: {c.optometrista.nome}</div>
                )}
              </div>
              <div className="mt-2 md:mt-0">
                <button
                  onClick={() => handleSelectConsulta(c)}
                  className={`px-4 py-1 rounded text-white ${
                    c.receita ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                  disabled={!!c.receita}
                >
                  {c.receita ? 'Receita Gerada' : 'Gerar Receita'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedConsulta && (
          <form onSubmit={handleSubmit} className="mt-6 bg-white p-6 rounded border space-y-4">
            <h2 className="font-semibold text-lg">
              Gerar Receita - {selectedConsulta.paciente?.nome}
              {selectedConsulta.optometrista && (
                <span className="text-gray-500 text-sm ml-2">({selectedConsulta.optometrista.nome})</span>
              )}
            </h2>

            <div>
              <label className="block mb-1 font-semibold">Número da Receita:</label>
              <input
                type="text"
                value={receita.numero_receita || 'Gerado automaticamente'}
                readOnly
                className="w-full border px-3 py-2 rounded bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">Olho Direito:</label>
                <input
                  type="text"
                  name="olho_direito"
                  value={receita.olho_direito || ''}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Olho Esquerdo:</label>
                <input
                  type="text"
                  name="olho_esquerdo"
                  value={receita.olho_esquerdo || ''}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">OD Esférico:</label>
                <input
                  type="text"
                  name="od_esferico"
                  value={receita.od_esferico || ''}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">OD Cilíndrico:</label>
                <input
                  type="text"
                  name="od_cilindrico"
                  value={receita.od_cilindrico || ''}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">OD Eixo:</label>
                <input
                  type="text"
                  name="od_eixo"
                  value={receita.od_eixo || ''}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">OE Esférico:</label>
                <input
                  type="text"
                  name="oe_esferico"
                  value={receita.oe_esferico || ''}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">OE Cilíndrico:</label>
                <input
                  type="text"
                  name="oe_cilindrico"
                  value={receita.oe_cilindrico || ''}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">OE Eixo:</label>
                <input
                  type="text"
                  name="oe_eixo"
                  value={receita.oe_eixo || ''}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Adição:</label>
                <input
                  type="text"
                  name="adicao"
                  value={receita.adicao || ''}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">DNP:</label>
                <input
                  type="text"
                  name="dnp"
                  value={receita.dnp || ''}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-semibold">Diagnóstico:</label>
              <textarea
                name="diagnostico"
                value={receita.diagnostico || ''}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                rows={3}
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Observações:</label>
              <textarea
                name="observacoes"
                value={receita.observacoes || ''}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                rows={3}
              />
            </div>

            {pdfUrl && (
              <div className="mt-2 flex gap-2">
                <a
  href={getApiUrl(receita.pdf_path || '')}
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-600 underline"
>
  Visualizar/Imprimir PDF
</a>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Deletar Receita
                </button>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedConsulta(null);
                  setReceita({});
                }}
                className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Receita'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
