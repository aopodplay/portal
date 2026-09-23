// app/trending/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import {
  Play,
  Heart,
  Headphones,
  Music,
  Search,
  Home,
  Flame,
  Library,
  User,
  Plus,
  Pause,
  TrendingUp,
  Clock,
  Eye,
  ThumbsUp,
  Menu,
  Loader2,
  AlertCircle,
  Calendar,
  Star,
  Sun,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

// Interface para item em alta
interface TrendingItem {
  id: number;
  contentId: number;
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

// Interface para categoria em alta
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

// Helper para gerar key estável para categorias
const getCategoryKey = (category: TrendingCategory, index: number) =>
  String(
    category.id ??
      category.category_id ??
      `${category.category}-${category.position ?? index}`
  );

// Helper para gerar key estável para itens em alta
const getItemKey = (item: TrendingItem, index: number) =>
  String(item.id ?? item.contentId ?? `trending-${index}`);

// Componente de Card de Conteúdo
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
          onClick={onPlay}
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

// Componente de Categoria em Alta
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

// Sidebar Component
const PodfSidebar = ({ collapsed = false }: { collapsed?: boolean }) => {
  const menuItems = [
    { icon: Home, label: 'Inicio', href: '/' },
    { icon: Search, label: 'Pesquisa', href: '/search' },
    { icon: Flame, label: 'Em Alta', href: '/trending' },
    { icon: Library, label: 'Biblioteca', href: '/library' },
    { icon: User, label: 'Perfil', href: '/profile' },
  ];

  const playlists = [
    'As Minhas Favoritas',
    'Oração da Manhã',
    'Louvores com a Família',
    'Pregações – Pr. Carlos',
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
          {!collapsed && (
            <h1 className="text-xl font-bold text-white">Podfá Play</h1>
          )}
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

export default function TrendingPage() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [categories, setCategories] = useState<TrendingCategory[]>([]);
  const [source, setSource] = useState<string>('');

  // Carregar dados
  useEffect(() => {
    loadTrending();
    loadCategories();
  }, [period]);

  const loadTrending = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${getApiUrl('/api/v1/trending')}?limit=20&period=${period}`,
        {
          headers: getAuthHeaders(),
        }
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

        // Deduplica por id OU por categoria (evita keys duplicadas)
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

  const handlePlay = (title: string) => {
    setCurrentlyPlaying(currentlyPlaying === title ? null : title);
  };

  const handleCategoryClick = (category: TrendingCategory) => {
    // Navegar para página de busca com filtro de categoria
    window.location.href = `/search?category=${encodeURIComponent(
      category.category
    )}`;
  };

  const periods = [
    { value: 'day', label: 'Hoje', icon: <Sun size={14} /> },
    { value: 'week', label: 'Esta semana', icon: <Calendar size={14} /> },
    { value: 'month', label: 'Este mês', icon: <TrendingUp size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodfSidebar collapsed={sidebarCollapsed} />

      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        } min-h-screen`}
      >
        <Header />

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Botão mobile */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-purple-600 rounded-full shadow-lg"
          >
            <Menu size={20} className="text-white" />
          </button>

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

            {/* Seletor de período */}
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

          {/* Mensagens */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                ✕
              </button>
            </div>
          )}

          {/* Source badge */}
          {source && (
            <div className="mb-4 flex justify-end">
              <span className="text-xs text-gray-500">
                {source === 'curated'
                  ? '🔥 Seleção editorial'
                  : '📊 Baseado em visualizações'}
              </span>
            </div>
          )}

          {/* Conteúdo */}
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
              {/* Grid de conteúdos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
                {trendingItems.map((item, index) => (
                  <ContentCard
                    key={getItemKey(item, index)}
                    item={item}
                    rank={index + 1}
                    isPlaying={currentlyPlaying === item.title}
                    onPlay={() => handlePlay(item.title)}
                  />
                ))}
              </div>

              {/* Categorias em alta */}
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

      {/* Now Playing Bar */}
      {currentlyPlaying && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 z-40">
          <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Music size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {currentlyPlaying}
                </p>
                <p className="text-gray-400 text-xs">Reproduzindo agora</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentlyPlaying(null)}
              className="px-4 py-1.5 bg-white/10 text-white rounded-full text-sm hover:bg-white/20 transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}