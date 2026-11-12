// src/lib/musicApi.ts
import { getApiUrl, getAuthHeaders } from '@/config/api';

export interface RecordPlayPayload {
  duration_listened: number;
  position_seconds?: number;
  total_duration?: number;
  device_type?: string;
  session_id?: string;
}

export interface RecordPlayResponse {
  plays: number;
  counted: boolean;
  reason: string;
}

export const musicApi = {
  /**
   * POST /api/v1/music/:id/play
   * Autenticação opcional — se houver token, grava user_id.
   */
  recordPlay: async (musicId: number, payload: RecordPlayPayload): Promise<RecordPlayResponse> => {
    const res = await fetch(getApiUrl(`/api/v1/music/${musicId}/play`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    if (!res.ok || !body?.success) {
      throw new Error(body?.message || `Erro ${res.status}`);
    }
    return body.data as RecordPlayResponse;
  },

  /** GET /api/v1/music/:id/plays */
  getPlays: async (musicId: number): Promise<number> => {
    const res = await fetch(getApiUrl(`/api/v1/music/${musicId}/plays`), {
      headers: getAuthHeaders(),
    });
    const body = await res.json();
    if (!res.ok || !body?.success) return 0;
    return body.data.plays ?? 0;
  },
};