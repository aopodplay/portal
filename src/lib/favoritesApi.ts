// src/lib/favoritesApi.ts
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { apiJsonFetch, parseApiError } from '@/lib/errorHandler';

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
  return apiJsonFetch<T>(url, init);
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
      let body: any = null;
      try {
        body = await res.json();
      } catch { /* resposta não-JSON */ }
      throw new Error(parseApiError(res, body, 'Não foi possível descarregar o ficheiro.'));
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