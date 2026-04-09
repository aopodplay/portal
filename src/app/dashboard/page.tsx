'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
  Briefcase,
  TrendingUp,
  TrendingDown,
  Eye,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Produto { 
  id: number; 
  nome: string; 
  estoque: number; 
  preco?: number;
  tipo?: string;
}

interface Venda { 
  id: number; 
  total: number; 
  created_at: string;
  forma_pagamento?: string;
  paciente?: { nome: string };
}

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
  totalFaturado: number;
  ticketMedio: number;
  crescimentoVendas: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function DashboardPage() {
  const { user } = useAuth();
  const perfil = user?.perfil;
  const [data, setData] = useState<DashboardData>({
    pacientes: 0,
    consultas: 0,
    vendas: 0,
    faturas: 0,
    servicos: 0,
    estoqueBaixo: 0,
    vendasHoje: 0,
    produtosBaixo: [],
    ultimasVendas: [],
    vendasMensais: [],
    atendimentos: 0,
    usuarios: 0,
    aguardando: 0,
    totalFaturado: 0,
    ticketMedio: 0,
    crescimentoVendas: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await fetch(getApiUrl('/dashboard'), { headers });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Status ${res.status}: ${text}`);
      }

      const json: DashboardData = await res.json();
      setData({
        ...json,
        totalFaturado: json.totalFaturado || 0,
        ticketMedio: json.ticketMedio || 0,
        crescimentoVendas: json.crescimentoVendas || 0
      });
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err);
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erro ao carregar dashboard</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={fetchDashboard} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto">
            <RefreshCw size={18} /> Tentar novamente
          </button>
        </div>
      </div>
    );

  const graficoVendas = (data.vendasMensais || []).map(v => ({
    mes: new Date(0, v.mes - 1).toLocaleString('pt-BR', { month: 'short' }),
    total: v.total || 0,
  }));

  const distribuicaoDados = [
    { name: 'Consultas', value: data.consultas || 0, color: '#3b82f6' },
    { name: 'Vendas', value: data.vendas || 0, color: '#10b981' },
    { name: 'Atendimentos', value: data.atendimentos || 0, color: '#f59e0b' },
    { name: 'Pacientes', value: data.pacientes || 0, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const formatValue = (value: number | undefined, format?: string): string => {
    const safeValue = value || 0;
    if (format === 'currency') {
      return safeValue.toLocaleString('pt-AO') + ' Kz';
    }
    return safeValue.toLocaleString('pt-AO');
  };

  const cardsConfig = [
    { 
      title: 'Pacientes', 
      icon: <Users size={24} />, 
      value: data.pacientes, 
      color: 'from-blue-500 to-blue-600', 
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      roles: ['admin', 'caixa', 'optometrista', 'recepcao'],
      subtitle: 'Total cadastrados'
    },
    { 
      title: 'Consultas', 
      icon: <CalendarCheck size={24} />, 
      value: data.consultas, 
      color: 'from-green-500 to-green-600', 
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      roles: ['admin', 'optometrista'],
      subtitle: 'Realizadas'
    },
    { 
      title: 'Vendas', 
      icon: <ShoppingCart size={24} />, 
      value: data.vendas, 
      color: 'from-yellow-500 to-yellow-600', 
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      roles: ['admin', 'caixa'],
      subtitle: 'Total de vendas'
    },
    { 
      title: 'Faturamento', 
      icon: <DollarSign size={24} />, 
      value: data.totalFaturado, 
      color: 'from-emerald-500 to-emerald-600', 
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      roles: ['admin', 'caixa'],
      subtitle: 'Total faturado',
      format: 'currency'
    },
    { 
      title: 'Ticket Médio', 
      icon: <TrendingUp size={24} />, 
      value: data.ticketMedio, 
      color: 'from-purple-500 to-purple-600', 
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      roles: ['admin', 'caixa'],
      subtitle: 'Por venda',
      format: 'currency'
    },
    { 
      title: 'Atendimentos', 
      icon: <Activity size={24} />, 
      value: data.atendimentos, 
      color: 'from-teal-500 to-teal-600', 
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      roles: ['admin', 'optometrista', 'caixa'],
      subtitle: 'Em andamento'
    },
    { 
      title: 'Aguardando', 
      icon: <Clock size={24} />, 
      value: data.aguardando, 
      color: 'from-orange-500 to-orange-600', 
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      roles: ['admin', 'optometrista', 'caixa', 'recepcao'],
      subtitle: 'Na fila de espera',
      alert: (data.aguardando || 0) > 5
    },
    { 
      title: 'Estoque Crítico', 
      icon: <AlertCircle size={24} />, 
      value: data.estoqueBaixo, 
      color: 'from-red-500 to-red-600', 
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      roles: ['admin', 'caixa', 'recepcao'],
      subtitle: 'Produtos com estoque baixo',
      alert: (data.estoqueBaixo || 0) > 0
    },
    { 
      title: 'Vendas Hoje', 
      icon: <DollarSign size={24} />, 
      value: data.vendasHoje, 
      color: 'from-indigo-500 to-indigo-600', 
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      roles: ['admin', 'caixa'],
      subtitle: 'Valor total',
      format: 'currency'
    },
    { 
      title: 'Serviços', 
      icon: <Briefcase size={24} />, 
      value: data.servicos, 
      color: 'from-cyan-500 to-cyan-600', 
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      roles: ['admin', 'caixa', 'recepcao'],
      subtitle: 'Oferecidos'
    },
    { 
      title: 'Usuários', 
      icon: <User size={24} />, 
      value: data.usuarios, 
      color: 'from-pink-500 to-pink-600', 
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      roles: ['admin'],
      subtitle: 'Ativos no sistema'
    },
    { 
      title: 'Faturas', 
      icon: <FileText size={24} />, 
      value: data.faturas, 
      color: 'from-slate-500 to-slate-600', 
      bgColor: 'bg-slate-50',
      iconColor: 'text-slate-600',
      roles: ['admin', 'caixa'],
      subtitle: 'Emitidas'
    }
  ];

  const allowedCards = cardsConfig.filter(card => perfil && card.roles.includes(perfil));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-indigo-100 mt-1">Visão geral do sistema e métricas importantes</p>
            </div>
            <div className="text-right text-sm text-indigo-200">
              <p>Última atualização: {lastUpdate.toLocaleTimeString('pt-AO')}</p>
              <button onClick={fetchDashboard} className="mt-1 text-white hover:text-indigo-200 transition-colors flex items-center gap-1">
                <RefreshCw size={14} /> Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {allowedCards.map((card) => (
            <div
              key={card.title}
              className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${card.alert ? 'ring-2 ring-red-400' : ''}`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center ${card.iconColor}`}>
                    {card.icon}
                  </div>
                  {card.alert && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-600 animate-pulse">
                      Atenção
                    </span>
                  )}
                </div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{card.title}</h3>
                <p className={`text-2xl font-bold ${card.alert ? 'text-red-600' : 'text-gray-800'}`}>
                  {formatValue(card.value, card.format)}
                </p>
                <p className="text-xs text-gray-400 mt-2">{card.subtitle}</p>
              </div>
              <div className={`h-1 bg-gradient-to-r ${card.color}`}></div>
            </div>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Vendas Mensais */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg text-gray-800">📊 Vendas Mensais</h2>
              {data.crescimentoVendas !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${(data.crescimentoVendas || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(data.crescimentoVendas || 0) > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{Math.abs(data.crescimentoVendas || 0)}% vs mês anterior</span>
                </div>
              )}
            </div>
            {graficoVendas.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <p>Sem dados para exibir gráfico</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={graficoVendas}>
                  <XAxis dataKey="mes" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    formatter={(value: any) => (value || 0).toLocaleString('pt-AO') + ' Kz'}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Gráfico de Distribuição */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-semibold text-lg text-gray-800 mb-6">📈 Distribuição por Categoria</h2>
            {distribuicaoDados.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <p>Sem dados para exibir</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={distribuicaoDados}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {distribuicaoDados.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {distribuicaoDados.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-sm text-gray-600">{item.name}:</span>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Listas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Produtos com Estoque Baixo */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
              <h2 className="font-semibold text-lg text-red-800 flex items-center gap-2">
                <AlertCircle size={20} /> Produtos com Estoque Baixo
              </h2>
            </div>
            <div className="p-6">
              {!data.produtosBaixo || data.produtosBaixo.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle size={48} className="mx-auto mb-3 text-green-400" />
                  <p>Nenhum produto com estoque crítico</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.produtosBaixo.map(p => (
                    <li key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <span className="font-medium text-gray-800">{p.nome}</span>
                        <p className="text-xs text-gray-400">{p.tipo || 'Produto'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-red-600 font-bold text-lg">{p.estoque || 0}</span>
                        <p className="text-xs text-gray-400">unidades</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Últimas Vendas */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-100 border-b border-green-200">
              <h2 className="font-semibold text-lg text-green-800 flex items-center gap-2">
                <ShoppingCart size={20} /> Últimas Vendas
              </h2>
            </div>
            <div className="p-6">
              {!data.ultimasVendas || data.ultimasVendas.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-3" />
                  <p>Nenhuma venda registrada</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.ultimasVendas.map(v => (
                    <li key={v.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <span className="font-medium text-gray-800">Venda #{v.id}</span>
                        <p className="text-xs text-gray-400">
                          {v.paciente?.nome || 'Cliente Avulso'} • {v.created_at ? new Date(v.created_at).toLocaleDateString('pt-AO') : '-'}
                        </p>
                        {v.forma_pagamento && (
                          <p className="text-xs text-gray-400">{v.forma_pagamento}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-green-600 font-bold">{(v.total || 0).toLocaleString('pt-AO')} Kz</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Resumo Rápido */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
          <h3 className="font-semibold text-indigo-800 mb-4 flex items-center gap-2">
            <Eye size={18} /> Resumo Rápido
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{(data.pacientes || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Pacientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{(data.consultas || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Consultas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{(data.vendas || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Vendas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{(data.atendimentos || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Atendimentos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}