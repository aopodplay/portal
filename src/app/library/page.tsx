// app/library/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import {
  Heart,
  Download,
  Clock,
  Play,
  Pause,
  Music,
  Headphones,
  Home,
  Search,
  Flame,
  Library,
  User,
  Plus,
  Menu,
  Loader2,
  AlertCircle,
  Trash2,
  X,
  ChevronRight,
} from 'lucide-react';
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from '@/config/api';
import { historyApi, HistoryItem as HistoryRecord } from '@/lib/historyApi';

// =====================================================================
// TIPOS
// =====================================================================

// Item genérico da biblioteca (favoritos/downloads)
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
// COMPONENTES
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

/**
 * Item do histórico — agora aceita o shape do `/api/v1/history`
 * (snake_case: content_id, cover_url, last_position, last_played_at, ...).
 */
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

        {/* Barra de progresso */}
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

// Sidebar Component
const PodfSidebar = ({ collapsed = false }: { collapsed?: boolean }) => {
  const menuItems = [
    { icon: Home, label: 'Inicio', href: '/' },
    { icon: Search, label: 'Pesquisa', href: '/search' },
    { icon: Flame, label: 'Em Alta', href: '/trending' },
    { icon: Library, label: 'Biblioteca', href: '/library' },
    { icon: User, label: 'Perfil', href: '/profile' },
  ];

  const playlists = [
    'As Minhas Favoritas',
    'Oração da Manhã',
    'Louvores com a Família',
    'Pregações – Pr. Carlos',
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-black/60 backdrop-blur-xl border-r border-white/10 transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Headphones size={18} className="text-white" />
          </div>
          {!collapsed && <h1 className="text-xl font-bold text-white">Podfá Play</h1>}
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? item.label : ''}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {!collapsed && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                AS TUAS PLAYLISTS
              </h3>
              <button className="text-gray-400 hover:text-white">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {playlists.map((playlist) => (
                <Link
                  key={playlist}
                  href="#"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <div className="w-1 h-1 bg-purple-400 rounded-full" />
                  <span className="truncate">{playlist}</span>
                </Link>
              ))}
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all w-full">
                <Plus size={14} />
                <span>Nova playlist</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

// =====================================================================
// PÁGINA
// =====================================================================

export default function LibraryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'favorites' | 'downloads' | 'history'>('favorites');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dados
  const [favorites, setFavorites] = useState<LibraryItem[]>([]);
  const [downloads, setDownloads] = useState<LibraryItem[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [summary, setSummary] = useState({
    counts: { favorites: 0, downloads: 0, history: 0 },
    recentHistory: [],
  });

  // Paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Carregar dados
  useEffect(() => {
    loadData();
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
        // 🔥 Aba Histórico agora usa o novo /api/v1/history
        const data = await historyApi.getHistory({ page, limit: 20 });
        setHistory(data.items);
        setTotalPages(data.pagination.totalPages || 1);
      }

      // Carregar resumo (só faz sentido para favoritos/downloads — mantemos)
      try {
        const summaryResponse = await fetch(getApiUrl(API_ENDPOINTS.LIBRARY_SUMMARY), {
          headers: getAuthHeaders(),
        });
        const summaryResult = await summaryResponse.json();
        if (summaryResult.success) {
          setSummary(summaryResult.data);
        }
      } catch {
        // resumo é opcional — não bloqueia
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

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
      // 🔥 Usa o novo endpoint
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
      // 🔥 Usa o novo endpoint
      await historyApi.clearAll();
      setHistory([]);
      setSuccess('Histórico limpo com sucesso');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Erro ao limpar histórico');
    }
  };

  const handlePlay = (title: string) => {
    setCurrentlyPlaying(currentlyPlaying === title ? null : title);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodfSidebar collapsed={sidebarCollapsed} />

      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        } min-h-screen`}
      >
        <Header />

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Botão mobile */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-purple-600 rounded-full shadow-lg"
          >
            <Menu size={20} className="text-white" />
          </button>

          {/* Título */}
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

          {/* Mensagens */}
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
                      isPlaying={currentlyPlaying === item.title}
                      onPlay={() => handlePlay(item.title)}
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
                      isPlaying={currentlyPlaying === item.title}
                      onPlay={() => handlePlay(item.title)}
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

              {/* Paginação */}
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

      {/* Now Playing Bar */}
      {currentlyPlaying && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 z-40">
          <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Music size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{currentlyPlaying}</p>
                <p className="text-gray-400 text-xs">Reproduzindo agora</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentlyPlaying(null)}
              className="px-4 py-1.5 bg-white/10 text-white rounded-full text-sm hover:bg-white/20 transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}