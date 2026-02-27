'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

export default function ConfiguracaoPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saftMessage, setSaftMessage] = useState('');

  const fetchConfig = async () => {
    try {
      const res = await fetch(getApiUrl('/configuracoes-sistema'), {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error(err);
      setMessage('Erro ao carregar configuração');
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const updateConfig = async (e: any) => {
    e.preventDefault();
    if (!config) return;
    setLoading(true);

    try {
      const body: any = { ...config };
      delete body.id;

      const res = await fetch(getApiUrl(`/configuracoes-sistema/${config.id}`), {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Erro ao atualizar configuração');
      const updated = await res.json();
      setConfig(updated);
      setMessage('Configuração atualizada com sucesso');
    } catch (err: any) {
      console.error(err);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile || !config) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('logo', logoFile);

    try {
      const { Authorization } = getAuthHeaders();

      const res = await fetch(getApiUrl('/configuracoes-sistema/logo'), {
        method: 'POST',
        headers: {
          Authorization
        },
        body: formData
      });

      if (!res.ok) throw new Error('Erro ao enviar logo');

      const data = await res.json();

      // Atualiza config com o novo caminho da logo
      setConfig({ ...config, logo: data.logo });
      setMessage('Logo atualizada com sucesso');

    } catch (err: any) {
      console.error(err);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const gerarSAFT = async () => {
    if (!config) return;
    setSaftMessage('Gerando SAF-T...');
    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/configuracoes-sistema/gerar-saf-t'), {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error('Erro ao gerar SAF-T');
      const data = await res.json();
      setSaftMessage(`SAF-T gerado com sucesso! Arquivo: ${data.path}`);
    } catch (err: any) {
      console.error(err);
      setSaftMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // qui está o ajuste importante
  const logoUrl = config?.logo ? getApiUrl(config.logo) : null;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Configuração do Sistema</h1>

      {message && (
        <div className="mb-6 p-3 bg-green-100 text-green-700 rounded shadow">
          {message}
        </div>
      )}

      {config && (
        <form onSubmit={updateConfig} className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* CARD DADOS DO SISTEMA */}
          <div className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-xl font-semibold mb-2">Dados do Sistema</h2>

            <div className="flex flex-col">
              <label className="mb-1 font-medium">Nome do Sistema</label>
              <input
                type="text"
                value={config.nome_sistema || ''}
                onChange={e => setConfig({ ...config, nome_sistema: e.target.value })}
                className="border px-3 py-2 rounded focus:ring focus:ring-blue-200"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-medium">Endereço</label>
              <input
                type="text"
                value={config.endereco || ''}
                onChange={e => setConfig({ ...config, endereco: e.target.value })}
                className="border px-3 py-2 rounded focus:ring focus:ring-blue-200"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-medium">Telefone</label>
              <input
                type="text"
                value={config.telefone || ''}
                onChange={e => setConfig({ ...config, telefone: e.target.value })}
                className="border px-3 py-2 rounded focus:ring focus:ring-blue-200"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-medium">Email</label>
              <input
                type="email"
                value={config.email || ''}
                onChange={e => setConfig({ ...config, email: e.target.value })}
                className="border px-3 py-2 rounded focus:ring focus:ring-blue-200"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-medium">Moeda</label>
              <input
                type="text"
                value={config.moeda || 'Kz'}
                onChange={e => setConfig({ ...config, moeda: e.target.value })}
                className="border px-3 py-2 rounded focus:ring focus:ring-blue-200"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-medium">Desconto Padrão (%)</label>
              <input
                type="number"
                value={config.desconto_padrao || 0}
                onChange={e => setConfig({ ...config, desconto_padrao: Number(e.target.value) })}
                className="border px-3 py-2 rounded focus:ring focus:ring-blue-200"
              />
            </div>
          </div>

          {/* CARD EMPRESA E LOGO */}
          <div className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-xl font-semibold mb-2">Dados da Empresa & Logo</h2>

            <div className="flex flex-col">
              <label className="mb-1 font-medium">Nome da Empresa</label>
              <input
                type="text"
                value={config.empresa_nome || ''}
                onChange={e => setConfig({ ...config, empresa_nome: e.target.value })}
                className="border px-3 py-2 rounded focus:ring focus:ring-blue-200"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-medium">NIF</label>
              <input
                type="text"
                value={config.empresa_nif || ''}
                onChange={e => setConfig({ ...config, empresa_nif: e.target.value })}
                className="border px-3 py-2 rounded focus:ring focus:ring-blue-200"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-medium">Morada</label>
              <input
                type="text"
                value={config.empresa_morada || ''}
                onChange={e => setConfig({ ...config, empresa_morada: e.target.value })}
                className="border px-3 py-2 rounded focus:ring focus:ring-blue-200"
                required
              />
            </div>

            <div className="flex flex-col items-start gap-3">
              <label className="font-medium">Logo</label>

              <input
                type="file"
                onChange={e => setLogoFile(e.target.files?.[0] || null)}
              />

              <button
                type="button"
                onClick={uploadLogo}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Enviar Logo
              </button>

              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-16 mt-2 object-contain"
                />
              )}
            </div>
          </div>

          {/* CARD SAF-T */}
          <div className="md:col-span-2 bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-xl font-semibold mb-2">Gerar SAF-T</h2>

            <p className="mb-3 text-gray-700">
              Clique no botão abaixo para gerar o SAF-T completo no padrão AGT.
            </p>

            <button
              type="button"
              onClick={gerarSAFT}
              className="px-6 py-3 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              disabled={loading}
            >
              {loading ? 'Gerando...' : 'Gerar SAF-T'}
            </button>

            {saftMessage && (
              <p className="mt-2 text-green-700">{saftMessage}</p>
            )}
          </div>

          {/* BOTÃO SALVAR */}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {loading ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}