// lib/cards.ts
import { getApiUrl, getAuthHeaders } from '@/config/api';

export type CardType =
  | 'AUDIO'
  | 'VIDEO'
  | 'PODCAST'
  | 'SERMON'
  | 'WORSHIP'
  | 'TESTIMONY'
  | 'BIBLE_CHAPTER';

export type CardSortBy = 'recent' | 'popular' | 'trending' | 'alphabetical';

export interface Card {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  type: CardType;
  image_url?: string;
  duration?: number;
  views: number;
  likes: number;
  author_name?: string;
  author_avatar?: string;
  created_at: string;
  play_count?: number;
  is_featured?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CardsResponse {
  success: boolean;
  message?: string;
  data: {
    cards: Card[];
    pagination: Pagination;
  };
}

export interface SimpleCardsResponse {
  success: boolean;
  message?: string;
  data: Card[];
}

export interface CardFilters {
  type?: CardType;
  category?: string;
  sortBy?: CardSortBy;
  page?: number;
  limit?: number;
  search?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order?: number;
  is_active?: boolean;
  content_count?: number;
}

export interface CategoryContentsResponse {
  success: boolean;
  data: {
    category: Category;
    subcategories: { subcategory: string; count: number }[];
    contents: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    featured: any[];
    popular: any[];
    recent: any[];
  };
}

// Helper para construir query string
function buildQuery(filters: CardFilters = {}): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ====== Funções de API ======

export async function getAllCards(filters: CardFilters = {}) {
  const res = await fetch(getApiUrl(`/api/v1/cards${buildQuery(filters)}`), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao carregar cards');
  return (await res.json()) as CardsResponse;
}

export async function getMusicCards(filters: CardFilters = {}) {
  const res = await fetch(getApiUrl(`/api/v1/cards/music${buildQuery(filters)}`), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao carregar músicas');
  return (await res.json()) as CardsResponse;
}

export async function getPodcastCards(filters: CardFilters = {}) {
  const res = await fetch(getApiUrl(`/api/v1/cards/podcast${buildQuery(filters)}`), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao carregar podcasts');
  return (await res.json()) as CardsResponse;
}

export async function getBibleCards(filters: CardFilters = {}) {
  const res = await fetch(getApiUrl(`/api/v1/cards/bible${buildQuery(filters)}`), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao carregar capítulos bíblicos');
  return (await res.json()) as CardsResponse;
}

export async function getFeaturedCards(limit = 6) {
  const res = await fetch(
    getApiUrl(`/api/v1/cards/featured?limit=${limit}`),
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error('Erro ao carregar destaques');
  return (await res.json()) as SimpleCardsResponse;
}

export async function getRecentCards(limit = 10) {
  const res = await fetch(
    getApiUrl(`/api/v1/cards/recent?limit=${limit}`),
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error('Erro ao carregar recentes');
  return (await res.json()) as SimpleCardsResponse;
}

export async function getPopularCards(limit = 10) {
  const res = await fetch(
    getApiUrl(`/api/v1/cards/popular?limit=${limit}`),
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error('Erro ao carregar populares');
  return (await res.json()) as SimpleCardsResponse;
}

export async function getCategories() {
  const res = await fetch(getApiUrl('/api/v1/categories'), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao carregar categorias');
  const json = await res.json();
  return (json.data || []) as Category[];
}

export async function getContentsByCategory(
  slug: string,
  filters: { page?: number; limit?: number; sortBy?: string; search?: string } = {}
) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
  });
  const qs = params.toString();

  const res = await fetch(
    getApiUrl(`/api/v1/categories/${slug}${qs ? `?${qs}` : ''}`),
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error('Erro ao carregar conteúdos da categoria');
  return (await res.json()) as CategoryContentsResponse;
}
