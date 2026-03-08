'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

interface PlanoSeguro {
  id: number;
  nome: string;
  ativo: boolean;
  seguradora_id: number;
  coberturas?: { id: number; tipo_servico: string }[];
}

interface Seguradora {
  id: number;
  nome: string;
  nif?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  planos?: PlanoSeguro[];
}

interface Autorizacao {
  id: number;
  numero_autorizacao: string;
  valor_autorizado: number;
  status: string;
  plano_seguro_id: number;
  plano?: { id: number; nome: string };
}

interface Cobertura {
  id?: number;
  tipo_servico: string;
  percentual_cobertura: number;
  limite_valor?: number;
  plano_seguro_id: number;
}

export default function SegurosPage() {
  const [tab, setTab] = useState<'seguradoras' | 'planos' | 'coberturas' | 'autorizacoes'>('seguradoras');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // =======================
  // Dados
  // =======================
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]);
  const [planos, setPlanos] = useState<PlanoSeguro[]>([]);
  const [autorizacoes, setAutorizacoes] = useState<Autorizacao[]>([]);
  const [coberturas, setCoberturas] = useState<Cobertura[]>([]);

  // =======================
  // Formulários
  // =======================
  const [novoSeg, setNovoSeg] = useState({ nome: '', nif: '', telefone: '', email: '', ativo: true });
  const [novoPlano, setNovoPlano] = useState({ nome: '', seguradora_id: 0, ativo: true });
  const [novaCobertura, setNovaCobertura] = useState<Cobertura>({
    tipo_servico: 'consulta',
    percentual_cobertura: 0,
    limite_valor: 0,
    plano_seguro_id: 0
  });
  const [novaAutorizacao, setNovaAutorizacao] = useState({ numero_autorizacao: '', valor_autorizado: 0, plano_seguro_id: 0, status: 'pendente' });

  // =======================
  // Fetch APIs
  // =======================
  const fetchSeguradoras = async () => {
    setLoading(true); setMessage('');
    try {
      const res = await fetch(getApiUrl('/seguradoras'), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao buscar seguradoras');
      setSeguradoras(await res.json());
    } catch (err: any) { setMessage(err.message); }
    finally { setLoading(false); }
  };

  const fetchPlanos = async () => {
    setLoading(true); setMessage('');
    try {
      const res = await fetch(getApiUrl('/planos'), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao buscar planos');
      setPlanos(await res.json());
    } catch (err: any) { setMessage(err.message); }
    finally { setLoading(false); }
  };

  const fetchAutorizacoes = async () => {
    setLoading(true); setMessage('');
    try {
      const res = await fetch(getApiUrl('/autorizacoes'), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao buscar autorizações');
      setAutorizacoes(await res.json());
    } catch (err: any) { setMessage(err.message); }
    finally { setLoading(false); }
  };

  const fetchCoberturas = async () => {
    setLoading(true); setMessage('');
    try {
      const res = await fetch(getApiUrl('/coberturas'), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao buscar coberturas');
      setCoberturas(await res.json());
    } catch (err: any) { setMessage(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'seguradoras') fetchSeguradoras();
    if (tab === 'planos') fetchPlanos();
    if (tab === 'coberturas') fetchCoberturas();
    if (tab === 'autorizacoes') fetchAutorizacoes();
  }, [tab]);

  // =======================
  // CRUD Funções
  // =======================
  // --- Seguradora ---
  const criarSeguradora = async () => {
    if (!novoSeg.nome) { setMessage('Nome é obrigatório'); return; }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/seguradoras'), { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(novoSeg) });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar seguradora');
      const data = await res.json();
      setSeguradoras([data, ...seguradoras]);
      setNovoSeg({ nome: '', nif: '', telefone: '', email: '', ativo: true });
      setMessage('Seguradora criada com sucesso');
    } catch (err: any) { setMessage(err.message); }
    finally { setLoading(false); }
  };

  const toggleSegAtivo = async (seg: Seguradora) => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/seguradoras/${seg.id}`), { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ ativo: !seg.ativo }) });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao atualizar seguradora');
      const updated = await res.json();
      setSeguradoras(seguradoras.map(s => s.id === updated.id ? updated : s));
    } catch (err: any) { setMessage(err.message); }
    finally { setLoading(false); }
  };

  const deleteSeg = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/seguradoras/${id}`), { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao deletar seguradora');
      setSeguradoras(seguradoras.filter(s => s.id !== id));
    } catch (err: any) { setMessage(err.message); }
    finally { setLoading(false); }
  };

  // --- Plano ---
  const criarPlano = async () => {
    if (!novoPlano.nome || !novoPlano.seguradora_id) { setMessage('Nome e seguradora são obrigatórios'); return; }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/seguradoras/planos'), { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(novoPlano) });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar plano');
      const data = await res.json();
      setPlanos([data, ...planos]);
      setNovoPlano({ nome: '', seguradora_id: 0, ativo: true });
    } catch (err: any) { setMessage(err.message); }
    finally { setLoading(false); }
  };

  const togglePlanoAtivo = async (p: PlanoSeguro) => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/seguradoras/planos/${p.id}`), { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ ativo: !p.ativo }) });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao atualizar plano');
      const updated = await res.json();
      setPlanos(planos.map(pl => pl.id === updated.id ? updated : pl));
    } catch (err: any) { setMessage(err.message); }
    finally { setLoading(false); }
  };

  const deletePlano = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/seguradoras/planos/${id}`), { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao deletar plano');
      setPlanos(planos.filter(pl => pl.id !== id));
    } catch (err: any) { setMessage(err.message); }
    finally { setLoading(false); }
  };

  // --- Coberturas ---
  const criarCobertura = async () => {
    if (!novaCobertura.tipo_servico || !novaCobertura.plano_seguro_id) { setMessage('Plano e tipo de serviço obrigatórios'); return; }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/seguradoras/coberturas'), { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(novaCobertura) });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar cobertura');
      const data = await res.json();
      setCoberturas([data, ...coberturas]);
      setNovaCobertura({ tipo_servico: 'consulta', percentual_cobertura: 0, limite_valor: 0, plano_seguro_id: 0 });
    } catch (err: any) { setMessage(err.message); }
    finally { setLoading(false); }
  };

  // --- Autorizações ---
  const criarAutorizacao = async () => {
    if (!novaAutorizacao.numero_autorizacao || !novaAutorizacao.plano_seguro_id) { setMessage('Número e plano obrigatórios'); return; }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/seguradoras/autorizacoes'), { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(novaAutorizacao) });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar autorização');
      const data = await res.json();
      setAutorizacoes([data, ...autorizacoes]);
      setNovaAutorizacao({ numero_autorizacao: '', valor_autorizado: 0, plano_seguro_id: 0, status: 'pendente' });
    } catch (err: any) { setMessage(err.message); }
    finally { setLoading(false); }
  };

  // =======================
  // JSX
  // =======================
  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Gestão Completa de Seguros</h1>
      {message && <div className="p-3 bg-gray-100 border rounded shadow">{message}</div>}

      <div className="flex gap-2">
        <button className={`px-4 py-2 rounded ${tab==='seguradoras'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setTab('seguradoras')}>Seguradoras</button>
        <button className={`px-4 py-2 rounded ${tab==='planos'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setTab('planos')}>Planos</button>
        <button className={`px-4 py-2 rounded ${tab==='coberturas'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setTab('coberturas')}>Coberturas</button>
        <button className={`px-4 py-2 rounded ${tab==='autorizacoes'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setTab('autorizacoes')}>Autorizações</button>
      </div>

      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        {loading && <p>Carregando...</p>}

        {/* ================= Seguradoras ================= */}
        {tab==='seguradoras' && (
          <>
            <h2 className="text-xl font-semibold mb-2">Nova Seguradora</h2>
            <div className="flex gap-2 flex-wrap mb-4">
              <input placeholder="Nome" value={novoSeg.nome} onChange={e=>setNovoSeg({...novoSeg,nome:e.target.value})} className="border p-2 rounded" />
              <input placeholder="NIF" value={novoSeg.nif} onChange={e=>setNovoSeg({...novoSeg,nif:e.target.value})} className="border p-2 rounded" />
              <input placeholder="Telefone" value={novoSeg.telefone} onChange={e=>setNovoSeg({...novoSeg,telefone:e.target.value})} className="border p-2 rounded" />
              <input placeholder="Email" value={novoSeg.email} onChange={e=>setNovoSeg({...novoSeg,email:e.target.value})} className="border p-2 rounded" />
              <button onClick={criarSeguradora} className="bg-green-600 text-white px-4 py-2 rounded">Criar</button>
            </div>

            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Nome</th>
                  <th className="border p-2">NIF</th>
                  <th className="border p-2">Telefone</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Ativo</th>
                  <th className="border p-2">Planos</th>
                  <th className="border p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {seguradoras.map(s=>(
                  <tr key={s.id}>
                    <td className="border p-2">{s.nome}</td>
                    <td className="border p-2">{s.nif||'-'}</td>
                    <td className="border p-2">{s.telefone||'-'}</td>
                    <td className="border p-2">{s.email||'-'}</td>
                    <td className="border p-2">{s.ativo?'Sim':'Não'}</td>
                    <td className="border p-2">{s.planos?.map(p=>p.nome).join(', ')||'-'}</td>
                    <td className="border p-2 flex gap-1">
                      <button onClick={()=>toggleSegAtivo(s)} className="bg-blue-600 text-white px-2 py-1 rounded">{s.ativo?'Desativar':'Ativar'}</button>
                      <button onClick={()=>deleteSeg(s.id)} className="bg-red-600 text-white px-2 py-1 rounded">Deletar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* ================= Planos ================= */}
        {tab==='planos' && (
          <>
            <h2 className="text-xl font-semibold mb-2">Novo Plano</h2>
            <div className="flex gap-2 flex-wrap mb-4">
              <input placeholder="Nome" value={novoPlano.nome} onChange={e=>setNovoPlano({...novoPlano,nome:e.target.value})} className="border p-2 rounded" />
              <select value={novoPlano.seguradora_id} onChange={e=>setNovoPlano({...novoPlano,seguradora_id: Number(e.target.value)})} className="border p-2 rounded">
                <option value={0}>Selecione Seguradora</option>
                {seguradoras.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
              <button onClick={criarPlano} className="bg-green-600 text-white px-4 py-2 rounded">Criar</button>
            </div>

            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Nome</th>
                  <th className="border p-2">Seguradora</th>
                  <th className="border p-2">Ativo</th>
                  <th className="border p-2">Coberturas</th>
                  <th className="border p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {planos.map(p=>(
                  <tr key={p.id}>
                    <td className="border p-2">{p.nome}</td>
                    {/* Aqui está o ajuste principal */}
                    <td className="border p-2">{seguradoras.find(s => s.id === p.seguradora_id)?.nome || 'Não encontrada'}</td>
                    <td className="border p-2">{p.ativo?'Sim':'Não'}</td>
                    <td className="border p-2">{p.coberturas?.map(c=>c.tipo_servico).join(', ')||'-'}</td>
                    <td className="border p-2 flex gap-1">
                      <button onClick={()=>togglePlanoAtivo(p)} className="bg-blue-600 text-white px-2 py-1 rounded">{p.ativo?'Desativar':'Ativar'}</button>
                      <button onClick={()=>deletePlano(p.id)} className="bg-red-600 text-white px-2 py-1 rounded">Deletar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* ================= Coberturas ================= */}
        {tab==='coberturas' && (
          <>
            <h2 className="text-xl font-semibold mb-2">Nova Cobertura</h2>
            <div className="flex gap-2 flex-wrap mb-4">
              <select value={novaCobertura.plano_seguro_id} onChange={e=>setNovaCobertura({...novaCobertura,plano_seguro_id: Number(e.target.value)})} className="border p-2 rounded">
                <option value={0}>Selecione Plano</option>
                {planos.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <select value={novaCobertura.tipo_servico} onChange={e=>setNovaCobertura({...novaCobertura,tipo_servico:e.target.value})} className="border p-2 rounded">
                <option value="consulta">Consulta</option>
                <option value="lente">Lente</option>
                <option value="armacao">Armação</option>
                <option value="exame">Exame</option>
              </select>
              <input type="number" placeholder="Percentual (%)" value={novaCobertura.percentual_cobertura} onChange={e=>setNovaCobertura({...novaCobertura,percentual_cobertura:Number(e.target.value)})} className="border p-2 rounded" />
              <input type="number" placeholder="Limite Valor" value={novaCobertura.limite_valor} onChange={e=>setNovaCobertura({...novaCobertura,limite_valor:Number(e.target.value)})} className="border p-2 rounded" />
              <button onClick={criarCobertura} className="bg-green-600 text-white px-4 py-2 rounded">Criar</button>
            </div>

            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Plano</th>
                  <th className="border p-2">Tipo Serviço</th>
                  <th className="border p-2">Percentual</th>
                  <th className="border p-2">Limite</th>
                </tr>
              </thead>
              <tbody>
                {coberturas.map(c=>(
                  <tr key={c.id}>
                    <td className="border p-2">{planos.find(p=>p.id===c.plano_seguro_id)?.nome || '-'}</td>
                    <td className="border p-2">{c.tipo_servico}</td>
                    <td className="border p-2">{c.percentual_cobertura}</td>
                    <td className="border p-2">{c.limite_valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* ================= Autorizações ================= */}
        {tab==='autorizacoes' && (
          <>
            <h2 className="text-xl font-semibold mb-2">Nova Autorização</h2>
            <div className="flex gap-2 flex-wrap mb-4">
              <input placeholder="Número Autorização" value={novaAutorizacao.numero_autorizacao} onChange={e=>setNovaAutorizacao({...novaAutorizacao,numero_autorizacao:e.target.value})} className="border p-2 rounded" />
              <input type="number" placeholder="Valor Autorizado" value={novaAutorizacao.valor_autorizado} onChange={e=>setNovaAutorizacao({...novaAutorizacao,valor_autorizado:Number(e.target.value)})} className="border p-2 rounded" />
              <select value={novaAutorizacao.plano_seguro_id} onChange={e=>setNovaAutorizacao({...novaAutorizacao,plano_seguro_id:Number(e.target.value)})} className="border p-2 rounded">
                <option value={0}>Selecione Plano</option>
                {planos.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <select value={novaAutorizacao.status} onChange={e=>setNovaAutorizacao({...novaAutorizacao,status:e.target.value})} className="border p-2 rounded">
                <option value="pendente">Pendente</option>
                <option value="aprovado">Aprovado</option>
                <option value="rejeitado">Rejeitado</option>
              </select>
              <button onClick={criarAutorizacao} className="bg-green-600 text-white px-4 py-2 rounded">Criar</button>
            </div>

            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Número</th>
                  <th className="border p-2">Plano</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Valor Autorizado</th>
                </tr>
              </thead>
              <tbody>
                {autorizacoes.map(a=>(
                  <tr key={a.id}>
                    <td className="border p-2">{a.numero_autorizacao}</td>
                    <td className="border p-2">{planos.find(p=>p.id===a.plano_seguro_id)?.nome || '-'}</td>
                    <td className="border p-2">{a.status}</td>
                    <td className="border p-2">{a.valor_autorizado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}