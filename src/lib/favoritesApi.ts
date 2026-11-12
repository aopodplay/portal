// src/lib/favoritesApi.ts
import { getApiUrl, getAuthHeaders } from '@/config/api';

// TIPOS
export type ContentType = 'content' | 'music' | 'video';

export interface FavoriteToggleResponse {
  favorited: boolean;
  content_id: number;
}

export interface CheckFavoriteResponse {
  isFavorited: boolean;
  content_id: number | null;
}

export interface DownloadInfo {
  downloadUrl?: string;
  token?: string;
  fileName?: string;
  fileSize?: number;
  [key: string]: any;
}

// HELPER
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

// FAVORITOS
export const favoritesApi = {
  toggleFavorite: (contentId: number, contentType: ContentType = 'content') =>
    jsonFetch<FavoriteToggleResponse>(
      `${getApiUrl(`/api/v1/favorites/${contentId}/toggle`)}`,
      {
        method: 'POST',
        body: JSON.stringify({ contentType }),
      }
    ),

  checkFavorite: (contentId: number, contentType: ContentType = 'content') =>
    jsonFetch<CheckFavoriteResponse>(
      `${getApiUrl(`/api/v1/favorites/${contentId}/check`)}?contentType=${contentType}`
    ),

  list: (page = 1, limit = 20) =>
    jsonFetch(`${getApiUrl('/api/v1/favorites')}?page=${page}&limit=${limit}`),
};

// DOWNLOADS
export const downloadsApi = {
  /**
   * GET /api/v1/downloads/content/:id?quality=high&contentType=music
   * Devolve o ficheiro como blob e dispara o "save as" no browser.
   */
  download: async (
    contentId: number,
    contentType: ContentType = 'content',
    quality: 'high' | 'medium' | 'low' = 'high'
  ): Promise<{ blob: Blob; fileName: string }> => {
    const url = `${getApiUrl(`/api/v1/downloads/content/${contentId}`)}?quality=${quality}&contentType=${contentType}`;

    const res = await fetch(url, {
      method: 'GET',                  
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      let msg = `Erro ${res.status}`;
      try {
        const j = await res.json();
        msg = j?.message || msg;
      } catch { /* resposta não-JSON */ }
      throw new Error(msg);
    }

    const disposition = res.headers.get('Content-Disposition') || '';
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const fileName = match ? decodeURIComponent(match[1]) : `download-${contentId}`;

    const blob = await res.blob();
    return { blob, fileName };
  },

  /** GET /api/v1/downloads/info/:id?contentType=music */
  getInfo: (contentId: number, contentType: ContentType = 'content') =>
    jsonFetch<DownloadInfo>(
      `${getApiUrl(`/api/v1/downloads/info/${contentId}`)}?contentType=${contentType}`
    ),

  /** GET /api/v1/downloads/my?page=1&limit=20 */
  list: (page = 1, limit = 20) =>
    jsonFetch(`${getApiUrl('/api/v1/downloads/my')}?page=${page}&limit=${limit}`),
};