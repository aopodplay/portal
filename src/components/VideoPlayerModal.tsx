'use client';

import { useEffect, useRef } from 'react';
import { X, Play } from 'lucide-react';
import { getApiUrl } from '@/config/api';
import { resolveThumbUrl } from '@/lib/media';

interface VideoItem {
  id: number;
  title: string;
  description: string | null;
  duration: number | null;
  file_path: string;
  thumbnail_path: string | null;
  file_size: number;
  views: number;
  likes: number;
  created_at: string;
}

interface VideoPlayerModalProps {
  video: VideoItem | null;
  onClose: () => void;
}

export default function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (video) {
      document.addEventListener('keydown', handleKeyDown);
      // Bloquear o scroll da página por trás
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [video, onClose]);

  // Auto-play quando abre
  useEffect(() => {
    if (video && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Alguns browsers bloqueiam autoplay com som — ignoramos silenciosamente
      });
    }
  }, [video]);

  if (!video) return null;

  const streamUrl = getApiUrl(`/api/v1/videos/stream/${video.id}`);
  const thumbUrl = resolveThumbUrl(video.thumbnail_path);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Vídeo */}
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            src={streamUrl}
            poster={thumbUrl}
            controls
            className="w-full h-full"
            controlsList="nodownload"
          >
            O teu navegador não suporta a reprodução de vídeo.
          </video>
        </div>

        {/* Informação */}
        <div className="p-5">
          <h2 className="text-xl font-bold text-white mb-1">{video.title}</h2>
          {video.description && (
            <p className="text-gray-400 text-sm mt-1">{video.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span>{video.views ?? 0} visualizações</span>
            <span>·</span>
            <span>{video.likes ?? 0} gostos</span>
          </div>
        </div>
      </div>
    </div>
  );
}