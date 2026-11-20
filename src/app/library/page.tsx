// app/library/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import {
  Heart,
  Download,
  Clock,
  Play,
  Pause,
  Music,
  Loader2,
  AlertCircle,
  Trash2,
  X,
  WifiOff,
  Video as VideoIcon,
  Search,
} from 'lucide-react';
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from '@/config/api';
import { historyApi, HistoryItem as HistoryRecord } from '@/lib/historyApi';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import ActionModal, { ActionModalConfig } from '@/components/ActionModal';
import { getFriendlyErrorMessage } from '@/lib/errorHandler';
import {
  listOfflineDownloads,
  removeOfflineMedia,
  formatBytes,
  type OfflineMediaRecord,
} from '@/lib/offlineStorage';
import { resolveThumbUrl } from '@/lib/media';

// =====================================================================
// TIPOS
// =====================================================================

interface LibraryItem {
  id: number;
  content_id: number;
  title: string;
  type: string;
  duration: number;
  cover_url: string;
  created_at?: string;
  downloaded_at?: string;
  username?: string;
  full_name?: string;
}

// =====================================================================
// HELPERS — converte qualquer item para o shape do PlayerContext
// =====================================================================

function toPlayerMusic(item: any) {
  return {
    id: item.content_id ?? item.id,
    title: item.title || `Conteúdo #${item.content_id ?? item.id}`,
    artist: item.full_name || item.username || item.author || 'Artista',
    album: null,
    duration: item.duration || 0,
    file_path: '',
    file_size: 0,
    cover_image: item.cover_url || null,
    created_at: item.created_at || new Date().toISOString(),
  };
}

// =====================================================================
// CONTENT CARD
// =====================================================================

const ContentCard = ({
  item,
  isPlaying = false,
  onPlay,
  onRemove,
  showRemove = false,
}: {
  item: LibraryItem;
  isPlaying?: boolean;
  onPlay?: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
}) => {
  const isVideo = String(item.type || '').toLowerCase() === 'video';
  return (
    <div
      onClick={onPlay}
      className="group cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/35 rounded-2xl p-3 transition-all"
    >
      <div
        className={`relative rounded-xl overflow-hidden ${
          isVideo ? 'aspect-video' : 'aspect-square'
        } mb-2.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20`}
      >
        {item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isVideo ? (
              <VideoIcon size={44} className="text-purple-400/50" />
            ) : (
              <Music size={44} className="text-purple-400/50" />
            )}
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-sm text-purple-200 flex items-center gap-1">
          {isVideo ? <VideoIcon size={10} /> : <Music size={10} />}
          {isVideo ? 'Vídeo' : 'Música'}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPlay?.();
          }}
          className="absolute bottom-2 right-2 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg hover:scale-110 hover:bg-purple-500"
        >
          {isPlaying ? (
            <Pause size={18} className="text-white" />
          ) : (
            <Play size={18} className="text-white ml-0.5" />
          )}
        </button>
        {showRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500"
          >
            <Trash2 size={14} className="text-white" />
          </button>
        )}
        {item.duration > 0 && (
          <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
            {Math.floor(item.duration / 60)}:
            {(item.duration % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>
      <h4 className="font-semibold text-white text-sm truncate group-hover:text-purple-300 transition-colors">
        {item.title}
      </h4>
      <p className="text-gray-400 text-xs truncate">
        {item.full_name || item.username || (isVideo ? 'Vídeo' : 'Artista')}
      </p>
    </div>
  );
};

// =====================================================================
// HISTORY ITEM ROW
// =====================================================================

const HistoryItemRow = ({
  item,
  isPlaying = false,
  onPlay,
  onRemove,
}: {
  item: HistoryRecord;
  isPlaying?: boolean;
  onPlay?: () => void;
  onRemove?: () => void;
}) => {
  const formatTime = (s?: number | null) => {
    if (!s || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const pct = Math.min(100, Math.max(0, item.progress ?? 0));
  const isDone = !!item.completed;
  const isVideo = String((item as any).type || (item as any).content_type || '').toLowerCase() === 'video';

  return (
    <div
      onClick={onPlay}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer group"
    >
      <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : isVideo ? (
          <VideoIcon size={22} className="text-purple-400" />
        ) : (
          <Music size={22} className="text-purple-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm truncate group-hover:text-purple-300 transition-colors">
            {item.title || `Conteúdo #${item.content_id}`}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-purple-200 shrink-0">
            {isVideo ? 'Vídeo' : 'Música'}
          </span>
        </div>
        <p className="text-gray-400 text-xs truncate">
          {item.full_name || item.username || (isVideo ? 'Vídeo' : 'Artista')}
          {item.total_duration
            ? ` · ${formatTime(item.last_position)} / ${formatTime(item.total_duration)}`
            : ` · ${formatTime(item.last_position)}`}
        </p>

        <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${isDone ? 'bg-green-500' : 'bg-purple-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onPlay}
          className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-purple-500"
        >
          {isPlaying ? (
            <Pause size={14} className="text-white" />
          ) : (
            <Play size={14} className="text-white ml-0.5" />
          )}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
        >
          <X size={14} className="text-red-400" />
        </button>
      </div>
    </div>
  );
};

// =====================================================================
// PÁGINA
// =====================================================================

export default function LibraryPage() {
  const { user } = useAuth();
  const { play, isPlaying, currentMusic } = usePlayer();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'favorites' | 'downloads' | 'history'>('favorites');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [favorites, setFavorites] = useState<LibraryItem[]>([]);
  const [downloads, setDownloads] = useState<LibraryItem[]>([]);
  const [offlineItems, setOfflineItems] = useState<OfflineMediaRecord[]>([]);
  const [selectedOfflineVideo, setSelectedOfflineVideo] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'music' | 'video'>('all');
  const [modalConfig, setModalConfig] = useState<ActionModalConfig | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [summary, setSummary] = useState({
    counts: { favorites: 0, downloads: 0, history: 0 },
    recentHistory: [],
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ---------- Carregar ----------
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'favorites') {
        const response = await fetch(
          `${getApiUrl(API_ENDPOINTS.LIBRARY_FAVORITES)}?page=${page}&limit=20`,
          { headers: getAuthHeaders() }
        );
        const result = await response.json();
        if (result.success) {
          setFavorites(result.data.items || []);
          setTotalPages(result.data.pagination?.totalPages || 1);
        }
      } else if (activeTab === 'downloads') {
        const response = await fetch(
          `${getApiUrl(API_ENDPOINTS.LIBRARY_DOWNLOADS)}?page=${page}&limit=20`,
          { headers: getAuthHeaders() }
        );
        const result = await response.json();
        if (result.success) {
          setDownloads(result.data.items || []);
          setTotalPages(result.data.pagination?.totalPages || 1);
        }
      } else if (activeTab === 'history') {
        const data = await historyApi.getHistory({ page, limit: 20 });
        setHistory(data.items);
        setTotalPages(data.pagination.totalPages || 1);
      }

      try {
        const summaryResponse = await fetch(getApiUrl(API_ENDPOINTS.LIBRARY_SUMMARY), {
          headers: getAuthHeaders(),
        });
        const summaryResult = await summaryResponse.json();
        if (summaryResult.success) {
          setSummary(summaryResult.data);
        }
      } catch {
        // opcional
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listOfflineDownloads().then(setOfflineItems);
  }, [activeTab]);

  const handleRemoveOffline = async (item: OfflineMediaRecord) => {
    await removeOfflineMedia(item.type, item.id);
    setOfflineItems((prev) => prev.filter((x) => x.key !== item.key));
  };

  const handlePlayOffline = (item: OfflineMediaRecord) => {
    if (item.type === 'video') {
      setSelectedOfflineVideo({
        id: item.id,
        title: item.title,
        description: item.subtitle,
        duration: item.duration ?? null,
        file_path: '',
        thumbnail_path: item.coverUrl ?? null,
        file_size: item.sizeBytes,
        views: 0,
        likes: 0,
        created_at: item.savedAt,
      });
    } else {
      play(
        {
          id: item.id,
          title: item.title,
          artist: item.subtitle,
          album: null,
          duration: item.duration ?? 0,
          file_path: '',
          file_size: item.sizeBytes,
          cover_image: item.coverUrl ?? null,
          created_at: item.savedAt,
        },
        true
      );
    }
  };

  // ---------- Remover ----------
  const handleRemoveFavorite = async (contentId: number) => {
    try {
      const response = await fetch(
        getApiUrl(`/api/v1/library/favorites/${contentId}`),
        { method: 'DELETE', headers: getAuthHeaders() }
      );
      const result = await response.json();
      if (result.success) {
        setFavorites(favorites.filter((f) => f.content_id !== contentId));
        setSuccess('Removido dos favoritos');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Erro ao remover favorito');
    }
  };

  const handleRemoveDownload = async (contentId: number) => {
    try {
      const response = await fetch(
        getApiUrl(`/api/v1/library/downloads/${contentId}`),
        { method: 'DELETE', headers: getAuthHeaders() }
      );
      const result = await response.json();
      if (result.success) {
        setDownloads(downloads.filter((d) => d.content_id !== contentId));
        setSuccess('Download removido');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Erro ao remover download');
    }
  };

  const handleRemoveHistory = async (contentId: number) => {
    try {
      await historyApi.clearContent(contentId);
      setHistory(history.filter((h) => h.content_id !== contentId));
      setSuccess('Removido do histórico');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Erro ao remover do histórico');
    }
  };

  const handleClearHistory = () => {
    setModalConfig({
      mode: 'confirm',
      title: 'Limpar todo o histórico',
      message: 'Tens a certeza que desejas limpar todo o teu histórico de reprodução?',
      confirmLabel: 'Limpar histórico',
      danger: true,
      onConfirm: async () => {
        try {
          await historyApi.clearAll();
          setHistory([]);
          setSuccess('Histórico limpo com sucesso');
          setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
          setError(getFriendlyErrorMessage(err, 'Não foi possível limpar o histórico.'));
        }
      },
    });
  };

  // ---------- Play REAL via PlayerContext / VideoPlayerModal ----------
  const getCurrentItems = () => {
    let raw: any[] = [];
    switch (activeTab) {
      case 'favorites':
        raw = favorites;
        break;
      case 'downloads':
        raw = downloads;
        break;
      case 'history':
        raw = history;
        break;
      default:
        raw = [];
    }
    const q = searchQuery.trim().toLowerCase();
    return raw.filter((item) => {
      const isVid = String(item.type || item.content_type || '').toLowerCase() === 'video';
      if (typeFilter === 'video' && !isVid) return false;
      if (typeFilter === 'music' && isVid) return false;
      if (!q) return true;
      return (
        String(item.title || '').toLowerCase().includes(q) ||
        String(item.full_name || item.username || '').toLowerCase().includes(q)
      );
    });
  };

  const currentItems = getCurrentItems();

  const handlePlay = async (item: LibraryItem | HistoryRecord) => {
    const anyItem = item as any;
    const isVideo = String(anyItem.type || anyItem.content_type || '').toLowerCase() === 'video';
    const contentId = Number(anyItem.content_id ?? anyItem.id);

    if (isVideo) {
      setSelectedOfflineVideo({
        id: contentId,
        title: anyItem.title || `Vídeo #${contentId}`,
        description: null,
        duration: anyItem.duration ?? null,
        file_path: '',
        thumbnail_path: anyItem.cover_url ?? null,
        file_size: 0,
        views: 0,
        likes: 0,
        created_at: anyItem.created_at || new Date().toISOString(),
      });
      try {
        const res = await fetch(getApiUrl(`/api/v1/videos/${contentId}`), {
          headers: getAuthHeaders(),
        });
        const body = await res.json().catch(() => null);
        if (res.ok && body?.success && body.data?.file_path) {
          setSelectedOfflineVideo(body.data);
          return;
        }
        const contentRes = await fetch(getApiUrl(`/api/v1/contents/${contentId}`), {
          headers: getAuthHeaders(),
        });
        const contentBody = await contentRes.json().catch(() => null);
        const c = contentBody?.data;
        if (contentRes.ok && c && (c.video_url || c.hls_url || c.file_path)) {
          setSelectedOfflineVideo({
            id: contentId,
            title: c.title || anyItem.title || `Vídeo #${contentId}`,
            description: c.description || null,
            duration: c.duration ?? anyItem.duration ?? null,
            file_path: c.video_url || c.hls_url || c.file_path,
            thumbnail_path: c.cover_url || anyItem.cover_url || null,
            file_size: c.size || 0,
            views: c.views || 0,
            likes: c.likes || 0,
            created_at: c.created_at || anyItem.created_at || new Date().toISOString(),
          });
        }
      } catch {
        // Mantém fallback já aberto
      }
      return;
    }

    const audioItems = (currentItems as any[]).filter(
      (i) => String(i.type || i.content_type || '').toLowerCase() !== 'video'
    );
    const startIdx = audioItems.findIndex(
      (i) => (i.content_id ?? i.id) === contentId
    );

    const queueFromIdx =
      startIdx >= 0 ? audioItems.slice(startIdx) : [item];

    const queue = queueFromIdx.map(toPlayerMusic);
    play(toPlayerMusic(item), true, queue);
  };

  const isCurrentPlaying = (item: LibraryItem | HistoryRecord) => {
    const id = (item as any).content_id ?? (item as any).id;
    return currentMusic?.id === id && isPlaying;
  };

  // =====================================================================
  // RENDER
  // =====================================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-0 md:ml-60 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Biblioteca</h1>
              <p className="text-purple-200 text-sm mt-0.5">
                Os teus conteúdos favoritos, downloads e histórico de reprodução
              </p>
            </div>

            {!loading &&
              (currentItems as any[]).some(
                (i) => String(i.type || i.content_type || '').toLowerCase() !== 'video'
              ) && (
                <button
                  type="button"
                  onClick={() => {
                    const firstAudio = (currentItems as any[]).find(
                      (i) => String(i.type || i.content_type || '').toLowerCase() !== 'video'
                    );
                    if (firstAudio) handlePlay(firstAudio);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/25 transition-all"
                >
                  <Play size={14} className="ml-0.5" />
                  <span>Reproduzir Músicas</span>
                </button>
              )}
          </div>

          {/* Resumo interativo */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <button
              type="button"
              onClick={() => {
                setActiveTab('favorites');
                setPage(1);
              }}
              className={`rounded-2xl p-4 text-center border transition-all ${
                activeTab === 'favorites'
                  ? 'bg-pink-500/15 border-pink-400/50 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <Heart size={24} className="text-pink-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {summary.counts.favorites}
              </p>
              <p className="text-xs text-gray-300">Favoritos</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('downloads');
                setPage(1);
              }}
              className={`rounded-2xl p-4 text-center border transition-all ${
                activeTab === 'downloads'
                  ? 'bg-blue-500/15 border-blue-400/50 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <Download size={24} className="text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {summary.counts.downloads}
              </p>
              <p className="text-xs text-gray-300">Downloads</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                setPage(1);
              }}
              className={`rounded-2xl p-4 text-center border transition-all ${
                activeTab === 'history'
                  ? 'bg-emerald-500/15 border-emerald-400/50 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <Clock size={24} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {summary.counts.history}
              </p>
              <p className="text-xs text-gray-300">Histórico</p>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                ✕
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-white/10">
            <button
              onClick={() => {
                setActiveTab('favorites');
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'favorites'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Heart size={16} />
              Favoritos
            </button>
            <button
              onClick={() => {
                setActiveTab('downloads');
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'downloads'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Download size={16} />
              Downloads
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock size={16} />
              Histórico
            </button>
          </div>

          {/* Pesquisa e filtro por tipo */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar na biblioteca..."
                className="w-full pl-9 pr-9 py-2 rounded-full bg-white/10 border border-white/10 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {(
                [
                  { key: 'all', label: 'Todos' },
                  { key: 'music', label: 'Músicas' },
                  { key: 'video', label: 'Vídeos' },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setTypeFilter(f.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    typeFilter === f.key
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/15'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo */}
          {activeTab === 'downloads' && offlineItems.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <WifiOff size={18} className="text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Guardados para Ver Offline ({offlineItems.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {offlineItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-emerald-500/20 hover:bg-white/10 transition-all"
                  >
                    <div
                      onClick={() => handlePlayOffline(item)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                        <img
                          src={resolveThumbUrl(item.coverUrl)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/75 text-white p-0.5 rounded">
                          {item.type === 'video' ? <VideoIcon size={11} /> : <Music size={11} />}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white text-sm truncate">{item.title}</p>
                        <p className="text-xs text-emerald-300 truncate">
                          {item.type === 'video' ? 'Vídeo Offline' : 'Música Offline'} ·{' '}
                          {formatBytes(item.sizeBytes)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handlePlayOffline(item)}
                        className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white"
                        title="Reproduzir offline"
                      >
                        <Play size={14} className="ml-0.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveOffline(item)}
                        className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-300"
                        title="Remover do dispositivo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-3 animate-pulse">
                  <div className="aspect-square rounded-xl bg-white/10 mb-3" />
                  <div className="h-3.5 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'favorites' && (
                  <Heart size={32} className="text-gray-400" />
                )}
                {activeTab === 'downloads' && (
                  <Download size={32} className="text-gray-400" />
                )}
                {activeTab === 'history' && (
                  <Clock size={32} className="text-gray-400" />
                )}
              </div>
              <p className="text-gray-400">
                {activeTab === 'favorites' && 'Nenhum favorito ainda'}
                {activeTab === 'downloads' && 'Nenhum download ainda'}
                {activeTab === 'history' && 'Nenhum histórico ainda'}
              </p>
              <Link
                href="/"
                className="inline-block mt-4 px-4 py-2 bg-purple-600 rounded-lg text-white text-sm hover:bg-purple-500 transition-colors"
              >
                Explorar conteúdos
              </Link>
            </div>
          ) : (
            <>
              {activeTab === 'history' ? (
                <div className="space-y-2">
                  {(currentItems as HistoryRecord[]).map((item) => (
                    <HistoryItemRow
                      key={item.id}
                      item={item}
                      isPlaying={isCurrentPlaying(item)}
                      onPlay={() => handlePlay(item)}
                      onRemove={() => handleRemoveHistory(item.content_id)}
                    />
                  ))}
                  {history.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="w-full mt-4 py-2 text-center text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Limpar todo o histórico
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {(currentItems as LibraryItem[]).map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      isPlaying={isCurrentPlaying(item)}
                      onPlay={() => handlePlay(item)}
                      onRemove={() =>
                        activeTab === 'favorites'
                          ? handleRemoveFavorite(item.content_id)
                          : handleRemoveDownload(item.content_id)
                      }
                      showRemove={activeTab === 'favorites' || activeTab === 'downloads'}
                    />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-gray-400 text-sm">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* 🔥 PlayerBar GLOBAL — substitui a "Now Playing Bar" local */}
      <PlayerBar />
      <VideoPlayerModal
        video={selectedOfflineVideo}
        onClose={() => setSelectedOfflineVideo(null)}
      />
      <ActionModal config={modalConfig} onClose={() => setModalConfig(null)} />
    </div>
  );
}