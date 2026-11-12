// src/lib/metricsApi.ts
import { getApiUrl, getAuthHeaders } from '@/config/api';
import type { ContentType } from './favoritesApi';

export interface ContentMetrics {
  views: number;
  likes: number;
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