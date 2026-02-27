'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

interface Paciente {
  id: number;
  nome: string;
}

interface Pagamento {
  id: number;
  fatura_id: number;
  paciente_id?: number;
  forma_pagamento: string;
  valor: number;
  data_pagamento: string; 
  paciente?: {
    id: number;
    nome: string;
  };
  fatura?: {
    id: number;
    numero: string;
    total: number;
    forma_pagamento: string;
    pagamentos?: { valor: number }[];
    venda?: {
      atendimento?: {
        paciente?: {
          nome?: string;
        };
      };
    };
  };
}

interface FaturaPendente {
  id: number;
  numero: string;
  total: number;
  forma_pagamento: string;
  saldo: number;
}

export default function PagamentosPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [faturasPendentes, setFaturasPendentes] = useState<FaturaPendente[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);

  const [faturaId, setFaturaId] = useState('');
  const [pacienteId, setPacienteId] = useState('');
  const [forma, setForma] = useState('dinheiro');
  const [valor, setValor] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // FORMATAÇÃO DE DATA 
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // FETCH PAGAMENTOS 
  const fetchPagamentos = async () => {
    try {
      const res = await fetch(getApiUrl('/pagamentos'), { headers: getAuthHeaders() });
      const data = await res.json();
      setPagamentos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setMessage('Erro ao carregar pagamentos');
    }
  };

  // FETCH PACIENTES 
  const fetchPacientes = async () => {
    try {
      const res = await fetch(getApiUrl('/pacientes'), { headers: getAuthHeaders() });
      const data = await res.json();
      setPacientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // FETCH FATURAS PENDENTES 
  const fetchFaturasPendentes = async () => {
    try {
      const res = await fetch(getApiUrl('/faturas'), { headers: getAuthHeaders() });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];

      // Filtra apenas faturas ativas (não canceladas)
      const pendentes = arr
        .filter((f: any) => {
          // se status for undefined, considera válida
          return f.status?.toLowerCase() !== 'cancelado';
        })
        .map((f: any) => {
          const totalPago =
            f.pagamentos?.reduce((sum: number, p: any) => sum + Number(p.valor), 0) || 0;
          const saldo = Number(f.total) - totalPago;
          return { ...f, saldo };
        })
        .filter((f: any) => f.saldo > 0); // só faturas com saldo

      setFaturasPendentes(pendentes);
    } catch (err) {
      console.error(err);
      setMessage('Erro ao carregar faturas');
    }
  };

  useEffect(() => {
    fetchPagamentos();
    fetchFaturasPendentes();
    fetchPacientes();
  }, []);

  //  SELECIONAR FATURA 
  const handleFaturaChange = (id: string) => {
    setFaturaId(id);
    const fatura = faturasPendentes.find(f => f.id === Number(id));

    if (fatura) {
      setValor(fatura.saldo.toFixed(2));
      setForma(fatura.forma_pagamento || 'dinheiro');
    } else {
      setValor('');
      setForma('dinheiro');
    }
  };

  // CRIAR PAGAMENTO 
  const criarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faturaId || !valor) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(getApiUrl('/pagamentos'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fatura_id: Number(faturaId),
          forma_pagamento: forma,
          valor: Number(valor),
          paciente_id: pacienteId ? Number(pacienteId) : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar pagamento');

      setMessage('Pagamento registado com sucesso');
      setFaturaId('');
      setPacienteId('');
      setValor('');
      setForma('dinheiro');

      fetchPagamentos();
      fetchFaturasPendentes();
    } catch (err: any) {
      console.error(err);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // UI 
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Pagamentos</h1>

      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded shadow">
          {message}
        </div>
      )}

      <form
        onSubmit={criarPagamento}
        className="bg-white p-6 rounded shadow mb-8 grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {/* FATURA */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Fatura</label>
          <select
            value={faturaId}
            onChange={e => handleFaturaChange(e.target.value)}
            className="border px-3 py-2 rounded"
            required
          >
            <option value="">Selecione</option>
            {faturasPendentes.map(f => (
              <option key={f.id} value={f.id}>
                {f.numero} — Saldo: {f.saldo.toLocaleString('pt-AO')} Kz
              </option>
            ))}
          </select>
        </div>

        {/* PACIENTE */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Paciente (opcional)</label>
          <select
            value={pacienteId}
            onChange={e => setPacienteId(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">Selecionar</option>
            {pacientes.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        {/* FORMA */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Forma</label>
          <select
            value={forma}
            onChange={e => setForma(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="dinheiro">Dinheiro</option>
            <option value="multicaixa">Multicaixa</option>
            <option value="transferencia">Transferência</option>
          </select>
        </div>

        {/* VALOR */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Valor</label>
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={e => setValor(e.target.value)}
            className="border px-3 py-2 rounded"
            required
            max={faturasPendentes.find(f => f.id === Number(faturaId))?.saldo}
          />
        </div>

        <div className="md:col-span-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {loading ? 'A guardar...' : 'Registar Pagamento'}
          </button>
        </div>
      </form>

      {/* TABELA */}
      <div className="bg-white p-6 rounded shadow overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Lista de Pagamentos</h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Fatura</th>
              <th className="p-2 text-left">Forma</th>
              <th className="p-2 text-left">Valor</th>
              <th className="p-2 text-left">Paciente</th>
              <th className="p-2 text-left">Data</th>
            </tr>
          </thead>

          <tbody>
            {pagamentos.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{p.id}</td>
                <td className="p-2">{p.fatura?.numero || p.fatura_id}</td>
                <td className="p-2">{p.forma_pagamento}</td>
                <td className="p-2">{p.valor}</td>
                <td className="p-2">
                  {p.paciente?.nome ||
                    p.fatura?.venda?.atendimento?.paciente?.nome ||
                    '-'}
                </td>
                <td className="p-2">{formatDate(p.data_pagamento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}