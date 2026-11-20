'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  X,
  Share2,
  Check,
  Maximize2,
  Minimize2,
  Play,
  Eye,
  Download,
  WifiOff,
  Loader2,
  MessageSquare,
  Lock,
  Unlock,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  Repeat,
  Reply,
  Heart,
  Flag,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { resolveMediaUrl, resolveThumbUrl, resolveAvatarUrl, DEFAULT_AVATAR } from '@/lib/media';
import ReportContentModal from '@/components/ReportContentModal';
import { fetchWithAuth, getApiUrl, getAuthHeaders } from '@/config/api';
import { getFriendlyErrorMessage, parseApiError } from '@/lib/errorHandler';
import { getOfflineBlobUrl, getOfflineMedia, saveOfflineMedia } from '@/lib/offlineStorage';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { historyApi } from '@/lib/historyApi';

export interface VideoItem {
  id: number;
  title: string;
  description: string | null;
  duration: number | null;
  resolution?: string | null;
  file_path: string;
  thumbnail_path: string | null;
  file_size: number;
  views: number;
  likes: number;
  user_id?: number | null;
  comments_locked?: boolean | number;
  user_play_count?: number;
  created_at: string;
}

interface VideoComment {
  id: number;
  video_id: number;
  user_id: number;
  parent_id?: number | null;
  content: string;
  likes_count?: number;
  liked_by_me?: boolean;
  username?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string;
  created_at: string;
}

interface VideoPlayerModalProps<T extends VideoItem = VideoItem> {
  video: T | null;
  videos?: T[];
  onSelectVideo?: (video: T) => void;
  onClose: () => void;
}

export default function VideoPlayerModal<T extends VideoItem = VideoItem>({
  video,
  videos = [],
  onSelectVideo,
  onClose,
}: VideoPlayerModalProps<T>) {
  const { user } = useAuth();
  const { isPlaying: isAudioPlaying, pause: pauseAudio } = usePlayer();
  const [internalVideo, setInternalVideo] = useState<T | null>(video);
  const [videoHistory, setVideoHistory] = useState<T[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [fallbackVideos, setFallbackVideos] = useState<T[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<T[]>([]);
  const [mixVideos, setMixVideos] = useState<T[]>([]);
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('podplay_video_autoplay') !== 'false';
  });

  const [copied, setCopied] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  // Visualizações & Gostos (Likes)
  const [viewsCount, setViewsCount] = useState<number>(0);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const [offlineUrl, setOfflineUrl] = useState<string | null>(null);
  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const [savingOffline, setSavingOffline] = useState(false);
  const [offlineError, setOfflineError] = useState<string | null>(null);

  // Comentários
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [commentsLocked, setCommentsLocked] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [togglingLock, setTogglingLock] = useState(false);
  const [replyingTo, setReplyingTo] = useState<VideoComment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (video && !user) {
      window.dispatchEvent(
        new CustomEvent('podplay:require-auth', {
          detail: { action: 'assistir a este vídeo', title: video.title },
        })
      );
      onClose();
      return;
    }
    setInternalVideo(video);
    setDescExpanded(false);
    setCommentError(null);
    if (!video) {
      setVideoHistory([]);
    }
  }, [video, user, onClose]);

  // Pausar áudio em reprodução ao abrir um vídeo
  useEffect(() => {
    if (internalVideo && isAudioPlaying) {
      pauseAudio();
    }
  }, [internalVideo?.id, isAudioPlaying, pauseAudio]);

  const activeVideo = internalVideo;

  const userType = String(
    (user as any)?.role || (user as any)?.type || (user as any)?.perfil || ''
  ).toLowerCase();
  const isAdmin = Boolean(user && userType === 'admin');
  const canManageLock = Boolean(
    user &&
      activeVideo &&
      (isAdmin || (activeVideo.user_id && Number(activeVideo.user_id) === Number(user.id)))
  );

  // Carregar lista de vídeos recomendados (aprende com o utilizador) + fallback
  useEffect(() => {
    if (!activeVideo) return;
    let cancelled = false;

    const recReq = user
      ? fetchWithAuth(`/api/v1/videos/recommended?excludeId=${activeVideo.id}`)
      : fetch(getApiUrl(`/api/v1/videos/recommended?excludeId=${activeVideo.id}`));

    recReq
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled && body?.success && Array.isArray(body.data)) {
          setRecommendedVideos(body.data);
        }
      })
      .catch(() => {});

    if (videos.length <= 1) {
      fetch(getApiUrl('/api/v1/videos'))
        .then((res) => res.json())
        .then((body) => {
          if (!cancelled && body?.success && Array.isArray(body.data)) {
            setFallbackVideos(body.data);
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [activeVideo?.id, videos.length, user]);

  // Registar visualização no histórico (alimenta o Mix de vídeos repetidos) + views + likes
  useEffect(() => {
    if (!activeVideo) return;
    let cancelled = false;

    setViewsCount(activeVideo.views ?? 0);
    setLikesCount(activeVideo.likes ?? 0);
    setLiked(false);

    // Incrementar visualização do vídeo
    fetch(getApiUrl(`/api/v1/videos/${activeVideo.id}/view`), { method: 'POST' })
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled && body?.success && typeof body.data?.views === 'number') {
          setViewsCount(body.data.views);
        }
      })
      .catch(() => {});

    // Estado de gosto (like)
    const likeReq = user
      ? fetchWithAuth(`/api/v1/videos/${activeVideo.id}/like-status`)
      : fetch(getApiUrl(`/api/v1/videos/${activeVideo.id}/like-status`));

    likeReq
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled && body?.success && body.data) {
          if (typeof body.data.likes === 'number') setLikesCount(body.data.likes);
          setLiked(Boolean(body.data.liked));
        }
      })
      .catch(() => {});

    if (user) {
      historyApi
        .recordPlayback({
          contentId: activeVideo.id,
          contentType: 'video',
          progress: 0,
          duration: activeVideo.duration || 0,
          completed: false,
        })
        .then(() => {
          // Atualiza o Mix lateral após registar a reprodução
          fetchWithAuth('/api/v1/videos/mix')
            .then((r) => r.json())
            .then((b) => {
              if (!cancelled && b?.success && Array.isArray(b.data?.videos)) {
                setMixVideos(b.data.videos);
              }
            })
            .catch(() => {});
        })
        .catch(() => {});
    } else {
      setMixVideos([]);
    }

    return () => {
      cancelled = true;
    };
  }, [activeVideo?.id, user]);

  // Verificar offline
  useEffect(() => {
    if (!activeVideo) {
      setOfflineUrl(null);
      setIsSavedOffline(false);
      setOfflineError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const [blobUrl, record] = await Promise.all([
        getOfflineBlobUrl('video', activeVideo.id),
        getOfflineMedia('video', activeVideo.id),
      ]);
      if (cancelled) return;
      setOfflineUrl(blobUrl);
      setIsSavedOffline(Boolean(record?.explicitDownload));
      setOfflineError(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeVideo]);

  // Carregar comentários
  const loadComments = useCallback(async (videoId: number) => {
    try {
      setLoadingComments(true);
      const res = await fetch(getApiUrl(`/api/v1/videos/${videoId}/comments`), {
        headers: getAuthHeaders(),
      });
      const body = await res.json();
      if (res.ok && body?.success && body.data) {
        setComments(Array.isArray(body.data.comments) ? body.data.comments : []);
        setCommentsLocked(Boolean(body.data.comments_locked));
      }
    } catch {
      // Silencioso
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    if (!activeVideo) {
      setComments([]);
      setCommentsLocked(false);
      return;
    }
    setCommentsLocked(Boolean(activeVideo.comments_locked));
    loadComments(activeVideo.id);
  }, [activeVideo?.id, loadComments]);

  // Fechar com ESC e bloquear scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (activeVideo) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeVideo, onClose]);

  if (!activeVideo) return null;

  const thumbUrl = resolveThumbUrl(activeVideo.thumbnail_path);
  const rawPath = (activeVideo.file_path || '').trim();
  const isIframeStream =
    rawPath.includes('cloudflarestream.com') ||
    rawPath.includes('/iframe') ||
    rawPath.includes('youtube.com/embed') ||
    rawPath.includes('player.vimeo.com');

  let iframeSrc = rawPath;
  if (isIframeStream) {
    if (thumbUrl.startsWith('http') && !iframeSrc.includes('poster=')) {
      const separator = iframeSrc.includes('?') ? '&' : '?';
      iframeSrc = `${iframeSrc}${separator}poster=${encodeURIComponent(thumbUrl)}`;
    }
    if (!iframeSrc.includes('autoplay=')) {
      const separator = iframeSrc.includes('?') ? '&' : '?';
      iframeSrc = `${iframeSrc}${separator}autoplay=1`;
    }
  }

  const directVideoSrc =
    resolveMediaUrl(rawPath) || getApiUrl(`/api/v1/videos/stream/${activeVideo.id}`);

  const sourcePool =
    recommendedVideos.length > 0
      ? recommendedVideos
      : videos.length > 0
        ? videos
        : fallbackVideos;
  const upNext = sourcePool.filter((v) => v.id !== activeVideo.id).slice(0, 10);
  const poolIndex = sourcePool.findIndex((v) => v.id === activeVideo.id);
  const prevVideo: T | null =
    videoHistory.length > 0
      ? videoHistory[videoHistory.length - 1]
      : poolIndex > 0
        ? sourcePool[poolIndex - 1]
        : null;
  const nextVideo: T | null =
    poolIndex >= 0 && poolIndex + 1 < sourcePool.length
      ? sourcePool[poolIndex + 1]
      : upNext[0] || null;
  const hasSidebar = !theaterMode && (upNext.length > 0 || mixVideos.length > 0);

  const toggleAutoPlay = () => {
    setAutoPlayNext((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('podplay_video_autoplay', String(next));
      }
      return next;
    });
  };

  const handleVideoEnded = () => {
    if (autoPlayNext && upNext.length > 0) {
      handleSelectNext(upNext[0]);
    }
  };

  const handleToggleLike = async () => {
    if (!user || !activeVideo || liking) return;
    try {
      setLiking(true);
      const res = await fetchWithAuth(`/api/v1/videos/${activeVideo.id}/like`, {
        method: 'POST',
      });
      const body = await res.json();
      if (res.ok && body?.success && body.data) {
        setLikesCount(Number(body.data.likes ?? 0));
        setLiked(Boolean(body.data.liked));
      }
    } catch {
      // Silencioso
    } finally {
      setLiking(false);
    }
  };

  const handleSelectNext = (nextVid: T) => {
    if (activeVideo && nextVid.id !== activeVideo.id) {
      setVideoHistory((prev) => [...prev.slice(-19), activeVideo]);
    }
    if (onSelectVideo) {
      onSelectVideo(nextVid);
    } else {
      setInternalVideo(nextVid);
    }
  };

  const handleSelectPrev = () => {
    if (!prevVideo) return;
    if (videoHistory.length > 0) {
      setVideoHistory((prev) => prev.slice(0, -1));
    }
    if (onSelectVideo) {
      onSelectVideo(prevVideo);
    } else {
      setInternalVideo(prevVideo);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/videos?v=${activeVideo.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: activeVideo.title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Cancelado
    }
  };

  const handleSaveOffline = async () => {
    if (!activeVideo || savingOffline || isSavedOffline) return;
    try {
      setSavingOffline(true);
      setOfflineError(null);
      const res = await fetchWithAuth(`/api/v1/videos/${activeVideo.id}/download`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.message || 'Não foi possível transferir o vídeo');
      }
      const blob = await res.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Ficheiro de vídeo vazio');
      }
      await saveOfflineMedia({
        key: `video:${activeVideo.id}`,
        id: activeVideo.id,
        type: 'video',
        title: activeVideo.title,
        subtitle: activeVideo.description || 'Vídeo PodFé',
        coverUrl: activeVideo.thumbnail_path,
        duration: activeVideo.duration,
        mimeType: blob.type || 'video/mp4',
        sizeBytes: blob.size,
        blob,
        savedAt: new Date().toISOString(),
        explicitDownload: true,
      });
      const localUrl = await getOfflineBlobUrl('video', activeVideo.id);
      setOfflineUrl(localUrl);
      setIsSavedOffline(true);
    } catch (err: any) {
      setOfflineError(err?.message || 'Erro ao guardar vídeo offline');
    } finally {
      setSavingOffline(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || submittingComment || commentsLocked) return;

    try {
      setSubmittingComment(true);
      setCommentError(null);
      const res = await fetchWithAuth(`/api/v1/videos/${activeVideo.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body, 'Não foi possível publicar o comentário.'));
      }
      setComments((prev) => [body.data, ...prev]);
      setNewComment('');
    } catch (err: any) {
      setCommentError(getFriendlyErrorMessage(err, 'Não foi possível publicar o comentário.'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const res = await fetchWithAuth(
        `/api/v1/videos/${activeVideo.id}/comments/${commentId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setComments((prev) =>
          prev.filter((c) => c.id !== commentId && Number(c.parent_id) !== commentId)
        );
      }
    } catch {
      // Silencioso
    }
  };

  const handleToggleCommentLike = async (commentId: number) => {
    if (!user) return;
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const nextLiked = !c.liked_by_me;
        return {
          ...c,
          liked_by_me: nextLiked,
          likes_count: Math.max(0, (c.likes_count || 0) + (nextLiked ? 1 : -1)),
        };
      })
    );
    try {
      const res = await fetchWithAuth(
        `/api/v1/videos/${activeVideo.id}/comments/${commentId}/like`,
        { method: 'POST' }
      );
      const body = await res.json();
      if (res.ok && body?.success && body.data) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  liked_by_me: Boolean(body.data.liked),
                  likes_count: Number(body.data.likes_count || 0),
                }
              : c
          )
        );
      }
    } catch {
      // Silencioso
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentComment: VideoComment) => {
    e.preventDefault();
    const content = replyText.trim();
    if (!content || submittingReply || commentsLocked) return;

    try {
      setSubmittingReply(true);
      setReplyError(null);
      const res = await fetchWithAuth(`/api/v1/videos/${activeVideo.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, parent_id: parentComment.id }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body, 'Não foi possível publicar a resposta.'));
      }
      const rootId = parentComment.parent_id ? Number(parentComment.parent_id) : parentComment.id;
      setComments((prev) => [body.data, ...prev]);
      setExpandedReplies((prev) => new Set(prev).add(rootId));
      setReplyText('');
      setReplyingTo(null);
    } catch (err: any) {
      setReplyError(getFriendlyErrorMessage(err, 'Não foi possível publicar a resposta.'));
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleToggleCommentsLock = async () => {
    if (!canManageLock || togglingLock) return;
    try {
      setTogglingLock(true);
      const nextLocked = !commentsLocked;
      const res = await fetchWithAuth(
        `/api/v1/videos/${activeVideo.id}/comments-lock`,
        {
          method: 'PATCH',
          body: JSON.stringify({ comments_locked: nextLocked }),
        }
      );
      const body = await res.json();
      if (res.ok && body?.success) {
        setCommentsLocked(nextLocked);
      }
    } catch {
      // Silencioso
    } finally {
      setTogglingLock(false);
    }
  };

  const descriptionText = activeVideo.description?.trim() || '';
  const isLongDescription =
    descriptionText.length > 160 || descriptionText.split('\n').length > 3;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${
          theaterMode ? 'max-w-7xl' : hasSidebar ? 'max-w-6xl' : 'max-w-5xl'
        } max-h-[92vh] bg-slate-950/95 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior de ações */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button
            onClick={() => setTheaterMode((prev) => !prev)}
            className="w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all"
            aria-label={theaterMode ? 'Modo padrão' : 'Modo cinema'}
            title={theaterMode ? 'Modo padrão' : 'Modo cinema'}
          >
            {theaterMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className={`flex flex-col ${
            hasSidebar ? 'lg:flex-row' : ''
          } overflow-y-auto`}
        >
          {/* Coluna principal: Player + Info + Comentários */}
          <div className="flex-1 min-w-0">
            <div className="relative bg-black aspect-video">
              {offlineUrl ? (
                <video
                  key={`offline-${activeVideo.id}`}
                  ref={videoRef}
                  src={offlineUrl}
                  poster={thumbUrl}
                  controls
                  autoPlay
                  playsInline
                  onCanPlay={() => {
                    videoRef.current?.play().catch(() => {});
                  }}
                  onPlay={() => {
                    if (isAudioPlaying) pauseAudio();
                  }}
                  onEnded={handleVideoEnded}
                  className="w-full h-full"
                  controlsList="nodownload"
                >
                  O teu navegador não suporta a reprodução de vídeo.
                </video>
              ) : !rawPath ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  Vídeo indisponível no momento.
                </div>
              ) : isIframeStream ? (
                <iframe
                  key={`iframe-${activeVideo.id}`}
                  src={iframeSrc}
                  title={activeVideo.title}
                  className="w-full h-full border-none"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                />
              ) : (
                <video
                  key={`direct-${activeVideo.id}`}
                  ref={videoRef}
                  src={directVideoSrc}
                  poster={thumbUrl}
                  controls
                  autoPlay
                  playsInline
                  onCanPlay={() => {
                    videoRef.current?.play().catch(() => {});
                  }}
                  onPlay={() => {
                    if (isAudioPlaying) pauseAudio();
                  }}
                  onEnded={handleVideoEnded}
                  className="w-full h-full"
                  controlsList="nodownload"
                >
                  O teu navegador não suporta a reprodução de vídeo.
                </video>
              )}
              {offlineUrl && (
                <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-[11px] font-bold">
                  <WifiOff size={12} /> Offline
                </span>
              )}
            </div>

            {/* Barra estilo YouTube: Anterior / Próximo vídeo */}
            {(prevVideo || nextVideo) && (
              <div className="flex items-center justify-between gap-2 px-5 py-2.5 bg-white/[0.03] border-b border-white/10">
                <button
                  type="button"
                  onClick={handleSelectPrev}
                  disabled={!prevVideo}
                  title={prevVideo ? `Anterior: ${prevVideo.title}` : 'Sem vídeo anterior'}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-xs font-medium text-gray-200 disabled:opacity-35 disabled:pointer-events-none transition-colors min-w-0 max-w-[48%]"
                >
                  <SkipBack size={14} className="flex-shrink-0" />
                  <span className="truncate">
                    Anterior{prevVideo ? `: ${prevVideo.title}` : ''}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => nextVideo && handleSelectNext(nextVideo)}
                  disabled={!nextVideo}
                  title={nextVideo ? `Próximo: ${nextVideo.title}` : 'Sem próximo vídeo'}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/30 text-xs font-medium text-purple-100 disabled:opacity-35 disabled:pointer-events-none transition-colors min-w-0 max-w-[48%]"
                >
                  <span className="truncate">
                    Próximo{nextVideo ? `: ${nextVideo.title}` : ''}
                  </span>
                  <SkipForward size={14} className="flex-shrink-0" />
                </button>
              </div>
            )}

            {/* Informação + Descrição com Ver Mais */}
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {activeVideo.title}
                </h2>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    disabled={!user || liking}
                    title={user ? (liked ? 'Remover gosto' : 'Gostar do vídeo') : 'Inicia sessão para gostar'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      liked
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    } disabled:opacity-60`}
                  >
                    <ThumbsUp size={14} className={liked ? 'fill-white' : ''} />
                    <span>{likesCount}</span>
                  </button>
                  <button
                    onClick={handleSaveOffline}
                    disabled={savingOffline || isSavedOffline}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSavedOffline
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    } disabled:opacity-75`}
                  >
                    {savingOffline ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isSavedOffline ? (
                      <Check size={14} />
                    ) : (
                      <Download size={14} />
                    )}
                    <span>
                      {savingOffline
                        ? 'A baixar...'
                        : isSavedOffline
                          ? 'Guardado Offline'
                          : 'Ver Offline'}
                    </span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white transition-all"
                  >
                    {copied ? (
                      <Check size={14} className="text-green-400" />
                    ) : (
                      <Share2 size={14} />
                    )}
                    <span>{copied ? 'Copiado' : 'Partilhar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-red-500/25 text-xs text-gray-200 hover:text-red-200 transition-all"
                    title="Denunciar vídeo"
                  >
                    <Flag size={13} />
                    <span>Denunciar</span>
                  </button>
                </div>
              </div>

              {offlineError && (
                <p className="text-xs text-amber-300 mt-2">{offlineError}</p>
              )}

              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye size={13} />
                  {viewsCount} visualizações
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <ThumbsUp size={12} />
                  {likesCount} gostos
                </span>
                <span>·</span>
                <span>
                  {new Date(activeVideo.created_at).toLocaleDateString('pt-PT')}
                </span>
              </div>

              {descriptionText && (
                <div className="mt-3 bg-white/5 rounded-xl p-3.5 border border-white/5">
                  <p
                    className={`text-gray-300 text-sm whitespace-pre-line ${
                      !descExpanded && isLongDescription ? 'line-clamp-3' : ''
                    }`}
                  >
                    {descriptionText}
                  </p>
                  {isLongDescription && (
                    <button
                      type="button"
                      onClick={() => setDescExpanded((prev) => !prev)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-purple-200 transition-colors"
                    >
                      {descExpanded ? (
                        <>
                          <span>Ver menos</span>
                          <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          <span>Ver mais</span>
                          <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Secção de Comentários */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <MessageSquare size={16} className="text-purple-400" />
                    <span>Comentários ({comments.length})</span>
                  </h3>

                  {canManageLock && (
                    <button
                      type="button"
                      onClick={handleToggleCommentsLock}
                      disabled={togglingLock}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        commentsLocked
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {commentsLocked ? <Lock size={12} /> : <Unlock size={12} />}
                      <span>
                        {commentsLocked
                          ? 'Destrancar comentários'
                          : 'Trancar comentários'}
                      </span>
                    </button>
                  )}
                </div>

                {commentsLocked ? (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs mb-4">
                    <Lock size={15} className="flex-shrink-0" />
                    <span>Os comentários estão trancados para este vídeo.</span>
                  </div>
                ) : user ? (
                  <form onSubmit={handleSubmitComment} className="mb-5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escreve um comentário..."
                        maxLength={2000}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim() || submittingComment}
                        className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium inline-flex items-center gap-1.5 transition-all"
                      >
                        {submittingComment ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Send size={15} />
                        )}
                        <span className="hidden sm:inline">Comentar</span>
                      </button>
                    </div>
                    {commentError && (
                      <p className="text-xs text-red-400 mt-1.5">{commentError}</p>
                    )}
                  </form>
                ) : (
                  <p className="text-xs text-gray-400 mb-4 bg-white/5 rounded-xl p-3">
                    Inicia sessão para deixar um comentário.
                  </p>
                )}

                {loadingComments ? (
                  <div className="flex justify-center py-6">
                    <Loader2 size={20} className="text-purple-400 animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-gray-500 py-3">
                    Ainda não há comentários neste vídeo.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {comments
                      .filter((c) => !c.parent_id)
                      .map((c) => {
                        const displayName = c.full_name || c.username || 'Utilizador';
                        const isStaff =
                          isAdmin ||
                          String((user as any)?.role || '').toLowerCase() === 'moderator';
                        const canDelete =
                          user &&
                          (isStaff || Number(c.user_id) === Number(user.id));
                        const replies = comments
                          .filter((r) => Number(r.parent_id) === Number(c.id))
                          .sort(
                            (a, b) =>
                              new Date(a.created_at).getTime() -
                              new Date(b.created_at).getTime()
                          );
                        const repliesExpanded = expandedReplies.has(c.id);
                        const isReplyingHere =
                          replyingTo &&
                          (replyingTo.id === c.id || Number(replyingTo.parent_id) === c.id);

                        return (
                          <div
                            key={c.id}
                            className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2.5"
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={resolveAvatarUrl(c.avatar_url)}
                                alt={displayName}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-slate-800 border border-white/10"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs font-semibold text-white truncate">
                                      {displayName}
                                    </span>
                                    <span className="text-[11px] text-gray-500">
                                      {new Date(c.created_at).toLocaleDateString('pt-PT', {
                                        day: '2-digit',
                                        month: 'short',
                                      })}
                                    </span>
                                  </div>
                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(c.id)}
                                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                      title="Apagar comentário"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-gray-300 mt-1 whitespace-pre-line break-words">
                                  {c.content}
                                </p>

                                {/* Ações do comentário: Curtir, Responder e Ver respostas */}
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCommentLike(c.id)}
                                    disabled={!user}
                                    className={`inline-flex items-center gap-1 transition-colors ${
                                      c.liked_by_me
                                        ? 'text-pink-400 font-semibold'
                                        : 'text-gray-400 hover:text-white'
                                    } disabled:opacity-50`}
                                    title={user ? 'Curtir comentário' : 'Inicia sessão para curtir'}
                                  >
                                    <Heart
                                      size={12}
                                      className={c.liked_by_me ? 'fill-pink-400' : ''}
                                    />
                                    <span>{c.likes_count || 0}</span>
                                  </button>

                                  {user && !commentsLocked && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingTo(c);
                                        setReplyText('');
                                        setReplyError(null);
                                      }}
                                      className="inline-flex items-center gap-1 text-gray-400 hover:text-purple-300 transition-colors"
                                    >
                                      <Reply size={12} />
                                      <span>Responder</span>
                                    </button>
                                  )}

                                  {replies.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedReplies((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(c.id)) next.delete(c.id);
                                          else next.add(c.id);
                                          return next;
                                        })
                                      }
                                      className="inline-flex items-center gap-1 text-purple-300 hover:text-purple-200 font-medium transition-colors"
                                    >
                                      {repliesExpanded ? (
                                        <ChevronUp size={12} />
                                      ) : (
                                        <ChevronDown size={12} />
                                      )}
                                      <span>
                                        {repliesExpanded
                                          ? 'Ocultar respostas'
                                          : `Ver ${replies.length} resposta${replies.length !== 1 ? 's' : ''}`}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Formulário inline de resposta */}
                            {isReplyingHere && replyingTo && (
                              <form
                                onSubmit={(e) => handleSubmitReply(e, replyingTo)}
                                className="ml-11 pt-1"
                              >
                                <div className="flex items-center justify-between text-[11px] text-purple-300 mb-1">
                                  <span>
                                    A responder a{' '}
                                    <strong>
                                      {replyingTo.full_name || replyingTo.username || 'Utilizador'}
                                    </strong>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyError(null);
                                    }}
                                    className="text-gray-400 hover:text-white"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Escreve a tua resposta..."
                                    maxLength={2000}
                                    autoFocus
                                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!replyText.trim() || submittingReply}
                                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium inline-flex items-center gap-1"
                                  >
                                    {submittingReply ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <Send size={12} />
                                    )}
                                    <span>Responder</span>
                                  </button>
                                </div>
                                {replyError && (
                                  <p className="text-[11px] text-red-400 mt-1">{replyError}</p>
                                )}
                              </form>
                            )}

                            {/* Lista de respostas */}
                            {replies.length > 0 && repliesExpanded && (
                              <div className="ml-11 space-y-2 pt-2 border-l-2 border-purple-500/30 pl-3">
                                {replies.map((r) => {
                                  const rName = r.full_name || r.username || 'Utilizador';
                                  const canDeleteReply =
                                    user && (isStaff || Number(r.user_id) === Number(user.id));
                                  return (
                                    <div key={r.id} className="flex items-start gap-2.5">
                                      <img
                                        src={resolveAvatarUrl(r.avatar_url)}
                                        alt={rName}
                                        className="w-6 h-6 rounded-full object-cover flex-shrink-0 bg-slate-800 border border-white/10"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                                        }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-[11px] font-semibold text-white truncate">
                                              {rName}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                              {new Date(r.created_at).toLocaleDateString('pt-PT', {
                                                day: '2-digit',
                                                month: 'short',
                                              })}
                                            </span>
                                          </div>
                                          {canDeleteReply && (
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteComment(r.id)}
                                              className="text-gray-500 hover:text-red-400 transition-colors p-0.5"
                                              title="Apagar resposta"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-300 mt-0.5 whitespace-pre-line break-words">
                                          {r.content}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1 text-[11px]">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleCommentLike(r.id)}
                                            disabled={!user}
                                            className={`inline-flex items-center gap-1 transition-colors ${
                                              r.liked_by_me
                                                ? 'text-pink-400 font-semibold'
                                                : 'text-gray-400 hover:text-white'
                                            } disabled:opacity-50`}
                                          >
                                            <Heart
                                              size={11}
                                              className={r.liked_by_me ? 'fill-pink-400' : ''}
                                            />
                                            <span>{r.likes_count || 0}</span>
                                          </button>
                                          {user && !commentsLocked && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setReplyingTo(r);
                                                setReplyText('');
                                                setReplyError(null);
                                              }}
                                              className="text-gray-400 hover:text-purple-300 transition-colors"
                                            >
                                              Responder
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barra lateral: Mix de Vídeos + Próximos vídeos (estilo YouTube) */}
          {hasSidebar && (
            <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 bg-black/30 p-4 flex-shrink-0 space-y-5">
              {mixVideos.length > 0 && (
                <div className="rounded-xl bg-gradient-to-b from-purple-900/40 to-slate-900/70 border border-purple-500/25 overflow-hidden">
                  <div className="px-3.5 py-3 border-b border-white/10 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Repeat size={14} className="text-purple-300 flex-shrink-0" />
                        <span className="truncate">O teu Mix de Vídeos</span>
                      </div>
                      <p className="text-[11px] text-purple-200/70 mt-0.5 truncate">
                        Vídeos que mais repetes
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-600/40 text-purple-200">
                      {mixVideos.length}
                    </span>
                  </div>
                  <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto">
                    {mixVideos.map((item, idx) => {
                      const isCurrent = item.id === activeVideo.id;
                      return (
                        <button
                          key={`mix-side-${item.id}`}
                          onClick={() => handleSelectNext(item)}
                          className={`w-full flex items-center gap-2.5 p-1.5 rounded-lg transition-all text-left group ${
                            isCurrent
                              ? 'bg-purple-600/25 border border-purple-500/30'
                              : 'hover:bg-white/10'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-gray-400 w-3 text-center flex-shrink-0">
                            {isCurrent ? '▶' : idx + 1}
                          </span>
                          <div className="relative w-20 aspect-video rounded overflow-hidden bg-slate-800 flex-shrink-0">
                            <img
                              src={resolveThumbUrl(item.thumbnail_path)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs font-medium line-clamp-2 ${
                                isCurrent
                                  ? 'text-purple-200'
                                  : 'text-white group-hover:text-purple-300'
                              }`}
                            >
                              {item.title}
                            </p>
                            {item.user_play_count && (
                              <p className="text-[10px] text-purple-300/80 mt-0.5 flex items-center gap-1">
                                <Repeat size={9} />
                                {item.user_play_count}×
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {upNext.length > 0 && (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                      Próximos vídeos
                    </h3>
                    <button
                      type="button"
                      onClick={toggleAutoPlay}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                        autoPlayNext
                          ? 'bg-purple-600/30 border-purple-500/40 text-purple-200'
                          : 'bg-white/5 border-white/10 text-gray-400'
                      }`}
                      title="Reproduzir o próximo vídeo automaticamente ao terminar"
                    >
                      Auto: {autoPlayNext ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {upNext.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectNext(item)}
                        className="w-full flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-white/10 transition-all text-left group"
                      >
                        <div className="relative w-28 aspect-video rounded-md overflow-hidden bg-slate-800 flex-shrink-0">
                          <img
                            src={resolveThumbUrl(item.thumbnail_path)}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play size={16} className="text-white" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {item.views ?? 0} visualizações
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>

      <ReportContentModal
        open={showReportModal}
        contentType="video"
        contentId={activeVideo?.id ?? null}
        contentTitle={activeVideo?.title}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}
