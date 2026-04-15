'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  FileBarChart,
  PieChart,
  BarChart3,
  Filter,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Package,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import * as XLSX from 'xlsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [exporting, setExporting] = useState(false);

  const fetchRelatorios = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);

      const url = `/relatorios${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(getApiUrl(url), { headers: getAuthHeaders() });

      if (!res.ok) {
        throw new Error('Erro ao carregar relatórios');
      }

      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Erro:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelatorios();
  }, [dataInicio, dataFim]);

  const limparFiltros = () => {
    setDataInicio('');
    setDataFim('');
  };

  const formatarValor = (valor: number) => {
    if (!valor && valor !== 0) return '0 Kz';
    return valor.toLocaleString('pt-AO') + ' Kz';
  };

  const formatarNumero = (valor: number) => {
    if (!valor && valor !== 0) return '0';
    return valor.toLocaleString('pt-AO');
  };

  const formatarPercentual = (valor: number) => {
    if (!valor && valor !== 0) return '0%';
    return valor.toFixed(1) + '%';
  };

  // Exportar para Excel
  const exportToExcel = () => {
    if (!data) return;
    setExporting(true);

    try {
      const workbookData = [
        {
          sheet: 'Resumo',
          data: [
            ['Métrica', 'Valor'],
            ['Total Faturado', formatarValor(data.resumo?.totalFaturado || 0)],
            ['Total de Vendas', formatarNumero(data.resumo?.totalVendas || 0)],
            ['Ticket Médio', formatarValor(data.resumo?.ticketMedio || 0)],
            ['Total Clientes', formatarNumero(data.resumo?.totalClientes || 0)],
            ['Total Produtos', formatarNumero(data.resumo?.totalProdutos || 0)]
          ]
        },
        {
          sheet: 'Vendas Mensais',
          data: (data.vendasMensais || []).map((v: any) => ({
            Mês: v.mes,
            'Valor Total (Kz)': v.total,
            Quantidade: v.quantidade
          }))
        },
        {
          sheet: 'Produtos Mais Vendidos',
          data: (data.produtosMaisVendidos || []).map((p: any) => ({
            Produto: p.nome,
            Quantidade: p.quantidade,
            'Total (Kz)': p.total
          }))
        },
        {
          sheet: 'Top Clientes',
          data: (data.clientesTop || []).map((c: any) => ({
            Cliente: c.nome,
            'Nº Compras': c.totalCompras,
            'Valor Total (Kz)': c.valorTotal
          }))
        },
        {
          sheet: 'Formas de Pagamento',
          data: (data.pagamentosPorForma || []).map((p: any) => ({
            'Forma de Pagamento': p.forma,
            'Total (Kz)': p.total,
            Percentual: p.percentual?.toFixed(1) + '%'
          }))
        }
      ];

      const wb = XLSX.utils.book_new();

      workbookData.forEach(({ sheet, data }) => {
        const ws = XLSX.utils.json_to_sheet(data);
        // Ajustar largura das colunas
        const colWidths = [];
        for (let i = 0; i < 10; i++) {
          colWidths.push({ wch: 20 });
        }
        ws['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(wb, ws, sheet);
      });

      XLSX.writeFile(wb, `relatorio_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
      alert('Erro ao gerar arquivo Excel');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erro ao carregar relatórios</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={fetchRelatorios} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto">
            <RefreshCw size={18} /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileBarChart size={28} /> Relatórios
              </h1>
              <p className="text-indigo-100 mt-1">Análise completa de dados e métricas do sistema</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                disabled={exporting}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <FileSpreadsheet size={18} />
                {exporting ? 'Exportando...' : 'Exportar Excel'}
              </button>
              <button onClick={fetchRelatorios} className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
                <RefreshCw size={16} /> Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-700">Filtros de Período</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={limparFiltros}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <X size={16} /> Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Total Faturado</p>
                <p className="text-2xl font-bold text-blue-600">{formatarValor(data.resumo?.totalFaturado)}</p>
              </div>
              <DollarSign className="text-blue-500" size={28} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Total de Vendas</p>
                <p className="text-2xl font-bold text-green-600">{formatarNumero(data.resumo?.totalVendas)}</p>
              </div>
              <ShoppingCart className="text-green-500" size={28} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Ticket Médio</p>
                <p className="text-2xl font-bold text-purple-600">{formatarValor(data.resumo?.ticketMedio)}</p>
              </div>
              <TrendingUp className="text-purple-500" size={28} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Total Clientes</p>
                <p className="text-2xl font-bold text-orange-600">{formatarNumero(data.resumo?.totalClientes)}</p>
              </div>
              <Users className="text-orange-500" size={28} />
            </div>
          </div>
        </div>

        {/* Gráfico de Vendas Mensais */}
        {data.vendasMensais && data.vendasMensais.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="font-semibold text-lg text-gray-800 mb-6 flex items-center gap-2">
              <BarChart3 size={20} /> Vendas Mensais
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.vendasMensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <Tooltip formatter={(value: any, name?: string) => {
                  if (name && name === 'total') return formatarValor(value);
                  return formatarNumero(value);
                }} />
                <Legend />
                <Bar yAxisId="left" dataKey="total" name="Valor Total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar yAxisId="right" dataKey="quantidade" name="Quantidade" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Vendas por Categoria */}
          {data.vendasPorCategoria && data.vendasPorCategoria.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="font-semibold text-lg text-gray-800 mb-6 flex items-center gap-2">
                <PieChart size={20} /> Vendas por Categoria
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={data.vendasPorCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="total"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.vendasPorCategoria.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatarValor(value)} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfico de Formas de Pagamento */}
          {data.pagamentosPorForma && data.pagamentosPorForma.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="font-semibold text-lg text-gray-800 mb-6 flex items-center gap-2">
                <CreditCard size={20} /> Formas de Pagamento
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={data.pagamentosPorForma}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="total"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.pagamentosPorForma.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatarValor(value)} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Produtos Mais Vendidos */}
        {data.produtosMaisVendidos && data.produtosMaisVendidos.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <h2 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <Package size={20} /> Produtos Mais Vendidos
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left text-sm font-semibold text-gray-600">Produto</th>
                    <th className="p-3 text-center text-sm font-semibold text-gray-600">Quantidade</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-600">Total</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-600">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.produtosMaisVendidos.map((produto: any, idx: number) => {
                    const percentual = (produto.total / (data.resumo?.totalFaturado || 1)) * 100;
                    return (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-sm font-medium text-gray-800">{produto.nome}</td>
                        <td className="p-3 text-sm text-center">{formatarNumero(produto.quantidade)}</td>
                        <td className="p-3 text-sm text-right text-green-600 font-medium">{formatarValor(produto.total)}</td>
                        <td className="p-3 text-sm text-right text-gray-500">{formatarPercentual(percentual)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Clientes */}
        {data.clientesTop && data.clientesTop.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <h2 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <Users size={20} /> Top Clientes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left text-sm font-semibold text-gray-600">Cliente</th>
                    <th className="p-3 text-center text-sm font-semibold text-gray-600">Compras</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-600">Valor Total</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-600">Ticket Médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.clientesTop.map((cliente: any, idx: number) => {
                    const ticketMedio = cliente.valorTotal / (cliente.totalCompras || 1);
                    return (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-sm font-medium text-gray-800">{cliente.nome}</td>
                        <td className="p-3 text-sm text-center">{formatarNumero(cliente.totalCompras)}</td>
                        <td className="p-3 text-sm text-right text-green-600 font-medium">{formatarValor(cliente.valorTotal)}</td>
                        <td className="p-3 text-sm text-right text-gray-500">{formatarValor(ticketMedio)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer com última atualização */}
        <div className="mt-6 text-center text-xs text-gray-400">
          Última atualização: {lastUpdate.toLocaleString('pt-AO')}
        </div>
      </div>
    </div>
  );
}