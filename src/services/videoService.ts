// src/services/videoService.ts
import { getApiUrl, getAuthHeaders } from '@/config/api';

export interface VideoItem {
  id: number;
  title: string;
  description: string | null;
  duration: number | null;
  resolution: string | null;
  file_path: string;
  thumbnail_path: string | null;
  file_size: number;
  views: number;
  likes: number;
  created_at: string;
}

export async function fetchVideos(): Promise<VideoItem[]> {
  const response = await fetch(getApiUrl('/api/v1/videos'), {
    headers: getAuthHeaders(),
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Erro ao carregar vídeos');
  }

  const items = Array.isArray(result.data)
    ? result.data
    : Array.isArray(result.data?.items)
      ? result.data.items
      : [];

  return items;
}

export function getVideoStreamUrl(id: number): string {
  return getApiUrl(`/api/v1/videos/stream/${id}`);
}