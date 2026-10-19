'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { getApiUrl } from '@/config/api';
import { musicApi } from '@/lib/musicApi';

// ============================================================
// TIPOS
// ============================================================

export interface MusicItem {
  id: number;
  title: string;
  artist: string;
  artist_id?: number | null;   // 🔥 NOVO
  album: string | null;
  album_id?: number | null;    // 🔥 NOVO
  duration: number | null;
  file_path: string;
  file_size: number;
  cover_image: string | null;
  created_at: string;
  plays?: number;              // 🔥 NOVO (opcional — vem do /api/v1/music)
}

export type RepeatMode = 'off' | 'all' | 'one';

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
  shuffle: boolean;
  repeat: RepeatMode;

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
  addToQueueNext: (music: MusicItem) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  jumpToIndex: (index: number) => void;

  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// ============================================================
// STORAGE
// ============================================================

const STORAGE = {
  CURRENT: 'podplay_current_music',
  TIME: 'podplay_current_time',
  VOLUME: 'podplay_volume',
  MUTED: 'podplay_is_muted',
  QUEUE: 'podplay_queue',
  INDEX: 'podplay_current_index',
  SHUFFLE: 'podplay_shuffle',
  REPEAT: 'podplay_repeat',
} as const;

// ============================================================
// HELPERS
// ============================================================

function shuffled<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const PLAY_MIN_SECONDS = 30;
const PLAY_MIN_PERCENT = 0.5;

function buildSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let sid = sessionStorage.getItem('podplay_session_id');
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('podplay_session_id', sid);
  }
  return sid;
}

// ============================================================
// PROVIDER
// ============================================================

export function PlayerProvider({ children }: { children: ReactNode }) {
  // ---------- estado ----------
  const [currentMusic, setCurrentMusic] = useState<MusicItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [queue, setQueue] = useState<MusicItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');

  // ---------- refs ----------
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentMusicRef = useRef<MusicItem | null>(null);
  const queueRef = useRef<MusicItem[]>([]);
  const indexRef = useRef(0);
  const repeatRef = useRef<RepeatMode>('off');
  const shuffleRef = useRef(false);
  const hydratedRef = useRef(false);
  const playReportedRef = useRef<Set<string>>(new Set());
  const failedPlayRef = useRef<Set<string>>(new Set()); // 🔥 backoff
  const sessionIdRef = useRef<string>('ssr');

  // ---------- manter refs sincronizadas ----------
  useEffect(() => {
    currentMusicRef.current = currentMusic;
  }, [currentMusic]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);
  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  // ---------- hidratação inicial (uma vez) ----------
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    sessionIdRef.current = buildSessionId();

    try {
      const savedCurrent = localStorage.getItem(STORAGE.CURRENT);
      const savedQueue = localStorage.getItem(STORAGE.QUEUE);
      const savedIndex = Number(localStorage.getItem(STORAGE.INDEX) || '0');
      const savedVolume = Number(localStorage.getItem(STORAGE.VOLUME) || '1');
      const savedMuted = localStorage.getItem(STORAGE.MUTED) === 'true';
      const savedShuffle = localStorage.getItem(STORAGE.SHUFFLE) === 'true';
      const savedRepeat = (localStorage.getItem(STORAGE.REPEAT) || 'off') as RepeatMode;

      setVolumeState(savedVolume);
      setIsMuted(savedMuted);
      setShuffle(savedShuffle);
      setRepeat(savedRepeat);

      if (savedCurrent) {
        const music = JSON.parse(savedCurrent) as MusicItem;
        setCurrentMusic(music);

        const savedTime = Number(localStorage.getItem(STORAGE.TIME) || '0');
        setCurrentTime(savedTime);

        setIsPlaying(false);
      }

      if (savedQueue) {
        const parsed = JSON.parse(savedQueue) as MusicItem[];
        setQueue(parsed);
        setCurrentIndex(savedIndex);
      }
    } catch (e) {
      console.warn('[Player] hidratação falhou:', e);
    }
  }, []);

  // ---------- persistir mudanças ----------
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (currentMusic) localStorage.setItem(STORAGE.CURRENT, JSON.stringify(currentMusic));
    else localStorage.removeItem(STORAGE.CURRENT);
  }, [currentMusic]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (queue.length) localStorage.setItem(STORAGE.QUEUE, JSON.stringify(queue));
    else localStorage.removeItem(STORAGE.QUEUE);
  }, [queue]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem(STORAGE.INDEX, String(currentIndex));
  }, [currentIndex]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem(STORAGE.VOLUME, String(volume));
  }, [volume]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem(STORAGE.MUTED, String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem(STORAGE.SHUFFLE, String(shuffle));
  }, [shuffle]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem(STORAGE.REPEAT, repeat);
  }, [repeat]);

  // ---------- criar o <audio> UMA vez ----------
  useEffect(() => {
    if (audioRef.current) return;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const onLoaded = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);

      const savedTime = Number(localStorage.getItem(STORAGE.TIME) || '0');
      if (savedTime > 0 && Math.abs(audio.currentTime - savedTime) > 1) {
        audio.currentTime = savedTime;
        setCurrentTime(savedTime);
      }
    };

    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (Math.floor(audio.currentTime) % 5 === 0) {
        localStorage.setItem(STORAGE.TIME, String(audio.currentTime));
      }
      maybeReportPlay(audio.currentTime, audio.duration || 0);
    };

    const onEnded = () => {
      localStorage.setItem(STORAGE.TIME, '0');
      handleEnded();
    };

    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => setIsLoading(false);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- quando a música muda, atualizar o src ----------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentMusic) {
      audio.pause();
      audio.src = '';
      return;
    }

    const newSrc = getApiUrl(`/api/v1/music/stream/${currentMusic.id}`);
    if (!audio.src.endsWith(`/music/stream/${currentMusic.id}`)) {
      setIsLoading(true);
      audio.src = newSrc;
      audio.load();
    }
  }, [currentMusic]);

  // ---------- play/pause ----------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentMusic) return;

    if (isPlaying) {
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          console.warn('[Player] autoplay bloqueado:', err?.message);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentMusic]);

  // ---------- volume ----------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // ---------- REPORT DE PLAY (30s OU 50%) ----------
  const maybeReportPlay = (time: number, dur: number) => {
    const music = currentMusicRef.current;
    if (!music) return;

    const key = `${music.id}:${sessionIdRef.current}`;

    // Já reportado com sucesso?
    if (playReportedRef.current.has(key)) return;

    // Falhou recentemente? (evita retry infinito)
    if (failedPlayRef.current.has(key)) return;

    const reachedThreshold =
      time >= PLAY_MIN_SECONDS || (dur > 0 && time / dur >= PLAY_MIN_PERCENT);

    if (!reachedThreshold) return;

    playReportedRef.current.add(key);

    musicApi
      .recordPlay(music.id, {
        duration_listened: Math.round(time),
        position_seconds: Math.round(time),
        total_duration: Math.round(dur || 0),
        device_type: 'desktop',
        session_id: sessionIdRef.current,
      })
      .then((res) => {
        if (res.counted) {
          window.dispatchEvent(
            new CustomEvent('podplay:playCounted', {
              detail: { musicId: music.id, plays: res.plays },
            })
          );
        }
      })
      .catch((err) => {
        // Remove do "reportado" mas marca como falhado (backoff 30s)
        playReportedRef.current.delete(key);
        failedPlayRef.current.add(key);
        setTimeout(() => failedPlayRef.current.delete(key), 30_000);
        console.warn('[Player] Falha ao registar play:', err?.message);
      });
  };

  // ---------- avançar automaticamente ----------
  const handleEnded = useCallback(() => {
    const q = queueRef.current;
    const i = indexRef.current;
    const r = repeatRef.current;

    if (r === 'one' && currentMusicRef.current) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return;
    }

    if (i + 1 < q.length) {
      setCurrentIndex(i + 1);
      setCurrentMusic(q[i + 1]);
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }

    if (r === 'all' && q.length > 0) {
      setCurrentIndex(0);
      setCurrentMusic(q[0]);
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }

    setIsPlaying(false);
    setCurrentTime(0);
    const audio = audioRef.current;
    if (audio) audio.currentTime = 0;
  }, []);

  // ---------- API PÚBLICA ----------

  const play = useCallback(
    (music: MusicItem, autoPlay = true, newQueue?: MusicItem[]) => {
      if (currentMusicRef.current?.id === music.id) {
        if (!isPlaying) setIsPlaying(true);
        return;
      }

      let finalQueue: MusicItem[];
      let finalIndex: number;

      if (newQueue && newQueue.length > 0) {
        finalQueue = shuffleRef.current ? shuffled(newQueue) : [...newQueue];
        finalIndex = finalQueue.findIndex((m) => m.id === music.id);
        if (finalIndex < 0) {
          finalQueue = [music, ...finalQueue];
          finalIndex = 0;
        }
      } else if (queueRef.current.length === 0) {
        finalQueue = [music];
        finalIndex = 0;
      } else {
        const existingIdx = queueRef.current.findIndex((m) => m.id === music.id);
        if (existingIdx >= 0) {
          finalQueue = queueRef.current;
          finalIndex = existingIdx;
        } else {
          finalQueue = [...queueRef.current, music];
          finalIndex = finalQueue.length - 1;
        }
      }

      setQueue(finalQueue);
      setCurrentIndex(finalIndex);
      setCurrentMusic(music);
      setCurrentTime(0);
      setDuration(0);
      localStorage.setItem(STORAGE.TIME, '0');
      setIsPlaying(autoPlay);
    },
    [isPlaying]
  );

  const playNext = useCallback(() => {
    const q = queueRef.current;
    const i = indexRef.current;
    if (i + 1 < q.length) {
      setCurrentIndex(i + 1);
      setCurrentMusic(q[i + 1]);
      setCurrentTime(0);
      setIsPlaying(true);
    } else if (repeatRef.current === 'all' && q.length > 0) {
      setCurrentIndex(0);
      setCurrentMusic(q[0]);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }, []);

  const playPrevious = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const q = queueRef.current;
    const i = indexRef.current;
    if (i > 0) {
      setCurrentIndex(i - 1);
      setCurrentMusic(q[i - 1]);
      setCurrentTime(0);
      setIsPlaying(true);
    } else if (repeatRef.current === 'all' && q.length > 0) {
      setCurrentIndex(q.length - 1);
      setCurrentMusic(q[q.length - 1]);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => setIsPlaying(false), []);

  const togglePlay = useCallback(() => {
    setIsPlaying((v) => !v);
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
    localStorage.setItem(STORAGE.TIME, String(time));
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    setIsMuted(clamped === 0);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((v) => !v), []);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    setCurrentMusic(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setQueue([]);
    setCurrentIndex(0);
    Object.values(STORAGE).forEach((k) => localStorage.removeItem(k));
  }, []);

  const addToQueue = useCallback((music: MusicItem) => {
    setQueue((prev) => [...prev, music]);
  }, []);

  const addToQueueNext = useCallback((music: MusicItem) => {
    setQueue((prev) => {
      const i = indexRef.current;
      const copy = [...prev];
      copy.splice(i + 1, 0, music);
      return copy;
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const copy = [...prev];
      copy.splice(index, 1);
      setCurrentIndex((ci) => (index < ci ? ci - 1 : ci));
      return copy;
    });
  }, []);

  const reorderQueue = useCallback((from: number, to: number) => {
    setQueue((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
    localStorage.removeItem(STORAGE.QUEUE);
    localStorage.removeItem(STORAGE.INDEX);
  }, []);

  const jumpToIndex = useCallback((index: number) => {
    const q = queueRef.current;
    if (index < 0 || index >= q.length) return;
    setCurrentIndex(index);
    setCurrentMusic(q[index]);
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const next = !prev;
      if (next) {
        const cur = currentMusicRef.current;
        const q = queueRef.current;
        if (cur && q.length > 0) {
          const others = q.filter((m) => m.id !== cur.id);
          const newQ = [cur, ...shuffled(others)];
          setQueue(newQ);
          setCurrentIndex(0);
        }
      }
      return next;
    });
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const formatTime = useCallback((time: number) => {
    if (isNaN(time) || !isFinite(time) || time < 0) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  // ---------- valor do contexto ----------
  const value: PlayerContextType = {
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
    addToQueueNext,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    jumpToIndex,
    toggleShuffle,
    cycleRepeat,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider');
  return ctx;
}