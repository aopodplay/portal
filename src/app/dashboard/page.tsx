'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  CalendarCheck, 
  ShoppingCart, 
  FileText, 
  AlertCircle, 
  DollarSign, 
  Activity, 
  User, 
  Clock,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Produto { id: number; nome: string; estoque: number; }
interface Venda { id: number; total: number; created_at: string; }

interface DashboardData {
  pacientes: number;
  consultas: number;
  vendas: number;
  faturas: number;
  servicos: number; 
  estoqueBaixo: number;
  vendasHoje: number;
  produtosBaixo: Produto[];
  ultimasVendas: Venda[];
  vendasMensais: { mes: number; total: number }[];
  atendimentos: number;
  usuarios: number;
  aguardando: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const perfil = user?.perfil;

  const [data, setData] = useState<DashboardData>({
    pacientes: 0,
    consultas: 0,
    vendas: 0,
    faturas: 0,
    servicos: 0, // 
    estoqueBaixo: 0,
    vendasHoje: 0,
    produtosBaixo: [],
    ultimasVendas: [],
    vendasMensais: [],
    atendimentos: 0,
    usuarios: 0,
    aguardando: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const headers = getAuthHeaders();
        const res = await fetch(getApiUrl('/dashboard'), { headers });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Status ${res.status}: ${text}`);
        }

        const json: DashboardData = await res.json();
        setData(json);
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

  const graficoVendas = data.vendasMensais.map(v => ({
    mes: new Date(0, v.mes - 1).toLocaleString('pt-BR', { month: 'short' }),
    total: v.total,
  }));

  const cardsConfig = [
    { title: 'Pacientes', icon: <Users size={24} />, value: data.pacientes, color: 'bg-blue-100', roles: ['admin','caixa','optometrista','recepcao'] },
    { title: 'Consultas', icon: <CalendarCheck size={24} />, value: data.consultas, color: 'bg-green-100', roles: ['admin','optometrista'] },
    { title: 'Vendas', icon: <ShoppingCart size={24} />, value: data.vendas, color: 'bg-yellow-100', roles: ['admin','caixa'] },
    { title: 'Faturas', icon: <FileText size={24} />, value: data.faturas, color: 'bg-purple-100', roles: ['admin','caixa'] },
    { title: 'Serviços', icon: <Briefcase size={24} />, value: data.servicos, color: 'bg-cyan-100', roles: ['admin','caixa','recepcao'] },
    { title: 'Estoque Baixo', icon: <AlertCircle size={24} />, value: data.estoqueBaixo, color: 'bg-red-100', alert: data.estoqueBaixo > 0, roles: ['admin','caixa','recepcao'] },
    { title: 'Vendas Hoje', icon: <DollarSign size={24} />, value: data.vendasHoje, color: 'bg-indigo-100', roles: ['admin','caixa'] },
    { title: 'Atendimentos', icon: <Activity size={24} />, value: data.atendimentos, color: 'bg-teal-100', roles: ['admin','optometrista','caixa'] },
    { title: 'Pacientes Aguardando', icon: <Clock size={24} />, value: data.aguardando, color: 'bg-orange-100', roles: ['admin','optometrista','caixa','recepcao'] },
    { title: 'Usuários', icon: <User size={24} />, value: data.usuarios, color: 'bg-pink-100', roles: ['admin'] }
  ];

  const allowedCards = cardsConfig.filter(card => perfil && card.roles.includes(perfil));

  return (
    <div className="p-6 space-y-8">

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {allowedCards.map((card) => (
          <Card
            key={card.title}
            icon={card.icon}
            title={card.title}
            value={card.value}
            color={card.color}
            alert={card.alert}
          />
        ))}
      </div>

      {/* GRÁFICO */}
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

      {/* LISTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <h2 className={`text-2xl sm:text-3xl font-bold ${alert ? 'text-red-600' : ''}`}>
          {value}
        </h2>
      </div>
    </div>
  );
}