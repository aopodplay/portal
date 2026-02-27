'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

/* Tipagens */

interface Paciente { id: number; nome: string; nif?: string }
interface Produto { id: number; nome: string; preco: number }
interface Servico { id: number; nome: string; valor: number }
interface VendaItem { id?: number; quantidade: number; preco_unitario: number; subtotal: number; produto?: Produto; servico?: Servico; produto_id?: number; servico_id?: number }
interface Atendimento { id: number; status: string; paciente: Paciente }
interface Venda { id: number; atendimento?: Atendimento; itens: VendaItem[] }
interface Pagamento { id: number; valor: number; forma_pagamento: string; paciente?: Paciente }
type StatusFatura = 'pendente' | 'pago' | 'cancelada'
interface Fatura { id: number; numero: string; total: number; status: StatusFatura; data_emissao: string; venda?: Venda; pagamentos: Pagamento[] }
interface User { role?: string }

/* FALLBACK CLÍNICA */

const CLINICA = {
  nome: 'Prestígio Óptica',
  endereco: 'Via camama-fubu junto ao primeiro retorno, rua 14.',
  telefone: '+244 937482426',
  nif: '5000511749',
};

/*Página */

export default function FaturasPage({ user }: { user?: User }) {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFatura, setEditingFatura] = useState<Fatura | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [config, setConfig] = useState<any>(null);

  const logoUrl = config?.logo ? getApiUrl(config.logo) : null;

  /* Função imprimir fatura */
  const imprimirFatura = (f: Fatura, pacienteNome: string, logo: string | null) => {
    const win = window.open('', '_blank');
    if (!win) return;

    const itens = f.venda?.itens || [];
    const formasPagamento = f.pagamentos?.map(p => p.forma_pagamento.toUpperCase()).join(', ') || 'DINHEIRO';

    //  Linhas de produtos e serviços  
    const linhasProdutos = itens.length
      ? itens.map(item => {
        const descricao = item.produto?.nome || item.servico?.nome || '-';
        const precoUnit = Number(item.preco_unitario || (item.produto?.preco || item.servico?.valor || 0));
        const subtotal = Number(item.subtotal || 0);

        return `
<tr>
  <td>${descricao}</td>
  <td style="text-align:center;">${item.quantidade}</td>
  <td style="text-align:right;">${precoUnit.toLocaleString('pt-AO')} Kz</td>
  <td style="text-align:right;">${subtotal.toLocaleString('pt-AO')} Kz</td>
</tr>
`;
      }).join('')
      : `<tr><td colspan="4" style="text-align:center;">Sem itens</td></tr>`;

    const nomeClinica = config?.nome_sistema || CLINICA.nome;
    const endereco = config?.endereco || CLINICA.endereco;
    const telefone = config?.telefone || CLINICA.telefone;
    const nif = config?.nif || CLINICA.nif;

    const totalPago = f.pagamentos?.reduce((acc, p) => acc + Number(p.valor), 0) || 0;
    const saldo = Number(f.total) - totalPago;

    win.document.write(`
<html>
<head>
<title>Fatura ${f.numero}</title>
<style>
@page { size: A4; margin: 20mm; }
body { font-family: Arial, sans-serif; font-size: 13px; color: #000; }
.header { display: flex; justify-content: space-between; align-items: center; }
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
  <div>${logo ? `<img src="${logo}" class="logo"/>` : `<strong style="font-size:18px;">${nomeClinica}</strong>`}</div>
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
  <strong>Nº:</strong> ${f.numero}<br/>
  <strong>Data de Emissão:</strong> ${new Date(f.data_emissao).toLocaleString()}<br/>
  <strong>Cliente:</strong> ${pacienteNome}<br/>
  <strong>Status:</strong> ${f.status.toUpperCase()}<br/>
  <strong>Forma Pagamento:</strong> ${formasPagamento}
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
  <div>Total Pago: ${totalPago.toLocaleString('pt-AO')} Kz</div>
  <div>Saldo: ${saldo.toLocaleString('pt-AO')} Kz</div>
  <div class="total-line">Total Geral: ${Number(f.total).toLocaleString('pt-AO')} Kz</div>
</div>

<div class="signature">
  <div>___________________________<br/>Assinatura do Cliente</div>
  <div>___________________________<br/>Assinatura do Responsável</div>
</div>

<div class="footer">
  Documento processado por programa informático certificado • 
  Emitido em ${new Date().toLocaleString()} • 
  Hash: ${f.id}-${f.numero}
</div>

<script>
window.onload = function() { window.print(); window.close(); }
</script>

</body>
</html>
`);
    win.document.close();
  };

  /* Buscar Faturas e Extras*/

  async function fetchFaturas() {
    try {
      const res = await fetch(getApiUrl('/faturas'), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      const arr = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      const normalizadas = arr.map((f: any) => ({ ...f, status: String(f.status).toLowerCase() as StatusFatura }));
      setFaturas(normalizadas);
    } catch (err: any) {
      console.error('Erro ao buscar faturas:', err);
      setError(err.message || 'Erro desconhecido');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    fetchFaturas();

    const fetchExtras = async () => {
      try {
        const [cfg, prods, servs] = await Promise.all([
          fetch(getApiUrl('/configuracoes-sistema'), { headers: getAuthHeaders() }).then(r => r.json()),
          fetch(getApiUrl('/produtos'), { headers: getAuthHeaders() }).then(r => r.json()),
          fetch(getApiUrl('/servicos'), { headers: getAuthHeaders() }).then(r => r.json())
        ]);
        setConfig(cfg);
        setProdutos(prods.data || prods);
        setServicos(servs.data || servs);
      } catch (err) { console.error('Erro ao carregar extras:', err); }
    };

    fetchExtras();
  }, []);

  /* Cancelar Fatura (permitido para admin e caixa)*/
const cancelarFatura = async (fatura: Fatura) => {
  const role = (user?.role || '').toLowerCase(); 
  if (!role || !['admin', 'caixa'].includes(role)) {
    setShowModal(true);
    return;
  }

  if (!confirm(`Deseja cancelar a fatura ${fatura.numero}?`)) return;

  try {
    const res = await fetch(getApiUrl(`/faturas/${fatura.id}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Erro ao cancelar a fatura');
    }

    setFaturas(prev => prev.map(f => f.id === fatura.id ? { ...f, status: 'cancelada' } : f));
    alert(`Fatura ${fatura.numero} cancelada com sucesso.`);
  } catch (err: any) {
    console.error('Erro ao cancelar fatura:', err);
    alert('Erro ao cancelar fatura: ' + (err.message || 'Desconhecido'));
  }
};

  /* Salvar edição */

  const salvarEdicao = async () => {
    if (!editingFatura) return;

    try {
      const res = await fetch(getApiUrl(`/faturas/${editingFatura.id}`), {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forma_pagamento: editingFatura.forma_pagamento,
          status: editingFatura.status,
          itens: editingFatura.venda?.itens.map(i => ({
            id: i.id,
            produto_id: i.produto?.id || i.produto_id || null,
            servico_id: i.servico?.id || i.servico_id || null,
            quantidade: i.quantidade,
            preco_unitario: i.preco_unitario
          }))
        })
      });

      if (!res.ok) throw new Error((await res.json()).error);
      const atualizada = await res.json();
      const faturaNormalizada = { ...atualizada, status: String(atualizada.status).toLowerCase() as StatusFatura };
      setFaturas(prev => prev.map(f => f.id === faturaNormalizada.id ? faturaNormalizada : f));
      setEditingFatura(null);
    } catch (err: any) { alert(err.message); }
  };

  /* Render */

  if (loading) return <p className="p-6 text-gray-500">Carregando faturas...</p>;
  if (error) return <p className="p-6 text-red-500">Erro: {error}</p>;
  if (!faturas.length) return <p className="p-6 text-gray-500">Nenhuma fatura encontrada.</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <h1 className="text-3xl font-bold mb-6">Faturas</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faturas.map(f => {
          const pacienteNome = f.pagamentos?.find(p => p.paciente)?.paciente?.nome
            || f.venda?.atendimento?.paciente?.nome
            || 'Cliente Avulso';
          return (
            <div key={f.id} className="bg-white shadow rounded p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{f.numero}</span>
                <span className={`px-2 py-1 rounded text-white text-xs ${f.status === 'pendente' ? 'bg-yellow-400' : f.status === 'pago' ? 'bg-green-500' : 'bg-red-500'}`}>{f.status.toUpperCase()}</span>
              </div>
              <span className="text-sm text-gray-500">Paciente: {pacienteNome}</span>
              <span className="text-sm text-gray-500">Total: {Number(f.total).toLocaleString('pt-AO')} Kz</span>
              <span className="text-sm text-gray-500">Emitida: {new Date(f.data_emissao).toLocaleDateString()}</span>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => imprimirFatura(f, pacienteNome, logoUrl)} // <--- passar logoUrl
                  className="flex-1 bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700"
                >
                  Imprimir
                </button>
                {f.status === 'pendente' && (
                  <>
                    <button onClick={() => setEditingFatura(f)} className="flex-1 bg-yellow-500 text-white py-1 rounded text-sm hover:bg-yellow-600">Editar</button>
                    <button onClick={() => cancelarFatura(f)} className="flex-1 bg-red-600 text-white py-1 rounded text-sm hover:bg-red-700">Cancelar</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de edição */}
      {editingFatura && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 overflow-auto p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Editar {editingFatura.numero}</h2>

            {/* Itens da venda */}
            {editingFatura.venda?.itens.map((item, index) => (
              <div key={item.id || index} className="flex gap-3 mb-3 items-center">
                <select
                  className="flex-1 border p-1 rounded"
                  value={item.produto?.id || item.servico?.id || ''}
                  onChange={(e) => {
                    const novaLista = [...editingFatura.venda!.itens];
                    const produtoSelecionado = produtos.find(p => p.id === Number(e.target.value));
                    const servicoSelecionado = servicos.find(s => s.id === Number(e.target.value));
                    if (produtoSelecionado) {
                      novaLista[index].produto = produtoSelecionado;
                      novaLista[index].servico = undefined;
                      novaLista[index].preco_unitario = produtoSelecionado.preco;
                    } else if (servicoSelecionado) {
                      novaLista[index].servico = servicoSelecionado;
                      novaLista[index].produto = undefined;
                      novaLista[index].preco_unitario = servicoSelecionado.valor;
                    }
                    novaLista[index].subtotal = novaLista[index].quantidade * novaLista[index].preco_unitario;
                    const novoTotal = novaLista.reduce((acc, i) => acc + i.subtotal, 0);
                    setEditingFatura({ ...editingFatura, total: novoTotal, venda: { ...editingFatura.venda!, itens: novaLista } });
                  }}
                >
                  <option value="">Selecionar Produto/Serviço</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>

                <input type="number" className="border p-1 w-20" min={0} value={item.quantidade}
                  onChange={(e) => {
                    const novaLista = [...editingFatura.venda!.itens];
                    novaLista[index].quantidade = Number(e.target.value);
                    novaLista[index].subtotal = novaLista[index].quantidade * novaLista[index].preco_unitario;
                    const novoTotal = novaLista.reduce((acc, i) => acc + i.subtotal, 0);
                    setEditingFatura({ ...editingFatura, total: novoTotal, venda: { ...editingFatura.venda!, itens: novaLista } });
                  }}
                />

                <input type="number" className="border p-1 w-28" min={0} value={item.preco_unitario}
                  onChange={(e) => {
                    const novaLista = [...editingFatura.venda!.itens];
                    novaLista[index].preco_unitario = Number(e.target.value);
                    novaLista[index].subtotal = novaLista[index].quantidade * novaLista[index].preco_unitario;
                    const novoTotal = novaLista.reduce((acc, i) => acc + i.subtotal, 0);
                    setEditingFatura({ ...editingFatura, total: novoTotal, venda: { ...editingFatura.venda!, itens: novaLista } });
                  }}
                />

                <span className="w-24 text-right">{item.subtotal.toLocaleString('pt-AO')} Kz</span>

                <button className="bg-red-500 text-white px-2 py-1 rounded"
                  onClick={() => {
                    const novaLista = editingFatura.venda!.itens.filter((_, i) => i !== index);
                    const novoTotal = novaLista.reduce((acc, i) => acc + i.subtotal, 0);
                    setEditingFatura({ ...editingFatura, total: novoTotal, venda: { ...editingFatura.venda!, itens: novaLista } });
                  }}>Remover</button>
              </div>
            ))}

            <button className="bg-blue-600 text-white px-3 py-1 rounded mb-4"
              onClick={() => {
                const novaLista = [...(editingFatura.venda?.itens || []), { quantidade: 1, preco_unitario: 0, subtotal: 0 } as VendaItem];
                setEditingFatura({ ...editingFatura, venda: { ...editingFatura.venda!, itens: novaLista } });
              }}
            >Adicionar Item</button>

            {/* Forma de pagamento e status */}
            <div className="flex gap-3 mt-4">
              <select value={editingFatura.forma_pagamento} onChange={e => setEditingFatura({ ...editingFatura, forma_pagamento: e.target.value })} className="border p-1 rounded">
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
                <option value="transferencia">Transferência</option>
              </select>
              <select value={editingFatura.status} onChange={e => setEditingFatura({ ...editingFatura, status: e.target.value as StatusFatura })} className="border p-1 rounded">
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div className="flex justify-between mt-4 font-semibold">
              <span>Total:</span>
              <span>{editingFatura.total.toLocaleString('pt-AO')} Kz</span>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditingFatura(null)} className="bg-gray-400 text-white px-4 py-2 rounded">Fechar</button>
              <button onClick={salvarEdicao} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Acesso Negado</h2>
            <p className="mb-4">Você não tem permissão para cancelar esta fatura.</p>
            <button onClick={() => setShowModal(false)} className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
