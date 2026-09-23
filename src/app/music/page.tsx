'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import {
  Play,
  Search,
  Home,
  Flame,
  Library,
  User,
  Plus,
  Headphones,
  Video as VideoIcon,
  Music as MusicIcon,
  Pause,
  Loader2,
  X,
  Clock,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { resolveCoverUrl } from '@/lib/media';

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

// ---------- Sidebar (mesma do resto da app) ----------

const Sidebar = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { user } = useAuth();

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
                item.href === '/music' ? 'bg-white/10 text-white' : ''
              } ${collapsed ? 'justify-center' : ''}`}
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

// ---------- Card de Música (com botão de play) ----------

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

        {/* Overlay escuro quando é a música atual */}
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
            onPlay(music);
          }}
          className={`absolute bottom-2 right-2 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:bg-purple-500 transition-all ${
            isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {isPlaying ? (
            <Pause size={18} className="text-white" />
          ) : (
            <Play size={18} className="text-white ml-0.5" />
          )}
        </button>

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
    </div>
  );
};

// ---------- Página Principal ----------

export default function MusicPage() {
  const { user } = useAuth();
  const { play, isPlaying, currentMusic, queue = [] } = usePlayer();
  const [sidebarCollapsed] = useState(false);

  const [allMusic, setAllMusic] = useState<MusicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Carregar todas as músicas
  useEffect(() => {
    const loadMusic = async () => {
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
    };
    loadMusic();
  }, []);

  // Filtro local por texto (título, artista e álbum)
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

  const isCurrentMusicPlaying = (music: MusicItem) =>
    currentMusic?.id === music.id && isPlaying;

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
          {/* Cabeçalho da página */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <MusicIcon size={28} className="text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Músicas</h1>
            </div>
            <p className="text-purple-200 text-sm">
              Todas as músicas disponíveis na Podfe Play
            </p>
          </div>

          {/* Barra de busca */}
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
                  aria-label="Limpar"
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

          {/* Estado: a carregar */}
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 size={40} className="text-purple-500 animate-spin" />
            </div>
          )}

          {/* Estado: erro */}
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

          {/* Estado: sem músicas */}
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

          {/* Grid de músicas */}
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

      {/* Player Bar Global */}
      <PlayerBar />

      <style jsx global>{`
        @keyframes wave-1 {
          0%, 100% { height: 8px; }
          50% { height: 20px; }
        }
        @keyframes wave-2 {
          0%, 100% { height: 16px; }
          50% { height: 8px; }
        }
        @keyframes wave-3 {
          0%, 100% { height: 12px; }
          50% { height: 24px; }
        }
        .animate-pulse:nth-child(1) {
          animation: wave-1 0.8s ease-in-out infinite;
        }
        .animate-pulse:nth-child(2) {
          animation: wave-2 0.8s ease-in-out infinite;
        }
        .animate-pulse:nth-child(3) {
          animation: wave-3 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}