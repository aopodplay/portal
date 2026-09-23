'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import {
  Play,
  Search,
  Home,
  Flame,
  Library,
  User,
  Plus,
  ChevronRight,
  Headphones,
  Video as VideoIcon,
  Eye,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { resolveThumbUrl } from '@/lib/media';

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

// ---------- Sidebar (mesma do resto da app) ----------

const Sidebar = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { user } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Inicio', href: '/' },
    { icon: Search, label: 'Pesquisa', href: '/search' },
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
                item.href === '/videos' ? 'bg-white/10 text-white' : ''
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

// ---------- Card de Vídeo (formato 16:9) ----------

const VideoCard = ({
  video,
  onPlay,
}: {
  video: VideoItem;
  onPlay: (video: VideoItem) => void;
}) => {
  const thumbUrl = resolveThumbUrl(video.thumbnail_path);
  const durationLabel =
    video.duration && video.duration > 0
      ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}`
      : null;

  const dateLabel = new Date(video.created_at).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className="group cursor-pointer bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-all"
      onClick={() => onPlay(video)}
    >
      <div className="relative aspect-video bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
        <img
          src={thumbUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/default-video-thumb.svg';
          }}
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Play size={24} className="text-white ml-1" />
          </div>
        </div>
        {durationLabel && (
          <span className="absolute bottom-2 right-2 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock size={10} />
            {durationLabel}
          </span>
        )}
        {video.resolution && (
          <span className="absolute top-2 left-2 text-xs font-semibold bg-purple-600 text-white px-1.5 py-0.5 rounded">
            {video.resolution}
          </span>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-medium text-white text-sm line-clamp-2 mb-1">
          {video.title}
        </h4>
        {video.description && (
          <p className="text-gray-400 text-xs line-clamp-2 mb-2">
            {video.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Eye size={11} />
            {video.views ?? 0} visualizações
          </span>
          <span>{dateLabel}</span>
        </div>
      </div>
    </div>
  );
};

// ---------- Página Principal ----------

export default function VideosPage() {
  const { user } = useAuth();
  const [sidebarCollapsed] = useState(false);
  const [allVideos, setAllVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // Carregar todos os vídeos
  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        setError(null);
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
          setAllVideos(items);
        } else {
          setError(result.message || 'Erro ao carregar vídeos');
        }
      } catch (err) {
        console.error('Erro ao carregar vídeos:', err);
        setError('Erro ao carregar vídeos');
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

  // Filtro local por texto
  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allVideos;
    return allVideos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q))
    );
  }, [allVideos, searchQuery]);

  const handlePlayVideo = (video: VideoItem) => {
    setSelectedVideo(video);
  };

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
              <VideoIcon size={28} className="text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Vídeos</h1>
            </div>
            <p className="text-purple-200 text-sm">
              Todos os vídeos disponíveis na Podfe Play
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
                placeholder="Pesquisar vídeos..."
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
                {filteredVideos.length} vídeo{filteredVideos.length !== 1 ? 's' : ''}
                {searchQuery && ` encontrado${filteredVideos.length !== 1 ? 's' : ''}`}
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

          {/* Estado: sem vídeos */}
          {!loading && !error && filteredVideos.length === 0 && (
            <div className="text-center py-20">
              <VideoIcon size={64} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-1">
                {searchQuery
                  ? 'Nenhum vídeo encontrado para esta pesquisa'
                  : 'Nenhum vídeo disponível no momento'}
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

          {/* Grid de vídeos */}
          {!loading && !error && filteredVideos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredVideos.map((video) => (
                <VideoCard key={video.id} video={video} onPlay={handlePlayVideo} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Player Bar Global */}
      <PlayerBar />

      {/* Modal do Player de Vídeo */}
      <VideoPlayerModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
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