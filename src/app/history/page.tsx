// app/history/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  Trash2,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Search,
  X,
  Music,
  Video as VideoIcon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  History as HistoryIcon,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import PlayerBar from '@/components/PlayerBar';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import ActionModal, { ActionModalConfig } from '@/components/ActionModal';
import { historyApi, HistoryItem } from '@/lib/historyApi';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { resolveThumbUrl } from '@/lib/media';
import { getApiUrl } from '@/config/api';
import { apiJsonFetch, getFriendlyErrorMessage } from '@/lib/errorHandler';

type StatusFilter = 'all' | 'in_progress' | 'completed';
type TypeFilter = 'all' | 'audio' | 'video';

function formatTime(s?: number | null): string {
  if (!s || s < 0) return '0:00';
  const hrs = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (hrs > 0) {
    return `${hrs}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function getDateGroup(dateStr?: string | null): string {
  if (!dateStr) return 'Anteriores';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Anteriores';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfItem = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfItem.getTime()) / 86_400_000);

  if (diffDays <= 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays <= 7) return 'Esta semana';
  return 'Anteriores';
}

function isVideoItem(item: HistoryItem): boolean {
  const t = String(item.type || item.source || '').toLowerCase();
  return t === 'video' || Boolean(item.video_url && !item.audio_url);
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { play, pause, currentMusic, isPlaying } = usePlayer();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filtros interativos
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  // Player modal para vídeos
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  // Modal acessível de confirmação e feedback toast
  const [modalConfig, setModalConfig] = useState<ActionModalConfig | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(
    async (p = 1) => {
      if (!user?.id) {
        setItems([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const data = await historyApi.getHistory({ page: p, limit: 20 });
        setItems(data.items);
        setTotalPages(data.pagination.totalPages || 1);
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'Não foi possível carregar o teu histórico.'));
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (!authLoading) {
      load(page);
    }
  }, [page, authLoading, load]);

  const handlePlayItem = async (item: HistoryItem) => {
    if (isVideoItem(item)) {
      const videoId = item.source_id || item.content_id;
      let resolvedFilePath = item.video_url || '';
      let resolvedThumb = item.cover_url || null;
      let resolvedDesc: string | null = null;
      let resolvedViews = 0;
      let resolvedLikes = 0;

      if (!resolvedFilePath && videoId) {
        try {
          const data = await apiJsonFetch<any>(getApiUrl(`/api/v1/videos/${videoId}`));
          if (data?.file_path) resolvedFilePath = data.file_path;
          if (data?.thumbnail_path) resolvedThumb = data.thumbnail_path;
          if (data?.description) resolvedDesc = data.description;
          if (typeof data?.views === 'number') resolvedViews = data.views;
          if (typeof data?.likes === 'number') resolvedLikes = data.likes;
        } catch {
          // Mantém fallback com os metadados já disponíveis no histórico
        }
      }

      setSelectedVideo({
        id: videoId,
        title: item.title || `Vídeo #${item.content_id}`,
        description: resolvedDesc,
        duration: item.total_duration || item.duration || 0,
        file_path: resolvedFilePath,
        thumbnail_path: resolvedThumb,
        file_size: 0,
        views: resolvedViews,
        likes: resolvedLikes,
        created_at: item.created_at || new Date().toISOString(),
      });
      return;
    }

    const trackId = item.music_id || item.source_id || item.content_id;
    const isSameTrack = currentMusic?.id === trackId;

    if (isSameTrack && isPlaying) {
      pause();
      return;
    }

    play({
      id: trackId,
      title: item.title || `Conteúdo #${item.content_id}`,
      artist: item.full_name || item.username || 'PodféPlay',
      album: null,
      duration: item.total_duration || item.duration || 0,
      file_path: item.audio_url || '',
      file_size: 0,
      cover_image: item.cover_url || null,
      created_at: item.created_at || new Date().toISOString(),
    });
  };

  const handleDelete = (item: HistoryItem) => {
    const label = item.title || `Conteúdo #${item.content_id}`;
    setModalConfig({
      mode: 'confirm',
      title: 'Remover do histórico',
      message: `Queres remover "${label}" do teu histórico de reprodução?`,
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          setRemovingId(item.content_id);
          await historyApi.clearContent(item.content_id);
          setItems((prev) => prev.filter((i) => i.content_id !== item.content_id));
          showToast('success', `"${label}" foi removido do histórico.`);
        } catch (e) {
          showToast('error', getFriendlyErrorMessage(e, 'Não foi possível remover o item.'));
        } finally {
          setRemovingId(null);
        }
      },
    });
  };

  const handleClearAll = () => {
    setModalConfig({
      mode: 'confirm',
      title: 'Limpar todo o histórico',
      message:
        'Tens a certeza que queres apagar todo o teu histórico de reprodução? Esta ação não pode ser desfeita.',
      confirmLabel: 'Limpar tudo',
      cancelLabel: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          await historyApi.clearAll();
          setItems([]);
          setTotalPages(1);
          setPage(1);
          showToast('success', 'Histórico limpo com sucesso.');
        } catch (e) {
          showToast('error', getFriendlyErrorMessage(e, 'Não foi possível limpar o histórico.'));
        }
      },
    });
  };

  // Estatísticas rápidas da lista atual
  const stats = useMemo(() => {
    const completed = items.filter((i) => Boolean(i.completed)).length;
    const inProgress = items.length - completed;
    return { total: items.length, completed, inProgress };
  }, [items]);

  // Filtragem local
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter === 'completed' && !item.completed) return false;
      if (statusFilter === 'in_progress' && item.completed) return false;

      const video = isVideoItem(item);
      if (typeFilter === 'video' && !video) return false;
      if (typeFilter === 'audio' && video) return false;

      if (q) {
        const title = (item.title || '').toLowerCase();
        const creator = (item.full_name || item.username || '').toLowerCase();
        if (!title.includes(q) && !creator.includes(q)) return false;
      }

      return true;
    });
  }, [items, searchQuery, statusFilter, typeFilter]);

  // Agrupamento por data
  const groupedItems = useMemo(() => {
    const order = ['Hoje', 'Ontem', 'Esta semana', 'Anteriores'];
    const map = new Map<string, HistoryItem[]>();
    for (const label of order) map.set(label, []);

    for (const item of filteredItems) {
      const group = getDateGroup(item.last_played_at || item.updated_at || item.created_at);
      map.get(group)!.push(item);
    }

    return order
      .map((label) => ({ label, entries: map.get(label)! }))
      .filter((g) => g.entries.length > 0);
  }, [filteredItems]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'all' || typeFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col overflow-x-clip">
      <Header />

      <div className="flex flex-1 min-h-0">
        <PodPlaySidebar />

        <main id="main-content" className="flex-1 min-w-0 px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-32">
          <div className="max-w-5xl mx-auto">
            {/* Cabeçalho da página */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
                  <Clock className="text-purple-400 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">Histórico de Reprodução</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Retoma rapidamente músicas, podcasts e vídeos onde paraste.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {user && (
                  <button
                    type="button"
                    onClick={() => load(page)}
                    disabled={loading}
                    aria-label="Atualizar histórico"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-white/10 hover:bg-white/15 text-gray-200 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 disabled:opacity-50"
                  >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
                    <span className="hidden sm:inline">Atualizar</span>
                  </button>
                )}

                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-300 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    Limpar tudo
                  </button>
                )}
              </div>
            </header>

            {/* Região live para leitores de ecrã */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {loading
                ? 'A carregar histórico de reprodução.'
                : `${filteredItems.length} ${filteredItems.length === 1 ? 'item encontrado' : 'itens encontrados'} no histórico.`}
            </div>

            {/* Toast acessível */}
            {toast && (
              <div
                role="status"
                aria-live="polite"
                className={`mb-5 px-4 py-3 rounded-xl border text-sm flex items-center justify-between gap-3 ${
                  toast.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                    : 'bg-red-500/15 border-red-500/30 text-red-200'
                }`}
              >
                <span>{toast.msg}</span>
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  aria-label="Fechar notificação"
                  className="p-1 rounded-lg hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div
                role="alert"
                className="mb-6 p-4 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-200 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 text-sm">
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => load(page)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Utilizador não autenticado */}
            {!authLoading && !user ? (
              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center">
                <HistoryIcon size={40} className="mx-auto mb-3 text-purple-400/80" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-white mb-1">
                  Inicia sessão para veres o teu histórico
                </h2>
                <p className="text-sm text-gray-400 mb-5">
                  O teu progresso de músicas, pregações e vídeos fica guardado na tua conta.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  Iniciar sessão
                </Link>
              </section>
            ) : loading ? (
              <div
                className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3"
                aria-busy="true"
              >
                <Loader2 className="animate-spin text-purple-500" size={36} aria-hidden="true" />
                <p className="text-sm">A carregar o teu histórico...</p>
              </div>
            ) : items.length === 0 ? (
              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
                <Clock size={42} className="mx-auto mb-3 text-purple-400/70" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-white mb-1">
                  O teu histórico está vazio
                </h2>
                <p className="text-sm text-gray-400 mb-5">
                  Ainda não reproduziste nenhum conteúdo. Explora músicas e vídeos para começar.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/music"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  >
                    Explorar músicas
                  </Link>
                  <Link
                    href="/videos"
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium text-gray-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  >
                    Ver vídeos
                  </Link>
                </div>
              </section>
            ) : (
              <>
                {/* Resumo + Barra de Pesquisa e Filtros */}
                <section aria-label="Filtros e resumo do histórico" className="mb-6 space-y-4">
                  {/* Resumo rápido */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 sm:px-4 sm:py-3 min-w-0">
                      <p className="text-[11px] sm:text-xs text-gray-400 truncate">Nesta página</p>
                      <p className="text-base sm:text-lg font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 sm:px-4 sm:py-3 min-w-0">
                      <p className="text-[11px] sm:text-xs text-gray-400 truncate">Em progresso</p>
                      <p className="text-base sm:text-lg font-bold text-purple-300">{stats.inProgress}</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 sm:px-4 sm:py-3 min-w-0">
                      <p className="text-[11px] sm:text-xs text-gray-400 truncate">Concluídos</p>
                      <p className="text-base sm:text-lg font-bold text-emerald-300">{stats.completed}</p>
                    </div>
                  </div>

                  {/* Pesquisa + Filtros */}
                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="relative flex-1 min-w-0">
                      <label htmlFor="history-search" className="sr-only">
                        Pesquisar no histórico por título ou autor
                      </label>
                      <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        id="history-search"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar por título ou artista..."
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          aria-label="Limpar pesquisa"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    {/* Filtro por estado */}
                    <div
                      role="group"
                      aria-label="Filtrar por estado de reprodução"
                      className="flex flex-wrap items-center gap-1.5 bg-white/[0.04] border border-white/10 p-1 rounded-xl"
                    >
                      {(
                        [
                          { id: 'all', label: 'Todos' },
                          { id: 'in_progress', label: 'Em progresso' },
                          { id: 'completed', label: 'Concluídos' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          aria-pressed={statusFilter === opt.id}
                          onClick={() => setStatusFilter(opt.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                            statusFilter === opt.id
                              ? 'bg-purple-600 text-white shadow'
                              : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Filtro por tipo */}
                    <div
                      role="group"
                      aria-label="Filtrar por tipo de conteúdo"
                      className="flex flex-wrap items-center gap-1.5 bg-white/[0.04] border border-white/10 p-1 rounded-xl"
                    >
                      {(
                        [
                          { id: 'all', label: 'Tudo' },
                          { id: 'audio', label: 'Áudio' },
                          { id: 'video', label: 'Vídeos' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          aria-pressed={typeFilter === opt.id}
                          onClick={() => setTypeFilter(opt.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                            typeFilter === opt.id
                              ? 'bg-purple-600 text-white shadow'
                              : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Sem resultados para os filtros */}
                {filteredItems.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
                    <p className="text-gray-300 font-medium mb-2">
                      Nenhum item corresponde aos filtros selecionados.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {groupedItems.map(({ label, entries }) => {
                      const headingId = `history-group-${label.toLowerCase().replace(/\s+/g, '-')}`;
                      return (
                        <section key={label} aria-labelledby={headingId}>
                          <h2
                            id={headingId}
                            className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 px-1"
                          >
                            {label} ({entries.length})
                          </h2>

                          <ul className="space-y-2.5" role="list">
                            {entries.map((item) => {
                              const pct = Math.min(100, Math.max(0, Math.round(item.progress ?? 0)));
                              const isDone = Boolean(item.completed);
                              const video = isVideoItem(item);
                              const trackId = item.music_id || item.source_id || item.content_id;
                              const isCurrentPlaying =
                                !video && currentMusic?.id === trackId && isPlaying;
                              const itemTitle = item.title || `Conteúdo #${item.content_id}`;

                              return (
                                <li
                                  key={item.id}
                                  className="flex items-start sm:items-center gap-3 sm:gap-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-2xl p-3 sm:p-3.5 transition-colors group"
                                >
                                  {/* Botão de capa + Play/Pause direto */}
                                  <button
                                    type="button"
                                    onClick={() => handlePlayItem(item)}
                                    aria-label={
                                      isCurrentPlaying
                                        ? `Pausar ${itemTitle}`
                                        : `Reproduzir ${itemTitle}`
                                    }
                                    className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-purple-600/30 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                                  >
                                    {item.cover_url ? (
                                      <img
                                        src={resolveThumbUrl(item.cover_url)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-white/60">
                                        {video ? (
                                          <VideoIcon size={22} aria-hidden="true" />
                                        ) : (
                                          <Music size={22} aria-hidden="true" />
                                        )}
                                      </div>
                                    )}
                                    <span className="absolute inset-0 bg-black/45 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 flex items-center justify-center transition-opacity">
                                      {isCurrentPlaying ? (
                                        <Pause size={20} className="text-white" aria-hidden="true" />
                                      ) : (
                                        <Play size={20} className="text-white ml-0.5" aria-hidden="true" />
                                      )}
                                    </span>
                                  </button>

                                  {/* Informação principal */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => handlePlayItem(item)}
                                        className="font-semibold text-sm sm:text-base text-white truncate text-left hover:text-purple-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
                                      >
                                        {itemTitle}
                                      </button>
                                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-gray-300 flex-shrink-0">
                                        {video ? (
                                          <>
                                            <VideoIcon size={11} aria-hidden="true" /> Vídeo
                                          </>
                                        ) : (
                                          <>
                                            <Music size={11} aria-hidden="true" /> Áudio
                                          </>
                                        )}
                                      </span>
                                    </div>

                                    <p className="text-gray-400 text-xs truncate mt-0.5">
                                      {item.full_name || item.username || 'PodféPlay'}
                                      {item.total_duration
                                        ? ` · ${formatTime(item.last_position)} / ${formatTime(item.total_duration)}`
                                        : ` · ${formatTime(item.last_position)}`}
                                      {item.play_count > 1 ? ` · ${item.play_count}x reproduzido` : ''}
                                    </p>

                                    {/* Barra de progresso acessível */}
                                    <div className="mt-2 flex items-center gap-2">
                                      <div
                                        role="progressbar"
                                        aria-valuenow={pct}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label={`Progresso de ${itemTitle}: ${pct}%`}
                                        className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"
                                      >
                                        <div
                                          className={`h-full transition-all ${
                                            isDone ? 'bg-emerald-500' : 'bg-purple-500'
                                          }`}
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                      <span className="text-[11px] text-gray-400 tabular-nums w-8 text-right">
                                        {pct}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Ações do item */}
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {isDone && (
                                      <span
                                        title="Concluído"
                                        aria-label="Concluído"
                                        className="p-1.5 text-emerald-400"
                                      >
                                        <CheckCircle2 size={18} aria-hidden="true" />
                                      </span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handlePlayItem(item)}
                                      aria-label={
                                        isCurrentPlaying
                                          ? `Pausar ${itemTitle}`
                                          : `Abrir ${itemTitle} no leitor`
                                      }
                                      title={isCurrentPlaying ? 'Pausar' : 'Abrir no leitor'}
                                      className="p-2 rounded-lg text-purple-300 hover:text-white hover:bg-purple-500/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                                    >
                                      {isCurrentPlaying ? (
                                        <Pause size={16} aria-hidden="true" />
                                      ) : (
                                        <Play size={16} aria-hidden="true" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDelete(item)}
                                      disabled={removingId === item.content_id}
                                      aria-label={`Remover ${itemTitle} do histórico`}
                                      title="Remover do histórico"
                                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 sm:opacity-60 sm:group-hover:opacity-100 focus-visible:opacity-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-40"
                                    >
                                      {removingId === item.content_id ? (
                                        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                      ) : (
                                        <Trash2 size={16} aria-hidden="true" />
                                      )}
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                      );
                    })}
                  </div>
                )}

                {/* Paginação acessível */}
                {totalPages > 1 && (
                  <nav
                    aria-label="Paginação do histórico"
                    className="flex flex-wrap items-center justify-center gap-2 mt-8"
                  >
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      aria-label="Página anterior"
                      className="p-2 rounded-xl bg-white/10 text-gray-200 hover:bg-white/20 disabled:opacity-40 disabled:pointer-events-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    >
                      <ChevronLeft size={16} aria-hidden="true" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        aria-label={`Página ${p}`}
                        aria-current={p === page ? 'page' : undefined}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                          p === page
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      aria-label="Próxima página"
                      className="p-2 rounded-xl bg-white/10 text-gray-200 hover:bg-white/20 disabled:opacity-40 disabled:pointer-events-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    >
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <PlayerBar />

      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      <ActionModal config={modalConfig} onClose={() => setModalConfig(null)} />
    </div>
  );
}
