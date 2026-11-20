'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import ActionModal, { ActionModalConfig } from '@/components/ActionModal';
import AddToPlaylistButton from '@/components/AddToPlaylistButton';
import {
  Play,
  Pause,
  Shuffle,
  Loader2,
  AlertCircle,
  Music as MusicIcon,
  DiscAlbum,
  ArrowLeft,
  Users,
  Heart,
  UserCheck,
  BadgeCheck,
  Share2,
  ListPlus,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { fetchWithAuth } from '@/config/api';
import { resolveCoverUrl } from '@/lib/media';
import {
  catalogApi,
  formatDurationOrDash,
  playsLabel,
  followersLabel,
  getArtistHref,
  type Artist,
  type Album,
  type MusicTrack,
} from '@/lib/catalogApi';
import { getFriendlyErrorMessage } from '@/lib/errorHandler';

// Importamos o tipo MusicItem do seu Context
import type { MusicItem } from '@/contexts/PlayerContext';

// =====================================================================
// TRACK ROW
// =====================================================================

function TrackRow({
  index,
  track,
  isCurrent,
  isPlaying,
  onPlay,
  onAddToQueue,
}: {
  index: number;
  track: MusicTrack;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onAddToQueue?: () => void;
}) {
  const cover = resolveCoverUrl(track.cover_image ?? undefined);

  return (
    <div
      onClick={onPlay}
      className={`group grid grid-cols-[32px_1fr_auto_auto] sm:grid-cols-[40px_2fr_1.5fr_1fr_80px] gap-3 items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isCurrent ? 'bg-purple-600/20' : 'hover:bg-white/5'
      }`}
    >
      <div className="flex items-center justify-center">
        {isCurrent && isPlaying ? (
          <div className="flex gap-0.5">
            <span className="w-0.5 h-3 bg-purple-400 rounded animate-pulse" />
            <span className="w-0.5 h-4 bg-purple-400 rounded animate-pulse delay-75" />
            <span className="w-0.5 h-2 bg-purple-400 rounded animate-pulse delay-150" />
          </div>
        ) : (
          <>
            <span className="text-gray-400 text-sm group-hover:hidden tabular-nums">
              {index + 1}
            </span>
            <Play size={14} className="text-white hidden group-hover:block" />
          </>
        )}
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded bg-purple-600/30 flex-shrink-0 overflow-hidden hidden sm:block">
          {track.cover_image ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <MusicIcon size={18} className="text-white/50 m-auto mt-2.5" />
          )}
        </div>
        <div className="min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              isCurrent ? 'text-purple-300' : 'text-white'
            }`}
          >
            {track.title}
          </p>
          <p className="text-gray-400 text-xs truncate">{track.artist}</p>
        </div>
      </div>

      <p className="text-gray-400 text-xs truncate hidden sm:block">
        {track.album || '—'}
      </p>

      <p className="text-gray-400 text-xs tabular-nums hidden sm:block">
        {playsLabel(track.plays ?? 0)}
      </p>

      <div className="flex items-center justify-end gap-2">
        <span className="text-gray-400 text-xs tabular-nums">
          {formatDurationOrDash(track.duration)}
        </span>
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {onAddToQueue && (
            <button
              type="button"
              onClick={onAddToQueue}
              title="Adicionar à fila"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <ListPlus size={14} />
            </button>
          )}
          <AddToPlaylistButton musicId={track.id} />
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// PÁGINA
// =====================================================================

export default function ArtistPage() {
  const params = useParams();
  const router = useRouter();
  const rawArtistParam = String(params?.id || '').trim();
  const { user } = useAuth();
  const { play, addToQueue, isPlaying, currentMusic } = usePlayer();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [top, setTop] = useState<MusicTrack[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [allTracks, setAllTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState<ActionModalConfig | null>(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donateAmount, setDonateAmount] = useState('1000');
  const [donateMessage, setDonateMessage] = useState('');
  const [donating, setDonating] = useState(false);

  // =====================================================================
  // Carregar dados
  // =====================================================================
  useEffect(() => {
    if (!rawArtistParam) {
      setError('Artista não encontrado.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const a = await catalogApi.getArtist(rawArtistParam);
        if (cancelled) return;

        // Se acedeu por ID numérico, atualiza a URL para o slug amigável
        if (/^\d+$/.test(rawArtistParam) && a?.name) {
          const prettyHref = getArtistHref(a.id, a.name);
          if (prettyHref !== `/artists/${rawArtistParam}`) {
            router.replace(prettyHref);
          }
        }

        const [t, al, music] = await Promise.all([
          catalogApi.getArtistTop(a.id, 5),
          catalogApi.getArtistAlbums(a.id),
          catalogApi.getArtistMusic(a.id),
        ]);

        if (cancelled) return;

        setArtist(a);
        setTop(t);
        setAlbums(al);
        setAllTracks(music);
        setFollowersCount(a.followers_count ?? 0);

        // Verifica se o user segue este artista
        if (user) {
          try {
            const res = await catalogApi.checkFollowing(a.id);
            if (!cancelled) setIsFollowing(res.following);
          } catch {
            /* silencioso */
          }
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(getFriendlyErrorMessage(err, 'Não foi possível carregar este artista.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawArtistParam, user, router]);

  // =====================================================================
  // Toggle Follow
  // =====================================================================
  const handleToggleFollow = async () => {
    if (!artist) return;
    if (!user) {
      alert('Precisas de estar logado para seguir artistas');
      return;
    }
    try {
      setFollowLoading(true);
      const res = await catalogApi.toggleFollow(artist.id);
      setIsFollowing(res.following);
      setFollowersCount(res.followers_count);
    } catch (e: any) {
      alert(getFriendlyErrorMessage(e, 'Não foi possível atualizar o estado de seguidor.'));
    } finally {
      setFollowLoading(false);
    }
  };

  // =====================================================================
  // Play / Shuffle
  // =====================================================================
  const handlePlayTop = useCallback(() => {
    if (top.length === 0) return;
    play(top[0] as unknown as MusicItem, true, top as unknown as MusicItem[]);
  }, [top, play]);

  const handlePlayAll = useCallback(() => {
    if (allTracks.length === 0) return;
    play(allTracks[0] as unknown as MusicItem, true, allTracks as unknown as MusicItem[]);
  }, [allTracks, play]);

  const handleShufflePlay = useCallback(() => {
    if (allTracks.length === 0) return;
    const random = allTracks[Math.floor(Math.random() * allTracks.length)];
    play(random as unknown as MusicItem, true, allTracks as unknown as MusicItem[]);
  }, [allTracks, play]);

  const playTrack = (track: MusicTrack, list: MusicTrack[]) => {
    play(track as unknown as MusicItem, true, list as unknown as MusicItem[]);
  };

  const totalMinutes = Math.round(
    allTracks.reduce((s, t) => s + (t.duration ?? 0), 0) / 60
  );

  // =====================================================================
  // LOADING
  // =====================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <PodPlaySidebar />
        <main className="ml-0 md:ml-64 min-h-screen flex items-center justify-center">
          <Loader2 size={48} className="text-purple-500 animate-spin" />
        </main>
      </div>
    );
  }

  // =====================================================================
  // ERRO
  // =====================================================================

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <PodPlaySidebar />
        <main className="ml-0 md:ml-64 min-h-screen flex flex-col items-center justify-center gap-4">
          <AlertCircle size={48} className="text-red-400" />
          <p className="text-red-300">{error || 'Artista não encontrado'}</p>
          <button
            onClick={() => router.push('/artists')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm"
          >
            Voltar aos artistas
          </button>
        </main>
        {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-full bg-slate-900/95 border border-purple-500/40 text-white text-xs font-medium shadow-2xl flex items-center gap-2 backdrop-blur-md">
          <Check size={14} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <PlayerBar />
      </div>
    );
  }

  // =====================================================================
  // NORMAL
  // =====================================================================

  const cover = resolveCoverUrl(artist.image_url ?? undefined);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-0 md:ml-60 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="p-6">
          <button
            onClick={() => router.push('/artists')}
            className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Todos os artistas
          </button>

          {/* ===================== HEADER DO ARTISTA ===================== */}
          <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-purple-700 via-pink-700 to-purple-800">
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-end">
              {/* Foto do artista */}
              <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden bg-purple-900/60 flex-shrink-0 shadow-2xl flex items-center justify-center ring-4 ring-white/10">
                {artist.image_url ? (
                  <img
                    src={cover}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users size={80} className="text-white/40" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                  Artista
                </span>
                <div className="flex items-center gap-2.5 mt-2">
                  <h1 className="text-3xl md:text-6xl font-bold text-white truncate">
                    {artist.name}
                  </h1>
                  {Boolean((artist as any).is_verified) && (
                    <BadgeCheck size={28} className="text-sky-400 shrink-0" />
                  )}
                </div>

                {/* Contadores */}
                <p className="text-purple-100 text-sm mt-3">
                  {artist.tracks_count ?? 0}{' '}
                  {(artist.tracks_count ?? 0) === 1 ? 'música' : 'músicas'}
                  {artist.albums_count
                    ? ` · ${artist.albums_count} ${
                        artist.albums_count === 1 ? 'álbum' : 'álbuns'
                      }`
                    : ''}
                  {followersCount > 0
                    ? ` · ${followersLabel(followersCount)}`
                    : ''}
                </p>

                {/* Bio */}
                {artist.bio ? (
                  <p className="text-purple-100 text-sm mt-3 line-clamp-3 max-w-2xl">
                    {artist.bio}
                  </p>
                ) : (
                  <p className="text-purple-200/60 text-sm mt-3 italic">
                    Sem biografia
                  </p>
                )}

                {/* Seguir + Reproduzir */}
                <div className="flex flex-wrap items-center gap-3 mt-6">
                  <button
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                    className={`px-5 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-60 ${
                      isFollowing
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {followLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isFollowing ? (
                      <UserCheck size={14} />
                    ) : (
                      <Heart size={14} />
                    )}
                    {isFollowing ? 'A seguir' : 'Seguir'}
                  </button>

                  <button
                    onClick={handlePlayAll}
                    disabled={allTracks.length === 0}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Play size={16} /> Reproduzir tudo
                  </button>

                  <button
                    onClick={handleShufflePlay}
                    disabled={allTracks.length === 0}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Shuffle size={16} /> Aleatório
                  </button>

                  <button
                    onClick={() => setShowDonateModal(true)}
                    className="px-4 py-2.5 bg-pink-600/80 hover:bg-pink-500 text-white rounded-full font-medium text-sm flex items-center gap-2"
                  >
                    <Heart size={15} /> Apoiar Criador
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const shareUrl = `${window.location.origin}${getArtistHref(artist.id, artist.name)}`;
                      try {
                        if (navigator.share) {
                          await navigator.share({ title: artist.name, url: shareUrl });
                          return;
                        }
                        await navigator.clipboard.writeText(shareUrl);
                        setToast('Link do artista copiado!');
                      } catch {
                        setToast('Link pronto a partilhar.');
                      }
                    }}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium text-sm flex items-center gap-2"
                  >
                    <Share2 size={15} /> Partilhar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ===================== MÚSICAS POPULARES ===================== */}
          {top.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Músicas populares
                </h2>
                <button
                  onClick={handlePlayTop}
                  className="text-sm text-purple-300 hover:text-white flex items-center gap-1"
                >
                  Reproduzir todas <Play size={14} />
                </button>
              </div>
              <div className="space-y-1">
                {top.map((track, i) => (
                  <TrackRow
                    key={track.id}
                    index={i}
                    track={track}
                    isCurrent={currentMusic?.id === track.id}
                    isPlaying={isPlaying}
                    onPlay={() => playTrack(track, top)}
                    onAddToQueue={() => {
                      addToQueue({
                        id: track.id,
                        title: track.title,
                        artist: track.artist || artist?.name || 'Artista',
                        album: track.album || null,
                        duration: track.duration || 0,
                        file_path: track.file_path || '',
                        file_size: track.file_size || 0,
                        cover_image: track.cover_image || null,
                        created_at: track.created_at || new Date().toISOString(),
                      });
                      setToast(`"${track.title}" adicionada à fila`);
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ===================== ÁLBUNS ===================== */}
          {albums.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4">Álbuns</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album) => {
                  const albumCover = resolveCoverUrl(album.cover_url ?? undefined);
                  return (
                    <Link
                      key={album.id}
                      href={`/albums/${album.id}`}
                      className="group"
                    >
                      <div className="relative rounded-lg overflow-hidden aspect-square mb-2 bg-purple-900/30 flex items-center justify-center">
                        {album.cover_url ? (
                          <img
                            src={albumCover}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <DiscAlbum size={48} className="text-white/40" />
                        )}
                      </div>
                      <h4 className="font-medium text-sm truncate text-white">
                        {album.title}
                      </h4>
                      <p className="text-gray-400 text-xs truncate">
                        {album.release_date
                          ? new Date(album.release_date).getFullYear()
                          : `${album.tracks_count ?? 0} faixas`}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ===================== TODAS AS MÚSICAS ===================== */}
          {allTracks.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Todas as músicas
                </h2>
                <p className="text-sm text-gray-400">
                  {allTracks.length}{' '}
                  {allTracks.length === 1 ? 'música' : 'músicas'}
                  {totalMinutes > 0 ? ` · ~${totalMinutes} min` : ''}
                </p>
              </div>
              <div className="space-y-1">
                {allTracks.map((track, i) => (
                  <TrackRow
                    key={track.id}
                    index={i}
                    track={track}
                    isCurrent={currentMusic?.id === track.id}
                    isPlaying={isPlaying}
                    onPlay={() => playTrack(track, allTracks)}
                  />
                ))}
              </div>
            </section>
          )}

          {allTracks.length === 0 &&
            albums.length === 0 &&
            top.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                Este artista ainda não tem músicas publicadas.
              </div>
            )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-full bg-slate-900/95 border border-purple-500/40 text-white text-xs font-medium shadow-2xl flex items-center gap-2 backdrop-blur-md">
          <Check size={14} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <PlayerBar />
      <ActionModal config={modalConfig} onClose={() => setModalConfig(null)} />

      {showDonateModal && artist && (
        <div
          className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !donating && setShowDonateModal(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Heart size={18} className="text-pink-400" />
              Apoiar {artist.name}
            </h3>
            <p className="text-xs text-gray-400">
              90% do valor vai diretamente para o criador (mínimo AOA 500).
            </p>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Valor (AOA)</label>
              <input
                type="number"
                min={500}
                value={donateAmount}
                onChange={(e) => setDonateAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Mensagem (opcional)</label>
              <textarea
                rows={2}
                value={donateMessage}
                onChange={(e) => setDonateMessage(e.target.value)}
                placeholder="Deixa uma palavra de encorajamento..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDonateModal(false)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={donating}
                onClick={async () => {
                  const amount = Number(donateAmount);
                  if (!Number.isFinite(amount) || amount < 500) {
                    setModalConfig({
                      mode: 'alert',
                      title: 'Valor inválido',
                      message: 'O valor mínimo de apoio é AOA 500.',
                      danger: true,
                    });
                    return;
                  }
                  try {
                    setDonating(true);
                    const res = await fetchWithAuth(`/api/v1/studio/donate/${artist.id}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        amount_aoa: amount,
                        donor_name: user?.fullName || user?.username || 'Ouvinte PodFéPlay',
                        message: donateMessage.trim(),
                        payment_method: 'multicaixa',
                      }),
                    });
                    const b = await res.json();
                    if (!res.ok || !b?.success) throw new Error(b?.message || 'Erro ao enviar apoio');
                    setShowDonateModal(false);
                    setDonateMessage('');
                    setModalConfig({
                      mode: 'alert',
                      title: 'Apoio registado!',
                      message: 'Obrigado! O teu apoio foi registado (90% vai diretamente para o criador).',
                    });
                  } catch (e: any) {
                    setModalConfig({
                      mode: 'alert',
                      title: 'Erro ao enviar apoio',
                      message: e?.message || 'Erro ao enviar apoio',
                      danger: true,
                    });
                  } finally {
                    setDonating(false);
                  }
                }}
                className="px-5 py-2 rounded-full bg-pink-600 hover:bg-pink-500 text-xs font-semibold text-white disabled:opacity-50"
              >
                {donating ? 'A enviar...' : 'Confirmar Apoio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}