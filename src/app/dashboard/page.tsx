'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, CalendarCheck, ShoppingCart, FileText, AlertCircle, DollarSign } from 'lucide-react';

interface Produto {
  id: number;
  nome: string;
  estoque: number;
}

interface Venda {
  id: number;
  total: number;
  createdAt: string;
}

interface DashboardData {
  pacientes: number;
  consultas: number;
  vendas: number;
  faturas: number;
  estoqueBaixo: number;
  vendasHoje: number;
  produtosBaixo: Produto[];
  ultimasVendas: Venda[];
  vendasMensais: { mes: number; total: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    pacientes: 0,
    consultas: 0,
    vendas: 0,
    faturas: 0,
    estoqueBaixo: 0,
    vendasHoje: 0,
    produtosBaixo: [],
    ultimasVendas: [],
    vendasMensais: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const headers = getAuthHeaders();
        const res = await fetch(getApiUrl('/dashboard'), { headers });

        // Debug detalhado do erro
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Status ${res.status}: ${text}`);
        }

        const json: DashboardData = await res.json();

        // Garantir que todos os arrays existam
        setData({
          pacientes: json.pacientes || 0,
          consultas: json.consultas || 0,
          vendas: json.vendas || 0,
          faturas: json.faturas || 0,
          estoqueBaixo: json.estoqueBaixo || 0,
          vendasHoje: json.vendasHoje || 0,
          produtosBaixo: json.produtosBaixo || [],
          ultimasVendas: json.ultimasVendas || [],
          vendasMensais: json.vendasMensais || [],
        });
      } catch (err: any) {
        console.error('Erro ao carregar dashboard:', err);
        setError(err.message || 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading)
    return <div className="p-6 text-center text-gray-500">Carregando dashboard...</div>;

  if (error)
    return <div className="p-6 text-center text-red-500">Erro: {error}</div>;

  // Formatar gráfico de vendas mensais
  const graficoVendas = data.vendasMensais.map(v => ({
    mes: new Date(0, v.mes - 1).toLocaleString('pt-BR', { month: 'short' }),
    total: v.total,
  }));

  return (
    <div className="p-6 space-y-8">
      {/* ================= CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card icon={<Users size={24} />} title="Pacientes" value={data.pacientes} color="bg-blue-100" />
        <Card icon={<CalendarCheck size={24} />} title="Consultas" value={data.consultas} color="bg-green-100" />
        <Card icon={<ShoppingCart size={24} />} title="Vendas" value={data.vendas} color="bg-yellow-100" />
        <Card icon={<FileText size={24} />} title="Faturas" value={data.faturas} color="bg-purple-100" />
        <Card icon={<AlertCircle size={24} />} title="Estoque Baixo" value={data.estoqueBaixo} color="bg-red-100" alert={data.estoqueBaixo > 0} />
        <Card icon={<DollarSign size={24} />} title="Vendas Hoje" value={data.vendasHoje} color="bg-indigo-100" />
      </div>

      {/* ================= GRÁFICO ================= */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="font-semibold mb-4">Vendas Mensais</h2>
        {graficoVendas.length === 0 ? (
          <p className="text-gray-500">Sem dados para exibir gráfico</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={graficoVendas}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: any) => value.toLocaleString('pt-AO') + ' Kz'} />
              <Bar dataKey="total" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ================= LISTAS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos críticos */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-semibold mb-4">Produtos com Estoque Baixo</h2>
          {data.produtosBaixo.length === 0 ? (
            <p className="text-gray-500">Nenhum produto crítico</p>
          ) : (
            <ul className="space-y-2">
              {data.produtosBaixo.map(p => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.nome}</span>
                  <span className="text-red-600 font-bold">{p.estoque}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Últimas vendas */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-semibold mb-4">Últimas Vendas</h2>
          {data.ultimasVendas.length === 0 ? (
            <p className="text-gray-500">Nenhuma venda registrada</p>
          ) : (
            <ul className="space-y-2">
              {data.ultimasVendas.map(v => (
                <li key={v.id} className="flex justify-between">
                  <span>Venda #{v.id}</span>
                  <span className="font-bold">{v.total?.toLocaleString('pt-AO')} Kz</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ================= CARD COMPONENTE =================
function Card({ icon, title, value, color, alert = false }: {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
  alert?: boolean;
}) {
  return (
    <div className={`p-6 rounded shadow flex items-center space-x-4 ${color}`}>
      <div className="text-gray-700">{icon}</div>
      <div>
        <p className="text-gray-700 font-medium">{title}</p>
        <h2 className={`text-2xl sm:text-3xl font-bold ${alert ? 'text-red-600' : ''}`}>{value}</h2>
      </div>
    </div>
  );
}
