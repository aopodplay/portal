// src/lib/adminApi.ts
import { getApiUrl, getAuthHeaders } from '@/config/api';

export interface StatsTotals {
  total_music: number;
  total_artists: number;
  total_albums: number;
  total_plays: number;
  total_play_events: number;
  unique_listeners: number;
}

export interface TopMusic {
  id: number;
  title: string;
  artist: string;
  artist_id: number | null;
  album: string | null;
  album_id: number | null;
  cover_image: string | null;
  plays: number;
}

export interface TopArtist {
  id: number;
  name: string;
  image_url: string | null;
  tracks_count: number;
  total_plays: number;
}

export interface TopAlbum {
  id: number;
  title: string;
  cover_url: string | null;
  artist_id: number | null;
  artist_name: string | null;
  tracks_count: number;
  total_plays: number;
}

export interface DayPlays {
  day: string;
  total: number;
}

export interface OverviewResponse {
  totals: StatsTotals;
  topMusic: TopMusic[];
  topArtists: TopArtist[];
  topAlbums: TopAlbum[];
}

export interface PlaysByPeriodResponse {
  from: string;
  to: string;
  days: DayPlays[];
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

export const adminApi = {
  getOverview: () =>
    jsonFetch<OverviewResponse>(`${getApiUrl('/api/v1/admin/stats/overview')}`),

  getPlaysByPeriod: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const q = qs.toString();
    return jsonFetch<PlaysByPeriodResponse>(
      `${getApiUrl('/api/v1/admin/stats/plays-by-period')}${q ? `?${q}` : ''}`
    );
  },
};