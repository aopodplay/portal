'use client';

import { useEffect, useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import PlayerBar from '@/components/PlayerBar';
import { fetchWithAuth, getApiUrl, getAuthHeaders } from '@/config/api';
import { getFriendlyErrorMessage, parseApiError } from '@/lib/errorHandler';
import {
  Flag,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Music,
  Video as VideoIcon,
  Search,
  ShieldAlert,
} from 'lucide-react';

const REPORT_REASONS = [
  'Conteúdo impróprio ou ofensivo',
  'Direitos de autor / Plágio',
  'Discurso de ódio ou assédio',
  'Spam ou conteúdo enganoso',
  'Informação falsa ou prejudicial',
  'Outro motivo',
];

export default function ReportsChannelPage() {
  const [contentType, setContentType] = useState<'music' | 'video'>('music');
  const [musicList, setMusicList] = useState<any[]>([]);
  const [videoList, setVideoList] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [itemSearch, setItemSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoadingCatalog(true);
        const [mRes, vRes] = await Promise.all([
          fetch(getApiUrl('/api/v1/music?limit=150'), { headers: getAuthHeaders() }),
          fetch(getApiUrl('/api/v1/videos?limit=150'), { headers: getAuthHeaders() }),
        ]);
        const [mBody, vBody] = await Promise.all([
          mRes.json().catch(() => null),
          vRes.json().catch(() => null),
        ]);
        if (mRes.ok && mBody?.success) {
          const items = Array.isArray(mBody.data) ? mBody.data : mBody.data?.items || [];
          setMusicList(items);
        }
        if (vRes.ok && vBody?.success) {
          const items = Array.isArray(vBody.data) ? vBody.data : vBody.data?.items || [];
          setVideoList(items);
        }
      } catch {
        // Silencioso
      } finally {
        setLoadingCatalog(false);
      }
    })();
  }, []);

  const currentItems = useMemo(() => {
    const source = contentType === 'music' ? musicList : videoList;
    const q = itemSearch.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (i) =>
        String(i.title || '').toLowerCase().includes(q) ||
        String(i.artist || '').toLowerCase().includes(q)
    );
  }, [contentType, musicList, videoList, itemSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) {
      setError('Seleciona o conteúdo que pretendes denunciar.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      const res = await fetchWithAuth('/api/v1/reports', {
        method: 'POST',
        body: JSON.stringify({
          content_type: contentType,
          content_id: Number(selectedId),
          reason,
          details: details.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body, 'Não foi possível enviar a denúncia.'));
      }
      setDetails('');
      setSelectedId('');
      setSuccess(
        body?.message || 'Denúncia registada com sucesso. A equipa de moderação irá analisar.'
      );
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível enviar a denúncia.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950/80 to-slate-950 text-white">
      <PodPlaySidebar />

      <main className="ml-0 md:ml-60 min-h-screen pb-28 transition-all duration-300">
        <Header />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <Flag size={24} className="text-red-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Canal de Denúncias</h1>
              <p className="text-sm text-gray-400">
                Reporta conteúdos impróprios, violações de direitos de autor ou infrações às regras da comunidade.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 text-xs text-gray-300">
            <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <p>
              Todas as denúncias são enviadas diretamente para a equipa de moderação no{' '}
              <strong className="text-white">Controlo Geral</strong>. Caso um conteúdo viole as
              normas da PodFéPlay, será bloqueado ou removido.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5"
          >
            <div>
              <label className="block text-xs text-gray-300 mb-2">Tipo de conteúdo *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setContentType('music');
                    setSelectedId('');
                  }}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    contentType === 'music'
                      ? 'bg-purple-600 border-purple-400 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Music size={15} />
                  <span>Música / Áudio</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContentType('video');
                    setSelectedId('');
                  }}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    contentType === 'video'
                      ? 'bg-purple-600 border-purple-400 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <VideoIcon size={15} />
                  <span>Vídeo</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-gray-300">
                Selecionar {contentType === 'music' ? 'música' : 'vídeo'} *
              </label>
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder={`Pesquisar ${contentType === 'music' ? 'música ou artista' : 'vídeo'}...`}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-gray-400"
                />
              </div>
              <select
                required
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loadingCatalog}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-sm text-white"
              >
                <option value="">
                  {loadingCatalog
                    ? 'A carregar catálogo...'
                    : `Seleciona ${contentType === 'music' ? 'uma música' : 'um vídeo'} (${currentItems.length})`}
                </option>
                {currentItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                    {item.artist ? ` — ${item.artist}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1.5">Motivo da denúncia *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-sm text-white"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1.5">
                Detalhes da denúncia (opcional)
              </label>
              <textarea
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explica o motivo ou indica o minuto/parte em questão..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              <span>Enviar Denúncia</span>
            </button>
          </form>
        </div>
      </main>

      <PlayerBar />
    </div>
  );
}
