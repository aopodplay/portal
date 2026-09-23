// app/search/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import {
  Search,
  X,
  Filter,
  Grid3x3,
  List,
  Music,
  Headphones,
  Play,
  Pause,
  Heart,
  Eye,
  ThumbsUp,
  Clock,
  Home,
  Flame,
  Library,
  User,
  Plus,
  Menu,
  Loader2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

// Interface para resultado de busca
interface SearchResult {
  id: number;
  title: string;
  description?: string;
  type: string;
  cover_url?: string;
  duration?: number;
  views: number;
  likes: number;
  author_name?: string;
  author_avatar?: string;
  church_name?: string;
  published_at?: string;
}

// Componente de Card de Conteúdo
const ContentCard = ({
  item,
  isPlaying = false,
  onPlay,
}: {
  item: SearchResult;
  isPlaying?: boolean;
  onPlay?: () => void;
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
            {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
          </span>
        )}
        <span className="absolute top-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
          {item.type === 'audio' ? 'Música' : item.type === 'video' ? 'Vídeo' : item.type === 'podcast' ? 'Podcast' : 'Pregação'}
        </span>
      </div>
      <h4 className="font-medium text-white text-sm truncate">{item.title}</h4>
      <p className="text-gray-400 text-xs truncate">{item.author_name || 'Artista'}</p>
      <div className="flex items-center gap-3 mt-1">
        <div className="flex items-center gap-1">
          <Eye size={10} className="text-gray-500" />
          <span className="text-gray-500 text-xs">{item.views?.toLocaleString() || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThumbsUp size={10} className="text-gray-500" />
          <span className="text-gray-500 text-xs">{item.likes?.toLocaleString() || 0}</span>
        </div>
      </div>
    </div>
  );
};

// Componente de Resultado em Lista
const ListResultItem = ({
  item,
  isPlaying = false,
  onPlay,
}: {
  item: SearchResult;
  isPlaying?: boolean;
  onPlay?: () => void;
}) => {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex-shrink-0 overflow-hidden">
        {item.cover_url ? (
          <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={24} className="text-purple-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-400">
            {item.type === 'audio' ? 'Música' : item.type === 'video' ? 'Vídeo' : item.type === 'podcast' ? 'Podcast' : 'Pregação'}
          </span>
          {item.duration && (
            <>
              <span className="text-gray-600 text-xs">•</span>
              <span className="text-gray-500 text-xs">
                {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
              </span>
            </>
          )}
        </div>
        <h4 className="font-medium text-white text-sm truncate">{item.title}</h4>
        <p className="text-gray-400 text-xs truncate">{item.author_name || 'Artista'}</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <Eye size={10} className="text-gray-500" />
            <span className="text-gray-500 text-xs">{item.views?.toLocaleString() || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp size={10} className="text-gray-500" />
            <span className="text-gray-500 text-xs">{item.likes?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>
      <button
        onClick={onPlay}
        className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-purple-500"
      >
        {isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
      </button>
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
          {!collapsed && <h1 className="text-xl font-bold text-white">Podfá Play</h1>}
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

// Componente de Sugestão de Busca
const SearchSuggestion = ({ suggestion, onClick }: { suggestion: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
  >
    <Search size={14} className="text-gray-500" />
    <span className="text-sm">{suggestion}</span>
  </button>
);

export default function SearchPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Estados
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    type: '',
    sort: 'relevance',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Carregar buscas populares
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const response = await fetch(getApiUrl('/api/v1/search/trending?limit=8'), {
          headers: getAuthHeaders(),
        });
        const result = await response.json();
        if (result.success) {
          setTrendingSearches(result.data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar buscas populares:', err);
        setTrendingSearches(['gospel', 'louvor', 'adoração', 'sermão', 'podcast']);
      }
    };
    loadTrending();
  }, []);

  // Buscar sugestões
  const loadSuggestions = useCallback(async () => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/v1/search/suggestions?q=${encodeURIComponent(query)}&limit=5`), {
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      if (result.success) {
        setSuggestions(result.data || []);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Erro ao carregar sugestões:', err);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        loadSuggestions();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, loadSuggestions]);

  // Buscar resultados
  const performSearch = useCallback(async (page: number = 1) => {
    if (!query.trim() && query.length === 0) return;

    setLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      let url = `/api/v1/search?q=${encodeURIComponent(query)}&page=${page}&limit=20`;
      if (filters.type) url += `&type=${filters.type}`;
      if (filters.sort) url += `&sort=${filters.sort}`;

      const response = await fetch(getApiUrl(url), {
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      if (result.success) {
        setResults(result.data.results || []);
        setPagination({
          page: result.data.pagination.page,
          total: result.data.pagination.total,
          totalPages: result.data.pagination.totalPages,
          hasNext: result.data.pagination.hasNext,
          hasPrev: result.data.pagination.hasPrev,
        });
      } else {
        setError(result.message || 'Erro ao buscar resultados');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  // Executar busca quando query ou filters mudarem
  useEffect(() => {
    if (query.length >= 2) {
      performSearch(1);
    } else if (query.length === 0) {
      setResults([]);
    }
  }, [query, filters.type, filters.sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(1);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    performSearch(1);
  };

  const handleTrendingClick = (term: string) => {
    setQuery(term);
    performSearch(1);
  };

  const handlePlay = (title: string) => {
    setCurrentlyPlaying(currentlyPlaying === title ? null : title);
  };

  const typeOptions = [
    { value: '', label: 'Todos' },
    { value: 'audio', label: 'Músicas' },
    { value: 'video', label: 'Vídeos' },
    { value: 'podcast', label: 'Podcasts' },
    { value: 'sermon', label: 'Pregações' },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevância' },
    { value: 'date', label: 'Mais recentes' },
    { value: 'views', label: 'Mais vistos' },
    { value: 'likes', label: 'Mais curtidos' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodfSidebar collapsed={sidebarCollapsed} />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} min-h-screen`}>
        <Header />

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Botão mobile */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-purple-600 rounded-full shadow-lg"
          >
            <Menu size={20} className="text-white" />
          </button>

          {/* Barra de Busca */}
          <div className="mb-8">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="O que você quer ouvir hoje?"
                className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </form>

            {/* Sugestões */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-w-6xl bg-gray-900 rounded-xl border border-white/10 shadow-lg overflow-hidden">
                {suggestions.map((suggestion) => (
                  <SearchSuggestion key={suggestion} suggestion={suggestion} onClick={() => handleSuggestionClick(suggestion)} />
                ))}
              </div>
            )}
          </div>

          {/* Buscas Populares */}
          {!query && trendingSearches.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Buscas populares</h3>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleTrendingClick(term)}
                    className="px-3 py-1.5 bg-white/10 rounded-full text-gray-300 text-sm hover:bg-white/20 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtros e resultados */}
          {query && (
            <>
              {/* Barra de Filtros */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilters({ ...filters, type: opt.value })}
                      className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                        filters.type === opt.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                    className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-purple-600' : 'text-gray-400'}`}
                    >
                      <Grid3x3 size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-purple-600' : 'text-gray-400'}`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Resultados */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={40} className="text-purple-500 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
                  <p className="text-gray-400">{error}</p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-400">Nenhum resultado encontrado para "{query}"</p>
                  <p className="text-gray-500 text-sm mt-2">Tente usar palavras-chave diferentes</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-4">
                    {pagination.total} resultados para "{query}"
                  </p>

                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {results.map((item) => (
                        <ContentCard
                          key={item.id}
                          item={item}
                          isPlaying={currentlyPlaying === item.title}
                          onPlay={() => handlePlay(item.title)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {results.map((item) => (
                        <ListResultItem
                          key={item.id}
                          item={item}
                          isPlaying={currentlyPlaying === item.title}
                          onPlay={() => handlePlay(item.title)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Paginação */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      <button
                        onClick={() => performSearch(pagination.page - 1)}
                        disabled={!pagination.hasPrev}
                        className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <span className="px-4 py-2 text-gray-400 text-sm">
                        Página {pagination.page} de {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => performSearch(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                        className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm disabled:opacity-50"
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </>
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
                <p className="text-white text-sm font-medium">{currentlyPlaying}</p>
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