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
  DiscAlbum,
  ArrowLeft,
} from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { resolveCoverUrl } from '@/lib/media';
import {
  catalogApi,
  formatDurationOrDash,
  playsLabel,
  type Album,
  type MusicTrack,
} from '@/lib/catalogApi';

// Importamos o tipo MusicItem do seu Context (ajuste o caminho se necessário)
import type { MusicItem } from '@/contexts/PlayerContext';

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
  return (
    <div
      onClick={onPlay}
      className={`group grid grid-cols-[40px_1fr_auto_auto] sm:grid-cols-[40px_2fr_1fr_80px] gap-3 items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
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

      <p className="text-gray-400 text-xs tabular-nums hidden sm:block">
        {playsLabel(track.plays ?? 0)}
      </p>

      <p className="text-gray-400 text-xs tabular-nums text-right">
        {formatDurationOrDash(track.duration)}
      </p>
    </div>
  );
}

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = Number(params?.id);
  const { play, isPlaying, currentMusic } = usePlayer();

  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!albumId || isNaN(albumId)) {
      setError('ID de álbum inválido');
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [a, t] = await Promise.all([
          catalogApi.getAlbum(albumId),
          catalogApi.getAlbumMusic(albumId),
        ]);

        if (cancelled) return;
        setAlbum(a);
        setTracks(t);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Erro ao carregar álbum');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [albumId]);

  const handlePlayAlbum = useCallback(() => {
    if (tracks.length === 0) return;
    // CAST: os dados são compatíveis em runtime
    play(tracks[0] as unknown as MusicItem, true, tracks as unknown as MusicItem[]);
  }, [tracks, play]);

  const handleShuffle = useCallback(() => {
    if (tracks.length === 0) return;
    const random = tracks[Math.floor(Math.random() * tracks.length)];
    play(random as unknown as MusicItem, true, tracks as unknown as MusicItem[]);
  }, [tracks, play]);

  const isCurrentTrack = (track: MusicTrack) => currentMusic?.id === track.id;
  const isAnyTrackPlaying =
    tracks.some((t) => t.id === currentMusic?.id) && isPlaying;

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

  if (error || !album) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <PodPlaySidebar />
        <main className="ml-64 min-h-screen flex flex-col items-center justify-center gap-4">
          <AlertCircle size={48} className="text-red-400" />
          <p className="text-red-300">{error || 'Álbum não encontrado'}</p>
          <button
            onClick={() => router.push('/albums')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm"
          >
            Voltar aos álbuns
          </button>
        </main>
        <PlayerBar />
      </div>
    );
  }

  const cover = resolveCoverUrl(album.cover_url ?? undefined);
  const releaseYear = album.release_date
    ? new Date(album.release_date).getFullYear()
    : null;
  const totalDuration = tracks.reduce((s, t) => s + (t.duration ?? 0), 0);
  const totalMinutes = Math.round(totalDuration / 60);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-64 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="p-6">
          <button
            onClick={() => router.push('/albums')}
            className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Todos os álbuns
          </button>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end mb-8">
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-xl overflow-hidden bg-purple-900/50 flex-shrink-0 shadow-2xl">
              {album.cover_url ? (
                <img
                  src={cover}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <DiscAlbum size={72} className="text-white/40" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                Álbum
              </span>
              <h1 className="text-3xl md:text-5xl font-bold text-white mt-1">
                {album.title}
              </h1>

              {album.artist_id && album.artist_name && (
                <Link
                  href={`/artists/${album.artist_id}`}
                  className="text-purple-300 hover:text-white text-sm font-medium mt-2 inline-block"
                >
                  {album.artist_name}
                </Link>
              )}

              <p className="text-gray-300 text-sm mt-2">
                {releaseYear ? `${releaseYear} · ` : ''}
                {tracks.length} {tracks.length === 1 ? 'faixa' : 'faixas'}
                {totalMinutes > 0 ? ` · ${totalMinutes} min` : ''}
              </p>

              {album.description && (
                <p className="text-gray-400 text-sm mt-3 line-clamp-3 max-w-2xl">
                  {album.description}
                </p>
              )}

              <div className="flex gap-3 mt-5">
                <button
                  onClick={handlePlayAlbum}
                  disabled={tracks.length === 0}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isAnyTrackPlaying ? (
                    <>
                      <Pause size={16} /> A tocar...
                    </>
                  ) : (
                    <>
                      <Play size={16} /> Reproduzir
                    </>
                  )}
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

          {tracks.length > 0 ? (
            <div className="space-y-1">
              {tracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  index={i}
                  track={track}
                  isCurrent={isCurrentTrack(track)}
                  isPlaying={isPlaying}
                  onPlay={() =>
                    play(track as unknown as MusicItem, true, tracks as unknown as MusicItem[])
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-12">
              Este álbum ainda não tem faixas.
            </p>
          )}
        </div>
      </main>

      <PlayerBar />
    </div>
  );
}