// app/videos/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoUpload } from '@/contexts/VideoUploadContext';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import AddVideoModal from '@/components/AddVideoModal';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import {
  Play,
  Search,
  Video as VideoIcon,
  Eye,
  Clock,
  X,
  Plus,
  Repeat,
  Heart,
  Share2,
  ThumbsUp,
  LayoutGrid,
  List,
  Check,
  TrendingUp,
} from 'lucide-react';
import { fetchWithAuth, getApiUrl, getAuthHeaders } from '@/config/api';
import { resolveThumbUrl } from '@/lib/media';
import { favoritesApi } from '@/lib/favoritesApi';
import { getFriendlyErrorMessage, parseApiError } from '@/lib/errorHandler';

// =====================================================================
// TIPO
// =====================================================================

interface VideoItem {
  id: number;
  title: string;
  description: string | null;
  category?: string | null;
  duration: number | null;
  resolution: string | null;
  file_path: string;
  thumbnail_path: string | null;
  file_size: number;
  views: number;
  likes: number;
  user_id?: number | null;
  comments_locked?: boolean | number;
  user_play_count?: number;
  created_at: string;
}

type VideoSort = 'recent' | 'views' | 'likes' | 'alpha' | 'favorites';
type ViewMode = 'grid' | 'list';

const VIDEOS_PER_PAGE = 15;

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Todos',
  video: 'Vídeos / Clipes',
  sermao: 'Sermões',
  podcast: 'Podcasts',
  estudo: 'Estudos Bíblicos',
  culto: 'Cultos',
  outro: 'Outros',
};

function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// =====================================================================
// VIDEO CARD
// =====================================================================

const VideoCard = ({
  video,
  onPlay,
  badge,
  isFavorited,
  onToggleFavorite,
  onShare,
}: {
  video: VideoItem;
  onPlay: (video: VideoItem) => void;
  badge?: string;
  isFavorited: boolean;
  onToggleFavorite: (video: VideoItem) => void;
  onShare: (video: VideoItem) => void;
}) => {
  const thumbUrl = resolveThumbUrl(video.thumbnail_path);
  const durationLabel = formatDuration(video.duration);
  const categoryLabel =
    video.category && CATEGORY_LABELS[video.category.toLowerCase()]
      ? CATEGORY_LABELS[video.category.toLowerCase()]
      : null;

  const dateLabel = new Date(video.created_at).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className="group cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/35 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col"
      onClick={() => onPlay(video)}
    >
      <div className="relative aspect-video bg-gradient-to-br from-indigo-500/20 to-purple-500/20 overflow-hidden">
        <img
          src={thumbUrl}
          alt={video.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/default-video-thumb.svg';
          }}
        />
        <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-13 h-13 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play size={22} className="text-white ml-0.5" />
          </div>
        </div>

        {/* Favoritar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(video);
          }}
          title={isFavorited ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
          aria-label={isFavorited ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 ${
            isFavorited
              ? 'bg-pink-500/90 text-white opacity-100'
              : 'bg-black/55 text-white/85 hover:text-white opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart size={14} className={isFavorited ? 'fill-white' : ''} />
        </button>

        {durationLabel && (
          <span className="absolute bottom-2 right-2 text-[11px] bg-black/75 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock size={10} />
            {durationLabel}
          </span>
        )}
        {badge ? (
          <span className="absolute top-2 left-2 text-[11px] font-semibold bg-purple-600/90 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
            <Repeat size={10} />
            {badge}
          </span>
        ) : categoryLabel ? (
          <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/65 backdrop-blur-sm text-purple-200 px-2 py-0.5 rounded-full">
            {categoryLabel}
          </span>
        ) : (
          video.resolution && (
            <span className="absolute top-2 left-2 text-xs font-semibold bg-purple-600 text-white px-1.5 py-0.5 rounded">
              {video.resolution}
            </span>
          )
        )}
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-semibold text-white text-sm line-clamp-2 mb-1 group-hover:text-purple-300 transition-colors">
            {video.title}
          </h4>
          {video.description && (
            <p className="text-gray-400 text-xs line-clamp-2 mb-2">
              {video.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 mt-1 border-t border-white/5">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1">
              <Eye size={11} />
              {(video.views ?? 0).toLocaleString('pt-PT')}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp size={11} />
              {(video.likes ?? 0).toLocaleString('pt-PT')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline">{dateLabel}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare(video);
              }}
              title="Partilhar vídeo"
              aria-label="Partilhar vídeo"
              className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Share2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// PÁGINA
// =====================================================================

export default function VideosPage() {
  const { user } = useAuth();
  const { reopenModalPath, clearReopenModal, lastCompletedAt } = useVideoUpload();
  const [allVideos, setAllVideos] = useState<VideoItem[]>([]);
  const [mixVideos, setMixVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<VideoSort>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [activeQueue, setActiveQueue] = useState<VideoItem[] | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  // ---------- Carregar vídeos ----------
  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(getApiUrl('/api/v1/videos?limit=200'), {
        headers: getAuthHeaders(),
      });
      const result = await response.json().catch(() => null);

      if (response.ok && result?.success && result.data) {
        const items: VideoItem[] = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.data.items)
            ? result.data.items
            : [];
        setAllVideos(items);
      } else {
        setError(parseApiError(response, result, 'Não foi possível carregar os vídeos.'));
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível carregar os vídeos. Tenta novamente.'));
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------- Carregar Mix personalizado ----------
  const loadMix = useCallback(async () => {
    if (!user) {
      setMixVideos([]);
      return;
    }
    try {
      const res = await fetchWithAuth('/api/v1/videos/mix');
      if (!res.ok) return;
      const body = await res.json();
      if (body?.success && Array.isArray(body.data?.videos)) {
        setMixVideos(body.data.videos);
      }
    } catch {
      // Silencioso
    }
  }, [user]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  useEffect(() => {
    loadMix();
  }, [loadMix]);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    favoritesApi
      .list(1, 200)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        const ids = new Set<number>();
        for (const item of list) {
          if (item.content_type === 'video' && item.content_id) {
            ids.add(Number(item.content_id));
          }
        }
        setFavoriteIds(ids);
      })
      .catch(() => {
        // Silencioso
      });
  }, [user]);

  useEffect(() => {
    if (reopenModalPath === '/videos') {
      setShowAddModal(true);
      clearReopenModal();
    }
  }, [reopenModalPath, clearReopenModal]);

  useEffect(() => {
    if (lastCompletedAt) {
      loadVideos();
    }
  }, [lastCompletedAt, loadVideos]);

  // ---------- Abrir vídeo via query ?v=ID ----------
  useEffect(() => {
    if (typeof window === 'undefined' || allVideos.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const vParam = params.get('v');
    if (vParam) {
      const target = allVideos.find((v) => String(v.id) === vParam);
      if (target) {
        setSelectedVideo(target);
      }
    }
  }, [allVideos]);

  const availableCategories = useMemo(() => {
    const present = new Set<string>();
    for (const v of allVideos) {
      if (v.category) present.add(v.category.toLowerCase());
    }
    const keys = ['all', ...Object.keys(CATEGORY_LABELS).filter((k) => k !== 'all' && present.has(k))];
    return keys;
  }, [allVideos]);

  // ---------- Filtro e ordenação ----------
  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = allVideos.filter((v) => {
      if (sortBy === 'favorites' && !favoriteIds.has(v.id)) return false;
      if (categoryFilter !== 'all' && String(v.category || '').toLowerCase() !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        v.title.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q))
      );
    });

    if (sortBy === 'views') {
      list = [...list].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    } else if (sortBy === 'likes') {
      list = [...list].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    } else if (sortBy === 'alpha') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'pt'));
    } else {
      list = [...list].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return list;
  }, [allVideos, searchQuery, categoryFilter, sortBy, favoriteIds]);

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedVideos = useMemo(
    () =>
      filteredVideos.slice(
        (safePage - 1) * VIDEOS_PER_PAGE,
        safePage * VIDEOS_PER_PAGE
      ),
    [filteredVideos, safePage]
  );

  const featuredVideo = useMemo(() => {
    if (allVideos.length === 0) return null;
    return [...allVideos].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0];
  }, [allVideos]);

  const handlePlayVideo = (video: VideoItem, customQueue?: VideoItem[]) => {
    setActiveQueue(customQueue || null);
    setSelectedVideo(video);
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
    setActiveQueue(null);
    loadMix();
  };

  const handleToggleFavorite = async (video: VideoItem) => {
    if (!user) {
      showToast('Inicia sessão para guardar vídeos favoritos.');
      return;
    }
    const wasFav = favoriteIds.has(video.id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFav) next.delete(video.id);
      else next.add(video.id);
      return next;
    });
    try {
      const res = await favoritesApi.toggleFavorite(video.id, 'video');
      showToast(
        res.favorited
          ? `"${video.title}" guardado nos favoritos`
          : `"${video.title}" removido dos favoritos`
      );
    } catch {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFav) next.add(video.id);
        else next.delete(video.id);
        return next;
      });
      showToast('Não foi possível atualizar favoritos.');
    }
  };

  const handleShare = async (video: VideoItem) => {
    const shareUrl = `${window.location.origin}/videos?v=${video.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link do vídeo copiado!');
    } catch {
      showToast('Link pronto a partilhar.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-0 md:ml-60 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="p-6 max-w-[1600px] mx-auto">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <VideoIcon size={28} className="text-purple-400" />
                <h1 className="text-3xl font-bold text-white">Vídeos</h1>
              </div>
              <p className="text-purple-200 text-sm">
                {allVideos.length} vídeos disponíveis na Podfe Play
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {!loading && filteredVideos.length > 0 && (
                <button
                  type="button"
                  onClick={() => handlePlayVideo(filteredVideos[0], filteredVideos)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-medium transition-all"
                >
                  <Play size={16} />
                  <span>Reproduzir Lista</span>
                </button>
              )}

              {user && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium shadow-lg shadow-purple-600/25 transition-all"
                >
                  <Plus size={18} />
                  <span>Adicionar Vídeo</span>
                </button>
              )}
            </div>
          </div>

          {/* Vídeo em Destaque */}
          {!loading && !searchQuery && categoryFilter === 'all' && sortBy === 'recent' && featuredVideo && (
            <section className="mb-7 rounded-2xl bg-gradient-to-r from-purple-900/60 via-indigo-900/45 to-slate-900/75 border border-purple-500/25 p-5 flex flex-col lg:flex-row items-center gap-5">
              <div
                onClick={() => handlePlayVideo(featuredVideo, allVideos)}
                className="relative w-full lg:w-80 aspect-video rounded-xl overflow-hidden shrink-0 cursor-pointer group shadow-xl"
              >
                <img
                  src={resolveThumbUrl(featuredVideo.thumbnail_path)}
                  alt={featuredVideo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/default-video-thumb.svg';
                  }}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center shadow-lg">
                    <Play size={20} className="text-white ml-0.5" />
                  </div>
                </div>
                {formatDuration(featuredVideo.duration) && (
                  <span className="absolute bottom-2 right-2 text-xs bg-black/75 text-white px-2 py-0.5 rounded">
                    {formatDuration(featuredVideo.duration)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 w-full">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/25 text-purple-200 mb-2">
                  <TrendingUp size={12} /> Vídeo Mais Visto
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white line-clamp-2">
                  {featuredVideo.title}
                </h2>
                {featuredVideo.description && (
                  <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 mt-1">
                    {featuredVideo.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 mt-2.5">
                  <span className="flex items-center gap-1">
                    <Eye size={13} /> {(featuredVideo.views ?? 0).toLocaleString('pt-PT')} visualizações
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={13} /> {(featuredVideo.likes ?? 0).toLocaleString('pt-PT')} gostos
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayVideo(featuredVideo, allVideos)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-900 hover:bg-purple-100 text-xs font-bold transition-colors"
                  >
                    <Play size={14} /> Assistir Agora
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(featuredVideo)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-medium transition-colors ${
                      favoriteIds.has(featuredVideo.id)
                        ? 'bg-pink-500/20 border-pink-400/50 text-pink-200'
                        : 'bg-white/10 border-white/15 text-white hover:bg-white/15'
                    }`}
                  >
                    <Heart
                      size={14}
                      className={favoriteIds.has(featuredVideo.id) ? 'fill-pink-400 text-pink-400' : ''}
                    />
                    <span>{favoriteIds.has(featuredVideo.id) ? 'Nos Favoritos' : 'Favoritar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare(featuredVideo)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-white transition-colors"
                  >
                    <Share2 size={14} />
                    <span>Partilhar</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Barra de busca + ordenação + vista */}
          <div className="mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative max-w-md w-full">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Pesquisar vídeos por título ou descrição..."
                className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/10 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  aria-label="Limpar"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: 'recent', label: 'Mais Recentes' },
                    { key: 'views', label: 'Mais Vistos' },
                    { key: 'likes', label: 'Mais Curtidos' },
                    { key: 'alpha', label: 'A–Z' },
                    ...(user ? [{ key: 'favorites' as VideoSort, label: 'Favoritos' }] : []),
                  ] as Array<{ key: VideoSort; label: string }>
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSortBy(item.key);
                      setPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      sortBy === item.key
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-white/10 text-gray-300 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="inline-flex items-center rounded-full bg-white/10 p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Vista em grelha"
                  aria-label="Vista em grelha"
                  className={`p-1.5 rounded-full transition-colors ${
                    viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Vista em lista"
                  aria-label="Vista em lista"
                  className={`p-1.5 rounded-full transition-colors ${
                    viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Chips de categoria */}
          {!loading && availableCategories.length > 1 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(cat);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    categoryFilter === cat
                      ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>
          )}

          {!loading && (
            <p className="text-xs text-gray-400 mb-4">
              {filteredVideos.length} vídeo{filteredVideos.length !== 1 ? 's' : ''}
              {searchQuery && ` encontrado${filteredVideos.length !== 1 ? 's' : ''}`}
            </p>
          )}

          {/* Mix Personalizado (estilo YouTube, baseado em vídeos repetidos) */}
          {!loading && !searchQuery && categoryFilter === 'all' && sortBy === 'recent' && mixVideos.length > 0 && (
            <section className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-purple-900/50 via-indigo-900/40 to-slate-900/60 border border-purple-500/20">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Repeat size={18} className="text-purple-300" />
                    <h2 className="text-lg font-bold text-white">O teu Mix de Vídeos</h2>
                  </div>
                  <p className="text-xs text-purple-200/80 mt-0.5">
                    Criado automaticamente com os vídeos que mais repetes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlayVideo(mixVideos[0], mixVideos)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all"
                >
                  <Play size={14} />
                  <span>Reproduzir Mix</span>
                </button>
              </div>
              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3.5 pb-1 -mx-2 px-2 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {mixVideos.slice(0, 5).map((video) => (
                  <div key={`mix-${video.id}`} className="w-[74vw] max-w-[290px] shrink-0 snap-start md:w-auto md:max-w-none">
                    <VideoCard
                      video={video}
                      badge={`Visto ${video.user_play_count}×`}
                      onPlay={(v) => handlePlayVideo(v, mixVideos)}
                      isFavorited={favoriteIds.has(video.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onShare={handleShare}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skeleton Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-video bg-white/10" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-3.5 bg-white/10 rounded w-4/5" />
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-20">
              <p className="text-red-400 mb-3">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && filteredVideos.length === 0 && (
            <div className="text-center py-20 bg-white/[0.03] border border-white/10 rounded-2xl">
              <VideoIcon size={56} className="text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300 text-base font-medium mb-1">
                {sortBy === 'favorites'
                  ? 'Ainda não guardaste vídeos favoritos'
                  : searchQuery || categoryFilter !== 'all'
                    ? 'Nenhum vídeo encontrado para estes filtros'
                    : 'Nenhum vídeo disponível no momento'}
              </p>
              {(searchQuery || categoryFilter !== 'all' || sortBy === 'favorites') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setSortBy('recent');
                    setPage(1);
                  }}
                  className="text-purple-400 hover:text-purple-300 text-sm mt-2"
                >
                  Mostrar todos os vídeos
                </button>
              )}
            </div>
          )}

          {!loading && !error && paginatedVideos.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {paginatedVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onPlay={(v) => handlePlayVideo(v, filteredVideos)}
                      isFavorited={favoriteIds.has(video.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedVideos.map((video) => {
                    const durationLabel = formatDuration(video.duration);
                    const isFav = favoriteIds.has(video.id);
                    const catLabel =
                      video.category && CATEGORY_LABELS[video.category.toLowerCase()]
                        ? CATEGORY_LABELS[video.category.toLowerCase()]
                        : null;
                    return (
                      <div
                        key={video.id}
                        onClick={() => handlePlayVideo(video, filteredVideos)}
                        className="group cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/35 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 transition-all"
                      >
                        <div className="relative w-full sm:w-56 aspect-video rounded-xl overflow-hidden shrink-0 bg-slate-900">
                          <img
                            src={resolveThumbUrl(video.thumbnail_path)}
                            alt={video.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/default-video-thumb.svg';
                            }}
                          />
                          {durationLabel && (
                            <span className="absolute bottom-1.5 right-1.5 text-[11px] bg-black/75 text-white px-1.5 py-0.5 rounded">
                              {durationLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-white text-base line-clamp-2 group-hover:text-purple-300 transition-colors">
                                {video.title}
                              </h4>
                              {catLabel && (
                                <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded-full shrink-0">
                                  {catLabel}
                                </span>
                              )}
                            </div>
                            {video.description && (
                              <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                                {video.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3 pt-2 mt-2 border-t border-white/5 text-xs text-gray-400">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Eye size={13} /> {(video.views ?? 0).toLocaleString('pt-PT')} visualizações
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp size={13} /> {(video.likes ?? 0).toLocaleString('pt-PT')}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleFavorite(video)}
                                title={isFav ? 'Remover dos favoritos' : 'Favoritar'}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isFav
                                    ? 'text-pink-400 hover:bg-pink-500/15'
                                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                              >
                                <Heart size={15} className={isFav ? 'fill-pink-400' : ''} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleShare(video)}
                                title="Partilhar"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                              >
                                <Share2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-white/10 text-xs text-gray-400">
                  <span>
                    Página <strong className="text-white">{safePage}</strong> de{' '}
                    <strong className="text-white">{totalPages}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                      className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                      className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Seguinte
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-full bg-slate-900/95 border border-purple-500/40 text-white text-xs font-medium shadow-2xl flex items-center gap-2 backdrop-blur-md">
          <Check size={14} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <PlayerBar />

      <VideoPlayerModal
        video={selectedVideo}
        videos={activeQueue || filteredVideos}
        onSelectVideo={(v) => setSelectedVideo(v)}
        onClose={handleClosePlayer}
      />

      <AddVideoModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          loadVideos();
        }}
      />

      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
