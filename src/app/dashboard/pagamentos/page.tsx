'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { Printer } from "lucide-react";

/* TIPAGENS */

interface Paciente {
  id: number;
  nome: string;
  nif?: string;
}

interface Produto { id: number; nome: string; preco: number }
interface Servico { id: number; nome: string; valor: number }
interface VendaItem { quantidade: number; preco_unitario: number; subtotal: number; produto?: Produto; servico?: Servico }
interface Atendimento { paciente: Paciente }
interface Venda { atendimento?: Atendimento; itens?: VendaItem[] }
interface PagamentoFatura { id: number; valor: number; valor_total?: number; forma_pagamento: string; paciente?: Paciente }

interface Fatura {
  id: number;
  numero: string;
  total: number;
  status: string;
  data_emissao: string;
  venda?: Venda;
  pagamentos: PagamentoFatura[];
   usuario?: {
    id: number
    nome: string
  }
}

interface Pagamento {
  id: number;
  fatura_id: number;
  paciente_id?: number;
  forma_pagamento: string;
  valor: number;
  data_pagamento: string;
  paciente?: { id: number; nome: string };
  fatura?: { id: number; numero: string; total: number; forma_pagamento: string; pagamentos?: { valor?: number; valor_total?: number }[]; venda?: { atendimento?: { paciente?: { nome?: string } }; itens?: VendaItem[] } };
}

interface FaturaPendente {
  id: number;
  numero: string;
  total: number;
  forma_pagamento: string;
  saldo: number;
}

/* =============================== */
/* COMPONENTE ==================== */
/* =============================== */

export default function PagamentosPage() {

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [faturasPendentes, setFaturasPendentes] = useState<FaturaPendente[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [config, setConfig] = useState<any>(null);

  const [faturaId, setFaturaId] = useState('');
  const [pacienteId, setPacienteId] = useState('');
  const [forma, setForma] = useState('dinheiro');
  const [valor, setValor] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  /* =============================== */
  /* FORMATAÇÃO DE DATA ============= */
  /* =============================== */

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

  /* =============================== */
  /* BUSCAS ========================= */
  /* =============================== */

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

  const fetchPacientes = async () => {
    try {
      const res = await fetch(getApiUrl('/pacientes'), { headers: getAuthHeaders() });
      const data = await res.json();
      setPacientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFaturasPendentes = async () => {
    try {

      const res = await fetch(getApiUrl('/faturas'), {
        headers: getAuthHeaders()
      });

      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];

      const pendentes = arr
        .filter((f: any) => {
          const status = f.status?.toLowerCase();
          return status === 'pendente' || status === 'parcial';
        })
        .map((f: any) => {

          const totalPago =
            f.pagamentos?.reduce(
              (sum: number, p: any) =>
                sum + Number(p.valor_total ?? p.valor ?? 0),
              0
            ) || 0;

          const saldo = Number(f.total || 0) - totalPago;

          return {
            id: f.id,
            numero: f.numero,
            total: f.total,
            forma_pagamento: f.forma_pagamento,
            saldo
          };

        })
        .filter((f: any) => f.saldo > 0);

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

    fetch(getApiUrl('/configuracoes-sistema'), { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(setConfig)
      .catch(() => { });

  }, []);

  /* =============================== */
  /* SELEÇÃO DE FATURA =============== */
  /* =============================== */

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

  /* =============================== */
  /* CRIAR PAGAMENTO ================= */
  /* =============================== */

  const criarPagamento = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!faturaId || !valor) return;

    setLoading(true);
    setMessage('');

    try {

      const res = await fetch(getApiUrl('/pagamentos'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
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

  /* =============================== */
  /* FUNÇÃO DE IMPRESSÃO ============= */
  /* =============================== */

  const imprimirFatura = async (f: Fatura) => {

    if (!config) return;

    const paciente =
      f.venda?.atendimento?.paciente ||
      f.pagamentos?.find(p => p.paciente)?.paciente;

    const pacienteNome = paciente?.nome || 'Cliente Avulso';

    const formasPagamento =
      f.pagamentos?.map(p => p.forma_pagamento.toUpperCase()).join(', ')
      || 'DINHEIRO';

    const totalPago =
      f.pagamentos?.reduce(
        (acc, p: any) =>
          acc + Number(p.valor_total ?? p.valor ?? 0),
        0
      ) || 0;

    const saldo = Number(f.total || 0) - totalPago;

    const linhasProdutos = f.venda?.itens?.length
      ? f.venda.itens.map(item => {

        const descricao =
          item.produto?.nome ||
          item.servico?.nome ||
          '-';

        const precoUnit =
          Number(
            item.preco_unitario ||
            item.produto?.preco ||
            item.servico?.valor ||
            0
          );

        const subtotal =
          Number(item.subtotal || 0);

        return `<tr>
<td>${descricao}</td>
<td style="text-align:center;">${item.quantidade}</td>
<td style="text-align:right;">${precoUnit.toLocaleString('pt-AO')} Kz</td>
<td style="text-align:right;">${subtotal.toLocaleString('pt-AO')} Kz</td>
</tr>`;

      }).join('')
      : `<tr><td colspan="4" style="text-align:center;">Sem itens</td></tr>`;

    const logoUrl = config.logo ? getApiUrl(config.logo) : null;

    const nomeClinica = config?.nome_sistema;
    const endereco = config?.endereco;
    const telefone = config?.telefone;
    const nif = config?.nif;

    const win = window.open('', '_blank');
    if (!win) return;

    const html = `
<html>
<head>
<title>Fatura ${f.numero}</title>
<style>
body { font-family: Arial, sans-serif; font-size: 13px; color: #000; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.logo { height: 70px; }
.company-info { text-align: right; }
.separator { border-top: 2px solid #000; margin: 15px 0; }
.title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 10px; }
.info { margin-bottom: 15px; line-height: 1.6; }
table { width: 100%; border-collapse: collapse; margin-top: 10px; }
th, td { border: 1px solid #000; padding: 6px; }
th { background: #f2f2f2; text-align: center; }
.total-section { margin-top: 20px; text-align: right; }
.total-line { font-size: 16px; font-weight: bold; }
.signature { margin-top: 60px; display: flex; justify-content: space-between; }
.signature div { width: 45%; text-align: center; }
.footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 11px; border-top: 1px solid #000; padding-top: 5px; }
</style>
</head>

<body>

<div class="header">

<div id="logo-container">
${logoUrl ? `<img src="${logoUrl}" class="logo"/>` : `<strong style="font-size:18px;">${nomeClinica}</strong>`}
</div>

<div class="company-info">
<strong>${nomeClinica}</strong><br/>
${endereco}<br/>
Tel: ${telefone}<br/>
NIF: ${nif}
</div>

</div>

<div class="separator"></div>

<div class="title">FATURA</div>

<div class="info">
<strong>Data de Emissão:</strong> ${new Date(f.data_emissao).toLocaleDateString('pt-AO')}<br/>
<strong>Cliente:</strong> ${pacienteNome}<br/>
<strong>Responsável:</strong> ${f.usuario?.nome || "-"}<br/>
<strong>Forma Pagamento:</strong> ${formasPagamento}<br/>
<strong>Status:</strong> ${f.status.toUpperCase()}
</div>

<table>

<thead>
<tr>
<th>Descrição</th>
<th>Qtd</th>
<th>Preço Unit.</th>
<th>Subtotal</th>
</tr>
</thead>

<tbody>
${linhasProdutos}
</tbody>

</table>

<div class="total-section">
<div>Total Pago: ${Number(totalPago).toLocaleString('pt-AO')} Kz</div>
<div>Saldo: ${Number(saldo).toLocaleString('pt-AO')} Kz</div>
<div class="total-line">Total Geral: ${Number(f.total).toLocaleString('pt-AO')} Kz</div>
</div>

<div class="signature">
<!--<div>___________________________<br/>Assinatura do Cliente</div>
<div>___________________________<br/>Assinatura do Responsável</div>-->
</div>

<div class="footer">
Documento processado por programa informático certificado • Emitido em ${new Date().toLocaleString()} • Hash: ${f.id}-${f.numero}
</div>

<script>
const img = document.querySelector('#logo-container img');

if(img){
img.onload = () => { window.print(); window.close(); };
}else{
window.onload = () => { window.print(); window.close(); };
}
</script>

</body>
</html>
`;

    win.document.write(html);
    win.document.close();

  };

  const handleImprimir = async (faturaId: number) => {

    try {

      const res = await fetch(
        getApiUrl(`/faturas/${faturaId}`),
        { headers: getAuthHeaders() }
      );

      const data = await res.json();

      imprimirFatura(data);

    } catch (err) {

      console.error(err);
      alert('Erro ao imprimir fatura');

    }

  };

  /* =============================== */
  /* RENDER ========================= */
  /* =============================== */

  return (
    <div className="p-8 bg-gray-100 min-h-screen">

      <h1 className="text-2xl font-bold mb-6">
        Pagamentos
      </h1>

      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded shadow">
          {message}
        </div>
      )}

      <form
        onSubmit={criarPagamento}
        className="bg-white p-6 rounded shadow mb-8 grid grid-cols-1 md:grid-cols-4 gap-4"
      >

        <div className="flex flex-col">
          <label className="mb-1 font-medium">
            Fatura
          </label>

          <select
            value={faturaId}
            onChange={e => handleFaturaChange(e.target.value)}
            className="border px-3 py-2 rounded"
            required
          >

            <option value="">
              Selecione
            </option>

            {faturasPendentes.map(f => (
              <option key={f.id} value={f.id}>
                {f.numero} — Saldo: {f.saldo.toLocaleString('pt-AO')} Kz
              </option>
            ))}

          </select>

        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">
            Paciente (opcional)
          </label>

          <select
            value={pacienteId}
            onChange={e => setPacienteId(e.target.value)}
            className="border px-3 py-2 rounded"
          >

            <option value="">
              Selecionar
            </option>

            {pacientes.map(p => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}

          </select>

        </div>

        <div className="flex flex-col">

          <label className="mb-1 font-medium">
            Forma
          </label>

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

        <div className="flex flex-col">

          <label className="mb-1 font-medium">
            Valor
          </label>

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

      <div className="bg-white p-6 rounded shadow overflow-auto">

        <h2 className="text-xl font-semibold mb-4">
          Lista de Pagamentos
        </h2>

        <table className="w-full text-sm">

          <thead>

            <tr className="border-b">
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Fatura</th>
              <th className="p-2 text-left">Forma</th>
              <th className="p-2 text-left">Valor</th>
              <th className="p-2 text-left">Paciente</th>
              <th className="p-2 text-left">Data</th>
              <th className="p-2 text-left">Ações</th>
            </tr>

          </thead>

          <tbody>

            {pagamentos.map(p => (

              <tr key={p.id} className="border-b hover:bg-gray-50">

                <td className="p-2">
                  {p.id}
                </td>

                <td className="p-2">
                  {p.fatura?.numero || p.fatura_id}
                </td>

                <td className="p-2">
                  {p.forma_pagamento}
                </td>

                <td className="p-2">
                  {Number(p.valor).toLocaleString('pt-AO')} Kz
                </td>

                <td className="p-2">
                  {p.paciente?.nome ||
                    p.fatura?.venda?.atendimento?.paciente?.nome ||
                    '-'}
                </td>

                <td className="p-2">
                  {formatDate(p.data_pagamento)}
                </td>

                <td className="p-2">

                  <button
                    onClick={() => p.fatura?.id && handleImprimir(p.fatura.id)}
                    className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 text-xs"
                  >
                    <Printer size={20} />
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );

}