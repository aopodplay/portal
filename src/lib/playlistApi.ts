// src/lib/playlistApi.ts
import { getApiUrl, getAuthHeaders } from '@/config/api';
import type { MusicTrack } from './catalogApi';

export interface Playlist {
  id: number;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_public: number;
  type: string;
  user_id: number;
  tracks_count?: number;
  created_at: string;
  updated_at: string;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    throw new Error(`Erro ${res.status} (resposta não-JSON)`);
  }

  if (!res.ok || !body?.success) {
    throw new Error(body?.message || `Erro ${res.status}`);
  }

  return body.data as T;
}

export const playlistApi = {
  /** GET /api/v1/playlists → { playlists: [...], pagination }
   *  Normaliza para array simples.
   */
  list: async (): Promise<Playlist[]> => {
    const data = await jsonFetch<any>(`${getApiUrl('/api/v1/playlists')}`);

    // O backend pode devolver:
    //   { playlists: [...], pagination }
    //   [...] (legado)
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.playlists)) return data.playlists;
    return [];
  },

  get: (id: number | string) =>
    jsonFetch<Playlist>(`${getApiUrl(`/api/v1/playlists/${id}`)}`),

  /**
   * GET /api/v1/playlists/:id/music
   * Se a rota não existir (backend antigo), cai para GET /:id e usa `.tracks`.
   */
  getMusic: async (id: number | string): Promise<MusicTrack[]> => {
    try {
      const data = await jsonFetch<any>(`${getApiUrl(`/api/v1/playlists/${id}/music`)}`);
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.tracks)) return data.tracks;
      return [];
    } catch {
      // Fallback: usa GET /:id e a propriedade `tracks`
      const playlist = await jsonFetch<any>(`${getApiUrl(`/api/v1/playlists/${id}`)}`);
      if (Array.isArray(playlist?.tracks)) return playlist.tracks;
      return [];
    }
  },

  create: (input: { title: string; description?: string; is_public?: boolean }) =>
    jsonFetch<Playlist>(`${getApiUrl('/api/v1/playlists')}`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  update: (
    id: number | string,
    input: { title?: string; description?: string; is_public?: boolean }
  ) =>
    jsonFetch<Playlist>(`${getApiUrl(`/api/v1/playlists/${id}`)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  remove: (id: number | string) =>
    jsonFetch(`${getApiUrl(`/api/v1/playlists/${id}`)}`, { method: 'DELETE' }),

  addMusic: (id: number | string, musicId: number) =>
    jsonFetch<{ added: boolean; itemId: number }>(
      `${getApiUrl(`/api/v1/playlists/${id}/music`)}`,
      { method: 'POST', body: JSON.stringify({ musicId }) }
    ),

  removeMusic: (id: number | string, musicId: number) =>
    jsonFetch(`${getApiUrl(`/api/v1/playlists/${id}/music/${musicId}`)}`, {
      method: 'DELETE',
    }),

  reorder: (id: number | string, musicIds: number[]) =>
    jsonFetch(`${getApiUrl(`/api/v1/playlists/${id}/reorder`)}`, {
      method: 'PATCH',
      body: JSON.stringify({ musicIds }),
    }),
};