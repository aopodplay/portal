'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import PodPlayFooter from '@/components/PodPlayFooter';
import AddToPlaylistButton from '@/components/AddToPlaylistButton';
import {
  Play,
  Pause,
  Flame,
  Plus,
  ChevronRight,
  Calendar,
  Church,
  Mic,
  DiscAlbum,
  Book,
  Radio,
  TrendingUp,
  Loader2,
  Video as VideoIcon,
  Music as MusicIcon,
  Clock,
  Eye,
  Heart,
  Download,
  Shuffle,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { resolveCoverUrl, resolveThumbUrl } from '@/lib/media';
import { historyApi } from '@/lib/historyApi';
import { catalogApi, type Artist, type Album } from '@/lib/catalogApi';
import { favoritesApi, downloadsApi, ContentType } from '@/lib/favoritesApi';
import { metricsApi } from '@/lib/metricsApi';
import type { ContentMetrics } from '@/lib/metricsApi';
import { formatDurationOrDash, playsLabel, getArtistHref } from '@/lib/catalogApi';
import { getFriendlyErrorMessage, parseApiError } from '@/lib/errorHandler';

// =====================================================================
// TIPOS
// =====================================================================

interface MusicItem {
  id: number;
  title: string;
  artist: string;
  artist_id?: number | null;
  album: string | null;
  album_id?: number | null;
  category?: string | null;
  duration: number | null;
  file_path: string;
  file_size: number;
  cover_image: string | null;
  created_at: string;
  plays?: number;
}

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
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  content_count?: number;
}

// =====================================================================
// MUSIC CARD
// =====================================================================

const MusicCard = ({
  music,
  onPlay,
  isCurrentMusicPlaying,
  isFavorited,
  onToggleFavorite,
  onDownload,
  isDownloading,
  metrics,
}: {
  music: MusicItem;
  onPlay: (music: MusicItem) => void;
  isCurrentMusicPlaying: (music: MusicItem) => boolean;
  isFavorited: boolean;
  onToggleFavorite: (music: MusicItem) => void;
  onDownload: (music: MusicItem) => void;
  isDownloading: boolean;
  metrics?: ContentMetrics;
}) => {
  const coverUrl = resolveCoverUrl(music.cover_image);
  const isPlaying = isCurrentMusicPlaying(music);
  const plays = music.plays ?? metrics?.likes ?? 0;

  return (
    <div className="group">
      <div
        className="relative rounded-lg overflow-hidden aspect-square mb-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 cursor-pointer"
        onClick={() => onPlay(music)}
      >
        <img
          src={coverUrl}
          alt={music.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/default-cover.svg';
          }}
        />

        {isPlaying && (
          <div className="absolute inset-0 bg-purple-900/40 flex items-center justify-center">
            <div className="flex gap-1">
              <span className="w-1 h-4 bg-white rounded animate-pulse" />
              <span className="w-1 h-6 bg-white rounded animate-pulse delay-75" />
              <span className="w-1 h-3 bg-white rounded animate-pulse delay-150" />
            </div>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(music);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm z-10 ${
            isFavorited
              ? 'bg-red-500/90 opacity-100'
              : 'bg-black/60 opacity-0 group-hover:opacity-100'
          }`}
          title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart
            size={14}
            className={isFavorited ? 'text-white fill-white' : 'text-white'}
          />
        </button>

        <div className="absolute bottom-2 right-2 flex gap-1.5 z-10">
          <div className="opacity-0 group-hover:opacity-100 transition-all">
            <AddToPlaylistButton musicId={music.id} />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(music);
            }}
            disabled={isDownloading}
            className="w-9 h-9 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-black/90 disabled:opacity-60"
            title="Descarregar"
          >
            {isDownloading ? (
              <Loader2 size={14} className="text-white animate-spin" />
            ) : (
              <Download size={14} className="text-white" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(music);
            }}
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

        {music.duration && music.duration > 0 && (
          <span className="absolute bottom-2 left-2 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock size={10} />
            {formatDurationOrDash(music.duration)}
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        <h4
          className={`font-medium text-sm truncate ${
            isPlaying ? 'text-purple-400' : 'text-white'
          }`}
          title={music.title}
        >
          {music.title}
        </h4>

        {music.artist_id ? (
          <Link
            href={getArtistHref(music.artist_id, music.artist)}
            className="text-gray-400 text-xs truncate block hover:text-purple-300 transition-colors"
            title={music.artist}
          >
            {music.artist}
          </Link>
        ) : (
          <p className="text-gray-400 text-xs truncate">{music.artist}</p>
        )}

        {music.album && music.album_id ? (
          <Link
            href={`/albums/${music.album_id}`}
            className="text-gray-500 text-xs truncate block hover:text-purple-300 transition-colors"
            title={music.album}
          >
            {music.album}
          </Link>
        ) : music.album ? (
          <p className="text-gray-500 text-xs truncate">{music.album}</p>
        ) : null}

        <p className="text-gray-500 text-xs truncate">{playsLabel(plays)}</p>
      </div>
    </div>
  );
};

// =====================================================================
// VIDEO CARD
// =====================================================================

const VideoCard = ({
  video,
  onPlay,
  isFavorited,
  onToggleFavorite,
  onDownload,
  isDownloading,
  metrics,
}: {
  video: VideoItem;
  onPlay: (video: VideoItem) => void;
  isFavorited: boolean;
  onToggleFavorite: (video: VideoItem) => void;
  onDownload: (video: VideoItem) => void;
  isDownloading: boolean;
  metrics?: ContentMetrics;
}) => {
  const thumbUrl = resolveThumbUrl(video.thumbnail_path);
  const durationLabel =
    video.duration && video.duration > 0
      ? formatDurationOrDash(video.duration)
      : null;

  return (
    <div className="group cursor-pointer" onClick={() => onPlay(video)}>
      <div className="relative rounded-lg overflow-hidden aspect-video mb-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
        <img
          src={thumbUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/default-video-thumb.svg';
          }}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(video);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm z-10 ${
            isFavorited
              ? 'bg-red-500/90 opacity-100'
              : 'bg-black/60 opacity-0 group-hover:opacity-100'
          }`}
          title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart
            size={14}
            className={isFavorited ? 'text-white fill-white' : 'text-white'}
          />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(video);
          }}
          disabled={isDownloading}
          className="absolute bottom-2 left-2 w-9 h-9 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-black/90 disabled:opacity-60 z-10"
          title="Descarregar"
        >
          {isDownloading ? (
            <Loader2 size={14} className="text-white animate-spin" />
          ) : (
            <Download size={14} className="text-white" />
          )}
        </button>

        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Play size={22} className="text-white ml-1" />
          </div>
        </div>

        {durationLabel && (
          <span className="absolute bottom-2 right-2 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock size={10} />
            {durationLabel}
          </span>
        )}
      </div>
      <h4 className="font-medium text-white text-sm truncate">{video.title}</h4>

      <div className="flex items-center gap-3 mt-0.5">
        <p className="text-gray-400 text-xs flex items-center gap-1">
          <Eye size={11} />
          {metrics?.views ?? video.views ?? 0} visualizações
        </p>
        <p className="text-gray-400 text-xs flex items-center gap-1">
          <Heart size={11} />
          {metrics?.likes ?? video.likes ?? 0}
        </p>
      </div>
    </div>
  );
};

const SeriesCard = ({
  title,
  subtitle,
  badge,
  imageUrl,
}: {
  title: string;
  subtitle: string;
  badge: string;
  imageUrl?: string;
}) => {
  const resolved = resolveCoverUrl(imageUrl);
  return (
    <div className="group cursor-pointer">
      <div className="relative rounded-lg overflow-hidden aspect-[3/4] mb-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
        <img
          src={resolved}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/default-cover.svg';
          }}
        />
        {badge && (
          <span className="absolute top-2 left-2 text-xs font-bold bg-purple-600 text-white px-2 py-1 rounded-md">
            {badge}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <button className="absolute bottom-2 right-2 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg hover:scale-110 hover:bg-purple-500">
          <Play size={18} className="text-white ml-0.5" />
        </button>
      </div>
      <h4 className="font-bold text-white text-base truncate">{title}</h4>
      <p className="text-gray-400 text-xs truncate">{subtitle}</p>
    </div>
  );
};

const ChurchEvent = ({
  title,
  description,
  date,
  icon: Icon,
}: {
  title: string;
  description: string;
  date: string;
  icon: React.ElementType;
}) => {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer group">
      <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white text-sm">{title}</h4>
        <p className="text-gray-400 text-xs">{description}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Calendar size={10} className="text-gray-500" />
          <span className="text-gray-500 text-xs">{date}</span>
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-500 group-hover:text-purple-400 transition-colors" />
    </div>
  );
};

const CategoryPill = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? 'bg-purple-600 text-white shadow-md'
          : 'bg-white/10 text-gray-300 hover:bg-white/20'
      }`}
    >
      {label}
    </button>
  );
};

// =====================================================================
// PÁGINA
// =====================================================================

export default function HomePage() {
  const { user } = useAuth();
  const { play, isPlaying, currentMusic } = usePlayer();

  const [activeCategory, setActiveCategory] = useState<string>('all');

  const [allMusic, setAllMusic] = useState<MusicItem[]>([]);
  const [musicLoading, setMusicLoading] = useState(true);

  const [videoList, setVideoList] = useState<VideoItem[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [featuredSeries, setFeaturedSeries] = useState<
    Array<{ id?: number; title: string; subtitle: string; badge: string; target_url?: string }>
  >([
    { title: '40 Dias de Oração', subtitle: 'Série Podfé Original', badge: '40 EP.', target_url: '/videos' },
    { title: 'Bíblia Completa em Áudio', subtitle: 'Narração Integral', badge: '66 LIVROS', target_url: '/music' },
    { title: 'Identidade em Cristo', subtitle: 'Pr. Lucinho Barreto', badge: '12 EP.', target_url: '/videos' },
  ]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryContents, setCategoryContents] = useState<any[]>([]);
  const [categoryContentLoading, setCategoryContentLoading] = useState(false);

  const [favoritesSet, setFavoritesSet] = useState<Set<string>>(new Set());
  const [downloadingSet, setDownloadingSet] = useState<Set<string>>(new Set());
  const [metricsMap, setMetricsMap] = useState<Record<string, ContentMetrics>>({});

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const favKey = (contentType: ContentType, id: number) => `${contentType}:${id}`;

  const defaultChurchEvents = [
    { title: 'Domingo — Pr. Carlos', description: 'Culto de Celebração', date: '26 Abril 2026', icon: Mic },
    { title: 'Estudo Bíblico — Romanos', description: 'Célula de Quarta-feira', date: 'Quarta - Célula', icon: Book },
    { title: 'Louvor & Adoração', description: 'Equipa de Louvor', date: 'Ensaio semanal', icon: DiscAlbum },
    { title: 'Próximo directo', description: 'Transmissão ao vivo', date: 'Domingo 09:00', icon: Radio },
  ];
  const [platformEvents, setPlatformEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch(getApiUrl('/api/v1/events'), { cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => {
        if (b?.success && Array.isArray(b.data) && b.data.length > 0) {
          setPlatformEvents(b.data);
        }
      })
      .catch(() => {});
  }, []);

  const eventsOnly = platformEvents.filter((ev) => ev.category !== 'publicidade');
  const adsList = platformEvents.filter((ev) => ev.category === 'publicidade');

  const churchEvents =
    eventsOnly.length > 0
      ? eventsOnly.map((ev) => ({
          title: ev.title,
          description: ev.description || ev.location || 'Evento da Plataforma',
          date: ev.event_date || new Date(ev.created_at).toLocaleDateString('pt-PT'),
          icon: Radio,
        }))
      : defaultChurchEvents;

  const registrarReproducao = useCallback(
    (contentId: number, contentType: 'music' | 'video') => {
      if (!user || !contentId) return;
      historyApi
        .recordPlayback({
          contentId,
          contentType,
          progress: 0,
          duration: 0,
          completed: false,
          deviceType: 'desktop',
        })
        .catch((err) =>
          console.warn(`[history] Falha a gravar ${contentType}:`, err?.message || err)
        );
    },
    [user]
  );

  const refreshMetrics = useCallback(
    async (contentType: ContentType, id: number) => {
      try {
        const m = await metricsApi.getOne(contentType, id);
        setMetricsMap((prev) => ({ ...prev, [`${contentType}:${id}`]: m }));
      } catch {
        /* silencioso */
      }
    },
    []
  );

  const handleToggleFavorite = useCallback(
    async (item: { id: number }, contentType: ContentType) => {
      if (!user) {
        showToast('error', 'Precisas de estar logado para favoritar');
        return;
      }

      const key = favKey(contentType, item.id);
      const wasFavorited = favoritesSet.has(key);

      setFavoritesSet((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.delete(key);
        else next.add(key);
        return next;
      });

      try {
        const res = await favoritesApi.toggleFavorite(item.id, contentType);
        setFavoritesSet((prev) => {
          const next = new Set(prev);
          if (res.favorited) next.add(key);
          else next.delete(key);
          return next;
        });
        showToast('success', res.favorited ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
        refreshMetrics(contentType, item.id);
      } catch (err: any) {
        setFavoritesSet((prev) => {
          const next = new Set(prev);
          if (wasFavorited) next.add(key);
          else next.delete(key);
          return next;
        });
        showToast('error', err?.message || 'Erro ao favoritar');
      }
    },
    [user, favoritesSet, refreshMetrics]
  );

  const handleDownload = useCallback(
    async (item: { id: number; title: string }, contentType: ContentType) => {
      if (!user) {
        showToast('error', 'Precisas de estar logado para descarregar');
        return;
      }

      const key = favKey(contentType, item.id);
      if (downloadingSet.has(key)) return;

      setDownloadingSet((prev) => new Set(prev).add(key));

      try {
        const { blob, fileName } = await downloadsApi.download(item.id, contentType, 'high');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || `${item.title}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('success', `Download iniciado: ${fileName}`);
      } catch (err: any) {
        showToast('error', getFriendlyErrorMessage(err, 'Não foi possível descarregar o ficheiro.'));
      } finally {
        setDownloadingSet((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [user, downloadingSet]
  );

  // Artistas e Álbuns
  useEffect(() => {
    (async () => {
      try {
        setCatalogLoading(true);
        const [artistsResult, albumsResult, seriesResult] = await Promise.allSettled([
          catalogApi.listArtists(1, 20),
          catalogApi.listAlbums(1, 20),
          fetch(getApiUrl('/api/v1/series')).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        if (artistsResult.status === 'fulfilled') {
          setArtists(Array.isArray(artistsResult.value?.artists) ? artistsResult.value.artists : []);
        }
        if (albumsResult.status === 'fulfilled') {
          setAlbums(Array.isArray(albumsResult.value?.albums) ? albumsResult.value.albums : []);
        }
        if (
          seriesResult.status === 'fulfilled' &&
          seriesResult.value?.success &&
          Array.isArray(seriesResult.value.data) &&
          seriesResult.value.data.length > 0
        ) {
          setFeaturedSeries(seriesResult.value.data);
        }

        if (artistsResult.status === 'rejected' && albumsResult.status === 'rejected') {
          setLoadError((prev) =>
            prev || getFriendlyErrorMessage(artistsResult.reason, 'Não foi possível carregar o catálogo neste momento.')
          );
        }
      } catch (err) {
        setLoadError((prev) =>
          prev || getFriendlyErrorMessage(err, 'Não foi possível carregar o catálogo neste momento.')
        );
      } finally {
        setCatalogLoading(false);
      }
    })();
  }, []);

  // Categorias
  useEffect(() => {
    (async () => {
      try {
        setCategoriesLoading(true);
        const res = await fetch(getApiUrl('/api/v1/categories'), {
          headers: getAuthHeaders(),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success && json.data) {
          setCategories(json.data);
        } else if (!res.ok) {
          setLoadError((prev) => prev || parseApiError(res, json, 'Não foi possível carregar as categorias.'));
        }
      } catch (err) {
        setLoadError((prev) => prev || getFriendlyErrorMessage(err, 'Não foi possível carregar as categorias.'));
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, []);

  // Músicas
  useEffect(() => {
    (async () => {
      try {
        setMusicLoading(true);
        const response = await fetch(getApiUrl('/api/v1/music'), {
          headers: getAuthHeaders(),
        });
        const result = await response.json().catch(() => null);
        if (response.ok && result?.success && result.data) {
          const items: MusicItem[] = Array.isArray(result.data)
            ? result.data
            : Array.isArray(result.data.items)
              ? result.data.items
              : [];
          setAllMusic(items);
        } else if (!response.ok) {
          setLoadError((prev) => prev || parseApiError(response, result, 'Não foi possível carregar as músicas.'));
        }
      } catch (err) {
        setLoadError((prev) => prev || getFriendlyErrorMessage(err, 'Não foi possível carregar as músicas.'));
      } finally {
        setMusicLoading(false);
      }
    })();
  }, []);

  // Vídeos
  useEffect(() => {
    (async () => {
      try {
        setVideosLoading(true);
        const response = await fetch(getApiUrl('/api/v1/videos'), {
          headers: getAuthHeaders(),
        });
        const result = await response.json().catch(() => null);
        if (response.ok && result?.success && result.data) {
          const items: VideoItem[] = Array.isArray(result.data)
            ? result.data
            : Array.isArray(result.data.items)
              ? result.data.items
              : [];
          setVideoList(items);
        } else if (!response.ok) {
          setLoadError((prev) => prev || parseApiError(response, result, 'Não foi possível carregar os vídeos.'));
        }
      } catch (err) {
        setLoadError((prev) => prev || getFriendlyErrorMessage(err, 'Não foi possível carregar os vídeos.'));
      } finally {
        setVideosLoading(false);
      }
    })();
  }, []);

  // Favoritos iniciais
  useEffect(() => {
    if (!user) return;
    if (allMusic.length === 0 && videoList.length === 0) return;

    let cancelled = false;

    (async () => {
      const toCheck: { contentType: ContentType; id: number }[] = [
        ...allMusic.slice(0, 12).map((m) => ({ contentType: 'music' as const, id: m.id })),
        ...videoList.slice(0, 12).map((v) => ({ contentType: 'video' as const, id: v.id })),
      ];

      const chunkSize = 5;
      const results: { key: string; isFavorited: boolean }[] = [];
      let shouldStop = false;

      for (let i = 0; i < toCheck.length && !shouldStop; i += chunkSize) {
        const chunk = toCheck.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(
          chunk.map(async ({ contentType, id }) => {
            try {
              const res = await favoritesApi.checkFavorite(id, contentType);
              return { key: favKey(contentType, id), isFavorited: res.isFavorited };
            } catch {
              shouldStop = true;
              return { key: favKey(contentType, id), isFavorited: false };
            }
          })
        );
        results.push(...chunkResults);
        if (cancelled) return;
      }

      if (cancelled) return;

      setFavoritesSet((prev) => {
        const next = new Set(prev);
        results.forEach((r) => {
          if (r.isFavorited) next.add(r.key);
        });
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [user, allMusic.length, videoList.length]);

  // Métricas iniciais
  useEffect(() => {
    if (!user) return;
    if (allMusic.length === 0 && videoList.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const map: Record<string, ContentMetrics> = {};

        if (allMusic.length > 0) {
          const musicMetrics = await metricsApi.getBatch(
            'music',
            allMusic.map((m) => m.id)
          );
          for (const [id, m] of Object.entries(musicMetrics)) {
            map[`music:${id}`] = m;
          }
        }

        if (cancelled) return;

        if (videoList.length > 0) {
          const videoMetrics = await metricsApi.getBatch(
            'video',
            videoList.map((v) => v.id)
          );
          for (const [id, m] of Object.entries(videoMetrics)) {
            map[`video:${id}`] = m;
          }
        }

        if (cancelled) return;

        setMetricsMap(map);
      } catch (err) {
        console.warn('[Home] Métricas:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, allMusic.length, videoList.length]);

  // Filtros
  const normalizeCat = useCallback((val?: string | null) => {
    return String(val || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }, []);

  const matchesCategory = useCallback(
    (itemCategory: string | null | undefined, slug: string, name?: string) => {
      const itemNorm = normalizeCat(itemCategory);
      if (!itemNorm) return false;
      const slugNorm = normalizeCat(slug);
      const nameNorm = normalizeCat(name);
      const itemStem = itemNorm.replace(/s$/, '');
      const slugStem = slugNorm.replace(/s$/, '');
      const nameStem = nameNorm.replace(/s$/, '');

      if (
        itemNorm === slugNorm ||
        itemNorm === nameNorm ||
        itemStem === slugStem ||
        (nameStem && itemStem === nameStem)
      ) {
        return true;
      }

      if (slugNorm.includes('testemunh') || nameNorm.includes('testemunh')) {
        return itemNorm.includes('testemunh') || itemNorm === 'testimony' || itemNorm === 'outro';
      }
      if (slugNorm.includes('serm') || nameNorm.includes('serm')) {
        return itemNorm.includes('serm');
      }
      if (slugNorm.includes('estud') || nameNorm.includes('estud')) {
        return itemNorm.includes('estud');
      }
      if (slugNorm.includes('podcast') || nameNorm.includes('podcast')) {
        return itemNorm.includes('podcast');
      }
      if (slugNorm.includes('cult') || nameNorm.includes('cult')) {
        return itemNorm.includes('cult');
      }
      return false;
    },
    [normalizeCat]
  );

  // Carregar conteúdos da categoria selecionada via endpoint de categorias
  useEffect(() => {
    if (activeCategory === 'all' || activeCategory === 'musicas' || activeCategory === 'videos') {
      setCategoryContents([]);
      setCategoryContentLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setCategoryContentLoading(true);
        const res = await fetch(
          getApiUrl(`/api/v1/categories/${encodeURIComponent(activeCategory)}?limit=24`),
          { headers: getAuthHeaders() }
        );
        const json = await res.json().catch(() => null);
        if (!cancelled && res.ok && json?.success && Array.isArray(json.data?.contents)) {
          setCategoryContents(json.data.contents);
        } else if (!cancelled) {
          setCategoryContents([]);
        }
      } catch {
        if (!cancelled) setCategoryContents([]);
      } finally {
        if (!cancelled) setCategoryContentLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const filteredMusic = useMemo(() => {
    if (activeCategory === 'all') return allMusic;
    const cat = categories.find((c) => c.slug === activeCategory);
    if (activeCategory === 'musicas') return allMusic;
    if (activeCategory === 'videos') return [];
    return allMusic.filter((m) => matchesCategory(m.category, activeCategory, cat?.name));
  }, [allMusic, activeCategory, categories, matchesCategory]);

  const filteredVideos = useMemo(() => {
    if (activeCategory === 'all') return videoList;
    if (activeCategory === 'videos') return videoList;
    if (activeCategory === 'musicas') return [];
    const cat = categories.find((c) => c.slug === activeCategory);
    return videoList.filter((v) => matchesCategory(v.category, activeCategory, cat?.name));
  }, [videoList, activeCategory, categories, matchesCategory]);

  const topPlayedMusic = useMemo(() => {
    return [...filteredMusic].sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0));
  }, [filteredMusic]);

  const musicCards = useMemo(() => topPlayedMusic.slice(0, 6), [topPlayedMusic]);

  // Singles & Lançamentos: ordenados por mais recentes e sem repetir os já exibidos em "Músicas Mais Tocadas"
  const singlesList = useMemo(() => {
    const shownIds = new Set(musicCards.map((m) => m.id));
    const recentSingles = [...filteredMusic]
      .filter((m) => !m.album_id && !m.album)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const distinct = recentSingles.filter((m) => !shownIds.has(m.id));
    return (distinct.length > 0 ? distinct : recentSingles).slice(0, 6);
  }, [filteredMusic, musicCards]);

  const topArtists = useMemo(() => {
    return [...artists]
      .sort((a, b) => (b.total_plays ?? 0) - (a.total_plays ?? 0))
      .slice(0, 6);
  }, [artists]);

  const topAlbums = useMemo(() => {
    return [...albums]
      .sort((a, b) => (b.total_plays ?? 0) - (a.total_plays ?? 0))
      .slice(0, 6);
  }, [albums]);

  const [continueListening, setContinueListening] = useState<Array<{ music: MusicItem; progressPct: number }>>([]);

  useEffect(() => {
    if (!user?.id) {
      setContinueListening([]);
      return;
    }
    let cancelled = false;

    const loadUserContinue = async () => {
      try {
        const res = await historyApi.getHistory({ page: 1, limit: 12, type: 'AUDIO' });
        if (cancelled) return;
        const byId = new Map(allMusic.map((m) => [m.id, m]));
        const seen = new Set<number>();
        const list: Array<{ music: MusicItem; progressPct: number }> = [];

        for (const h of res.items) {
          const mid = h.music_id ?? (h.source === 'music' ? h.source_id : null);
          if (!mid || seen.has(mid)) continue;
          const matched = byId.get(mid) || (h.audio_url
            ? ({
                id: mid,
                title: h.title,
                artist: h.full_name || h.username || 'PodFéPlay',
                album: null,
                duration: h.duration ?? h.total_duration ?? null,
                file_path: h.audio_url,
                file_size: 0,
                cover_image: h.cover_url,
                created_at: h.created_at,
              } as MusicItem)
            : null);
          if (!matched) continue;
          seen.add(mid);
          const rawPct = Number(h.progress_percentage ?? 0);
          const pct = Number.isFinite(rawPct) && rawPct > 0
            ? Math.min(100, Math.round(rawPct))
            : h.completed
              ? 100
              : 10;
          list.push({ music: matched, progressPct: pct });
        }
        setContinueListening(list);
      } catch {
        if (!cancelled) setContinueListening([]);
      }
    };

    loadUserContinue();
    window.addEventListener('podplay:history-updated', loadUserContinue);
    return () => {
      cancelled = true;
      window.removeEventListener('podplay:history-updated', loadUserContinue);
    };
  }, [user?.id, allMusic]);

  const featuredVideos = useMemo(() => {
    return [...filteredVideos]
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
      .slice(0, 4);
  }, [filteredVideos]);

  const handlePlayMusic = (music: MusicItem) => {
    refreshMetrics('music', music.id);

    if (allMusic.length === 0) {
      play(music, true, [music]);
      return;
    }
    const currentIndex = allMusic.findIndex((m) => m.id === music.id);
    if (currentIndex >= 0) {
      const newQueue = [
        ...allMusic.slice(currentIndex),
        ...allMusic.slice(0, currentIndex),
      ];
      play(music, true, newQueue);
    } else {
      play(music, true, [music]);
    }
  };

  const handlePlayVideo = (video: VideoItem) => {
    registrarReproducao(video.id, 'video');
    refreshMetrics('video', video.id);
    setSelectedVideo(video);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const isCurrentMusicPlaying = (music: MusicItem) =>
    currentMusic?.id === music.id && isPlaying;

  const activeCategoryName =
    activeCategory === 'all'
      ? 'Todos'
      : categories.find((c) => c.slug === activeCategory)?.name || 'Categoria';

  // =====================================================================
  // RENDER
  // =====================================================================

  return (
    <div className="min-h-screen bg-[#09090d] text-white bg-[radial-gradient(ellipse_at_top,_rgba(126,34,206,0.16),_transparent_55%)]">
      <PodPlaySidebar />

      <main className="ml-0 md:ml-60 min-h-screen pb-28 transition-all duration-300">
        <Header />

        <div className="p-6 max-w-[1440px] mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {user
                ? `${getGreeting()}, ${user.fullName?.split(' ')[0] || user.username}`
                : 'Descubra louvores, pregações e vídeos'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {user ? 'Igreja Vida Nova · Angola' : 'Explore o catálogo completo da PodFéPlay'}
            </p>
          </div>

          {/* HERO DINÂMICO (SPOTLIGHT) */}
          <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-[#2a124c] via-[#1c1033] to-[#11111a] border border-white/10 shadow-2xl">
            <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-200 uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full">
                  <Flame size={13} className="text-amber-400" />
                  {topPlayedMusic[0] ? 'Destaque Mais Tocado' : 'Em Destaque'}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mt-3 tracking-tight">
                  {topPlayedMusic[0]?.title || 'Louvor, Palavra & Adoração'}
                </h2>
                <p className="text-gray-300 text-sm mt-1.5">
                  {topPlayedMusic[0]
                    ? `${(topPlayedMusic[0] as any).artist_name || topPlayedMusic[0].artist} · ${(topPlayedMusic[0].plays ?? 0).toLocaleString('pt-PT')} reproduções`
                    : 'Músicas, mensagens e vídeos edificantes num só lugar'}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-5">
                  <button
                    onClick={() => topPlayedMusic[0] && handlePlayMusic(topPlayedMusic[0])}
                    className="px-6 py-2.5 bg-white text-slate-950 hover:bg-gray-100 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Play size={16} fill="currentColor" /> Reproduzir Agora
                  </button>
                  {allMusic.length > 1 && (
                    <button
                      onClick={() => {
                        const shuffledList = [...allMusic].sort(() => Math.random() - 0.5);
                        play(shuffledList[0], true, shuffledList);
                      }}
                      className="px-5 py-2.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/30 text-white rounded-full font-semibold text-sm transition-all flex items-center gap-2"
                    >
                      <Shuffle size={15} /> Misturar Tudo
                    </button>
                  )}
                  {topArtists[0] && (
                    <Link
                      href={getArtistHref(topArtists[0].id, topArtists[0].name)}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-full font-medium text-sm transition-all"
                    >
                      {topArtists[0].name}
                    </Link>
                  )}
                </div>
              </div>

              {topPlayedMusic[0] && (
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-xl overflow-hidden shadow-2xl border border-white/15 flex-shrink-0">
                  <img
                    src={resolveCoverUrl(topPlayedMusic[0].cover_image)}
                    alt={topPlayedMusic[0].title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* CONTINUE A OUVIR (cards horizontais estilo Spotify) */}
          {activeCategory === 'all' && user && continueListening.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h3 className="text-lg font-bold text-white">Continue a Ouvir</h3>
                  <p className="text-xs text-gray-400">Retoma exatamente de onde paraste</p>
                </div>
                <Link href="/history" className="text-xs text-purple-300 hover:text-white flex items-center gap-1">
                  Histórico <ChevronRight size={14} />
                </Link>
              </div>
              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3.5 pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3">
                {continueListening.slice(0, 6).map(({ music, progressPct }) => {
                  const playingThis = isCurrentMusicPlaying(music);
                  const pct = progressPct;
                  return (
                    <div
                      key={`continue-${music.id}`}
                      onClick={() => handlePlayMusic(music)}
                      className="w-[78vw] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none group relative bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] rounded-xl overflow-hidden cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between gap-3 p-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 shadow-md">
                            <img
                              src={resolveCoverUrl(music.cover_image)}
                              alt={music.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/default-cover.svg';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                              {music.title}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {(music as any).artist_name || music.artist}
                            </p>
                            <span className="inline-block text-[10px] font-medium text-purple-300/90 mt-1">
                              {playingThis ? 'A reproduzir agora' : 'Retomar faixa'}
                            </span>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-600 group-hover:bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-all">
                          {playingThis ? (
                            <Pause size={16} className="text-white" />
                          ) : (
                            <Play size={16} className="text-white ml-0.5" />
                          )}
                        </div>
                      </div>
                      <div className="h-0.5 w-full bg-white/10">
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: `${playingThis ? 100 : pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SUGESTÕES RÁPIDAS ESTILO SPOTIFY (MAIS TOCADAS) */}
          {activeCategory === 'all' && topPlayedMusic.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Flame size={18} className="text-amber-400" />
                  Sugestões Mais Tocadas
                </h3>
                <Link href="/trending" className="text-xs text-purple-300 hover:text-white flex items-center gap-1">
                  Em Alta <ChevronRight size={14} />
                </Link>
              </div>
              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3">
                {topPlayedMusic.slice(0, 6).map((track, idx) => (
                  <div
                    key={`quick-${track.id}`}
                    onClick={() => handlePlayMusic(track)}
                    className="w-[78vw] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none group flex items-center justify-between gap-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl overflow-hidden pr-3 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-14 h-14 flex-shrink-0 bg-slate-800">
                        <img
                          src={resolveCoverUrl(track.cover_image)}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 left-1 text-[10px] font-bold bg-black/70 text-amber-300 px-1.5 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                        <p className="text-xs text-gray-300 truncate">
                          {track.artist} · {(track.plays ?? 0).toLocaleString('pt-PT')} plays
                        </p>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-purple-600 group-hover:bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-md opacity-90 group-hover:scale-105 transition-all">
                      {isCurrentMusicPlaying(track) ? (
                        <Pause size={15} className="text-white" />
                      ) : (
                        <Play size={15} className="text-white ml-0.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {loadError && (
            <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-amber-200">{loadError}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold text-amber-100 transition"
                >
                  Tentar novamente
                </button>
                <button
                  onClick={() => setLoadError(null)}
                  className="px-2 py-1.5 text-xs text-amber-300/80 hover:text-amber-100 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}

          {/* CATEGORIAS */}
          <div className="mb-8">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <CategoryPill
                label="Todos"
                active={activeCategory === 'all'}
                onClick={() => setActiveCategory('all')}
              />
              {categoriesLoading ? (
                <div className="flex items-center gap-2 px-4">
                  <Loader2 size={14} className="animate-spin text-purple-400" />
                  <span className="text-sm text-gray-400">A carregar...</span>
                </div>
              ) : (
                categories.map((cat) => (
                  <CategoryPill
                    key={cat.slug}
                    label={cat.name}
                    active={activeCategory === cat.slug}
                    onClick={() => setActiveCategory(cat.slug)}
                  />
                ))
              )}
            </div>
          </div>

          {activeCategory !== 'all' && activeCategory !== 'musicas' && activeCategory !== 'videos' ? (
            <section className="mb-10 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{activeCategoryName}</h3>
              </div>

              {categoryContentLoading || musicLoading || videosLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={32} className="text-purple-500 animate-spin" />
                </div>
              ) : filteredMusic.length === 0 &&
                filteredVideos.length === 0 &&
                categoryContents.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  Ainda não há conteúdo nesta categoria.
                </div>
              ) : (
                <>
                  {filteredMusic.length > 0 && (
                    <div>
                      <h4 className="text-base font-semibold text-gray-200 mb-3">Áudios & Louvores</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                        {filteredMusic.map((music) => (
                          <MusicCard
                            key={`cat-music-${music.id}`}
                            music={music}
                            metrics={metricsMap[`music:${music.id}`]}
                            onPlay={handlePlayMusic}
                            isCurrentMusicPlaying={isCurrentMusicPlaying}
                            isFavorited={favoritesSet.has(favKey('music', music.id))}
                            onToggleFavorite={(m) => handleToggleFavorite(m, 'music')}
                            onDownload={(m) => handleDownload(m, 'music')}
                            isDownloading={downloadingSet.has(favKey('music', music.id))}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredVideos.length > 0 && (
                    <div>
                      <h4 className="text-base font-semibold text-gray-200 mb-3">Vídeos</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredVideos.map((video) => (
                          <VideoCard
                            key={`cat-video-${video.id}`}
                            video={video}
                            metrics={metricsMap[`video:${video.id}`]}
                            onPlay={setSelectedVideo}
                            isFavorited={favoritesSet.has(favKey('video', video.id))}
                            onToggleFavorite={(v) => handleToggleFavorite(v, 'video')}
                            onDownload={(v) => handleDownload(v, 'video')}
                            isDownloading={downloadingSet.has(favKey('video', video.id))}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {categoryContents.length > 0 && (
                    <div>
                      <h4 className="text-base font-semibold text-gray-200 mb-3">Conteúdos da Categoria</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {categoryContents.map((item: any) => {
                          const isVideo =
                            String(item.type || item.source || '').toUpperCase() === 'VIDEO' ||
                            Boolean(item.video_url && !item.audio_url);
                          return (
                            <div
                              key={`cat-content-${item.id}`}
                              onClick={() => {
                                if (isVideo) {
                                  setSelectedVideo({
                                    id: item.source_id || item.id,
                                    title: item.title,
                                    description: item.description || null,
                                    duration: item.duration || 0,
                                    resolution: null,
                                    file_path: item.video_url || '',
                                    thumbnail_path: item.cover_url || null,
                                    file_size: 0,
                                    views: item.views || 0,
                                    likes: item.likes || 0,
                                    created_at: item.created_at || new Date().toISOString(),
                                  });
                                } else {
                                  handlePlayMusic({
                                    id: item.source_id || item.id,
                                    title: item.title,
                                    artist: item.full_name || item.username || 'PodféPlay',
                                    album: null,
                                    duration: item.duration || 0,
                                    file_path: item.audio_url || '',
                                    file_size: 0,
                                    cover_image: item.cover_url || null,
                                    created_at: item.created_at || new Date().toISOString(),
                                  });
                                }
                              }}
                              className="group cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all"
                            >
                              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 mb-2.5">
                                <img
                                  src={resolveCoverUrl(item.cover_url)}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shadow-lg">
                                    <Play size={18} className="text-white ml-0.5" />
                                  </div>
                                </div>
                              </div>
                              <h5 className="font-semibold text-white text-sm truncate">{item.title}</h5>
                              <p className="text-xs text-gray-400 truncate mt-0.5">
                                {item.full_name || item.username || activeCategoryName}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          ) : (
            <>
              {/* CANTORES / ARTISTAS MAIS OUVIDOS */}
              {activeCategory === 'all' && !catalogLoading && topArtists.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Mic size={20} className="text-pink-400" />
                      <h3 className="text-xl font-bold text-white">Cantores Mais Ouvidos</h3>
                    </div>
                    <Link href="/artists" className="text-sm text-purple-300 hover:text-white flex items-center gap-1">
                      Ver todos <ChevronRight size={16} />
                    </Link>
                  </div>
                  <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3.5 pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-6">
                    {topArtists.map((artist, idx) => (
                      <Link
                        key={artist.id}
                        href={getArtistHref(artist.id, artist.name)}
                        className="w-[40vw] max-w-[160px] shrink-0 snap-start md:w-auto md:max-w-none group bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-center transition-all"
                      >
                        <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-purple-500/30 to-pink-500/30 mb-3 shadow-lg">
                          <img
                            src={resolveCoverUrl(artist.image_url)}
                            alt={artist.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full whitespace-nowrap">
                              #1 Mais Ouvido
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-white text-sm truncate">{artist.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {(artist.total_plays ?? 0).toLocaleString('pt-PT')} plays
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* ÁLBUNS EM DESTAQUE */}
              {activeCategory === 'all' && !catalogLoading && topAlbums.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <DiscAlbum size={20} className="text-amber-400" />
                      <h3 className="text-xl font-bold text-white">Álbuns</h3>
                    </div>
                    <Link href="/albums" className="text-sm text-purple-300 hover:text-white flex items-center gap-1">
                      Ver todos <ChevronRight size={16} />
                    </Link>
                  </div>
                  <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3.5 pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-6">
                    {topAlbums.map((album) => (
                      <Link
                        key={album.id}
                        href={`/albums/${album.id}`}
                        className="w-[42vw] max-w-[175px] shrink-0 snap-start md:w-auto md:max-w-none group bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-slate-800 mb-3">
                          <img
                            src={resolveCoverUrl(album.cover_url)}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h4 className="font-semibold text-white text-sm truncate">{album.title}</h4>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {album.artist_name || 'Álbum'} · {album.tracks_count ?? 0} faixas
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* MÚSICAS */}
              {(activeCategory === 'all' || activeCategory === 'musicas') && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Músicas Mais Tocadas</h3>
                    <Link href="/music" className="text-sm text-purple-300 hover:text-white flex items-center gap-1">
                      Ver todas <ChevronRight size={16} />
                    </Link>
                  </div>

                  {musicLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 size={32} className="text-purple-500 animate-spin" />
                    </div>
                  ) : musicCards.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      Nenhuma música disponível no momento
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3.5 pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-6">
                      {musicCards.map((music) => (
                        <div key={music.id} className="w-[42vw] max-w-[175px] shrink-0 snap-start md:w-auto md:max-w-none">
                          <MusicCard
                            music={music}
                            metrics={metricsMap[`music:${music.id}`]}
                            onPlay={handlePlayMusic}
                            isCurrentMusicPlaying={isCurrentMusicPlaying}
                            isFavorited={favoritesSet.has(favKey('music', music.id))}
                            onToggleFavorite={(m) => handleToggleFavorite(m, 'music')}
                            onDownload={(m) => handleDownload(m, 'music')}
                            isDownloading={downloadingSet.has(favKey('music', music.id))}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* SINGLES */}
              {activeCategory === 'all' && singlesList.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MusicIcon size={20} className="text-purple-400" />
                      <h3 className="text-xl font-bold text-white">Singles & Lançamentos</h3>
                    </div>
                    <Link href="/music" className="text-sm text-purple-300 hover:text-white flex items-center gap-1">
                      Ver todos <ChevronRight size={16} />
                    </Link>
                  </div>
                  <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3.5 pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-6">
                    {singlesList.map((music) => (
                      <div key={`single-${music.id}`} className="w-[42vw] max-w-[175px] shrink-0 snap-start md:w-auto md:max-w-none">
                        <MusicCard
                          music={music}
                          metrics={metricsMap[`music:${music.id}`]}
                          onPlay={handlePlayMusic}
                          isCurrentMusicPlaying={isCurrentMusicPlaying}
                          isFavorited={favoritesSet.has(favKey('music', music.id))}
                          onToggleFavorite={(m) => handleToggleFavorite(m, 'music')}
                          onDownload={(m) => handleDownload(m, 'music')}
                          isDownloading={downloadingSet.has(favKey('music', music.id))}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* VÍDEOS */}
              {(activeCategory === 'all' || activeCategory === 'videos') && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <VideoIcon size={20} className="text-purple-400" />
                      <h3 className="text-xl font-bold text-white">Vídeos em Destaque</h3>
                    </div>
                    <Link href="/videos" className="text-sm text-purple-300 hover:text-white flex items-center gap-1">
                      Ver todos <ChevronRight size={16} />
                    </Link>
                  </div>

                  {videosLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 size={32} className="text-purple-500 animate-spin" />
                    </div>
                  ) : featuredVideos.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      Nenhum vídeo disponível no momento
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3.5 pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4">
                      {featuredVideos.map((video) => (
                        <div key={video.id} className="w-[76vw] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none">
                          <VideoCard
                            video={video}
                            metrics={metricsMap[`video:${video.id}`]}
                            onPlay={handlePlayVideo}
                            isFavorited={favoritesSet.has(favKey('video', video.id))}
                            onToggleFavorite={(v) => handleToggleFavorite(v, 'video')}
                            onDownload={(v) => handleDownload(v, 'video')}
                            isDownloading={downloadingSet.has(favKey('video', video.id))}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* PUBLICIDADES & DESTAQUES (entre a penúltima e a última secção) */}
              {activeCategory === 'all' && adsList.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-3.5">
                    <div>
                      <h3 className="text-lg font-bold text-white">Publicidades & Destaques</h3>
                      <p className="text-xs text-gray-400">Novidades e parceiros da plataforma</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {adsList.map((ad) => {
                      const content = (
                        <div className="group relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-r from-purple-900/50 via-slate-900/80 to-pink-900/40 hover:border-purple-400/50 transition-all shadow-lg">
                          {ad.banner_url ? (
                            <div className="relative h-44 w-full overflow-hidden">
                              <img
                                src={resolveCoverUrl(ad.banner_url)}
                                alt={ad.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <span className="inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-pink-500/80 text-white mb-1.5">
                                  Publicidade
                                </span>
                                <h4 className="text-base font-bold text-white truncate">{ad.title}</h4>
                                {ad.description && (
                                  <p className="text-xs text-gray-200 line-clamp-2 mt-0.5">{ad.description}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-5 flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <span className="inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 mb-2">
                                  Publicidade
                                </span>
                                <h4 className="text-base font-bold text-white truncate">{ad.title}</h4>
                                {ad.description && (
                                  <p className="text-xs text-gray-300 line-clamp-2 mt-1">{ad.description}</p>
                                )}
                                {(ad.event_date || ad.location) && (
                                  <p className="text-[11px] text-purple-300 mt-2">
                                    {[ad.event_date, ad.location].filter(Boolean).join(' · ')}
                                  </p>
                                )}
                              </div>
                              {ad.link_url && (
                                <span className="px-3.5 py-2 rounded-full bg-purple-600 group-hover:bg-purple-500 text-xs font-semibold text-white flex-shrink-0">
                                  Saiba mais
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );

                      return ad.link_url ? (
                        <a
                          key={`ad-${ad.id}`}
                          href={ad.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          {content}
                        </a>
                      ) : (
                        <div key={`ad-${ad.id}`}>{content}</div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}

          <PodPlayFooter />
        </div>
      </main>

      <PlayerBar />

      <VideoPlayerModal
        video={selectedVideo}
        videos={featuredVideos}
        onSelectVideo={handlePlayVideo}
        onClose={() => setSelectedVideo(null)}
      />

      {toast && (
        <div
          className={`fixed bottom-24 right-6 z-50 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-green-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <style jsx global>{`
        @keyframes wave-1 { 0%, 100% { height: 8px; } 50% { height: 20px; } }
        @keyframes wave-2 { 0%, 100% { height: 16px; } 50% { height: 8px; } }
        @keyframes wave-3 { 0%, 100% { height: 12px; } 50% { height: 24px; } }
        .animate-pulse:nth-child(1) { animation: wave-1 0.8s ease-in-out infinite; }
        .animate-pulse:nth-child(2) { animation: wave-2 0.8s ease-in-out infinite; }
        .animate-pulse:nth-child(3) { animation: wave-3 0.8s ease-in-out infinite; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}