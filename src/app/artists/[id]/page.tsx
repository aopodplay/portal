'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import {
  Play,
  Pause,
  Shuffle,
  Loader2,
  AlertCircle,
  Music as MusicIcon,
  DiscAlbum,
  ArrowLeft,
  Users,
  Heart,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { resolveCoverUrl } from '@/lib/media';
import {
  catalogApi,
  formatDurationOrDash,
  playsLabel,
  followersLabel,
  type Artist,
  type Album,
  type MusicTrack,
} from '@/lib/catalogApi';

// =====================================================================
// TRACK ROW
// =====================================================================

function TrackRow({
  index,
  track,
  isCurrent,
  isPlaying,
  onPlay,
}: {
  index: number;
  track: MusicTrack;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const cover = resolveCoverUrl(track.cover_image ?? undefined);

  return (
    <div
      onClick={onPlay}
      className={`group grid grid-cols-[32px_1fr_auto_auto] sm:grid-cols-[40px_2fr_1.5fr_1fr_80px] gap-3 items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isCurrent ? 'bg-purple-600/20' : 'hover:bg-white/5'
      }`}
    >
      <div className="flex items-center justify-center">
        {isCurrent && isPlaying ? (
          <div className="flex gap-0.5">
            <span className="w-0.5 h-3 bg-purple-400 rounded animate-pulse" />
            <span className="w-0.5 h-4 bg-purple-400 rounded animate-pulse delay-75" />
            <span className="w-0.5 h-2 bg-purple-400 rounded animate-pulse delay-150" />
          </div>
        ) : (
          <>
            <span className="text-gray-400 text-sm group-hover:hidden tabular-nums">
              {index + 1}
            </span>
            <Play size={14} className="text-white hidden group-hover:block" />
          </>
        )}
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded bg-purple-600/30 flex-shrink-0 overflow-hidden hidden sm:block">
          {track.cover_image ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <MusicIcon size={18} className="text-white/50 m-auto mt-2.5" />
          )}
        </div>
        <div className="min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              isCurrent ? 'text-purple-300' : 'text-white'
            }`}
          >
            {track.title}
          </p>
          <p className="text-gray-400 text-xs truncate">{track.artist}</p>
        </div>
      </div>

      <p className="text-gray-400 text-xs truncate hidden sm:block">
        {track.album || '—'}
      </p>

      <p className="text-gray-400 text-xs tabular-nums hidden sm:block">
        {playsLabel(track.plays ?? 0)}
      </p>

      <p className="text-gray-400 text-xs tabular-nums text-right">
        {formatDurationOrDash(track.duration)}
      </p>
    </div>
  );
}

// =====================================================================
// PÁGINA
// =====================================================================

export default function ArtistPage() {
  const params = useParams();
  const router = useRouter();
  const artistId = Number(params?.id);
  const { user } = useAuth();
  const { play, isPlaying, currentMusic } = usePlayer();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [top, setTop] = useState<MusicTrack[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [allTracks, setAllTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // =====================================================================
  // Carregar dados
  // =====================================================================
  useEffect(() => {
    if (!artistId || isNaN(artistId)) {
      setError('ID de artista inválido');
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [a, t, al, music] = await Promise.all([
          catalogApi.getArtist(artistId),
          catalogApi.getArtistTop(artistId, 5),
          catalogApi.getArtistAlbums(artistId),
          catalogApi.getArtistMusic(artistId),
        ]);

        if (cancelled) return;

        setArtist(a);
        setTop(t);
        setAlbums(al);
        setAllTracks(music);
        setFollowersCount(a.followers_count ?? 0);

        // Verifica se o user segue este artista
        if (user) {
          try {
            const res = await catalogApi.checkFollowing(artistId);
            if (!cancelled) setIsFollowing(res.following);
          } catch {
            /* silencioso */
          }
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Erro ao carregar artista');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [artistId, user]);

  // =====================================================================
  // Toggle Follow
  // =====================================================================
  const handleToggleFollow = async () => {
    if (!user) {
      alert('Precisas de estar logado para seguir artistas');
      return;
    }
    try {
      setFollowLoading(true);
      const res = await catalogApi.toggleFollow(artistId);
      setIsFollowing(res.following);
      setFollowersCount(res.followers_count);
    } catch (e: any) {
      alert(e?.message || 'Erro ao seguir artista');
    } finally {
      setFollowLoading(false);
    }
  };

  // =====================================================================
  // Play / Shuffle
  // =====================================================================
  const handlePlayTop = useCallback(() => {
    if (top.length === 0) return;
    play(top[0], true, top);
  }, [top, play]);

  const handlePlayAll = useCallback(() => {
    if (allTracks.length === 0) return;
    play(allTracks[0], true, allTracks);
  }, [allTracks, play]);

  const handleShufflePlay = useCallback(() => {
    if (allTracks.length === 0) return;
    const random = allTracks[Math.floor(Math.random() * allTracks.length)];
    play(random, true, allTracks);
  }, [allTracks, play]);

  const playTrack = (track: MusicTrack, list: MusicTrack[]) => {
    play(track, true, list);
  };

  const totalMinutes = Math.round(
    allTracks.reduce((s, t) => s + (t.duration ?? 0), 0) / 60
  );

  // =====================================================================
  // LOADING
  // =====================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <PodPlaySidebar />
        <main className="ml-64 min-h-screen flex items-center justify-center">
          <Loader2 size={48} className="text-purple-500 animate-spin" />
        </main>
      </div>
    );
  }

  // =====================================================================
  // ERRO
  // =====================================================================

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <PodPlaySidebar />
        <main className="ml-64 min-h-screen flex flex-col items-center justify-center gap-4">
          <AlertCircle size={48} className="text-red-400" />
          <p className="text-red-300">{error || 'Artista não encontrado'}</p>
          <button
            onClick={() => router.push('/artists')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm"
          >
            Voltar aos artistas
          </button>
        </main>
        <PlayerBar />
      </div>
    );
  }

  // =====================================================================
  // NORMAL
  // =====================================================================

  const cover = resolveCoverUrl(artist.image_url ?? undefined);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-64 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="p-6">
          <button
            onClick={() => router.push('/artists')}
            className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Todos os artistas
          </button>

          {/* ===================== HEADER DO ARTISTA ===================== */}
          <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-purple-700 via-pink-700 to-purple-800">
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-end">
              {/* Foto do artista */}
              <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden bg-purple-900/60 flex-shrink-0 shadow-2xl flex items-center justify-center ring-4 ring-white/10">
                {artist.image_url ? (
                  <img
                    src={cover}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users size={80} className="text-white/40" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                  Artista
                </span>
                <h1 className="text-3xl md:text-6xl font-bold text-white mt-2 truncate">
                  {artist.name}
                </h1>

                {/* Contadores */}
                <p className="text-purple-100 text-sm mt-3">
                  {artist.tracks_count ?? 0}{' '}
                  {(artist.tracks_count ?? 0) === 1 ? 'música' : 'músicas'}
                  {artist.albums_count
                    ? ` · ${artist.albums_count} ${
                        artist.albums_count === 1 ? 'álbum' : 'álbuns'
                      }`
                    : ''}
                  {followersCount > 0
                    ? ` · ${followersLabel(followersCount)}`
                    : ''}
                </p>

                {/* Bio */}
                {artist.bio ? (
                  <p className="text-purple-100 text-sm mt-3 line-clamp-3 max-w-2xl">
                    {artist.bio}
                  </p>
                ) : (
                  <p className="text-purple-200/60 text-sm mt-3 italic">
                    Sem biografia
                  </p>
                )}

                {/* Seguir + Reproduzir */}
                <div className="flex flex-wrap items-center gap-3 mt-6">
                  <button
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                    className={`px-5 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-60 ${
                      isFollowing
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {followLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isFollowing ? (
                      <UserCheck size={14} />
                    ) : (
                      <Heart size={14} />
                    )}
                    {isFollowing ? 'A seguir' : 'Seguir'}
                  </button>

                  <button
                    onClick={handlePlayAll}
                    disabled={allTracks.length === 0}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Play size={16} /> Reproduzir tudo
                  </button>

                  <button
                    onClick={handleShufflePlay}
                    disabled={allTracks.length === 0}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Shuffle size={16} /> Aleatório
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ===================== MÚSICAS POPULARES ===================== */}
          {top.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Músicas populares
                </h2>
                <button
                  onClick={handlePlayTop}
                  className="text-sm text-purple-300 hover:text-white flex items-center gap-1"
                >
                  Reproduzir todas <Play size={14} />
                </button>
              </div>
              <div className="space-y-1">
                {top.map((track, i) => (
                  <TrackRow
                    key={track.id}
                    index={i}
                    track={track}
                    isCurrent={currentMusic?.id === track.id}
                    isPlaying={isPlaying}
                    onPlay={() => playTrack(track, top)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ===================== ÁLBUNS ===================== */}
          {albums.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4">Álbuns</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album) => {
                  const albumCover = resolveCoverUrl(album.cover_url ?? undefined);
                  return (
                    <Link
                      key={album.id}
                      href={`/albums/${album.id}`}
                      className="group"
                    >
                      <div className="relative rounded-lg overflow-hidden aspect-square mb-2 bg-purple-900/30 flex items-center justify-center">
                        {album.cover_url ? (
                          <img
                            src={albumCover}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <DiscAlbum size={48} className="text-white/40" />
                        )}
                      </div>
                      <h4 className="font-medium text-sm truncate text-white">
                        {album.title}
                      </h4>
                      <p className="text-gray-400 text-xs truncate">
                        {album.release_date
                          ? new Date(album.release_date).getFullYear()
                          : `${album.tracks_count ?? 0} faixas`}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ===================== TODAS AS MÚSICAS ===================== */}
          {allTracks.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Todas as músicas
                </h2>
                <p className="text-sm text-gray-400">
                  {allTracks.length}{' '}
                  {allTracks.length === 1 ? 'música' : 'músicas'}
                  {totalMinutes > 0 ? ` · ~${totalMinutes} min` : ''}
                </p>
              </div>
              <div className="space-y-1">
                {allTracks.map((track, i) => (
                  <TrackRow
                    key={track.id}
                    index={i}
                    track={track}
                    isCurrent={currentMusic?.id === track.id}
                    isPlaying={isPlaying}
                    onPlay={() => playTrack(track, allTracks)}
                  />
                ))}
              </div>
            </section>
          )}

          {allTracks.length === 0 &&
            albums.length === 0 &&
            top.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                Este artista ainda não tem músicas publicadas.
              </div>
            )}
        </div>
      </main>

      <PlayerBar />
    </div>
  );
}