'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  X,
  Clock,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { resolveCoverUrl } from '@/lib/media';
import { formatDurationOrDash, playsLabel } from '@/lib/catalogApi';

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

const MusicCard = ({
  music,
  onPlay,
  isCurrentMusicPlaying,
}: {
  music: MusicItem;
  onPlay: (music: MusicItem) => void;
  isCurrentMusicPlaying: (music: MusicItem) => boolean;
}) => {
  const coverUrl = resolveCoverUrl(music.cover_image);
  const isPlaying = isCurrentMusicPlaying(music);
  const plays = music.plays ?? 0;

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

        <div className="absolute bottom-2 right-2 flex gap-1.5 z-10">
          <div className="opacity-0 group-hover:opacity-100 transition-all">
            <AddToPlaylistButton musicId={music.id} />
          </div>

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
        >
          {music.title}
        </h4>

        {music.artist_id ? (
          <Link
            href={`/artists/${music.artist_id}`}
            className="text-gray-400 text-xs truncate block hover:text-purple-300"
          >
            {music.artist}
          </Link>
        ) : (
          <p className="text-gray-400 text-xs truncate">{music.artist}</p>
        )}

        {music.album && music.album_id ? (
          <Link
            href={`/albums/${music.album_id}`}
            className="text-gray-500 text-xs truncate block hover:text-purple-300"
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

export default function MusicPage() {
  const { user } = useAuth();
  const { play, isPlaying, currentMusic } = usePlayer();

  const [allMusic, setAllMusic] = useState<MusicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
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
        } else {
          setError(result.message || 'Erro ao carregar músicas');
        }
      } catch (err) {
        console.error('Erro ao carregar músicas:', err);
        setError('Erro ao carregar músicas');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const filteredMusic = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allMusic;
    return allMusic.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.artist.toLowerCase().includes(q) ||
        (m.album && m.album.toLowerCase().includes(q))
    );
  }, [allMusic, searchQuery]);

  const handlePlayMusic = (music: MusicItem) => {
    if (allMusic.length === 0) {
      play(music, true, [music]);
      return;
    }
    const idx = allMusic.findIndex((m) => m.id === music.id);
    if (idx >= 0) {
      const newQueue = [...allMusic.slice(idx), ...allMusic.slice(0, idx)];
      play(music, true, newQueue);
    } else {
      play(music, true, [music]);
    }
  };

  const isCurrentMusicPlaying = (music: MusicItem) =>
    currentMusic?.id === music.id && isPlaying;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-64 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <MusicIcon size={28} className="text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Músicas</h1>
            </div>
            <p className="text-purple-200 text-sm">
              Todas as músicas disponíveis na Podfe Play
            </p>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por título, artista ou álbum..."
                className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {!loading && (
              <p className="text-xs text-gray-400 mt-2">
                {filteredMusic.length} música{filteredMusic.length !== 1 ? 's' : ''}
                {searchQuery && ` encontrada${filteredMusic.length !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 size={40} className="text-purple-500 animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-20">
              <p className="text-red-400 mb-3">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && filteredMusic.length === 0 && (
            <div className="text-center py-20">
              <MusicIcon size={64} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-1">
                {searchQuery
                  ? 'Nenhuma música encontrada para esta pesquisa'
                  : 'Nenhuma música disponível no momento'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-purple-400 hover:text-purple-300 text-sm mt-2"
                >
                  Limpar pesquisa
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredMusic.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredMusic.map((music) => (
                <MusicCard
                  key={music.id}
                  music={music}
                  onPlay={handlePlayMusic}
                  isCurrentMusicPlaying={isCurrentMusicPlaying}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <PlayerBar />
    </div>
  );
}