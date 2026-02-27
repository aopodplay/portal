'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

interface Paciente { id: number; nome: string; telefone?: string; nif?: string; }
interface Atendimento { id: number; status: string; }
interface Usuario { id: string; nome: string; }
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
  medicacao?: string; 
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

export default function ReceitasPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [receita, setReceita] = useState<Partial<Receita>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Buscar configuração do sistema
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(getApiUrl('/configuracoes-sistema'), { headers: getAuthHeaders() });
        const data = await res.json();
        setConfig(data);
      } catch (err) {
        console.error('Erro ao carregar config:', err);
      }
    };
    fetchConfig();
  }, []);

  // Buscar consultas concluídas
  useEffect(() => {
    const fetchConsultas = async () => {
      try {
        const res = await fetch(getApiUrl('/consultas/concluidas'), { headers: getAuthHeaders() });
        const data = await res.json();
        setConsultas(Array.isArray(data) ? data : data.data ?? []);
      } catch (err) {
        console.error('Erro ao carregar consultas:', err);
        setMessage('Erro ao carregar consultas concluídas');
      }
    };
    fetchConsultas();
  }, []);

  const logoUrl = config?.logo ? getApiUrl(config.logo) : '/logo.png';
  const nomeSistema = config?.nome_sistema || 'Prestígio Óptica';

  const filteredConsultas = consultas.filter((c) => {
    const nome = c.paciente?.nome.toLowerCase() || '';
    const nif = c.paciente?.nif?.toLowerCase() || '';
    return nome.includes(search.toLowerCase()) || nif.includes(search.toLowerCase());
  });

  // Ajuste: preenche o campo de medicação da receita com valores da consulta
  const handleSelectConsulta = (c: Consulta) => {
    setSelectedConsulta(c);
    setMessage('');
    const existing = c.receita;

    setReceita({
      consulta_id: c.id,
      id: existing?.id,
      numero_receita: existing?.numero_receita,
      pdf_path: existing?.pdf_path,
      olho_direito: existing?.olho_direito || (c.od_esferico ? `${c.od_esferico} ${c.od_cilindrico || ''} ${c.od_eixo || ''}`.trim() : ''),
      olho_esquerdo: existing?.olho_esquerdo || (c.oe_esferico ? `${c.oe_esferico} ${c.oe_cilindrico || ''} ${c.oe_eixo || ''}`.trim() : ''),
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
      medicacao: existing?.medicacao || c.observacoes || '', 
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
      const res = await fetch(getApiUrl(receita.id ? `/receitas/${receita.id}` : '/receitas'), {
        method: receita.id ? 'PUT' : 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro na API');
      const data = await res.json();
      setReceita(data);
      setMessage('Receita registrada com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar receita:', err);
      setMessage('Erro ao registrar receita');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!receita.id) return;
    if (!confirm('Tem certeza que deseja deletar esta receita?')) return;
    try {
      const res = await fetch(getApiUrl(`/receitas/${receita.id}`), { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) { console.error('Erro na API ao deletar receita', await res.text()); setMessage('Erro ao deletar receita'); return; }
      setMessage('Receita deletada com sucesso');
      setSelectedConsulta(null);
      setReceita({});
      setConsultas((prev) => prev.map((c) => (c.id === receita.consulta_id ? { ...c, receita: undefined } : c)));
    } catch (err) { console.error('Erro ao deletar receita:', err); setMessage('Erro ao deletar receita'); }
  };

  const imprimirReceitaA4 = (r: Partial<Receita>, c: Consulta | null) => {
    if (!c || !r) return;
    const win = window.open('', '_blank');
    if (!win) return;

    const logoTag = config?.logo || '/logo.png'
      ? `<img src="${config?.logo ? getApiUrl(config.logo) : '/logo.png'}" class="logo"/>`
      : `<div style="font-size:20px;font-weight:bold;">${config?.nome_sistema || 'Prestígio Óptica'}</div>`;

    win.document.write(`
      <html>
        <head>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; }
            .container { width: 100%; padding: 20px; box-sizing: border-box; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .logo { height: 80px; }
            .clinic-info { text-align: right; font-size: 14px; line-height: 1.4; }
            h1 { text-align: center; font-size: 22px; margin-bottom: 20px; }
            .info-grid { font-size: 14px; margin-bottom: 20px; line-height: 1.4; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
            th, td { border: 1px solid #333; padding: 8px; text-align: center; }
            th { background: #f3f3f3; }
            .observacoes { margin-bottom: 40px; }
            .assinatura { display: flex; justify-content: space-between; margin-top: 60px; }
            .assinatura div { text-align: center; font-size: 14px; }
            .footer { font-size: 12px; text-align: center; color: #777; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>${logoTag}</div>
              <div class="clinic-info">
                <strong>${config?.nome_sistema || 'Prestígio Óptica'}</strong><br/>
                ${config?.endereco || ''}<br/>
                Tel: ${config?.telefone || ''}<br/>
                NIF: ${config?.nif || ''}
              </div>
            </div>

            <h1>RECEITA DE ÓCULOS</h1>

            <div class="info-grid">
              <strong>Paciente:</strong> ${c.paciente?.nome}<br/>
              <strong>Nº Receita:</strong> ${r.numero_receita || '-'}<br/>
              <strong>Data:</strong> ${new Date().toLocaleDateString()}<br/>
              <strong>Optometrista:</strong> ${c.optometrista?.nome || '-'}
            </div>

            <table>
              <thead>
                <tr>
                  <th>Olho</th><th>Esfera</th><th>Cilindro</th><th>Eixo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Direito</td><td>${r.od_esferico || '-'}</td><td>${r.od_cilindrico || '-'}</td><td>${r.od_eixo || '-'}</td>
                </tr>
                <tr>
                  <td>Esquerdo</td><td>${r.oe_esferico || '-'}</td><td>${r.oe_cilindrico || '-'}</td><td>${r.oe_eixo || '-'}</td>
                </tr>
                <tr>
                  <td>Adição</td><td colspan="3">${r.adicao || '-'}</td>
                </tr>
              </tbody>
            </table>

            <div class="info-grid observacoes">
              <strong>DNP:</strong> ${r.dnp || '-'}<br/>
              <strong>Diagnóstico:</strong> ${r.diagnostico || '-'}<br/>
              <strong>Observações:</strong> ${r.observacoes || '-'}<br/>
              <strong>Medicação:</strong> ${r.medicacao || '-'}
            </div>

            <div class="assinatura">
              <div>___________________________<br/>Assinatura do Optometrista</div>
              <div>___________________________<br/>Assinatura do Paciente</div>
            </div>

            <div class="footer">Documento gerado pelo sistema • Obrigado pela preferência</div>
          </div>

          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);

    win.document.close();
  };

  return (
    <div className="p-6 w-full">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{nomeSistema} - Receitas</h1>
        {message && <div className="mb-4 p-3 rounded bg-gray-100 text-gray-800">{message}</div>}

        <input type="text" placeholder="Pesquisar por paciente ou NIF..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="mb-4 border px-3 py-2 rounded w-full" />

        <div className="bg-white rounded border divide-y">
          {filteredConsultas.length === 0 && <p className="p-4 text-gray-500">Nenhum paciente encontrado</p>}
          {filteredConsultas.map((c) => (
            <div key={c.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <span className="font-semibold">{c.paciente?.nome}</span>
                {c.paciente?.nif && <span className="text-gray-500 text-sm ml-2">({c.paciente.nif})</span>}
                <div className="text-gray-500 text-sm">Consulta ID: {c.id}</div>
                {c.optometrista && <div className="text-gray-500 text-sm">Optometrista: {c.optometrista.nome}</div>}
              </div>
              <div className="mt-2 md:mt-0">
                <button onClick={() => handleSelectConsulta(c)}
                  className={`px-4 py-1 rounded text-white ${c.receita ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  disabled={!!c.receita}>
                  {c.receita ? 'Receita Gerada' : 'Gerar Receita'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedConsulta && (
          <form onSubmit={handleSubmit} className="mt-6 bg-white p-6 rounded border space-y-4">
            <h2 className="font-semibold text-lg">Gerar Receita - {selectedConsulta.paciente?.nome}
              {selectedConsulta.optometrista && <span className="text-gray-500 text-sm ml-2">({selectedConsulta.optometrista.nome})</span>}
            </h2>

            <div>
              <label className="block mb-1 font-semibold">Número da Receita:</label>
              <input type="text" value={receita.numero_receita || 'Gerado automaticamente'} readOnly
                className="w-full border px-3 py-2 rounded bg-gray-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="olho_direito" value={receita.olho_direito || ''} onChange={handleChange} placeholder="Olho Direito" className="w-full border px-3 py-2 rounded" />
              <input type="text" name="olho_esquerdo" value={receita.olho_esquerdo || ''} onChange={handleChange} placeholder="Olho Esquerdo" className="w-full border px-3 py-2 rounded" />
              <input type="text" name="od_esferico" value={receita.od_esferico || ''} onChange={handleChange} placeholder="OD Esférico" className="w-full border px-3 py-2 rounded" />
              <input type="text" name="od_cilindrico" value={receita.od_cilindrico || ''} onChange={handleChange} placeholder="OD Cilíndrico" className="w-full border px-3 py-2 rounded" />
              <input type="text" name="od_eixo" value={receita.od_eixo || ''} onChange={handleChange} placeholder="OD Eixo" className="w-full border px-3 py-2 rounded" />
              <input type="text" name="oe_esferico" value={receita.oe_esferico || ''} onChange={handleChange} placeholder="OE Esférico" className="w-full border px-3 py-2 rounded" />
              <input type="text" name="oe_cilindrico" value={receita.oe_cilindrico || ''} onChange={handleChange} placeholder="OE Cilíndrico" className="w-full border px-3 py-2 rounded" />
              <input type="text" name="oe_eixo" value={receita.oe_eixo || ''} onChange={handleChange} placeholder="OE Eixo" className="w-full border px-3 py-2 rounded" />
              <input type="text" name="adicao" value={receita.adicao || ''} onChange={handleChange} placeholder="Adição" className="w-full border px-3 py-2 rounded" />
              <input type="text" name="dnp" value={receita.dnp || ''} onChange={handleChange} placeholder="DNP" className="w-full border px-3 py-2 rounded" />
              <input type="text" name="medicacao" value={receita.medicacao || ''} onChange={handleChange} placeholder="Medicação" className="w-full border px-3 py-2 rounded" />
            </div>

            <textarea name="diagnostico" value={receita.diagnostico || ''} onChange={handleChange} placeholder="Diagnóstico" className="w-full border px-3 py-2 rounded" rows={3} />
            <textarea name="observacoes" value={receita.observacoes || ''} onChange={handleChange} placeholder="Observações" className="w-full border px-3 py-2 rounded" rows={3} />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedConsulta(null)} className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-100">Cancelar</button>
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">{loading ? 'Salvando...' : 'Salvar Receita'}</button>
              <button type="button" onClick={() => imprimirReceitaA4(receita, selectedConsulta)} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Imprimir Receita A4</button>
              {receita.id && <button type="button" onClick={handleDelete} className="px-4 py-1 rounded bg-red-600 text-white hover:bg-red-700">Deletar Receita</button>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
