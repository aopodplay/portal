'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import AddToPlaylistButton from '@/components/AddToPlaylistButton';
import {
  Play,
  Pause,
  Search,
  Music as MusicIcon,
  X,
  Clock,
  Shuffle,
  Heart,
  ListPlus,
  Share2,
  LayoutGrid,
  List,
  Check,
  TrendingUp,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { resolveCoverUrl } from '@/lib/media';
import { formatDurationOrDash, playsLabel, getArtistHref } from '@/lib/catalogApi';
import { favoritesApi } from '@/lib/favoritesApi';
import { getFriendlyErrorMessage, parseApiError } from '@/lib/errorHandler';

interface MusicItem {
  id: number;
  title: string;
  artist: string;
  artist_id?: number | null;
  album: string | null;
  album_id?: number | null;
  duration: number | null;
  file_path: string;
  file_size: number;
  cover_image: string | null;
  created_at: string;
  plays?: number;
}

type SortMode = 'recent' | 'popular' | 'alpha' | 'favorites';
type ViewMode = 'grid' | 'list';

const ITEMS_PER_PAGE = 24;

const MusicCard = ({
  music,
  onPlay,
  isCurrentMusicPlaying,
  isFavorited,
  onToggleFavorite,
  onAddToQueue,
  onShare,
}: {
  music: MusicItem;
  onPlay: (music: MusicItem) => void;
  isCurrentMusicPlaying: (music: MusicItem) => boolean;
  isFavorited: boolean;
  onToggleFavorite: (music: MusicItem) => void;
  onAddToQueue: (music: MusicItem) => void;
  onShare: (music: MusicItem) => void;
}) => {
  const coverUrl = resolveCoverUrl(music.cover_image);
  const isPlaying = isCurrentMusicPlaying(music);
  const plays = music.plays ?? 0;

  return (
    <div className="group bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/30 rounded-2xl p-3 transition-all duration-200 flex flex-col">
      <div
        className="relative rounded-xl overflow-hidden aspect-square mb-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 cursor-pointer"
        onClick={() => onPlay(music)}
      >
        <img
          src={coverUrl}
          alt={music.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/default-cover.svg';
          }}
        />

        {isPlaying && (
          <div className="absolute inset-0 bg-purple-900/45 flex items-center justify-center">
            <div className="flex gap-1">
              <span className="w-1 h-4 bg-white rounded animate-pulse" />
              <span className="w-1 h-6 bg-white rounded animate-pulse delay-75" />
              <span className="w-1 h-3 bg-white rounded animate-pulse delay-150" />
            </div>
          </div>
        )}

        {/* Botão favoritar no topo direito */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(music);
          }}
          title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 ${
            isFavorited
              ? 'bg-pink-500/90 text-white opacity-100'
              : 'bg-black/50 text-white/80 hover:text-white opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart size={14} className={isFavorited ? 'fill-white' : ''} />
        </button>

        {/* Ações inferiores */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToQueue(music);
            }}
            title="Adicionar à fila"
            aria-label="Adicionar à fila"
            className="w-8 h-8 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
          >
            <ListPlus size={14} />
          </button>

          <div
            className="opacity-0 group-hover:opacity-100 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <AddToPlaylistButton musicId={music.id} />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay(music);
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

        {music.duration && music.duration > 0 && (
          <span className="absolute bottom-2 left-2 text-[11px] bg-black/70 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock size={10} />
            {formatDurationOrDash(music.duration)}
          </span>
        )}
      </div>

      <div className="space-y-0.5 flex-1 flex flex-col justify-between">
        <div>
          <h4
            onClick={() => onPlay(music)}
            className={`font-semibold text-sm truncate cursor-pointer hover:underline ${
              isPlaying ? 'text-purple-400' : 'text-white'
            }`}
          >
            {music.title}
          </h4>

          {music.artist_id ? (
            <Link
              href={getArtistHref(music.artist_id, music.artist)}
              className="text-gray-300 text-xs truncate block hover:text-purple-300"
            >
              {music.artist}
            </Link>
          ) : (
            <p className="text-gray-300 text-xs truncate">{music.artist}</p>
          )}

          {music.album && music.album_id ? (
            <Link
              href={`/albums/${music.album_id}`}
              className="text-gray-400 text-[11px] truncate block hover:text-purple-300"
            >
              {music.album}
            </Link>
          ) : music.album ? (
            <p className="text-gray-400 text-[11px] truncate">{music.album}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/5 text-[11px] text-gray-400">
          <span className="truncate">{playsLabel(plays)}</span>
          <button
            type="button"
            onClick={() => onShare(music)}
            title="Partilhar música"
            aria-label="Partilhar música"
            className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <Share2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MusicPage() {
  const { user } = useAuth();
  const { play, togglePlay, addToQueue, isPlaying, currentMusic } = usePlayer();

  const [allMusic, setAllMusic] = useState<MusicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(getApiUrl('/api/v1/music?limit=200'), {
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
        } else {
          setError(parseApiError(response, result, 'Não foi possível carregar as músicas.'));
        }
      } catch (err) {
        setError(getFriendlyErrorMessage(err, 'Não foi possível carregar as músicas. Tenta novamente.'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
          if ((item.content_type === 'music' || !item.content_type) && item.content_id) {
            ids.add(Number(item.content_id));
          } else if (item.id && item.title && item.artist) {
            ids.add(Number(item.id));
          }
        }
        setFavoriteIds(ids);
      })
      .catch(() => {
        // Silencioso
      });
  }, [user]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { musicId, plays } = (e as CustomEvent).detail as {
        musicId: number;
        plays: number;
      };
      setAllMusic((prev) =>
        prev.map((m) => (m.id === musicId ? { ...m, plays } : m))
      );
    };
    window.addEventListener('podplay:playCounted', handler);
    return () => window.removeEventListener('podplay:playCounted', handler);
  }, []);

  const filteredAndSortedMusic = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = allMusic.filter((m) => {
      if (sortMode === 'favorites' && !favoriteIds.has(m.id)) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        m.artist.toLowerCase().includes(q) ||
        (m.album && m.album.toLowerCase().includes(q))
      );
    });

    if (sortMode === 'popular') {
      list = [...list].sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0));
    } else if (sortMode === 'alpha') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'pt'));
    } else {
      list = [...list].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return list;
  }, [allMusic, searchQuery, sortMode, favoriteIds]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedMusic.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedMusic = useMemo(
    () =>
      filteredAndSortedMusic.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
      ),
    [filteredAndSortedMusic, safePage]
  );

  const featuredTrack = useMemo(() => {
    if (allMusic.length === 0) return null;
    return [...allMusic].sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0))[0];
  }, [allMusic]);

  const totalPlays = useMemo(
    () => allMusic.reduce((acc, m) => acc + (m.plays ?? 0), 0),
    [allMusic]
  );

  const handlePlayMusic = (music: MusicItem) => {
    if (currentMusic?.id === music.id) {
      togglePlay();
      return;
    }
    const source = filteredAndSortedMusic.length > 0 ? filteredAndSortedMusic : allMusic;
    const idx = source.findIndex((m) => m.id === music.id);
    if (idx >= 0) {
      const newQueue = [...source.slice(idx), ...source.slice(0, idx)];
      play(music, true, newQueue);
    } else {
      play(music, true, [music]);
    }
  };

  const handlePlayAll = (shuffled = false) => {
    const source = filteredAndSortedMusic.length > 0 ? filteredAndSortedMusic : allMusic;
    if (source.length === 0) return;
    const queue = shuffled
      ? [...source].sort(() => Math.random() - 0.5)
      : [...source];
    play(queue[0], true, queue);
    showToast(shuffled ? 'A reproduzir em modo aleatório' : 'A reproduzir todas as músicas');
  };

  const handleToggleFavorite = async (music: MusicItem) => {
    if (!user) {
      showToast('Inicia sessão para guardar favoritos.');
      return;
    }
    const wasFav = favoriteIds.has(music.id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFav) next.delete(music.id);
      else next.add(music.id);
      return next;
    });
    try {
      const res = await favoritesApi.toggleFavorite(music.id, 'music');
      showToast(
        res.favorited
          ? `"${music.title}" adicionada aos favoritos`
          : `"${music.title}" removida dos favoritos`
      );
    } catch {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFav) next.add(music.id);
        else next.delete(music.id);
        return next;
      });
      showToast('Não foi possível atualizar favoritos.');
    }
  };

  const handleAddToQueue = (music: MusicItem) => {
    addToQueue(music);
    showToast(`"${music.title}" adicionada à fila`);
  };

  const handleShare = async (music: MusicItem) => {
    const shareUrl = `${window.location.origin}/player/${music.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: music.title, text: `${music.title} — ${music.artist}`, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link da música copiado!');
    } catch {
      showToast('Link pronto a partilhar.');
    }
  };

  const isCurrentMusicPlaying = (music: MusicItem) =>
    currentMusic?.id === music.id && isPlaying;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-0 md:ml-60 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="p-6 max-w-[1600px] mx-auto">
          {/* Cabeçalho e ações globais */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <MusicIcon size={28} className="text-purple-400" />
                <h1 className="text-3xl font-bold text-white">Músicas</h1>
              </div>
              <p className="text-purple-200 text-sm">
                {allMusic.length} faixas disponíveis · {totalPlays.toLocaleString('pt-PT')} reproduções totais
              </p>
            </div>

            {!loading && filteredAndSortedMusic.length > 0 && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handlePlayAll(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/25 transition-all"
                >
                  <Play size={16} className="ml-0.5" />
                  <span>Reproduzir Tudo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePlayAll(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-medium transition-all"
                >
                  <Shuffle size={16} />
                  <span>Aleatório</span>
                </button>
              </div>
            )}
          </div>

          {/* Destaque principal (quando não há pesquisa ativa) */}
          {!loading && !searchQuery && sortMode === 'recent' && featuredTrack && (
            <section className="mb-7 p-5 rounded-2xl bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-slate-900/70 border border-purple-500/25 flex flex-col sm:flex-row items-center gap-5">
              <div
                onClick={() => handlePlayMusic(featuredTrack)}
                className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shrink-0 shadow-xl cursor-pointer group"
              >
                <img
                  src={resolveCoverUrl(featuredTrack.cover_image)}
                  alt={featuredTrack.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/default-cover.svg';
                  }}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="w-11 h-11 rounded-full bg-purple-600 flex items-center justify-center shadow-lg">
                    {isCurrentMusicPlaying(featuredTrack) ? (
                      <Pause size={18} className="text-white" />
                    ) : (
                      <Play size={18} className="text-white ml-0.5" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/25 text-purple-200 mb-2">
                  <TrendingUp size={12} /> Música Mais Ouvida
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                  {featuredTrack.title}
                </h2>
                <p className="text-sm text-purple-200 mt-0.5 truncate">
                  {featuredTrack.artist}
                  {featuredTrack.album ? ` · ${featuredTrack.album}` : ''}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {playsLabel(featuredTrack.plays ?? 0)}
                  {featuredTrack.duration ? ` · ${formatDurationOrDash(featuredTrack.duration)}` : ''}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayMusic(featuredTrack)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-900 hover:bg-purple-100 text-xs font-bold transition-colors"
                  >
                    {isCurrentMusicPlaying(featuredTrack) ? (
                      <>
                        <Pause size={14} /> Pausar
                      </>
                    ) : (
                      <>
                        <Play size={14} /> Ouvir Agora
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(featuredTrack)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-medium transition-colors ${
                      favoriteIds.has(featuredTrack.id)
                        ? 'bg-pink-500/20 border-pink-400/50 text-pink-200'
                        : 'bg-white/10 border-white/15 text-white hover:bg-white/15'
                    }`}
                  >
                    <Heart
                      size={14}
                      className={favoriteIds.has(featuredTrack.id) ? 'fill-pink-400 text-pink-400' : ''}
                    />
                    <span>{favoriteIds.has(featuredTrack.id) ? 'Nos Favoritos' : 'Favoritar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddToQueue(featuredTrack)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-white transition-colors"
                  >
                    <ListPlus size={14} />
                    <span>Fila</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Barra de pesquisa, filtros e vista */}
          <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
                placeholder="Pesquisar por título, artista ou álbum..."
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
                  aria-label="Limpar pesquisa"
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
                    { key: 'popular', label: 'Mais Ouvidas' },
                    { key: 'alpha', label: 'A–Z' },
                    ...(user ? [{ key: 'favorites' as SortMode, label: 'Favoritas' }] : []),
                  ] as Array<{ key: SortMode; label: string }>
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSortMode(item.key);
                      setPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      sortMode === item.key
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

          {!loading && (
            <p className="text-xs text-gray-400 mb-4">
              {filteredAndSortedMusic.length} música{filteredAndSortedMusic.length !== 1 ? 's' : ''}
              {searchQuery && ` encontrada${filteredAndSortedMusic.length !== 1 ? 's' : ''}`}
            </p>
          )}

          {/* Skeleton Loading */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-3 animate-pulse">
                  <div className="aspect-square rounded-xl bg-white/10 mb-3" />
                  <div className="h-3.5 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
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

          {!loading && !error && filteredAndSortedMusic.length === 0 && (
            <div className="text-center py-20 bg-white/[0.03] border border-white/10 rounded-2xl">
              <MusicIcon size={56} className="text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300 text-base font-medium mb-1">
                {sortMode === 'favorites'
                  ? 'Ainda não tens músicas favoritas'
                  : searchQuery
                    ? 'Nenhuma música encontrada para esta pesquisa'
                    : 'Nenhuma música disponível no momento'}
              </p>
              {(searchQuery || sortMode === 'favorites') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSortMode('recent');
                    setPage(1);
                  }}
                  className="text-purple-400 hover:text-purple-300 text-sm mt-2"
                >
                  Mostrar todas as músicas
                </button>
              )}
            </div>
          )}

          {/* Lista / Grelha */}
          {!loading && !error && paginatedMusic.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {paginatedMusic.map((music) => (
                    <MusicCard
                      key={music.id}
                      music={music}
                      onPlay={handlePlayMusic}
                      isCurrentMusicPlaying={isCurrentMusicPlaying}
                      isFavorited={favoriteIds.has(music.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onAddToQueue={handleAddToQueue}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/10">
                  {paginatedMusic.map((music, idx) => {
                    const playing = isCurrentMusicPlaying(music);
                    const isFav = favoriteIds.has(music.id);
                    const number = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                    return (
                      <div
                        key={music.id}
                        onClick={() => handlePlayMusic(music)}
                        className={`flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.07] transition-colors cursor-pointer group ${
                          playing ? 'bg-purple-500/15' : ''
                        }`}
                      >
                        <span className="w-6 text-center text-xs text-gray-400 shrink-0">
                          {playing ? (
                            <MusicIcon size={14} className="text-purple-400 mx-auto animate-pulse" />
                          ) : (
                            number
                          )}
                        </span>
                        <img
                          src={resolveCoverUrl(music.cover_image)}
                          alt={music.title}
                          loading="lazy"
                          decoding="async"
                          className="w-11 h-11 rounded-lg object-cover shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/default-cover.svg';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold truncate ${
                              playing ? 'text-purple-300' : 'text-white'
                            }`}
                          >
                            {music.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {music.artist}
                            {music.album ? ` · ${music.album}` : ''}
                          </p>
                        </div>
                        <span className="hidden md:inline-block text-xs text-gray-400 shrink-0 w-28 text-right">
                          {playsLabel(music.plays ?? 0)}
                        </span>
                        <span className="hidden sm:inline-block text-xs text-gray-400 shrink-0 w-14 text-right">
                          {formatDurationOrDash(music.duration)}
                        </span>
                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(music)}
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
                            onClick={() => handleAddToQueue(music)}
                            title="Adicionar à fila"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <ListPlus size={15} />
                          </button>
                          <AddToPlaylistButton musicId={music.id} />
                          <button
                            type="button"
                            onClick={() => handleShare(music)}
                            title="Partilhar"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Share2 size={14} />
                          </button>
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
    </div>
  );
}
