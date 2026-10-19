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
} from 'lucide-react';
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from '@/config/api';
import { historyApi, HistoryItem as HistoryRecord } from '@/lib/historyApi';

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
  return (
    <div className="group cursor-pointer">
      <div className="relative rounded-lg overflow-hidden aspect-square mb-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
        {item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={48} className="text-purple-400/50" />
          </div>
        )}
        <button
          onClick={onPlay}
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
      <h4 className="font-medium text-white text-sm truncate">{item.title}</h4>
      <p className="text-gray-400 text-xs truncate">
        {item.full_name || item.username || 'Artista'}
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

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Music size={24} className="text-purple-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/player/${item.content_id}`}
          className="font-medium text-white text-sm truncate block hover:text-purple-300 transition-colors"
        >
          {item.title || `Conteúdo #${item.content_id}`}
        </Link>
        <p className="text-gray-400 text-xs truncate">
          {item.full_name || item.username || 'Artista'}
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

      <div className="flex items-center gap-2">
        <button
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

  const handleClearHistory = async () => {
    if (!confirm('Tem certeza que deseja limpar todo o histórico?')) return;
    try {
      await historyApi.clearAll();
      setHistory([]);
      setSuccess('Histórico limpo com sucesso');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Erro ao limpar histórico');
    }
  };

  // ---------- Play REAL via PlayerContext ----------
  const getCurrentItems = () => {
    switch (activeTab) {
      case 'favorites':
        return favorites;
      case 'downloads':
        return downloads;
      case 'history':
        return history;
      default:
        return [];
    }
  };

  const currentItems = getCurrentItems();

  const handlePlay = (item: LibraryItem | HistoryRecord) => {
    // Enfileira a partir do item clicado + os seguintes
    const itemsArray = currentItems as any[];
    const startIdx = itemsArray.findIndex(
      (i) => (i.content_id ?? i.id) === ((item as any).content_id ?? (item as any).id)
    );

    const queueFromIdx =
      startIdx >= 0 ? itemsArray.slice(startIdx) : [item];

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

      <main className="ml-64 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Biblioteca</h1>
            <p className="text-gray-400 text-sm">
              Seus conteúdos favoritos, downloads e histórico
            </p>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <Heart size={24} className="text-pink-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {summary.counts.favorites}
              </p>
              <p className="text-xs text-gray-400">Favoritos</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <Download size={24} className="text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {summary.counts.downloads}
              </p>
              <p className="text-xs text-gray-400">Downloads</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <Clock size={24} className="text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {summary.counts.history}
              </p>
              <p className="text-xs text-gray-400">Histórico</p>
            </div>
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

          {/* Conteúdo */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={40} className="text-purple-500 animate-spin" />
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
    </div>
  );
}