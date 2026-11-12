'use client';
import { Play, Pause, Eye, Clock, Heart } from 'lucide-react';
import { resolveCoverUrl } from '@/lib/media';
import type { Card } from '@/lib/cards';

const typeLabels: Record<string, string> = {
  AUDIO: 'Música',
  WORSHIP: 'Louvor',
  VIDEO: 'Vídeo',
  PODCAST: 'Podcast',
  SERMON: 'Sermão',
  TESTIMONY: 'Testemunho',
  BIBLE_CHAPTER: 'Bíblia',
};

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ContentCardUnified({
  card,
  isPlaying = false,
  onPlay,
  variant = 'square', // 'square' | 'video' | 'portrait'
}: {
  card: Card;
  isPlaying?: boolean;
  onPlay?: (card: Card) => void;
  variant?: 'square' | 'video' | 'portrait';
}) {
  const image = resolveCoverUrl(card.image_url);
  const duration = formatDuration(card.duration);

  const aspect =
    variant === 'video'
      ? 'aspect-video'
      : variant === 'portrait'
        ? 'aspect-[3/4]'
        : 'aspect-square';

  return (
    <div className="group cursor-pointer" onClick={() => onPlay?.(card)}>
      <div
        className={`relative rounded-lg overflow-hidden ${aspect} mb-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20`}
      >
        <img
          src={image}
          alt={card.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/default-cover.svg';
          }}
        />

        {/* Badge de tipo */}
        <span className="absolute top-2 left-2 text-[10px] font-bold bg-purple-600/90 text-white px-1.5 py-0.5 rounded">
          {card.subtitle || typeLabels[card.type] || card.type}
        </span>

        {/* Duração */}
        {duration && (
          <span className="absolute bottom-2 left-2 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock size={10} />
            {duration}
          </span>
        )}

        {/* Botão Play */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay?.(card);
          }}
          className="absolute bottom-2 right-2 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg hover:scale-110 hover:bg-purple-500"
        >
          {isPlaying ? (
            <Pause size={18} className="text-white" />
          ) : (
            <Play size={18} className="text-white ml-0.5" />
          )}
        </button>
      </div>

      <h4 className="font-medium text-white text-sm truncate">{card.title}</h4>
      <p className="text-gray-400 text-xs truncate">
        {card.author_name || card.subtitle || typeLabels[card.type]}
      </p>

      <div className="flex items-center gap-3 mt-0.5 text-gray-500 text-[11px]">
        {card.views > 0 && (
          <span className="flex items-center gap-1">
            <Eye size={10} /> {card.views}
          </span>
        )}
        {card.likes > 0 && (
          <span className="flex items-center gap-1">
            <Heart size={10} /> {card.likes}
          </span>
        )}
      </div>
    </div>
  );
}