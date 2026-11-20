// src/lib/catalogApi.ts
import { getApiUrl, getUploadHeaders } from '@/config/api';
import { apiJsonFetch, parseMultipartResponse } from '@/lib/errorHandler';

// ============================================================
// TIPOS
// ============================================================

export interface MusicTrack {
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
  plays: number;
  created_at?: string;
  updated_at?: string;
}

export interface Artist {
  id: number;
  name: string;
  image_url: string | null;
  bio: string | null;
  created_at?: string;
  updated_at?: string;
  tracks_count?: number;
  albums_count?: number;
  total_plays?: number;
  followers_count?: number;
}

export interface Album {
  id: number;
  title: string;
  cover_url: string | null;
  description: string | null;
  release_date: string | null;
  artist_id: number | null;
  artist_name?: string | null;
  artist_image?: string | null;
  tracks_count?: number;
  total_duration?: number;
  total_plays?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FollowToggleResponse {
  following: boolean;
  followers_count: number;
}

export interface FollowCheckResponse {
  following: boolean;
}

export interface ArtistListResponse {
  artists: Artist[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ============================================================
// HELPER
// ============================================================

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  return apiJsonFetch<T>(url, init);
}

// ============================================================
// API
// ============================================================

export const catalogApi = {
  // ---------- ARTISTS ----------
  listArtists: (page = 1, limit = 50) =>
    jsonFetch<ArtistListResponse>(
      `${getApiUrl('/api/v1/artists')}?page=${page}&limit=${limit}`
    ),

  getArtist: (id: number | string) =>
    jsonFetch<Artist>(`${getApiUrl(`/api/v1/artists/${id}`)}`),

  getArtistMusic: (id: number | string) =>
    jsonFetch<MusicTrack[]>(`${getApiUrl(`/api/v1/artists/${id}/music`)}`),

  getArtistAlbums: (id: number | string) =>
    jsonFetch<Album[]>(`${getApiUrl(`/api/v1/artists/${id}/albums`)}`),

  getArtistTop: (id: number | string, limit = 5) =>
    jsonFetch<MusicTrack[]>(
      `${getApiUrl(`/api/v1/artists/${id}/top`)}?limit=${limit}`
    ),

  // ---------- FOLLOW ----------
  toggleFollow: (artistId: number | string) =>
    jsonFetch<FollowToggleResponse>(
      `${getApiUrl(`/api/v1/artists/${artistId}/follow`)}`,
      { method: 'POST' }
    ),

  checkFollowing: (artistId: number | string) =>
    jsonFetch<FollowCheckResponse>(
      `${getApiUrl(`/api/v1/artists/${artistId}/follow`)}`
    ),

  getMyFollowing: (page = 1, limit = 50) =>
    jsonFetch<ArtistListResponse>(
      `${getApiUrl('/api/v1/artists/me/following')}?page=${page}&limit=${limit}`
    ),

  getArtistFollowers: (artistId: number | string, page = 1, limit = 50) =>
    jsonFetch<{
      followers: Array<{
        id: number;
        username: string;
        full_name: string | null;
        avatar_url: string | null;
        followed_at: string;
      }>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(
      `${getApiUrl(`/api/v1/artists/${artistId}/followers`)}?page=${page}&limit=${limit}`
    ),

  // ---------- ADMIN: CRIAR ARTISTA (multipart) ----------
  createArtist: async (payload: {
    name: string;
    bio?: string;
    image?: File | null;
  }): Promise<Artist> => {
    const formData = new FormData();
    formData.append('name', payload.name);
    if (payload.bio !== undefined) formData.append('bio', payload.bio);
    if (payload.image) formData.append('image', payload.image);

    const res = await fetch(getApiUrl('/api/v1/artists'), {
      method: 'POST',
      headers: getUploadHeaders(), // ⚠️ SEM Content-Type (o browser define o boundary)
      body: formData,
    });

    return parseMultipartResponse<Artist>(res, 'Não foi possível criar o artista.');
  },

  // ---------- ADMIN: ATUALIZAR ARTISTA (multipart) ----------
  updateArtist: async (
    id: number | string,
    payload: { name?: string; bio?: string; image?: File | null }
  ): Promise<Artist> => {
    const formData = new FormData();
    if (payload.name !== undefined) formData.append('name', payload.name);
    if (payload.bio !== undefined) formData.append('bio', payload.bio);
    if (payload.image) formData.append('image', payload.image);

    const res = await fetch(getApiUrl(`/api/v1/artists/${id}`), {
      method: 'PUT',
      headers: getUploadHeaders(),
      body: formData,
    });

    return parseMultipartResponse<Artist>(res, 'Não foi possível atualizar o artista.');
  },

  // ---------- ADMIN: APAGAR ARTISTA ----------
  deleteArtist: (id: number | string) =>
    jsonFetch(`${getApiUrl(`/api/v1/artists/${id}`)}`, { method: 'DELETE' }),

  // ---------- ADMIN: UPLOAD DEDICADO DE FOTO ----------
  uploadArtistPhoto: async (
    id: number | string,
    file: File
  ): Promise<Artist> => {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch(getApiUrl(`/api/v1/artists/${id}/photo`), {
      method: 'POST',
      headers: getUploadHeaders(),
      body: formData,
    });

    return parseMultipartResponse<Artist>(res, 'Não foi possível enviar a foto do artista.');
  },

  // ---------- ALBUMS ----------
  listAlbums: (page = 1, limit = 50) =>
    jsonFetch<{
      albums: Album[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`${getApiUrl('/api/v1/albums')}?page=${page}&limit=${limit}`),

  getAlbum: (id: number | string) =>
    jsonFetch<Album>(`${getApiUrl(`/api/v1/albums/${id}`)}`),

  getAlbumMusic: (id: number | string) =>
    jsonFetch<MusicTrack[]>(`${getApiUrl(`/api/v1/albums/${id}/music`)}`),
};

// ============================================================
// HELPERS DE UI
// ============================================================

export function formatPlays(n: number): string {
  if (!n || n < 0) return '0';
  return n.toLocaleString('pt-PT');
}

export function playsLabel(n: number): string {
  return `${formatPlays(n)} ${n === 1 ? 'reprodução' : 'reproduções'}`;
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDurationOrDash(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function followersLabel(n: number): string {
  return `${formatPlays(n)} ${n === 1 ? 'seguidor' : 'seguidores'}`;
}

export function slugifyArtistName(name?: string | null): string {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getArtistHref(
  id?: number | string | null,
  name?: string | null
): string {
  const slug = slugifyArtistName(name);
  if (slug) return `/artists/${slug}`;
  if (id !== undefined && id !== null && String(id).trim() !== '') {
    return `/artists/${id}`;
  }
  return '/artists';
}