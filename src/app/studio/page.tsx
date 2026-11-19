'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Mic2,
  Play,
  Heart,
  Music,
  DiscAlbum,
  Users,
  Plus,
  Upload,
  Loader2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import PlayerBar from '@/components/PlayerBar';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { fetchWithAuth } from '@/config/api';
import { resolveCoverUrl } from '@/lib/media';

interface StudioOverview {
  artist: {
    id: number;
    name: string;
    bio?: string | null;
    image_url?: string | null;
  } | null;
  totals: {
    totalPlays: number;
    totalLikes: number;
    totalTracks: number;
    totalAlbums: number;
    followersCount: number;
  };
  albums: Array<{
    id: number;
    title: string;
    cover_url?: string | null;
    description?: string | null;
    release_date?: string | null;
    tracks_count: number;
    total_plays: number;
  }>;
  tracks: Array<{
    id: number;
    title: string;
    artist: string;
    album?: string | null;
    album_title?: string | null;
    duration?: number | null;
    file_path: string;
    file_size?: number | null;
    cover_image?: string | null;
    album_cover?: string | null;
    plays: number;
    created_at: string;
  }>;
}

export default function CreatorStudioPage() {
  const { user, loading: authLoading } = useAuth();
  const { play } = usePlayer();

  const [data, setData] = useState<StudioOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modais
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);

  // Form Artista
  const [artistName, setArtistName] = useState('');
  const [artistBio, setArtistBio] = useState('');
  const [artistPhoto, setArtistPhoto] = useState<File | null>(null);
  const [savingArtist, setSavingArtist] = useState(false);

  // Form Álbum
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [albumDate, setAlbumDate] = useState('');
  const [albumCover, setAlbumCover] = useState<File | null>(null);
  const [savingAlbum, setSavingAlbum] = useState(false);

  // Form Música
  const [trackTitle, setTrackTitle] = useState('');
  const [trackAlbumId, setTrackAlbumId] = useState('');
  const [trackAudio, setTrackAudio] = useState<File | null>(null);
  const [trackCover, setTrackCover] = useState<File | null>(null);
  const [savingTrack, setSavingTrack] = useState(false);

  const loadStudio = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWithAuth('/api/v1/studio/overview');
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.message || 'Erro ao carregar estúdio');
      }
      setData(body.data);
      if (body.data?.artist) {
        setArtistName(body.data.artist.name || '');
        setArtistBio(body.data.artist.bio || '');
      } else {
        setArtistName(user.fullName || user.username || '');
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar estúdio');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadStudio();
    }
  }, [authLoading, loadStudio]);

  const notifySuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  const handleSaveArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistName.trim()) return;
    try {
      setSavingArtist(true);
      setError(null);
      const fd = new FormData();
      fd.append('name', artistName.trim());
      if (artistBio.trim()) fd.append('bio', artistBio.trim());
      if (artistPhoto) fd.append('image', artistPhoto);

      const res = await fetchWithAuth('/api/v1/studio/artist', {
        method: 'POST',
        body: fd,
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao guardar artista');

      setShowArtistModal(false);
      setArtistPhoto(null);
      notifySuccess('Perfil de artista atualizado!');
      await loadStudio();
    } catch (err: any) {
      setError(err?.message || 'Erro ao guardar perfil de artista');
    } finally {
      setSavingArtist(false);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumTitle.trim()) return;
    try {
      setSavingAlbum(true);
      setError(null);
      const fd = new FormData();
      fd.append('title', albumTitle.trim());
      if (albumDesc.trim()) fd.append('description', albumDesc.trim());
      if (albumDate) fd.append('release_date', albumDate);
      if (albumCover) fd.append('cover', albumCover);

      const res = await fetchWithAuth('/api/v1/studio/albums', {
        method: 'POST',
        body: fd,
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao criar álbum');

      setShowAlbumModal(false);
      setAlbumTitle('');
      setAlbumDesc('');
      setAlbumDate('');
      setAlbumCover(null);
      notifySuccess('Álbum criado com sucesso!');
      await loadStudio();
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar álbum');
    } finally {
      setSavingAlbum(false);
    }
  };

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackTitle.trim() || !trackAudio) return;
    try {
      setSavingTrack(true);
      setError(null);
      const fd = new FormData();
      fd.append('title', trackTitle.trim());
      if (trackAlbumId) fd.append('album_id', trackAlbumId);
      fd.append('file', trackAudio);
      if (trackCover) fd.append('coverImage', trackCover);

      const res = await fetchWithAuth('/api/v1/studio/music', {
        method: 'POST',
        body: fd,
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao lançar música');

      setShowTrackModal(false);
      setTrackTitle('');
      setTrackAlbumId('');
      setTrackAudio(null);
      setTrackCover(null);
      notifySuccess('Música lançada na plataforma!');
      await loadStudio();
    } catch (err: any) {
      setError(err?.message || 'Erro ao lançar música');
    } finally {
      setSavingTrack(false);
    }
  };

  const handleDeleteTrack = async (id: number, title: string) => {
    if (!confirm(`Remover o lançamento "${title}"?`)) return;
    try {
      const res = await fetchWithAuth(`/api/v1/studio/music/${id}`, {
        method: 'DELETE',
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao remover música');
      notifySuccess('Música removida.');
      await loadStudio();
    } catch (err: any) {
      setError(err?.message || 'Erro ao remover música');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950/80 to-slate-950 text-white">
      <PodPlaySidebar />

      <main className="ml-0 md:ml-64 min-h-screen pb-28 transition-all duration-300">
        <Header />

        <div className="p-6 max-w-7xl mx-auto">
          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center overflow-hidden shadow-lg border border-white/15">
                {data?.artist?.image_url ? (
                  <img
                    src={resolveCoverUrl(data.artist.image_url)}
                    alt={data.artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Mic2 size={28} className="text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full">
                    Estúdio do Criador
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mt-1">
                  {data?.artist?.name || user?.fullName || user?.username || 'Meu Estúdio'}
                </h1>
                <p className="text-sm text-gray-400">
                  Gere os teus lançamentos, álbuns, capas e acompanha o alcance das tuas músicas.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowArtistModal(true)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-all"
              >
                Perfil de Artista
              </button>
              <button
                onClick={() => setShowAlbumModal(true)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium flex items-center gap-1.5 transition-all"
              >
                <DiscAlbum size={16} /> Novo Álbum
              </button>
              <button
                onClick={() => setShowTrackModal(true)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-sm font-semibold flex items-center gap-1.5 shadow-lg transition-all"
              >
                <Plus size={16} /> Lançar Música
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-sm flex items-center gap-2">
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={40} className="text-purple-400 animate-spin" />
            </div>
          ) : !user ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-gray-300">Faz login para acederes ao Estúdio do Criador.</p>
            </div>
          ) : (
            <>
              {/* Métricas do Criador */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
                <MetricCard
                  icon={<Play size={20} className="text-emerald-400" />}
                  label="Visualizações / Plays"
                  value={data?.totals.totalPlays ?? 0}
                />
                <MetricCard
                  icon={<Heart size={20} className="text-pink-400" />}
                  label="Curtidas"
                  value={data?.totals.totalLikes ?? 0}
                />
                <MetricCard
                  icon={<Music size={20} className="text-purple-400" />}
                  label="Músicas Lançadas"
                  value={data?.totals.totalTracks ?? 0}
                />
                <MetricCard
                  icon={<DiscAlbum size={20} className="text-amber-400" />}
                  label="Álbuns"
                  value={data?.totals.totalAlbums ?? 0}
                />
                <MetricCard
                  icon={<Users size={20} className="text-sky-400" />}
                  label="Seguidores"
                  value={data?.totals.followersCount ?? 0}
                />
              </div>

              {/* Álbuns */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <DiscAlbum size={20} className="text-amber-400" />
                    Os Meus Álbuns
                  </h2>
                  <button
                    onClick={() => setShowAlbumModal(true)}
                    className="text-xs text-purple-300 hover:text-white"
                  >
                    + Criar álbum
                  </button>
                </div>

                {!data?.albums?.length ? (
                  <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center text-gray-400 text-sm">
                    Ainda não criaste nenhum álbum. Cria o teu primeiro álbum com capa personalizada!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {data.albums.map((album) => (
                      <div
                        key={album.id}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-slate-800 mb-3">
                          <img
                            src={resolveCoverUrl(album.cover_url)}
                            alt={album.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-semibold text-sm truncate">{album.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {album.tracks_count} faixa{album.tracks_count !== 1 ? 's' : ''} · {album.total_plays} plays
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Músicas Lançadas */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles size={20} className="text-purple-400" />
                    Os Meus Lançamentos
                  </h2>
                  <button
                    onClick={() => setShowTrackModal(true)}
                    className="text-xs text-purple-300 hover:text-white"
                  >
                    + Lançar música
                  </button>
                </div>

                {!data?.tracks?.length ? (
                  <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center text-gray-400 text-sm">
                    Ainda não lançaste nenhuma música. Clica em &quot;Lançar Música&quot; para publicar a tua primeira faixa.
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="divide-y divide-white/10">
                      {data.tracks.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between gap-4 p-4 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() =>
                                play({
                                  id: track.id,
                                  title: track.title,
                                  artist: track.artist,
                                  album: track.album || track.album_title || null,
                                  duration: track.duration || 0,
                                  file_path: track.file_path,
                                  file_size: track.file_size || 0,
                                  cover_image: track.cover_image || track.album_cover || null,
                                  created_at: track.created_at,
                                })
                              }
                              className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 group"
                              title="Reproduzir"
                            >
                              <img
                                src={resolveCoverUrl(track.cover_image || track.album_cover)}
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Play size={18} className="text-white" />
                              </div>
                            </button>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{track.title}</p>
                              <p className="text-xs text-gray-400 truncate">
                                {track.album_title || track.album || 'Single'} ·{' '}
                                {new Date(track.created_at).toLocaleDateString('pt-PT')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-5 flex-shrink-0">
                            <span className="text-xs text-gray-300 flex items-center gap-1">
                              <Play size={13} className="text-emerald-400" />
                              {track.plays ?? 0}
                            </span>
                            <button
                              onClick={() => handleDeleteTrack(track.id, track.title)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Remover música"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <PlayerBar />

      {/* MODAL ARTISTA */}
      {showArtistModal && (
        <Modal title="Perfil de Artista" onClose={() => setShowArtistModal(false)}>
          <form onSubmit={handleSaveArtist} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nome Artístico *</label>
              <input
                type="text"
                required
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Biografia</label>
              <textarea
                rows={3}
                value={artistBio}
                onChange={(e) => setArtistBio(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Foto do Artista</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setArtistPhoto(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-300"
              />
            </div>
            <button
              type="submit"
              disabled={savingArtist}
              className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingArtist ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Guardar Perfil
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL ÁLBUM */}
      {showAlbumModal && (
        <Modal title="Criar Novo Álbum" onClose={() => setShowAlbumModal(false)}>
          <form onSubmit={handleCreateAlbum} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Título do Álbum *</label>
              <input
                type="text"
                required
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                placeholder="Ex: Adoração em Espírito"
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Data de Lançamento</label>
              <input
                type="date"
                value={albumDate}
                onChange={(e) => setAlbumDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Descrição</label>
              <textarea
                rows={2}
                value={albumDesc}
                onChange={(e) => setAlbumDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                <ImageIcon size={13} /> Foto / Capa do Álbum
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAlbumCover(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-300"
              />
            </div>
            <button
              type="submit"
              disabled={savingAlbum}
              className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingAlbum ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Criar Álbum
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL LANÇAR MÚSICA */}
      {showTrackModal && (
        <Modal title="Lançar Nova Música" onClose={() => setShowTrackModal(false)}>
          <form onSubmit={handleCreateTrack} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Título da Música *</label>
              <input
                type="text"
                required
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                placeholder="Ex: Tua Graça Me Basta"
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Álbum (opcional)</label>
              <select
                value={trackAlbumId}
                onChange={(e) => setTrackAlbumId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Single (sem álbum)</option>
                {data?.albums.map((al) => (
                  <option key={al.id} value={al.id}>
                    {al.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ficheiro de Áudio (MP3, WAV, M4A) *</label>
              <input
                type="file"
                required
                accept="audio/*"
                onChange={(e) => setTrackAudio(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Capa da Música (opcional — usa a do álbum se vazia)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setTrackCover(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-300"
              />
            </div>
            <button
              type="submit"
              disabled={savingTrack}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingTrack ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Publicar Lançamento
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString('pt-PT')}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
