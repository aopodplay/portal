// app/playlists/[id]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import {
  Play,
  Shuffle,
  Loader2,
  AlertCircle,
  Music as MusicIcon,
  ListMusic,
  Trash2,
  ArrowLeft,
  GripVertical,
} from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { resolveCoverUrl } from '@/lib/media';
import { playlistApi, Playlist } from '@/lib/playlistApi';
import { formatDurationOrDash, playsLabel, type MusicTrack } from '@/lib/catalogApi';

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = Number(params?.id);
  const { play, isPlaying, currentMusic } = usePlayer();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const p: any = await playlistApi.get(playlistId);
      setPlaylist(p);

      if (Array.isArray(p?.tracks)) {
        setTracks(p.tracks);
      } else {
        const t = await playlistApi.getMusic(playlistId);
        setTracks(t);
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar playlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!playlistId || isNaN(playlistId)) {
      setError('ID inválido');
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  const handlePlayAll = useCallback(() => {
    if (tracks.length === 0) return;
    play(tracks[0], true, tracks);
  }, [tracks, play]);

  const handleShuffle = useCallback(() => {
    if (tracks.length === 0) return;
    const random = tracks[Math.floor(Math.random() * tracks.length)];
    play(random, true, tracks);
  }, [tracks, play]);

  const handleRemove = async (musicId: number, title: string) => {
    if (!confirm(`Remover "${title}" da playlist?`)) return;
    try {
      await playlistApi.removeMusic(playlistId, musicId);
      setTracks((prev) => prev.filter((t) => t.id !== musicId));
    } catch (e: any) {
      alert(e?.message || 'Erro ao remover');
    }
  };

  // ---------- Reorder por drag-and-drop ----------
  const handleDragStart = (i: number) => setDragIndex(i);

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    setTracks((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(dragIndex, 1);
      copy.splice(i, 0, item);
      return copy;
    });
    setDragIndex(i);
  };

  const handleDragEnd = async () => {
    setDragIndex(null);
    try {
      await playlistApi.reorder(playlistId, tracks.map((t) => t.id));
    } catch (e) {
      console.warn('Erro ao reordenar:', e);
    }
  };

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

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <PodPlaySidebar />
        <main className="ml-64 min-h-screen flex flex-col items-center justify-center gap-4">
          <AlertCircle size={48} className="text-red-400" />
          <p className="text-red-300">{error || 'Playlist não encontrada'}</p>
          <button
            onClick={() => router.push('/playlists')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm"
          >
            Voltar às playlists
          </button>
        </main>
        <PlayerBar />
      </div>
    );
  }

  // =====================================================================
  // NORMAL
  // =====================================================================

  const cover = resolveCoverUrl(playlist.cover_url ?? undefined);
  const totalDuration = tracks.reduce((s, t) => s + (t.duration ?? 0), 0);
  const totalMinutes = Math.round(totalDuration / 60);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-64 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="p-6">
          <button
            onClick={() => router.push('/playlists')}
            className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Todas as playlists
          </button>

          {/* Header */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end mb-8">
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-xl overflow-hidden bg-gradient-to-br from-purple-600/40 to-pink-600/40 flex-shrink-0 shadow-2xl flex items-center justify-center">
              {playlist.cover_url ? (
                <img
                  src={cover}
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ListMusic size={72} className="text-white/50" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                Playlist
              </span>
              <h1 className="text-3xl md:text-5xl font-bold text-white mt-1">
                {playlist.title}
              </h1>
              {playlist.description && (
                <p className="text-gray-300 text-sm mt-3 line-clamp-3 max-w-2xl">
                  {playlist.description}
                </p>
              )}
              <p className="text-gray-400 text-sm mt-2">
                {tracks.length} {tracks.length === 1 ? 'música' : 'músicas'}
                {totalMinutes > 0 ? ` · ${totalMinutes} min` : ''}
              </p>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={handlePlayAll}
                  disabled={tracks.length === 0}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Play size={16} /> Reproduzir
                </button>
                <button
                  onClick={handleShuffle}
                  disabled={tracks.length === 0}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Shuffle size={16} /> Aleatório
                </button>
              </div>
            </div>
          </div>

          {/* Lista */}
          {tracks.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ListMusic size={48} className="text-gray-600 mx-auto mb-3" />
              Esta playlist ainda não tem músicas.
              <br />
              <Link
                href="/music"
                className="inline-block mt-4 text-purple-400 hover:text-purple-300 text-sm"
              >
                Explorar músicas →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {tracks.map((track, i) => {
                const isCurrent = currentMusic?.id === track.id;
                const trackCover = resolveCoverUrl(track.cover_image ?? undefined);
                return (
                  <div
                    key={track.id}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    onClick={() => play(track, true, tracks)}
                    className={`group grid grid-cols-[24px_32px_1fr_auto_auto] sm:grid-cols-[24px_40px_2fr_1.5fr_1fr_80px_40px] gap-3 items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isCurrent ? 'bg-purple-600/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <GripVertical
                      size={14}
                      className="text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab"
                    />

                    <div className="flex items-center justify-center">
                      {isCurrent && isPlaying ? (
                        <div className="flex gap-0.5">
                          <span className="w-0.5 h-3 bg-purple-400 rounded animate-pulse" />
                          <span className="w-0.5 h-4 bg-purple-400 rounded animate-pulse delay-75" />
                          <span className="w-0.5 h-2 bg-purple-400 rounded animate-pulse delay-150" />
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm group-hover:hidden tabular-nums">
                          {i + 1}
                        </span>
                      )}
                      <Play size={14} className="text-white hidden group-hover:block" />
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded bg-purple-600/30 flex-shrink-0 overflow-hidden hidden sm:block">
                        {track.cover_image ? (
                          <img
                            src={trackCover}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <MusicIcon
                            size={18}
                            className="text-white/50 m-auto mt-2.5"
                          />
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
                        <p className="text-gray-400 text-xs truncate">
                          {track.artist}
                        </p>
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

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(track.id, track.title);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity p-1"
                      title="Remover da playlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <PlayerBar />
    </div>
  );
}