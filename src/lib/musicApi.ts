// src/lib/musicApi.ts
import { getApiUrl } from '@/config/api';
import { apiJsonFetch } from '@/lib/errorHandler';

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
    return apiJsonFetch<RecordPlayResponse>(getApiUrl(`/api/v1/music/${musicId}/play`), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** GET /api/v1/music/:id/plays */
  getPlays: async (musicId: number): Promise<number> => {
    try {
      const data = await apiJsonFetch<{ plays?: number }>(
        getApiUrl(`/api/v1/music/${musicId}/plays`)
      );
      return data?.plays ?? 0;
    } catch {
      return 0;
    }
  },
};