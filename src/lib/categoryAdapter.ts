// lib/categoryAdapter.ts
import type { Card, CardType } from './cards';

export function contentToCard(row: any): Card {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subcategory || row.type || '',
    description: row.description,
    type: (row.type as CardType) || 'AUDIO',
    image_url: row.cover_url || row.cover_image || row.image_url,
    duration: row.duration,
    views: row.views ?? row.plays_count ?? 0,
    likes: row.likes ?? row.likes_count ?? 0,
    author_name: row.full_name || row.username || null,
    author_avatar: row.avatar_url || null,
    created_at: row.published_at || row.created_at,
    play_count: row.plays_count ?? 0,
    // preserva o URL do stream para o player
    ...( { stream_url: row.audio_url || row.file_path || null } as any ),
  };
}