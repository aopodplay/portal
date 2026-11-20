// app/trending/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import VideoPlayerModal, { VideoItem } from '@/components/VideoPlayerModal';
import {
  Play,
  Music,
  Flame,
  Pause,
  TrendingUp,
  Eye,
  ThumbsUp,
  AlertCircle,
  Calendar,
  Star,
  Sun,
  Video as VideoIcon,
  Heart,
  Share2,
  ListPlus,
  Check,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { getFriendlyErrorMessage, parseApiError } from '@/lib/errorHandler';
import { favoritesApi } from '@/lib/favoritesApi';
import { resolveCoverUrl, resolveThumbUrl } from '@/lib/media';

// =====================================================================
// TIPOS
// =====================================================================

interface TrendingItem {
  id: number;
  contentId?: number;
  music_id?: number;
  video_id?: number;
  source_id?: number;
  title: string;
  type: string;
  content_type?: string;
  cover_url?: string;
  thumbnail_path?: string;
  file_path?: string;
  video_url?: string;
  hls_url?: string;
  description?: string | null;
  views: number;
  likes: number;
  position: number;
  reason?: string;
  score?: number;
  author?: string;
  duration?: number;
  created_at?: string;
}

interface TrendingCategory {
  id?: number;
  category_id?: number;
  category: string;
  title?: string;
  subtitle?: string;
  image_url?: string;
  position?: number;
  content_count?: number;
  is_auto?: boolean;
}

type TypeFilter = 'all' | 'music' | 'video';

// =====================================================================
// HELPERS
// =====================================================================

const getCategoryKey = (category: TrendingCategory, index: number) =>
  String(
    category.id ??
      category.category_id ??
      `${category.category}-${category.position ?? index}`
  );

const getItemKey = (item: TrendingItem, index: number) =>
  String(item.id ?? item.contentId ?? `trending-${index}`);

function isVideoItem(item: TrendingItem): boolean {
  const t = String(item.type || item.content_type || '').toLowerCase();
  return t === 'video' || Boolean(item.video_id);
}

function getSourceId(item: TrendingItem): number {
  if (isVideoItem(item)) {
    return Number(item.video_id ?? item.source_id ?? item.contentId ?? item.id);
  }
  return Number(item.music_id ?? item.source_id ?? item.contentId ?? item.id);
}

function toPlayerMusic(item: TrendingItem) {
  const id = getSourceId(item);
  return {
    id,
    title: item.title,
    artist: item.author || 'Artista',
    album: null,
    duration: item.duration || 0,
    file_path: item.file_path || '',
    file_size: 0,
    cover_image: item.cover_url || null,
    created_at: item.created_at || new Date().toISOString(),
  };
}

function toVideoItem(item: TrendingItem): VideoItem {
  return {
    id: getSourceId(item),
    title: item.title,
    description: item.description || null,
    duration: item.duration ?? null,
    file_path: item.file_path || item.video_url || item.hls_url || '',
    thumbnail_path: item.thumbnail_path || item.cover_url || null,
    file_size: 0,
    views: item.views ?? 0,
    likes: item.likes ?? 0,
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
  onToggleFavorite,
  onAddToQueue,
  onShare,
  isFavorited = false,
  rank,
}: {
  item: TrendingItem;
  isPlaying?: boolean;
  onPlay?: () => void;
  onToggleFavorite?: () => void;
  onAddToQueue?: () => void;
  onShare?: () => void;
  isFavorited?: boolean;
  rank?: number;
}) => {
  const isVideo = isVideoItem(item);
  const coverSrc = isVideo
    ? resolveThumbUrl(item.thumbnail_path || item.cover_url)
    : resolveCoverUrl(item.cover_url);

  return (
    <div
      onClick={onPlay}
      className="group cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/35 rounded-2xl p-2.5 sm:p-3 transition-all duration-200 flex flex-col min-w-0 overflow-hidden"
    >
      <div
        className={`relative rounded-xl overflow-hidden ${
          isVideo ? 'aspect-video' : 'aspect-square'
        } mb-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20`}
      >
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = isVideo
                ? '/default-video-thumb.svg'
                : '/default-cover.svg';
            }}
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

        {/* Ranking badge */}
        {rank && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <div
              className={`px-2 py-0.5 rounded-full flex items-center justify-center font-bold text-white text-[11px] shadow ${
                rank === 1
                  ? 'bg-amber-500'
                  : rank === 2
                    ? 'bg-slate-400 text-slate-900'
                    : rank === 3
                      ? 'bg-orange-500'
                      : 'bg-black/65 backdrop-blur-sm'
              }`}
            >
              #{rank}
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-sm text-purple-200 flex items-center gap-1">
              {isVideo ? <VideoIcon size={10} /> : <Music size={10} />}
              {isVideo ? 'Vídeo' : 'Música'}
            </span>
          </div>
        )}

        {/* Favoritar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          title={isFavorited ? 'Remover dos favoritos' : 'Favoritar'}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 ${
            isFavorited
              ? 'bg-pink-500/90 text-white opacity-100'
              : 'bg-black/55 text-white/85 hover:text-white opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart size={14} className={isFavorited ? 'fill-white' : ''} />
        </button>

        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          {!isVideo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToQueue?.();
              }}
              title="Adicionar à fila"
              className="w-8 h-8 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            >
              <ListPlus size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.();
            }}
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
            className={`w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:bg-purple-500 transition-all ${
              isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isPlaying ? (
              <Pause size={18} className="text-white" />
            ) : (
              <Play size={18} className="text-white ml-0.5" />
            )}
          </button>
        </div>

        {item.duration && item.duration > 0 && (
          <span className="absolute bottom-2 left-2 text-[11px] bg-black/70 text-white px-1.5 py-0.5 rounded">
            {Math.floor(item.duration / 60)}:
            {(item.duration % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0 overflow-hidden">
        <div className="min-w-0">
          <h4 className="font-semibold text-white text-xs sm:text-sm truncate group-hover:text-purple-300 transition-colors">
            {item.title}
          </h4>
          <p className="text-gray-400 text-[11px] sm:text-xs truncate">
            {item.author || (isVideo ? 'PodFéPlay Vídeo' : 'Artista')}
          </p>
        </div>

        <div className="flex items-center justify-between gap-1 pt-2 mt-2 border-t border-white/5 text-[11px] text-gray-400 min-w-0">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="flex items-center gap-1 shrink-0">
              <Eye size={11} />
              {(item.views ?? 0).toLocaleString('pt-PT')}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <ThumbsUp size={11} />
              {(item.likes ?? 0).toLocaleString('pt-PT')}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare?.();
            }}
            title="Partilhar"
            className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <Share2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// CATEGORY CARD
// =====================================================================

const CategoryCard = ({
  category,
  onClick,
}: {
  category: TrendingCategory;
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer group border border-white/10"
    >
      <div className="aspect-video bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.title || category.category}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-center p-6">
            <Star size={32} className="text-white/50 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white">
              {category.title || category.category}
            </h3>
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white text-sm font-semibold">
          {category.title || category.category}
        </p>
        <p className="text-gray-300 text-xs">
          {category.subtitle || `${category.content_count || 0} conteúdos`}
        </p>
      </div>
    </div>
  );
};

// =====================================================================
// PÁGINA
// =====================================================================

export default function TrendingPage() {
  const { user } = useAuth();
  const { play, togglePlay, addToQueue, isPlaying, currentMusic } = usePlayer();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [categories, setCategories] = useState<TrendingCategory[]>([]);
  const [source, setSource] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [videoQueue, setVideoQueue] = useState<VideoItem[]>([]);
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  // ---------- Carregar ----------
  const loadTrending = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${getApiUrl('/api/v1/trending')}?limit=30&period=${period}`,
        { headers: getAuthHeaders() }
      );
      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        setTrendingItems(result.data.items || []);
        setSource(result.data.source || 'automated');
      } else {
        setError(parseApiError(response, result, 'Não foi possível carregar os conteúdos em alta.'));
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível carregar os conteúdos em alta. Tenta novamente.'));
    } finally {
      setLoading(false);
    }
  }, [period]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch(getApiUrl('/api/v1/trending/categories'), {
        headers: getAuthHeaders(),
      });
      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        const raw: TrendingCategory[] = result.data || [];
        const seen = new Set<string>();
        const unique = raw.filter((cat) => {
          const key = String(cat.id ?? cat.category_id ?? cat.category);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setCategories(unique);
      }
    } catch {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    loadTrending();
    loadCategories();
  }, [loadTrending, loadCategories]);

  useEffect(() => {
    if (!user) {
      setFavoriteKeys(new Set());
      return;
    }
    favoritesApi
      .list(1, 200)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        const keys = new Set<string>();
        for (const fav of list) {
          const ct = String(fav.content_type || 'music').toLowerCase();
          const cid = Number(fav.content_id ?? fav.id);
          if (cid) keys.add(`${ct === 'video' ? 'video' : 'music'}-${cid}`);
        }
        setFavoriteKeys(keys);
      })
      .catch(() => {});
  }, [user]);

  const filteredItems = useMemo(() => {
    if (typeFilter === 'all') return trendingItems;
    return trendingItems.filter((item) =>
      typeFilter === 'video' ? isVideoItem(item) : !isVideoItem(item)
    );
  }, [trendingItems, typeFilter]);

  const topItem = filteredItems[0] || null;

  // ---------- Play REAL (Músicas no PlayerContext, Vídeos no VideoPlayerModal!) ----------
  const handlePlayItem = async (item: TrendingItem) => {
    if (isVideoItem(item)) {
      const vidId = getSourceId(item);
      const initialVideo = toVideoItem(item);
      const queueVids = filteredItems.filter(isVideoItem).map(toVideoItem);
      setVideoQueue(queueVids);
      setSelectedVideo(initialVideo);

      // Enriquecer com dados completos do vídeo (descrição, likes, file_path oficial)
      try {
        const res = await fetch(getApiUrl(`/api/v1/videos/${vidId}`), {
          headers: getAuthHeaders(),
        });
        const body = await res.json().catch(() => null);
        if (res.ok && body?.success && body.data?.file_path) {
          setSelectedVideo(body.data);
          return;
        }
        if (!initialVideo.file_path) {
          const contentRes = await fetch(getApiUrl(`/api/v1/contents/${vidId}`), {
            headers: getAuthHeaders(),
          });
          const contentBody = await contentRes.json().catch(() => null);
          const c = contentBody?.data;
          if (contentRes.ok && c && (c.video_url || c.hls_url || c.file_path)) {
            setSelectedVideo({
              ...initialVideo,
              file_path: c.video_url || c.hls_url || c.file_path,
              description: c.description || initialVideo.description,
            });
          }
        }
      } catch {
        // Mantém fallback já aberto
      }
      return;
    }

    const musicId = getSourceId(item);
    if (currentMusic?.id === musicId) {
      togglePlay();
      return;
    }

    const musicQueue = filteredItems.filter((i) => !isVideoItem(i)).map(toPlayerMusic);
    const idx = musicQueue.findIndex((m) => m.id === musicId);
    const orderedQueue =
      idx >= 0
        ? [...musicQueue.slice(idx), ...musicQueue.slice(0, idx)]
        : musicQueue;
    play(toPlayerMusic(item), true, orderedQueue);
  };

  const handleToggleFavorite = async (item: TrendingItem) => {
    if (!user) {
      showToast('Inicia sessão para guardar favoritos.');
      return;
    }
    const isVid = isVideoItem(item);
    const cid = getSourceId(item);
    const key = `${isVid ? 'video' : 'music'}-${cid}`;
    const wasFav = favoriteKeys.has(key);

    setFavoriteKeys((prev) => {
      const next = new Set(prev);
      if (wasFav) next.delete(key);
      else next.add(key);
      return next;
    });

    try {
      const res = await favoritesApi.toggleFavorite(cid, isVid ? 'video' : 'music');
      showToast(
        res.favorited
          ? `"${item.title}" adicionado aos favoritos`
          : `"${item.title}" removido dos favoritos`
      );
    } catch {
      setFavoriteKeys((prev) => {
        const next = new Set(prev);
        if (wasFav) next.add(key);
        else next.delete(key);
        return next;
      });
      showToast('Não foi possível atualizar favoritos.');
    }
  };

  const handleShareItem = async (item: TrendingItem) => {
    const id = getSourceId(item);
    const url = isVideoItem(item)
      ? `${window.location.origin}/videos?v=${id}`
      : `${window.location.origin}/player/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast('Link copiado para partilhar!');
    } catch {
      showToast('Link pronto a partilhar.');
    }
  };

  const isCurrentPlaying = (item: TrendingItem) => {
    if (isVideoItem(item)) return false;
    return currentMusic?.id === getSourceId(item) && isPlaying;
  };

  const handleCategoryClick = (category: TrendingCategory) => {
    window.location.href = `/search?category=${encodeURIComponent(
      category.category
    )}`;
  };

  const periods = [
    { value: 'day', label: 'Hoje', icon: <Sun size={14} /> },
    { value: 'week', label: 'Esta semana', icon: <Calendar size={14} /> },
    { value: 'month', label: 'Este mês', icon: <TrendingUp size={14} /> },
  ];

  // =====================================================================
  // RENDER
  // =====================================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-0 md:ml-60 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="max-w-[1600px] mx-auto px-6 py-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <Flame size={28} className="text-orange-400" />
                <h1 className="text-3xl font-bold text-white">Em Alta</h1>
              </div>
              <p className="text-purple-200 text-sm mt-1">
                As músicas e vídeos mais populares na PodFéPlay
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {periods.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriod(p.value as any)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    period === p.value
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros por tipo */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              {(
                [
                  { key: 'all', label: 'Todos' },
                  { key: 'music', label: 'Músicas' },
                  { key: 'video', label: 'Vídeos' },
                ] as Array<{ key: TypeFilter; label: string }>
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setTypeFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    typeFilter === f.key
                      ? 'bg-white text-slate-900 font-bold'
                      : 'bg-white/10 text-gray-300 hover:bg-white/15'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {source && (
              <span className="text-xs text-gray-400">
                {source === 'curated'
                  ? 'Seleção editorial'
                  : 'Ordenado por visualizações e interações'}
              </span>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                ✕
              </button>
            </div>
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
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.03] border border-white/10 rounded-2xl">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flame size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-300 text-sm">
                Nenhum conteúdo em alta encontrado para este filtro.
              </p>
            </div>
          ) : (
            <>
              {/* Hero #1 Em Alta */}
              {topItem && (
                <section className="mb-7 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-500/20 via-purple-900/55 to-slate-900/80 border border-orange-400/25 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 overflow-hidden">
                  <div
                    onClick={() => handlePlayItem(topItem)}
                    className={`relative ${
                      isVideoItem(topItem)
                        ? 'w-full sm:w-64 aspect-video'
                        : 'w-28 h-28 sm:w-36 sm:h-36'
                    } rounded-2xl overflow-hidden shrink-0 shadow-xl cursor-pointer group`}
                  >
                    <img
                      src={
                        isVideoItem(topItem)
                          ? resolveThumbUrl(topItem.thumbnail_path || topItem.cover_url)
                          : resolveCoverUrl(topItem.cover_url)
                      }
                      alt={topItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-bold">
                      #1
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 w-full text-center sm:text-left overflow-hidden">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-500/25 text-orange-200 mb-2">
                      <Flame size={12} /> #1 Em Alta · {isVideoItem(topItem) ? 'Vídeo' : 'Música'}
                    </span>
                    <h2 className="text-lg sm:text-2xl font-bold text-white line-clamp-2 break-words">
                      {topItem.title}
                    </h2>
                    <p className="text-sm text-purple-200 mt-0.5 truncate">
                      {topItem.author || (isVideoItem(topItem) ? 'PodFéPlay Vídeo' : 'Artista')}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-gray-300 mt-2">
                      <span className="flex items-center gap-1">
                        <Eye size={13} /> {(topItem.views ?? 0).toLocaleString('pt-PT')} visualizações
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={13} /> {(topItem.likes ?? 0).toLocaleString('pt-PT')} gostos
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlayItem(topItem)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-900 hover:bg-purple-100 text-xs font-bold transition-colors"
                      >
                        <Play size={14} />
                        <span>{isVideoItem(topItem) ? 'Assistir Agora' : 'Ouvir Agora'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(topItem)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-white"
                      >
                        <Heart
                          size={14}
                          className={
                            favoriteKeys.has(
                              `${isVideoItem(topItem) ? 'video' : 'music'}-${getSourceId(topItem)}`
                            )
                              ? 'fill-pink-400 text-pink-400'
                              : ''
                          }
                        />
                        <span>Favoritar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareItem(topItem)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-white"
                      >
                        <Share2 size={14} />
                        <span>Partilhar</span>
                      </button>
                    </div>
                  </div>
                </section>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
                {filteredItems.map((item, index) => {
                  const key = `${isVideoItem(item) ? 'video' : 'music'}-${getSourceId(item)}`;
                  return (
                    <ContentCard
                      key={getItemKey(item, index)}
                      item={item}
                      rank={index + 1}
                      isPlaying={isCurrentPlaying(item)}
                      isFavorited={favoriteKeys.has(key)}
                      onPlay={() => handlePlayItem(item)}
                      onToggleFavorite={() => handleToggleFavorite(item)}
                      onAddToQueue={() => {
                        addToQueue(toPlayerMusic(item));
                        showToast(`"${item.title}" adicionada à fila`);
                      }}
                      onShare={() => handleShareItem(item)}
                    />
                  );
                })}
              </div>

              {categories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Star size={20} className="text-purple-400" />
                    <h2 className="text-xl font-bold text-white">
                      Categorias em Alta
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category, index) => (
                      <CategoryCard
                        key={getCategoryKey(category, index)}
                        category={category}
                        onClick={() => handleCategoryClick(category)}
                      />
                    ))}
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
        videos={videoQueue}
        onSelectVideo={(v) => setSelectedVideo(v)}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
}
