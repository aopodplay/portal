'use client';

import { usePlayer } from '@/contexts/PlayerContext';
import { X, Play, Trash2, Music, GripVertical } from 'lucide-react';
import { resolveCoverUrl } from '@/lib/media';
import { useRef } from 'react';

export default function QueuePanel({ onClose }: { onClose: () => void }) {
  const {
    queue,
    currentIndex,
    currentMusic,
    isPlaying,
    jumpToIndex,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    formatTime,
  } = usePlayer();

  const dragIndexRef = useRef<number | null>(null);

  const handleDragStart = (i: number) => {
    dragIndexRef.current = i;
  };

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === i) return;
    reorderQueue(from, i);
    dragIndexRef.current = i;
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
  };

  return (
    <div className="fixed bottom-24 right-4 w-80 max-h-[60vh] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-40 flex flex-col">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div>
          <h3 className="text-white font-bold text-sm">Fila de reprodução</h3>
          <p className="text-gray-400 text-xs">
            {queue.length} {queue.length === 1 ? 'música' : 'músicas'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-gray-400 hover:text-red-400 p-1.5 transition-colors"
              title="Limpar fila"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-y-auto flex-1 p-2">
        {queue.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            A fila está vazia
          </p>
        ) : (
          queue.map((music, i) => {
            const isCurrent = i === currentIndex;
            const cover = resolveCoverUrl(music.cover_image ?? undefined);

            return (
              <div
                key={`${music.id}-${i}`}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  isCurrent ? 'bg-purple-600/20' : 'hover:bg-white/5'
                }`}
                onClick={() => jumpToIndex(i)}
              >
                <GripVertical
                  size={14}
                  className="text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0"
                />

                <div className="w-9 h-9 rounded bg-purple-600/30 flex-shrink-0 overflow-hidden">
                  {music.cover_image ? (
                    <img src={cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music size={16} className="text-white/50 m-auto mt-2.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium truncate ${
                      isCurrent ? 'text-purple-300' : 'text-white'
                    }`}
                  >
                    {music.title}
                  </p>
                  <p className="text-gray-400 text-[10px] truncate">
                    {music.artist}
                    {music.duration ? ` · ${formatTime(music.duration)}` : ''}
                  </p>
                </div>

                {isCurrent && isPlaying ? (
                  <div className="flex gap-0.5 flex-shrink-0 mr-1">
                    <span className="w-0.5 h-3 bg-purple-400 rounded animate-pulse" />
                    <span className="w-0.5 h-4 bg-purple-400 rounded animate-pulse delay-75" />
                    <span className="w-0.5 h-2 bg-purple-400 rounded animate-pulse delay-150" />
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      jumpToIndex(i);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white p-1 transition-opacity flex-shrink-0"
                  >
                    <Play size={14} />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(i);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 p-1 transition-opacity flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}