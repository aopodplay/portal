// app/trending/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import {
  Play,
  Music,
  Flame,
  Pause,
  TrendingUp,
  Eye,
  ThumbsUp,
  Loader2,
  AlertCircle,
  Calendar,
  Star,
  Sun,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

// =====================================================================
// TIPOS
// =====================================================================

interface TrendingItem {
  id: number;
  contentId: number;
  music_id?: number;
  source_id?: number;
  title: string;
  type: string;
  cover_url?: string;
  views: number;
  likes: number;
  position: number;
  reason?: string;
  score?: number;
  author?: string;
  duration?: number;
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

function toPlayerMusic(item: TrendingItem) {
  const id = item.music_id ?? item.source_id ?? item.contentId ?? item.id;
  return {
    id,
    title: item.title,
    artist: item.author || 'Artista',
    album: null,
    duration: item.duration || 0,
    file_path: '',
    file_size: 0,
    cover_image: item.cover_url || null,
    created_at: new Date().toISOString(),
  };
}

// =====================================================================
// CONTENT CARD
// =====================================================================

const ContentCard = ({
  item,
  isPlaying = false,
  onPlay,
  rank,
}: {
  item: TrendingItem;
  isPlaying?: boolean;
  onPlay?: () => void;
  rank?: number;
}) => {
  return (
    <div className="group cursor-pointer">
      <div className="relative rounded-lg overflow-hidden aspect-square mb-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
        {item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={48} className="text-purple-400/50" />
          </div>
        )}
        {rank && rank <= 3 && (
          <div className="absolute top-2 left-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                rank === 1
                  ? 'bg-yellow-500'
                  : rank === 2
                  ? 'bg-gray-400'
                  : 'bg-orange-500'
              }`}
            >
              #{rank}
            </div>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay?.();
          }}
          className="absolute bottom-2 right-2 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg hover:scale-110 hover:bg-purple-500"
        >
          {isPlaying ? (
            <Pause size={18} className="text-white" />
          ) : (
            <Play size={18} className="text-white ml-0.5" />
          )}
        </button>
        {item.duration && (
          <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
            {Math.floor(item.duration / 60)}:
            {(item.duration % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>
      <h4 className="font-medium text-white text-sm truncate">{item.title}</h4>
      <p className="text-gray-400 text-xs truncate">
        {item.author || 'Artista'}
      </p>
      <div className="flex items-center gap-3 mt-1">
        <div className="flex items-center gap-1">
          <Eye size={10} className="text-gray-500" />
          <span className="text-gray-500 text-xs">
            {item.views?.toLocaleString() || 0}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ThumbsUp size={10} className="text-gray-500" />
          <span className="text-gray-500 text-xs">
            {item.likes?.toLocaleString() || 0}
          </span>
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
      className="relative rounded-xl overflow-hidden cursor-pointer group"
    >
      <div className="aspect-video bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.title || category.category}
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white text-sm font-medium">
          {category.subtitle || `${category.content_count || 0} conteúdos`}
        </p>
        <button className="mt-2 px-4 py-1.5 bg-purple-600 rounded-full text-white text-xs hover:bg-purple-500 transition-colors">
          Explorar
        </button>
      </div>
    </div>
  );
};

// =====================================================================
// PÁGINA
// =====================================================================

export default function TrendingPage() {
  const { user } = useAuth();
  const { play, isPlaying, currentMusic } = usePlayer();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [categories, setCategories] = useState<TrendingCategory[]>([]);
  const [source, setSource] = useState<string>('');

  // ---------- Carregar ----------
  useEffect(() => {
    loadTrending();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadTrending = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${getApiUrl('/api/v1/trending')}?limit=20&period=${period}`,
        { headers: getAuthHeaders() }
      );
      const result = await response.json();

      if (result.success) {
        setTrendingItems(result.data.items || []);
        setSource(result.data.source || 'automated');
      } else {
        setError(result.message || 'Erro ao carregar conteúdos em alta');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(getApiUrl('/api/v1/trending/categories'), {
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      if (result.success) {
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
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  // ---------- Play REAL ----------
  const handlePlayItem = (item: TrendingItem) => {
    const queue = trendingItems.map(toPlayerMusic);
    play(toPlayerMusic(item), true, queue);
  };

  const isCurrentPlaying = (item: TrendingItem) => {
    const id = item.music_id ?? item.source_id ?? item.contentId ?? item.id;
    return currentMusic?.id === id && isPlaying;
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

      <main className="ml-64 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Flame size={28} className="text-orange-500" />
                <h1 className="text-2xl font-bold text-white">Em Alta</h1>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Os conteúdos mais populares do momento
              </p>
            </div>

            <div className="flex gap-2 mt-4 md:mt-0">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    period === p.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                ✕
              </button>
            </div>
          )}

          {source && (
            <div className="mb-4 flex justify-end">
              <span className="text-xs text-gray-500">
                {source === 'curated'
                  ? '🔥 Seleção editorial'
                  : '📊 Baseado em visualizações'}
              </span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={40} className="text-purple-500 animate-spin" />
            </div>
          ) : trendingItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flame size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-400">
                Nenhum conteúdo em alta no momento
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
                {trendingItems.map((item, index) => (
                  <ContentCard
                    key={getItemKey(item, index)}
                    item={item}
                    rank={index + 1}
                    isPlaying={isCurrentPlaying(item)}
                    onPlay={() => handlePlayItem(item)}
                  />
                ))}
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

      {/* 🔥 PlayerBar GLOBAL — substitui a barra local */}
      <PlayerBar />
    </div>
  );
}