'use client';

import { usePlayer } from '@/contexts/PlayerContext';
import {
  Play,
  Pause,
  Music,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  X,
  Loader2,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { resolveCoverUrl } from '@/lib/media';
import QueuePanel from './QueuePanel';

export default function PlayerBar() {
  const {
    currentMusic,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    queue,
    currentIndex,
    shuffle,
    repeat,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    closePlayer,
    formatTime,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const [queueOpen, setQueueOpen] = useState(false);

  if (!currentMusic) return null;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasNext =
    queue.length > 0 && (currentIndex < queue.length - 1 || repeat === 'all');
  const hasPrevious =
    queue.length > 0 && (currentIndex > 0 || repeat === 'all');

  const cover = resolveCoverUrl(currentMusic.cover_image ?? undefined);

  return (
    <>
      {queueOpen && <QueuePanel onClose={() => setQueueOpen(false)} />}

      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-gray-400 w-12 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
              style={{
                background: `linear-gradient(to right, #8B5CF6 ${progressPct}%, #4B5563 ${progressPct}%)`,
              }}
            />
            <span className="text-xs text-gray-400 w-12 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {currentMusic.cover_image ? (
                  <img
                    src={cover}
                    alt={currentMusic.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music size={22} className="text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className="text-white text-sm font-medium truncate"
                  title={currentMusic.title}
                >
                  {currentMusic.title}
                </p>
                <div className="flex items-center gap-1 text-xs truncate">
                  {currentMusic.artist_id ? (
                    <Link
                      href={`/artists/${currentMusic.artist_id}`}
                      className="text-gray-400 truncate hover:text-purple-300 transition-colors"
                    >
                      {currentMusic.artist}
                    </Link>
                  ) : (
                    <span className="text-gray-400 truncate">
                      {currentMusic.artist}
                    </span>
                  )}
                  {currentMusic.album && currentMusic.album_id && (
                    <>
                      <span className="text-gray-600">·</span>
                      <Link
                        href={`/albums/${currentMusic.album_id}`}
                        className="text-gray-400 truncate hover:text-purple-300 transition-colors"
                      >
                        {currentMusic.album}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={toggleShuffle}
                className={`p-2 transition-colors hidden sm:block ${
                  shuffle ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Shuffle size={18} />
              </button>

              <button
                onClick={playPrevious}
                disabled={!hasPrevious}
                className={`p-2 text-gray-400 hover:text-white transition-colors ${
                  !hasPrevious ? 'opacity-30 cursor-not-allowed' : ''
                }`}
              >
                <SkipBack size={20} />
              </button>

              <button
                onClick={togglePlay}
                disabled={isLoading}
                className="w-11 h-11 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 size={20} className="text-white animate-spin" />
                ) : isPlaying ? (
                  <Pause size={20} className="text-white" />
                ) : (
                  <Play size={20} className="text-white ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                disabled={!hasNext}
                className={`p-2 text-gray-400 hover:text-white transition-colors ${
                  !hasNext ? 'opacity-30 cursor-not-allowed' : ''
                }`}
              >
                <SkipForward size={20} />
              </button>

              <button
                onClick={cycleRepeat}
                className={`p-2 transition-colors hidden sm:block ${
                  repeat !== 'off'
                    ? 'text-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xs justify-end">
              <button
                onClick={() => setQueueOpen((v) => !v)}
                className={`p-2 transition-colors ${
                  queueOpen
                    ? 'text-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ListMusic size={18} />
              </button>

              <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolume}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500 hidden sm:block"
              />

              <button
                onClick={closePlayer}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}