// lib/historyApi.ts
import { fetchWithAuth } from '@/config/api';
import { apiJsonFetch } from '@/lib/errorHandler';

// ============================================================
// TIPOS — alinhados com o shape REAL do backend
// ============================================================

export interface HistoryItem {
  id: number;
  user_id: number;
  content_id: number;
  music_id?: number | null;   
  source?: string | null;        
  source_id?: number | null;   
  title: string;
  type: string;
  cover_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  duration: number | null;
  total_duration: number;
  progress: number;
  progress_percentage: string;
  last_position: number;
  completed: number;
  play_count: number;
  device_type: string;
  ip_address: string;
  is_favorited: number;
  last_played_at: string;
  created_at: string;
  updated_at: string;
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

async function jsonFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  return apiJsonFetch<T>(
    endpoint,
    { cache: 'no-store', ...init },
    { fetcher: fetchWithAuth, useAuthHeaders: false }
  );
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
  recordPlayback: async (payload: {
    contentId: number;
    contentType?: 'content' | 'music' | 'video';   // 🔥 NOVO
    progress: number;       // segundos ou progresso
    lastPosition?: number;
    totalDuration?: number;
    duration?: number;
    completed?: boolean;
    deviceType?: 'mobile' | 'desktop' | 'tablet' | 'tv';
    sessionId?: string;
  }) => {
    const data = await jsonFetch('/api/v1/history/record', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('podplay:history-updated'));
    }
    return data;
  },

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

    const data = await jsonFetch<any>(`/api/v1/history${qs}`);

    const items: HistoryItem[] = Array.isArray(data?.history)
      ? data.history
      : Array.isArray(data)
        ? data
        : [];

    const pagination = data?.pagination ?? {
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
      `/api/v1/history/content/${contentId}/resume`
    ),

  /** GET /api/v1/history/content/:id/progress */
  getLastProgress: (contentId: number | string) =>
    jsonFetch<HistoryItem | null>(
      `/api/v1/history/content/${contentId}/progress`
    ),

  /** POST /api/v1/history/content/:id/complete */
  markCompleted: (contentId: number | string) =>
    jsonFetch(`/api/v1/history/content/${contentId}/complete`, {
      method: 'POST',
    }),

  /** DELETE /api/v1/history/content/:id */
  clearContent: async (contentId: number | string) => {
    const data = await jsonFetch(`/api/v1/history/content/${contentId}`, {
      method: 'DELETE',
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('podplay:history-updated'));
    }
    return data;
  },

  /** DELETE /api/v1/history/clear-all */
  clearAll: async () => {
    const data = await jsonFetch('/api/v1/history/clear-all', {
      method: 'DELETE',
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('podplay:history-updated'));
    }
    return data;
  },

  /** GET /api/v1/history/stats */
  getStats: (period?: 'day' | 'week' | 'month' | 'year' | 'all') => {
    const qs = buildQuery({ period });
    return jsonFetch<HistoryStats>(`/api/v1/history/stats${qs}`);
  },

  /** POST /api/v1/history/sync */
  syncOffline: (items: any[], deviceId?: string) =>
    jsonFetch('/api/v1/history/sync', {
      method: 'POST',
      body: JSON.stringify({ items, deviceId }),
    }),
};

// Aliases (para componentes antigos que usam outros nomes)
(historyApi as any).markAsCompleted = historyApi.markCompleted;
(historyApi as any).getHistoryStats = historyApi.getStats;
(historyApi as any).syncOfflineHistory = historyApi.syncOffline;