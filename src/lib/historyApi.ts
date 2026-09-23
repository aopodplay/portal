// lib/historyApi.ts
import { getApiUrl, getAuthHeaders } from '@/config/api';

// ============================================================
// TIPOS — alinhados com o shape REAL do backend
// ============================================================

export interface HistoryItem {
  id: number;
  user_id: number;
  content_id: number;
  title: string;
  type: string;                 // "VIDEO" | "AUDIO" | "PODCAST" | "SERMON" | ...
  cover_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  duration: number | null;
  total_duration: number;
  progress: number;             // 0–100
  progress_percentage: string;  // "0.00"
  last_position: number;        // segundos
  completed: number;            // 0 ou 1
  play_count: number;
  device_type: string;
  ip_address: string;
  is_favorited: number;
  last_played_at: string;
  created_at: string;
  updated_at: string;
  // do JOIN com users:
  full_name: string | null;
  username: string;
  avatar_url: string | null;
}

export interface HistoryResponse {
  items: HistoryItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ResumePoint {
  resumePosition: number;
  totalDuration: number;
  remainingTime: number;
}

export interface HistoryStats {
  totalPlays: number;
  totalDuration: number;
  uniqueContents: number;
  mostPlayedContent?: any;
  dailyStats?: any[];
  byDeviceType?: Record<string, number>;
}

// ============================================================
// HELPER INTERNO
// ============================================================

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

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}

// ============================================================
// API
// ============================================================

export const historyApi = {
  /** POST /api/v1/history/record
   *
   *  `contentType` diz ao backend em que tabela procurar o conteúdo:
   *  - 'content' → tabela `contents` (default; compatível com o legado)
   *  - 'music'   → tabela `music`
   *  - 'video'   → tabela `videos`
   *
   *  Se for 'music' ou 'video', o backend cria (ou reutiliza) um
   *  espelho na tabela `contents` para satisfazer a FK de `history_temp`.
   */
  recordPlayback: (payload: {
    contentId: number;
    contentType?: 'content' | 'music' | 'video';   // 🔥 NOVO
    progress: number;       // 0–100
    duration?: number;
    completed?: boolean;
    deviceType?: 'mobile' | 'desktop' | 'tablet' | 'tv';
    sessionId?: string;
  }) =>
    jsonFetch(`${getApiUrl('/api/v1/history/record')}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** GET /api/v1/history
   *  Backend devolve: { success, message, data: { history: [...], pagination: {...} } }
   *  Normalizamos para: { items: [...], pagination: {...} }
   */
  getHistory: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    completed?: boolean;
  }): Promise<HistoryResponse> => {
    const qs = buildQuery({
      page: params?.page,
      limit: params?.limit,
      type: params?.type,
      completed: params?.completed,
    });

    const res = await fetch(`${getApiUrl('/api/v1/history')}${qs}`, {
      headers: getAuthHeaders(),
    });
    const body = await res.json();

    if (!res.ok || !body?.success) {
      throw new Error(body?.message || `Erro ${res.status}`);
    }

    const items: HistoryItem[] = Array.isArray(body.data?.history)
      ? body.data.history
      : Array.isArray(body.data)
        ? body.data
        : [];

    const pagination = body.data?.pagination ?? {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      total: items.length,
      totalPages: items.length > 0 ? 1 : 0,
    };

    return { items, pagination };
  },

  /** GET /api/v1/history/content/:id/resume */
  getResumePoint: (contentId: number | string) =>
    jsonFetch<ResumePoint | null>(
      `${getApiUrl(`/api/v1/history/content/${contentId}/resume`)}`
    ),

  /** GET /api/v1/history/content/:id/progress */
  getLastProgress: (contentId: number | string) =>
    jsonFetch<HistoryItem | null>(
      `${getApiUrl(`/api/v1/history/content/${contentId}/progress`)}`
    ),

  /** POST /api/v1/history/content/:id/complete */
  markCompleted: (contentId: number | string) =>
    jsonFetch(`${getApiUrl(`/api/v1/history/content/${contentId}/complete`)}`, {
      method: 'POST',
    }),

  /** DELETE /api/v1/history/content/:id */
  clearContent: (contentId: number | string) =>
    jsonFetch(`${getApiUrl(`/api/v1/history/content/${contentId}`)}`, {
      method: 'DELETE',
    }),

  /** DELETE /api/v1/history/clear-all */
  clearAll: () =>
    jsonFetch(`${getApiUrl('/api/v1/history/clear-all')}`, {
      method: 'DELETE',
    }),

  /** GET /api/v1/history/stats */
  getStats: (period?: 'day' | 'week' | 'month' | 'year' | 'all') => {
    const qs = buildQuery({ period });
    return jsonFetch<HistoryStats>(`${getApiUrl('/api/v1/history/stats')}${qs}`);
  },

  /** POST /api/v1/history/sync */
  syncOffline: (items: any[], deviceId?: string) =>
    jsonFetch(`${getApiUrl('/api/v1/history/sync')}`, {
      method: 'POST',
      body: JSON.stringify({ items, deviceId }),
    }),
};

// Aliases (para componentes antigos que usam outros nomes)
(historyApi as any).markAsCompleted = historyApi.markCompleted;
(historyApi as any).getHistoryStats = historyApi.getStats;
(historyApi as any).syncOfflineHistory = historyApi.syncOffline;