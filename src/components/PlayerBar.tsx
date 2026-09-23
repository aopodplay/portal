// src/components/PlayerBar.tsx
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
} from 'lucide-react';

export default function PlayerBar() {
  const {
    currentMusic,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    closePlayer,
    formatTime,
    playNext,
    playPrevious,
    queue,
    currentIndex,
  } = usePlayer();

  if (!currentMusic) return null;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const hasNext = queue.length > 0 && currentIndex < queue.length - 1;
  const hasPrevious = queue.length > 0 && currentIndex > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-gray-400 w-12">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
            style={{
              background: `linear-gradient(to right, #8B5CF6 ${progressPercentage}%, #4B5563 ${progressPercentage}%)`
            }}
          />
          <span className="text-xs text-gray-400 w-12">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {currentMusic.cover_image ? (
                <img src={currentMusic.cover_image} alt={currentMusic.title} className="w-full h-full object-cover" />
              ) : (
                <Music size={24} className="text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentMusic.title}</p>
              <p className="text-gray-400 text-xs truncate">{currentMusic.artist}</p>
              {queue.length > 1 && (
                <p className="text-xs text-purple-400">
                  {queue.length} músicas na fila • {currentIndex + 1} de {queue.length}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={playPrevious}
              disabled={!hasPrevious}
              className={`text-gray-400 hover:text-white transition-colors p-2 ${
                !hasPrevious ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              <SkipBack size={18} />
            </button>
            
            <button
              onClick={togglePlay}
              className="w-10 h-10 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={18} className="text-white animate-spin" />
              ) : isPlaying ? (
                <Pause size={18} className="text-white" />
              ) : (
                <Play size={18} className="text-white ml-0.5" />
              )}
            </button>
            
            <button 
              onClick={playNext}
              disabled={!hasNext}
              className={`text-gray-400 hover:text-white transition-colors p-2 ${
                !hasNext ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              <SkipForward size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 min-w-[200px] justify-end">
            <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
              style={{
                background: `linear-gradient(to right, #8B5CF6 ${(isMuted ? 0 : volume) * 100}%, #4B5563 ${(isMuted ? 0 : volume) * 100}%)`
              }}
            />
            <button
              onClick={closePlayer}
              className="text-gray-400 hover:text-white transition-colors px-2 py-1 text-sm hover:bg-white/10 rounded"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}