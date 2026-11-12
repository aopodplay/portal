// app/player/[id]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import AddToPlaylistButton from '@/components/AddToPlaylistButton';
import {
  Play,
  Pause,
  Loader2,
  AlertCircle,
  Music as MusicIcon,
  DiscAlbum,
  ArrowLeft,
  Clock,
  Heart,
  Download,
  User as UserIcon,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { resolveCoverUrl } from '@/lib/media';
import { favoritesApi, downloadsApi, ContentType } from '@/lib/favoritesApi';
import { formatDurationOrDash, playsLabel } from '@/lib/catalogApi';

// =====================================================================
// TIPO
// =====================================================================

interface MusicDetail {
  id: number;
  title: string;
  artist: string;
  artist_id?: number | null;
  album: string | null;
  album_id?: number | null;
  duration: number | null;
  file_path: string;
  file_size: number;
  cover_image: string | null;
  plays: number;
  created_at: string;
}

// =====================================================================
// PÁGINA
// =====================================================================

export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const musicId = Number(params?.id);
  const { user } = useAuth();
  const { play, isPlaying, currentMusic } = usePlayer();

  const [music, setMusic] = useState<MusicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFavorited, setIsFavorited] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // ---------- Carregar detalhe da música ----------
  useEffect(() => {
    if (!musicId || isNaN(musicId)) {
      setError('ID inválido');
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar música (do /api/v1/music/:id)
        const res = await fetch(getApiUrl(`/api/v1/music/${musicId}`), {
          headers: getAuthHeaders(),
        });
        const body = await res.json();

        if (!res.ok || !body?.success) {
          throw new Error(body?.message || 'Música não encontrada');
        }

        if (cancelled) return;
        setMusic(body.data as MusicDetail);

        // Verificar se está favoritada
        if (user) {
          try {
            const fav = await favoritesApi.checkFavorite(musicId, 'music');
            if (!cancelled) setIsFavorited(!!fav.isFavorited);
          } catch {
            /* silencioso */
          }
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Erro ao carregar');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [musicId, user]);

  // ---------- Tocar ----------
  const handlePlay = useCallback(() => {
    if (!music) return;

    // Se já está a tocar esta música, faz toggle
    if (currentMusic?.id === music.id) {
      // togglePlay() do player
      // (o PlayerBar já mostra o botão de pausa)
      return;
    }

    // Enfileira apenas esta música (o utilizador pode depois adicionar mais)
    play(music as any, true, [music as any]);
  }, [music, currentMusic, play]);

  const isThisPlaying = currentMusic?.id === music?.id && isPlaying;

  // ---------- Favoritar ----------
  const handleToggleFavorite = async () => {
    if (!user || !music) {
      showToast('error', 'Precisas de estar logado');
      return;
    }

    try {
      const res = await favoritesApi.toggleFavorite(music.id, 'music');
      setIsFavorited(res.favorited);
      showToast('success', res.favorited ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
    } catch (e: any) {
      showToast('error', e?.message || 'Erro ao favoritar');
    }
  };

  // ---------- Download ----------
  const handleDownload = async () => {
    if (!user || !music) {
      showToast('error', 'Precisas de estar logado');
      return;
    }

    try {
      setDownloading(true);
      const { blob, fileName } = await downloadsApi.download(music.id, 'music', 'high');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || music.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', `Download: ${fileName}`);
    } catch (e: any) {
      showToast('error', e?.message || 'Erro ao descarregar');
    } finally {
      setDownloading(false);
    }
  };

  // =====================================================================
  // RENDER — Loading
  // =====================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <PodPlaySidebar />
        <main className="ml-64 min-h-screen flex items-center justify-center">
          <Loader2 size={48} className="text-purple-500 animate-spin" />
        </main>
      </div>
    );
  }

  // =====================================================================
  // RENDER — Erro
  // =====================================================================

  if (error || !music) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <PodPlaySidebar />
        <main className="ml-64 min-h-screen flex flex-col items-center justify-center gap-4">
          <AlertCircle size={48} className="text-red-400" />
          <p className="text-red-300">{error || 'Música não encontrada'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm"
          >
            Voltar
          </button>
        </main>
        <PlayerBar />
      </div>
    );
  }

  // =====================================================================
  // RENDER — Normal
  // =====================================================================

  const cover = resolveCoverUrl(music.cover_image ?? undefined);
  const plays = music.plays ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-64 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="p-6">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          <div className="grid md:grid-cols-[300px_1fr] gap-8 max-w-5xl">
            {/* Capa */}
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-purple-900/40 shadow-2xl">
              {music.cover_image ? (
                <img
                  src={cover}
                  alt={music.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/default-cover.svg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MusicIcon size={80} className="text-white/30" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Música
              </span>

              <h1 className="text-3xl md:text-4xl font-bold text-white mt-1 break-words">
                {music.title}
              </h1>

              {/* Artista */}
              {music.artist_id ? (
                <Link
                  href={`/artists/${music.artist_id}`}
                  className="text-purple-300 hover:text-white text-base mt-2 inline-flex items-center gap-1"
                >
                  <UserIcon size={16} />
                  {music.artist}
                </Link>
              ) : (
                <p className="text-gray-400 text-base mt-2">{music.artist}</p>
              )}

              {/* Álbum */}
              {music.album && music.album_id && (
                <Link
                  href={`/albums/${music.album_id}`}
                  className="text-gray-400 hover:text-purple-300 text-sm mt-1 inline-flex items-center gap-1"
                >
                  <DiscAlbum size={14} />
                  {music.album}
                </Link>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Play size={12} />
                  {playsLabel(plays)}
                </span>
                {music.duration && music.duration > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDurationOrDash(music.duration)}
                  </span>
                )}
              </div>

              {/* Botões */}
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={handlePlay}
                  disabled={isThisPlaying}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white rounded-full font-medium flex items-center gap-2 transition-all"
                >
                  {isThisPlaying ? (
                    <>
                      <Pause size={18} /> A tocar...
                    </>
                  ) : (
                    <>
                      <Play size={18} /> Reproduzir
                    </>
                  )}
                </button>

                <button
                  onClick={handleToggleFavorite}
                  className={`px-4 py-3 rounded-full font-medium flex items-center gap-2 transition-all ${
                    isFavorited
                      ? 'bg-red-500/90 hover:bg-red-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <Heart size={18} className={isFavorited ? 'fill-white' : ''} />
                </button>

                <div>
                  <AddToPlaylistButton musicId={music.id} />
                </div>

                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white rounded-full font-medium flex items-center gap-2 transition-all"
                  title="Descarregar"
                >
                  {downloading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                </button>
              </div>

              {/* Nota informativa */}
              <p className="text-xs text-gray-500 mt-6">
                Ao clicar em <strong>Reproduzir</strong>, a música toca no player global
                em baixo e continua mesmo que mudes de página.
              </p>
            </div>
          </div>
        </div>
      </main>

      <PlayerBar />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-24 right-6 z-50 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-green-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}