// src/contexts/PlayerContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getApiUrl } from '@/config/api';

export interface MusicItem {
  id: number;
  title: string;
  artist: string;
  album: string | null;
  duration: number | null;
  file_path: string;
  file_size: number;
  cover_image: string | null;
  created_at: string;
}

interface PlayerContextType {
  currentMusic: MusicItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  queue: MusicItem[];
  currentIndex: number;
  play: (music: MusicItem, autoPlay?: boolean, queue?: MusicItem[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  closePlayer: () => void;
  formatTime: (time: number) => string;
  addToQueue: (music: MusicItem) => void;
  clearQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_MUSIC: 'podplay_current_music',
  CURRENT_TIME: 'podplay_current_time',
  IS_PLAYING: 'podplay_is_playing',
  VOLUME: 'podplay_volume',
  IS_MUTED: 'podplay_is_muted',
  DURATION: 'podplay_duration',
  QUEUE: 'podplay_queue',
  CURRENT_INDEX: 'podplay_current_index',
};

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentMusic, setCurrentMusic] = useState<MusicItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUserInteracted, setIsUserInteracted] = useState(false);
  const [queue, setQueue] = useState<MusicItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  // Carregar estado salvo ao iniciar
  useEffect(() => {
    const savedMusic = localStorage.getItem(STORAGE_KEYS.CURRENT_MUSIC);
    const savedTime = parseFloat(localStorage.getItem(STORAGE_KEYS.CURRENT_TIME) || '0');
    const savedPlaying = localStorage.getItem(STORAGE_KEYS.IS_PLAYING) === 'true';
    const savedVolume = parseFloat(localStorage.getItem(STORAGE_KEYS.VOLUME) || '1');
    const savedMuted = localStorage.getItem(STORAGE_KEYS.IS_MUTED) === 'true';
    const savedDuration = parseFloat(localStorage.getItem(STORAGE_KEYS.DURATION) || '0');
    const savedQueue = localStorage.getItem(STORAGE_KEYS.QUEUE);
    const savedIndex = parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX) || '0');

    if (savedMusic) {
      try {
        const music = JSON.parse(savedMusic);
        setCurrentMusic(music);
        setCurrentTime(savedTime);
        setDuration(savedDuration);
        setVolumeState(savedVolume);
        setIsMuted(savedMuted);
        
        if (savedQueue) {
          const parsedQueue = JSON.parse(savedQueue);
          setQueue(parsedQueue);
          setCurrentIndex(savedIndex);
        }
        
        if (savedPlaying) {
          setIsPlaying(true);
        }
      } catch (e) {
        console.error('Erro ao carregar música salva:', e);
      }
    }
  }, []);

  // Salvar estado quando mudar
  useEffect(() => {
    if (currentMusic) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_MUSIC, JSON.stringify(currentMusic));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_MUSIC);
    }
  }, [currentMusic]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_PLAYING, String(isPlaying));
  }, [isPlaying]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, String(currentTime));
  }, [currentTime]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VOLUME, String(volume));
  }, [volume]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_MUTED, String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DURATION, String(duration));
  }, [duration]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, String(currentIndex));
  }, [currentIndex]);

  // Tocar próxima música
  const playNext = () => {
    if (queue.length === 0) return;
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      const nextMusic = queue[nextIndex];
      setCurrentIndex(nextIndex);
      setCurrentMusic(nextMusic);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true);
      setIsUserInteracted(true);
      localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, '0');
    } else {
      // Fim da fila
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // Tocar música anterior
  const playPrevious = () => {
    if (queue.length === 0) return;
    
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      const prevMusic = queue[prevIndex];
      setCurrentIndex(prevIndex);
      setCurrentMusic(prevMusic);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true);
      setIsUserInteracted(true);
      localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, '0');
    }
  };

  // Inicializar áudio quando a música mudar
  useEffect(() => {
    if (currentMusic) {
      const audio = new Audio();
      audio.src = getApiUrl(`/api/v1/music/stream/${currentMusic.id}`);
      audio.preload = 'metadata';
      audio.volume = isMuted ? 0 : volume;
      
      if (currentTime > 0) {
        audio.currentTime = currentTime;
      }
      
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
        if (isPlaying && isUserInteracted) {
          audio.play().catch(() => console.log('Autoplay bloqueado, aguardando interação'));
        }
      });
      
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
        if (audio.currentTime - lastSavedTimeRef.current > 5) {
          lastSavedTimeRef.current = audio.currentTime;
          localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, String(audio.currentTime));
        }
      });
      
      audio.addEventListener('ended', () => {
        // Quando a música termina, tocar a próxima
        setIsPlaying(false);
        setCurrentTime(0);
        localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, '0');
        localStorage.setItem(STORAGE_KEYS.IS_PLAYING, 'false');
        
        // Tocar próxima música
        if (queue.length > 0 && currentIndex + 1 < queue.length) {
          playNext();
        }
      });
      
      audio.addEventListener('waiting', () => {
        setIsLoading(true);
      });
      
      audio.addEventListener('canplay', () => {
        setIsLoading(false);
        if (isPlaying && isUserInteracted) {
          audio.play().catch(() => console.log('Autoplay bloqueado'));
        }
      });
      
      audio.addEventListener('play', () => {
        setIsPlaying(true);
        setIsUserInteracted(true);
      });
      
      audio.addEventListener('pause', () => {
        setIsPlaying(false);
      });
      
      // Marcar interação do usuário
      const handleUserInteraction = () => {
        setIsUserInteracted(true);
        if (isPlaying && audio.paused) {
          audio.play().catch(() => {});
        }
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      };
      
      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);
      
      audioRef.current = audio;
      
      if (isPlaying && isUserInteracted) {
        audio.play().catch(() => console.log('Aguardando interação do usuário'));
      }
      
      return () => {
        if (audioRef.current) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, String(audioRef.current.currentTime));
        }
        audio.pause();
        audio.src = '';
        audio.removeEventListener('loadedmetadata', () => {});
        audio.removeEventListener('timeupdate', () => {});
        audio.removeEventListener('ended', () => {});
        audio.removeEventListener('waiting', () => {});
        audio.removeEventListener('canplay', () => {});
        audio.removeEventListener('play', () => {});
        audio.removeEventListener('pause', () => {});
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      };
    }
  }, [currentMusic]);

  // Controlar play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        if (isUserInteracted) {
          audioRef.current.play().catch(() => console.log('Aguardando interação do usuário'));
        } else {
          const handleInteraction = () => {
            setIsUserInteracted(true);
            if (isPlaying) {
              audioRef.current?.play().catch(() => {});
            }
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
          };
          document.addEventListener('click', handleInteraction);
          document.addEventListener('touchstart', handleInteraction);
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Controlar volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const play = (music: MusicItem, autoPlay: boolean = false, newQueue?: MusicItem[]) => {
    // Se fornecida uma nova fila, usá-la
    if (newQueue && newQueue.length > 0) {
      const index = newQueue.findIndex(m => m.id === music.id);
      setQueue(newQueue);
      setCurrentIndex(index >= 0 ? index : 0);
    } else if (queue.length === 0) {
      // Se não há fila, criar uma com a música atual
      setQueue([music]);
      setCurrentIndex(0);
    } else {
      // Verificar se a música já está na fila
      const existingIndex = queue.findIndex(m => m.id === music.id);
      if (existingIndex >= 0) {
        setCurrentIndex(existingIndex);
      } else {
        // Adicionar à fila e tocar
        const newQueue = [...queue, music];
        setQueue(newQueue);
        setCurrentIndex(queue.length);
      }
    }
    
    // Se é a mesma música e está pausada, resumir
    if (currentMusic?.id === music.id && !isPlaying) {
      setIsPlaying(true);
      return;
    }
    
    // Se é a mesma música e já está tocando, não fazer nada
    if (currentMusic?.id === music.id && isPlaying) {
      return;
    }
    
    // Limpar áudio anterior
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    setCurrentMusic(music);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(autoPlay);
    localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, '0');
    
    if (!autoPlay) {
      setIsUserInteracted(true);
    }
  };

  const addToQueue = (music: MusicItem) => {
    setQueue(prev => [...prev, music]);
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(0);
    localStorage.removeItem(STORAGE_KEYS.QUEUE);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_INDEX);
  };

  const pause = () => {
    setIsPlaying(false);
  };

  const togglePlay = () => {
    setIsUserInteracted(true);
    setIsPlaying(!isPlaying);
  };

  const seek = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, String(time));
  };

  const setVolume = (vol: number) => {
    setVolumeState(vol);
    if (vol === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setCurrentMusic(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setQueue([]);
    setCurrentIndex(0);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_MUSIC);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_TIME);
    localStorage.removeItem(STORAGE_KEYS.IS_PLAYING);
    localStorage.removeItem(STORAGE_KEYS.DURATION);
    localStorage.removeItem(STORAGE_KEYS.QUEUE);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_INDEX);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <PlayerContext.Provider
      value={{
        currentMusic,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isLoading,
        queue,
        currentIndex,
        play,
        playNext,
        playPrevious,
        pause,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        closePlayer,
        formatTime,
        addToQueue,
        clearQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}