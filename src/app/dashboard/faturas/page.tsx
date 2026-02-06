'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

interface Paciente {
  id: number;
  nome: string;
  nif?: string;
}

interface Atendimento {
  id: number;
  status: string;
  paciente: Paciente;
}

interface Venda {
  id: number;
  atendimento: Atendimento;
}

interface Pagamento {
  id: number;
  valor: number;
  forma_pagamento: string;
}

interface Fatura {
  id: number;
  numero: string;
  total: number;
  status: 'pendente' | 'pago' | 'cancelada';
  data_emissao: string;
  venda: Venda;
  pagamentos: Pagamento[];
}

export default function FaturasPage() {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFaturas() {
      try {
        const res = await fetch(getApiUrl('/faturas'), { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const data = await res.json();

        // Garantir que recebemos um array
        const arr = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setFaturas(arr);
      } catch (err: any) {
        console.error('Erro ao buscar faturas:', err);
        setError(err.message || 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchFaturas();
  }, []);

  if (loading) return <p className="p-6 text-gray-500">Carregando faturas...</p>;
  if (error) return <p className="p-6 text-red-500">Erro: {error}</p>;
  if (!faturas.length) return <p className="p-6 text-gray-500">Nenhuma fatura encontrada.</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Faturas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faturas.map(f => (
          <div key={f.id} className="bg-white shadow rounded p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{f.numero}</span>
              <span className={`px-2 py-1 rounded text-white text-xs ${
                f.status === 'pendente' ? 'bg-yellow-400' :
                f.status === 'pago' ? 'bg-green-500' :
                'bg-red-500'
              }`}>
                {f.status.toUpperCase()}
              </span>
            </div>
            <span className="text-gray-500 text-sm">
              Paciente: {f.venda?.atendimento?.paciente?.nome || '-'}
            </span>
            <span className="text-gray-500 text-sm">
              Total: {f.total.toLocaleString('pt-AO')} Kz
            </span>
            <span className="text-gray-500 text-sm">
              Emitida em: {new Date(f.data_emissao).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
