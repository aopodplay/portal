'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import {
  Play,
  Pause,
  Headphones,
  Search,
  Home,
  Flame,
  Library,
  User,
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
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { resolveCoverUrl, resolveThumbUrl } from '@/lib/media';
import { historyApi } from '@/lib/historyApi';
import { favoritesApi, downloadsApi, ContentType } from '@/lib/favoritesApi';
import { metricsApi } from '@/lib/metricsApi';
import type { ContentMetrics } from '@/lib/metricsApi';

// =====================================================================
// TIPOS
// =====================================================================

interface MusicItem {
  id: number;
  title: string;
  artist: string;
  album: string | null;
  duration: number | null;
  file_path: string;
  file_size: number;
  cover_image: string | null;
  created_at: string;
}

interface VideoItem {
  id: number;
  title: string;
  description: string | null;
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
// SIDEBAR
// =====================================================================

const Sidebar = ({ collapsed = false }: { collapsed?: boolean }) => {
  const menuItems = [
    { icon: Home, label: 'Inicio', href: '/' },
    { icon: Search, label: 'Pesquisa', href: '/search' },
    { icon: MusicIcon, label: 'Músicas', href: '/music' },
    { icon: VideoIcon, label: 'Vídeos', href: '/videos' },
    { icon: Flame, label: 'Em Alta', href: '/trending' },
    { icon: Library, label: 'Biblioteca', href: '/library' },
    { icon: User, label: 'Perfil', href: '/profile' },
  ];

  const playlists = [
    'As Minhas Favoritas',
    'Oração da Manhã',
    'Louvores com a Família',
    'Pregações — Pr. Carlos',
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
          {!collapsed && <h1 className="text-xl font-bold text-white">Podfe Play</h1>}
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
// CARDS
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
  const durationLabel =
    music.duration && music.duration > 0
      ? `${Math.floor(music.duration / 60)}:${String(music.duration % 60).padStart(2, '0')}`
      : null;

  return (
    <div className="group cursor-pointer" onClick={() => onPlay(music)}>
      <div className="relative rounded-lg overflow-hidden aspect-square mb-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
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

        {/* Botão favoritar */}
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

        {/* Botões play + download */}
        <div className="absolute bottom-2 right-2 flex gap-1.5 z-10">
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

        {durationLabel && (
          <span className="absolute bottom-2 left-2 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock size={10} />
            {durationLabel}
          </span>
        )}
      </div>

      <h4 className={`font-medium text-sm truncate ${isPlaying ? 'text-purple-400' : 'text-white'}`}>
        {music.title}
      </h4>
      <p className="text-gray-400 text-xs truncate">{music.artist}</p>
      {music.album && (
        <p className="text-gray-500 text-xs truncate">{music.album}</p>
      )}

      {/* 🔥 Views + Likes */}
      <div className="flex items-center gap-3 mt-1">
        <span className="text-gray-400 text-xs flex items-center gap-1">
          <Eye size={11} />
          {metrics?.views ?? 0}
        </span>
        <span className="text-gray-400 text-xs flex items-center gap-1">
          <Heart size={11} />
          {metrics?.likes ?? 0}
        </span>
      </div>
    </div>
  );
};

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
      ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}`
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

        {/* Botão favoritar */}
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

        {/* Botão download */}
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

      {/* 🔥 Views + Likes */}
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
  const [sidebarCollapsed] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Músicas
  const [allMusic, setAllMusic] = useState<MusicItem[]>([]);
  const [musicLoading, setMusicLoading] = useState(true);

  // Vídeos
  const [videoList, setVideoList] = useState<VideoItem[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // Categorias
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Estado de favoritos
  const [favoritesSet, setFavoritesSet] = useState<Set<string>>(new Set());

  // Estado de downloads em curso
  const [downloadingSet, setDownloadingSet] = useState<Set<string>>(new Set());

  // 🔥 Métricas (views + likes) por chave `${contentType}:${id}`
  const [metricsMap, setMetricsMap] = useState<Record<string, ContentMetrics>>({});

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const favKey = (contentType: ContentType, id: number) => `${contentType}:${id}`;

  const churchEvents = [
    { title: 'Domingo — Pr. Carlos', description: 'Culto de Celebração', date: '26 Abril 2026', icon: Mic },
    { title: 'Estudo Bíblico — Romanos', description: 'Célula de Quarta-feira', date: 'Quarta - Célula', icon: Book },
    { title: 'Louvor & Adoração', description: 'Equipa de Louvor', date: 'Ensaio semanal', icon: DiscAlbum },
    { title: 'Próximo directo', description: 'Transmissão ao vivo', date: 'Domingo 09:00', icon: Radio },
  ];

  const featuredSeries = [
    { title: '40 Dias de Oração', subtitle: 'Série Podfé Original', badge: '40 EP.' },
    { title: 'Bíblia Completa em Áudio', subtitle: 'Narração Integral', badge: '66 LIVROS' },
    { title: 'Identidade em Cristo', subtitle: 'Pr. Lucinho Barreto', badge: '12 EP.' },
  ];

  // ---------- REGISTAR REPRODUÇÃO ----------
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

  // ---------- ATUALIZAR MÉTRICAS DE UM ITEM ----------
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

  // ---------- FAVORITAR ----------
  const handleToggleFavorite = useCallback(
    async (item: { id: number }, contentType: ContentType) => {
      if (!user) {
        showToast('error', 'Precisas de estar logado para favoritar');
        return;
      }

      const key = favKey(contentType, item.id);
      const wasFavorited = favoritesSet.has(key);

      // Otimista
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

        // 🔥 Atualiza métricas (likes mudaram)
        refreshMetrics(contentType, item.id);
      } catch (err: any) {
        // Reverter
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

  // ---------- DOWNLOAD ----------
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
        showToast('error', err?.message || 'Erro ao descarregar');
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

  // ---------- CARREGAR CATEGORIAS ----------
  useEffect(() => {
    (async () => {
      try {
        setCategoriesLoading(true);
        const res = await fetch(getApiUrl('/api/v1/categories'), {
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (json.success && json.data) setCategories(json.data);
      } catch (err) {
        console.error('[HomePage] Categorias:', err);
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, []);

  // ---------- CARREGAR MÚSICAS ----------
  useEffect(() => {
    (async () => {
      try {
        setMusicLoading(true);
        const response = await fetch(getApiUrl('/api/v1/music'), {
          headers: getAuthHeaders(),
        });
        const result = await response.json();
        if (result.success && result.data) {
          const items: MusicItem[] = Array.isArray(result.data)
            ? result.data
            : Array.isArray(result.data.items)
              ? result.data.items
              : [];
          setAllMusic(items);
        }
      } catch (err) {
        console.error('[HomePage] Músicas:', err);
      } finally {
        setMusicLoading(false);
      }
    })();
  }, []);

  // ---------- CARREGAR VÍDEOS ----------
  useEffect(() => {
    (async () => {
      try {
        setVideosLoading(true);
        const response = await fetch(getApiUrl('/api/v1/videos'), {
          headers: getAuthHeaders(),
        });
        const result = await response.json();
        if (result.success && result.data) {
          const items: VideoItem[] = Array.isArray(result.data)
            ? result.data
            : Array.isArray(result.data.items)
              ? result.data.items
              : [];
          setVideoList(items);
        }
      } catch (err) {
        console.error('[HomePage] Vídeos:', err);
      } finally {
        setVideosLoading(false);
      }
    })();
  }, []);

  // 🔥 Marcar como favoritado os itens que já estão na BD
  useEffect(() => {
    if (!user) return;
    if (allMusic.length === 0 && videoList.length === 0) return;

    let cancelled = false;

    (async () => {
      const toCheck: { contentType: ContentType; id: number }[] = [
        ...allMusic.map((m) => ({ contentType: 'music' as const, id: m.id })),
        ...videoList.map((v) => ({ contentType: 'video' as const, id: v.id })),
      ];

      const chunkSize = 5;
      const results: { key: string; isFavorited: boolean }[] = [];

      for (let i = 0; i < toCheck.length; i += chunkSize) {
        const chunk = toCheck.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(
          chunk.map(async ({ contentType, id }) => {
            try {
              const res = await favoritesApi.checkFavorite(id, contentType);
              return { key: favKey(contentType, id), isFavorited: res.isFavorited };
            } catch {
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

  // 🔥 Carregar métricas (views + likes) para os cards
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

  // ---------- FILTROS ----------
  const filteredMusic = useMemo(() => {
    if (activeCategory === 'all') return allMusic;
    const cat = categories.find((c) => c.slug === activeCategory);
    if (!cat) return allMusic;
    switch (cat.slug) {
      case 'musicas': return allMusic;
      case 'videos': return [];
      default: return [];
    }
  }, [allMusic, activeCategory, categories]);

  const filteredVideos = useMemo(() => {
    if (activeCategory === 'all') return videoList;
    if (activeCategory === 'videos') return videoList;
    return [];
  }, [videoList, activeCategory]);

  const musicCards = useMemo(() => filteredMusic.slice(0, 6), [filteredMusic]);
  const recentMusic = useMemo(() => allMusic.slice(0, 5), [allMusic]);
  const featuredVideos = useMemo(() => filteredVideos.slice(0, 4), [filteredVideos]);

  // ---------- PLAY ----------
  const handlePlayMusic = (music: MusicItem) => {
    registrarReproducao(music.id, 'music');

    // 🔥 Atualiza métricas deste item em background
    refreshMetrics('music', music.id);

    if (allMusic.length === 0) {
      play(music, false, [music]);
      return;
    }
    const currentIndex = allMusic.findIndex((m) => m.id === music.id);
    if (currentIndex >= 0) {
      const newQueue = [
        ...allMusic.slice(currentIndex),
        ...allMusic.slice(0, currentIndex),
      ];
      play(music, false, newQueue);
    } else {
      play(music, false, [music]);
    }
  };

  const handlePlayVideo = (video: VideoItem) => {
    registrarReproducao(video.id, 'video');

    // 🔥 Atualiza métricas deste item em background
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <Sidebar collapsed={sidebarCollapsed} />

      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        } min-h-screen pb-24`}
      >
        <Header />

        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'João'}
            </h1>
            <p className="text-purple-200 text-sm">Igreja Vida Nova - Angola</p>
          </div>

          {/* HERO */}
          <div className="relative rounded-xl overflow-hidden mb-8 bg-gradient-to-r from-purple-700 via-pink-700 to-purple-700">
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative p-6 md:p-8">
              <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                + SÉRIE ORIGINAL
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-2">
                40 Dias de Oração
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                Série Podfé Original · 40 episódios · Temporada 2
              </p>
              <button className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-medium text-sm transition-all flex items-center gap-2">
                <Play size={16} /> Reproduzir
              </button>
            </div>
          </div>

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
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{activeCategoryName}</h3>
              </div>
              <div className="text-center py-12 text-gray-400">
                Ainda não há conteúdo nesta categoria.
              </div>
            </section>
          ) : (
            <>
              {/* MÚSICAS */}
              {(activeCategory === 'all' || activeCategory === 'musicas') && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Músicas em Destaque</h3>
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {musicCards.map((music) => (
                        <MusicCard
                          key={music.id}
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
                  )}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {featuredVideos.map((video) => (
                        <VideoCard
                          key={video.id}
                          video={video}
                          metrics={metricsMap[`video:${video.id}`]}
                          onPlay={handlePlayVideo}
                          isFavorited={favoritesSet.has(favKey('video', video.id))}
                          onToggleFavorite={(v) => handleToggleFavorite(v, 'video')}
                          onDownload={(v) => handleDownload(v, 'video')}
                          isDownloading={downloadingSet.has(favKey('video', video.id))}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* CONTINUE A OUVIR */}
              {activeCategory === 'all' && recentMusic.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Continue a Ouvir</h3>
                    <p className="text-sm text-gray-400">Onde paraste</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {recentMusic.map((music) => (
                      <MusicCard
                        key={`recent-${music.id}`}
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
                </section>
              )}

              {/* MINHA IGREJA + SÉRIES */}
              {activeCategory === 'all' && (
                <div className="grid lg:grid-cols-2 gap-8 mb-8">
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Church size={20} className="text-purple-400" />
                      <h3 className="text-xl font-bold text-white">Minha Igreja</h3>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                      <div className="mb-4 pb-3 border-b border-white/10">
                        <h4 className="text-lg font-bold text-white">Igreja Vida Nova</h4>
                        <p className="text-gray-400 text-sm">Luanda, Angola</p>
                      </div>
                      <div className="space-y-2">
                        {churchEvents.map((event, index) => (
                          <ChurchEvent
                            key={index}
                            title={event.title}
                            description={event.description}
                            date={event.date}
                            icon={event.icon}
                          />
                        ))}
                      </div>
                      <button className="w-full mt-4 py-2 text-center text-sm text-purple-400 hover:text-purple-300 transition-colors">
                        Ver todos os eventos →
                      </button>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={20} className="text-purple-400" />
                        <h3 className="text-xl font-bold text-white">Séries em Destaque</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {featuredSeries.map((series, index) => (
                        <SeriesCard
                          key={index}
                          title={series.title}
                          subtitle={series.subtitle}
                          badge={series.badge}
                        />
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* EM ALTA */}
              {activeCategory === 'all' && allMusic.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Flame size={20} className="text-orange-500" />
                      <h3 className="text-xl font-bold text-white">Em Alta Esta Semana</h3>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm space-y-3">
                    {allMusic.slice(0, 3).map((music) => (
                      <div key={`trend-${music.id}`} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img
                              src={resolveCoverUrl(music.cover_image)}
                              alt={music.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/default-cover.svg';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium text-white text-sm truncate">{music.title}</h4>
                            <p className="text-gray-400 text-xs truncate">{music.artist}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePlayMusic(music)}
                          className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-all flex-shrink-0"
                        >
                          <Play size={18} className="text-white ml-0.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <PlayerBar />

      <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />

      {/* Toast de feedback */}
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