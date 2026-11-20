// src/lib/metricsApi.ts
import { getApiUrl } from '@/config/api';
import { apiJsonFetch } from '@/lib/errorHandler';
import type { ContentType } from './favoritesApi';

export interface ContentMetrics {
  views: number;
  likes: number;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  return apiJsonFetch<T>(url, init);
}

export const metricsApi = {
  /** GET /api/v1/metrics/:contentType/:sourceId */
  getOne: (contentType: ContentType, sourceId: number) =>
    jsonFetch<ContentMetrics>(
      `${getApiUrl(`/api/v1/metrics/${contentType}/${sourceId}`)}`
    ),

  /** POST /api/v1/metrics/:contentType/batch
   *  Devolve um mapa { [sourceId]: { views, likes } }
   */
  getBatch: (contentType: ContentType, ids: number[]) =>
    jsonFetch<Record<string, ContentMetrics>>(
      `${getApiUrl(`/api/v1/metrics/${contentType}/batch`)}`,
      {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }
    ),
};