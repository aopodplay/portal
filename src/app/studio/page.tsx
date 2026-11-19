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
  Calendar,
  Clock,
  BadgeCheck,
  Send,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import Header from '@/components/layout/Header';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import PlayerBar from '@/components/PlayerBar';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { fetchWithAuth } from '@/config/api';
import { resolveCoverUrl } from '@/lib/media';

interface StudioOverview {
  verification?: {
    isVerified: boolean;
    request: {
      id: number;
      artist_name: string;
      bio?: string | null;
      genre?: string | null;
      status: 'pending' | 'approved' | 'rejected';
      rejection_reason?: string | null;
      created_at: string;
    } | null;
  };
  artist: {
    id: number;
    name: string;
    bio?: string | null;
    image_url?: string | null;
    is_verified?: number | boolean;
  } | null;
  totals: {
    totalPlays: number;
    totalLikes: number;
    totalTracks: number;
    totalAlbums: number;
    followersCount: number;
    scheduledCount?: number;
  };
  albums: Array<{
    id: number;
    title: string;
    cover_url?: string | null;
    description?: string | null;
    release_date?: string | null;
    status?: 'published' | 'scheduled' | 'draft';
    scheduled_at?: string | null;
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
    release_type?: 'single' | 'album';
    category?: string | null;
    status?: 'published' | 'scheduled' | 'draft';
    scheduled_at?: string | null;
    plays: number;
    created_at: string;
  }>;
  recentFollowers?: Array<{
    id: number;
    username: string;
    full_name?: string | null;
    avatar_url?: string | null;
    followed_at: string;
  }>;
  playsByDay?: Array<{
    day: string;
    total: number;
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
  const [albumScheduleMode, setAlbumScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [albumScheduledAt, setAlbumScheduledAt] = useState('');
  const [albumCover, setAlbumCover] = useState<File | null>(null);
  const [savingAlbum, setSavingAlbum] = useState(false);

  // Form Música / Single
  const [trackTitle, setTrackTitle] = useState('');
  const [trackAlbumId, setTrackAlbumId] = useState('');
  const [trackCategory, setTrackCategory] = useState('musica');
  const [trackScheduleMode, setTrackScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [trackScheduledAt, setTrackScheduledAt] = useState('');
  const [trackAudio, setTrackAudio] = useState<File | null>(null);
  const [trackCover, setTrackCover] = useState<File | null>(null);
  const [savingTrack, setSavingTrack] = useState(false);

  // Tabs & Solicitação de Verificação
  const [studioTab, setStudioTab] = useState<'analytics' | 'content' | 'schedule' | 'followers'>('analytics');
  const [reqArtistName, setReqArtistName] = useState('');
  const [reqGenre, setReqGenre] = useState('');
  const [reqBio, setReqBio] = useState('');
  const [reqInstagram, setReqInstagram] = useState('');
  const [reqPortfolio, setReqPortfolio] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

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
      if (albumScheduleMode === 'scheduled' && albumScheduledAt) {
        fd.append('status', 'scheduled');
        fd.append('scheduled_at', new Date(albumScheduledAt).toISOString());
      } else {
        fd.append('status', 'published');
      }
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
      setAlbumScheduleMode('now');
      setAlbumScheduledAt('');
      setAlbumCover(null);
      notifySuccess(
        albumScheduleMode === 'scheduled' && albumScheduledAt
          ? 'Álbum agendado com sucesso!'
          : 'Álbum criado com sucesso!'
      );
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
      fd.append('release_type', trackAlbumId ? 'album' : 'single');
      fd.append('category', trackCategory);
      if (trackScheduleMode === 'scheduled' && trackScheduledAt) {
        fd.append('status', 'scheduled');
        fd.append('scheduled_at', new Date(trackScheduledAt).toISOString());
      } else {
        fd.append('status', 'published');
      }
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
      setTrackCategory('musica');
      setTrackScheduleMode('now');
      setTrackScheduledAt('');
      setTrackAudio(null);
      setTrackCover(null);
      notifySuccess(
        trackScheduleMode === 'scheduled' && trackScheduledAt
          ? 'Lançamento agendado com sucesso!'
          : 'Música lançada na plataforma!'
      );
      await loadStudio();
    } catch (err: any) {
      setError(err?.message || 'Erro ao lançar música');
    } finally {
      setSavingTrack(false);
    }
  };

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqArtistName.trim()) return;
    try {
      setSubmittingReq(true);
      setError(null);
      const res = await fetchWithAuth('/api/v1/studio/request-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist_name: reqArtistName.trim(),
          genre: reqGenre.trim() || null,
          bio: reqBio.trim() || null,
          instagram_url: reqInstagram.trim() || null,
          portfolio_url: reqPortfolio.trim() || null,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao enviar solicitação');
      notifySuccess('Solicitação enviada! Aguarda a aprovação da administração.');
      await loadStudio();
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar solicitação');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handlePublishNow = async (kind: 'music' | 'albums', id: number) => {
    try {
      const res = await fetchWithAuth(`/api/v1/studio/${kind}/${id}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published', scheduled_at: null }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao publicar');
      notifySuccess('Publicado agora na plataforma!');
      await loadStudio();
    } catch (err: any) {
      setError(err?.message || 'Erro ao publicar');
    }
  };

  const handleDeleteAlbum = async (id: number, title: string) => {
    if (!confirm(`Remover o álbum "${title}"?`)) return;
    try {
      const res = await fetchWithAuth(`/api/v1/studio/albums/${id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao remover álbum');
      notifySuccess('Álbum removido.');
      await loadStudio();
    } catch (err: any) {
      setError(err?.message || 'Erro ao remover álbum');
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
                  {data?.verification?.isVerified && (
                    <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <BadgeCheck size={13} /> Artista Verificado
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mt-1">
                  {data?.artist?.name || user?.fullName || user?.username || 'Meu Estúdio'}
                </h1>
                <p className="text-sm text-gray-400">
                  Gere os teus lançamentos, singles, álbuns, agendamentos e acompanha os teus seguidores.
                </p>
              </div>
            </div>

            {data?.verification?.isVerified && (
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
                  <Plus size={16} /> Lançar Música / Single
                </button>
              </div>
            )}
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
          ) : !data?.verification?.isVerified ? (
            <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
                  <BadgeCheck size={24} className="text-purple-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Verificação de Artista</h2>
                  <p className="text-xs text-gray-400">
                    Solicita aprovação para ganhares o selo de artista verificado e acederes ao teu painel Estúdio.
                  </p>
                </div>
              </div>

              {data?.verification?.request?.status === 'pending' ? (
                <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Clock size={16} /> Solicitação em análise pela administração
                  </div>
                  <p className="text-xs text-amber-100/80">
                    Nome artístico solicitado: <strong>{data.verification.request.artist_name}</strong>. Assim que for aprovada no Controlo Geral, poderás publicar músicas, singles, álbuns e agendar lançamentos.
                  </p>
                </div>
              ) : (
                <>
                  {data?.verification?.request?.status === 'rejected' && (
                    <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs space-y-1">
                      <p className="font-semibold">A tua solicitação anterior foi rejeitada.</p>
                      {data.verification.request.rejection_reason && (
                        <p>Motivo: {data.verification.request.rejection_reason}</p>
                      )}
                      <p className="text-red-200/80">Podes atualizar os teus dados e enviar uma nova solicitação abaixo.</p>
                    </div>
                  )}

                  <form onSubmit={handleRequestVerification} className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Nome Artístico *</label>
                      <input
                        type="text"
                        required
                        value={reqArtistName}
                        onChange={(e) => setReqArtistName(e.target.value)}
                        placeholder={user.fullName || user.username || 'Ex: Ministério Vida'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Estilo / Género Musical</label>
                        <input
                          type="text"
                          value={reqGenre}
                          onChange={(e) => setReqGenre(e.target.value)}
                          placeholder="Ex: Louvor, Adoração, Gospel"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Instagram / Rede Social</label>
                        <input
                          type="text"
                          value={reqInstagram}
                          onChange={(e) => setReqInstagram(e.target.value)}
                          placeholder="@teu_perfil"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Link de Portfólio / Canal (opcional)</label>
                      <input
                        type="text"
                        value={reqPortfolio}
                        onChange={(e) => setReqPortfolio(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Sobre ti / Ministério</label>
                      <textarea
                        rows={3}
                        value={reqBio}
                        onChange={(e) => setReqBio(e.target.value)}
                        placeholder="Conta um pouco sobre a tua música e ministério..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReq}
                      className="w-full py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submittingReq ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Solicitar Verificação de Artista
                    </button>
                  </form>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Métricas do Criador */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                <MetricCard
                  icon={<Users size={20} className="text-sky-400" />}
                  label="Seguidores"
                  value={data?.totals.followersCount ?? 0}
                  onClick={() => setStudioTab('followers')}
                />
                <MetricCard
                  icon={<Play size={20} className="text-emerald-400" />}
                  label="Visualizações / Plays"
                  value={data?.totals.totalPlays ?? 0}
                  onClick={() => setStudioTab('analytics')}
                />
                <MetricCard
                  icon={<Heart size={20} className="text-pink-400" />}
                  label="Curtidas"
                  value={data?.totals.totalLikes ?? 0}
                  onClick={() => setStudioTab('analytics')}
                />
                <MetricCard
                  icon={<Music size={20} className="text-purple-400" />}
                  label="Músicas & Singles"
                  value={data?.totals.totalTracks ?? 0}
                  onClick={() => setStudioTab('content')}
                />
                <MetricCard
                  icon={<DiscAlbum size={20} className="text-amber-400" />}
                  label="Álbuns"
                  value={data?.totals.totalAlbums ?? 0}
                  onClick={() => setStudioTab('content')}
                />
                <MetricCard
                  icon={<Calendar size={20} className="text-indigo-400" />}
                  label="Agendados"
                  value={data?.totals.scheduledCount ?? 0}
                  onClick={() => setStudioTab('schedule')}
                />
              </div>

              {/* Tabs do Estúdio */}
              <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-3">
                {[
                  { key: 'analytics', label: 'Estatísticas & Gráficos', icon: BarChart3 },
                  { key: 'content', label: 'Conteúdos (Álbuns & Singles)', icon: Music },
                  {
                    key: 'schedule',
                    label: `Agendamentos (${data?.totals.scheduledCount ?? 0})`,
                    icon: Calendar,
                  },
                  {
                    key: 'followers',
                    label: `Seguidores (${data?.totals.followersCount ?? 0})`,
                    icon: Users,
                  },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setStudioTab(t.key as any)}
                    className={`px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
                      studioTab === t.key
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <t.icon size={15} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {studioTab === 'analytics' ? (
                <section className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
                      <h2 className="text-base font-bold text-white mb-1">
                        Reproduções das Tuas Músicas (Últimos 14 dias)
                      </h2>
                      <p className="text-xs text-gray-400 mb-4">
                        Evolução diária de plays nas tuas faixas
                      </p>
                      <div className="h-64 w-full">
                        {(() => {
                          const raw = data?.playsByDay || [];
                          const map = new Map(
                            raw.map((d) => [String(d.day).slice(0, 10), Number(d.total || 0)])
                          );
                          const chartDays: Array<{ day: string; total: number }> = [];
                          for (let i = 13; i >= 0; i--) {
                            const dt = new Date(Date.now() - i * 86400_000);
                            const iso = dt.toISOString().slice(0, 10);
                            chartDays.push({
                              day: `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`,
                              total: map.get(iso) || 0,
                            });
                          }
                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartDays} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="studioPlaysGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.55} />
                                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.02} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#0F172A',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '12px',
                                  }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="total"
                                  name="Plays"
                                  stroke="#C084FC"
                                  strokeWidth={2.5}
                                  fill="url(#studioPlaysGrad)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col">
                      <h2 className="text-base font-bold text-white mb-1">Distribuição de Conteúdos</h2>
                      <p className="text-xs text-gray-400 mb-3">Singles, Álbum e Agendamentos</p>
                      {(() => {
                        const tracks = data?.tracks || [];
                        const singlesCount = tracks.filter((t) => !t.album_title && !t.album && t.status !== 'scheduled').length;
                        const albumTracksCount = tracks.filter((t) => Boolean(t.album_title || t.album) && t.status !== 'scheduled').length;
                        const scheduledCount = tracks.filter((t) => t.status === 'scheduled').length;
                        const pieData = [
                          { name: 'Singles', value: singlesCount, color: '#EC4899' },
                          { name: 'Faixas de Álbum', value: albumTracksCount, color: '#A855F7' },
                          { name: 'Agendados', value: scheduledCount, color: '#38BDF8' },
                        ].filter((d) => d.value > 0);
                        if (pieData.length === 0) {
                          return (
                            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 text-center">
                              Lança a tua primeira música ou álbum para visualizar a distribuição.
                            </div>
                          );
                        }
                        return (
                          <>
                            <div className="h-44 w-full flex-1">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={42}
                                    outerRadius={68}
                                    paddingAngle={4}
                                  >
                                    {pieData.map((entry, idx) => (
                                      <Cell key={`spie-${idx}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#0F172A',
                                      border: '1px solid rgba(255,255,255,0.15)',
                                      borderRadius: '12px',
                                      color: '#fff',
                                      fontSize: '12px',
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="space-y-1.5 mt-2">
                              {pieData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between text-xs bg-white/5 px-2.5 py-1.5 rounded-lg">
                                  <span className="flex items-center gap-1.5 text-gray-300">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    {item.name}
                                  </span>
                                  <span className="font-bold text-white">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h2 className="text-base font-bold text-white mb-1">Top Músicas por Reproduções</h2>
                    <p className="text-xs text-gray-400 mb-4">As tuas faixas com maior alcance na plataforma</p>
                    <div className="h-64 w-full">
                      {!(data?.tracks || []).length ? (
                        <div className="h-full flex items-center justify-center text-xs text-gray-400">
                          Sem faixas lançadas ainda.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[...(data?.tracks || [])]
                              .sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0))
                              .slice(0, 6)
                              .map((t) => ({
                                name: String(t.title || '').slice(0, 16),
                                plays: Number(t.plays || 0),
                              }))}
                            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} allowDecimals={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0F172A',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '12px',
                              }}
                            />
                            <Bar dataKey="plays" name="Plays" fill="#10B981" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </section>
              ) : studioTab === 'schedule' ? (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Calendar size={20} className="text-indigo-400" />
                    Conteúdos Agendados
                  </h2>
                  {(() => {
                    const scheduledTracks = (data?.tracks || []).filter((t) => t.status === 'scheduled');
                    const scheduledAlbums = (data?.albums || []).filter((a) => a.status === 'scheduled');
                    if (scheduledTracks.length === 0 && scheduledAlbums.length === 0) {
                      return (
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center text-gray-400 text-sm">
                          Nenhum conteúdo agendado no momento. Ao criar um álbum ou música/single, podes escolher &quot;Agendar lançamento&quot;.
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-3">
                        {scheduledAlbums.map((al) => (
                          <div
                            key={`sched-album-${al.id}`}
                            className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-4"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={resolveCoverUrl(al.cover_url)}
                                alt={al.title}
                                className="w-12 h-12 rounded-lg object-cover bg-slate-800"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{al.title}</p>
                                <p className="text-xs text-indigo-300 flex items-center gap-1 mt-0.5">
                                  <Clock size={12} /> Álbum agendado para{' '}
                                  {al.scheduled_at
                                    ? new Date(al.scheduled_at).toLocaleString('pt-PT')
                                    : '—'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handlePublishNow('albums', al.id)}
                              className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold flex-shrink-0"
                            >
                              Publicar agora
                            </button>
                          </div>
                        ))}
                        {scheduledTracks.map((tr) => (
                          <div
                            key={`sched-track-${tr.id}`}
                            className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-4"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={resolveCoverUrl(tr.cover_image || tr.album_cover)}
                                alt={tr.title}
                                className="w-12 h-12 rounded-lg object-cover bg-slate-800"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{tr.title}</p>
                                <p className="text-xs text-indigo-300 flex items-center gap-1 mt-0.5">
                                  <Clock size={12} /> {tr.album_title ? `Álbum: ${tr.album_title}` : 'Single'} · Agendado para{' '}
                                  {tr.scheduled_at
                                    ? new Date(tr.scheduled_at).toLocaleString('pt-PT')
                                    : '—'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handlePublishNow('music', tr.id)}
                              className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold flex-shrink-0"
                            >
                              Publicar agora
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </section>
              ) : studioTab === 'followers' ? (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users size={20} className="text-sky-400" />
                    Seguidores ({data?.totals.followersCount ?? 0})
                  </h2>
                  {!data?.recentFollowers?.length ? (
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center text-gray-400 text-sm">
                      Ainda não tens seguidores registados.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {data.recentFollowers.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5"
                        >
                          <div className="w-10 h-10 rounded-full bg-purple-600/40 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {f.avatar_url ? (
                              <img
                                src={resolveCoverUrl(f.avatar_url)}
                                alt={f.full_name || f.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users size={16} className="text-purple-200" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{f.full_name || f.username}</p>
                            <p className="text-xs text-gray-400 truncate">
                              @{f.username} · desde {new Date(f.followed_at).toLocaleDateString('pt-PT')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                <>

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
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all relative group"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-slate-800 mb-3 relative">
                          <img
                            src={resolveCoverUrl(album.cover_url)}
                            alt={album.title}
                            className="w-full h-full object-cover"
                          />
                          {album.status === 'scheduled' && (
                            <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-600/90 text-white font-semibold">
                              Agendado
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAlbum(album.id, album.title)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover álbum"
                          >
                            <Trash2 size={13} />
                          </button>
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
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm truncate">{track.title}</p>
                                {track.status === 'scheduled' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    Agendado
                                  </span>
                                )}
                              </div>
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
            <div>
              <label className="block text-xs text-gray-400 mb-1">Publicação</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAlbumScheduleMode('now')}
                  className={`py-2 rounded-lg text-xs font-medium border ${
                    albumScheduleMode === 'now'
                      ? 'bg-purple-600/30 border-purple-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  Publicar agora
                </button>
                <button
                  type="button"
                  onClick={() => setAlbumScheduleMode('scheduled')}
                  className={`py-2 rounded-lg text-xs font-medium border ${
                    albumScheduleMode === 'scheduled'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  Agendar lançamento
                </button>
              </div>
              {albumScheduleMode === 'scheduled' && (
                <input
                  type="datetime-local"
                  required
                  value={albumScheduledAt}
                  onChange={(e) => setAlbumScheduledAt(e.target.value)}
                  className="mt-2 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>
            <button
              type="submit"
              disabled={savingAlbum}
              className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingAlbum ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {albumScheduleMode === 'scheduled' ? 'Agendar Álbum' : 'Criar Álbum'}
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
              <label className="block text-xs text-gray-400 mb-1">Categoria *</label>
              <select
                value={trackCategory}
                onChange={(e) => setTrackCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="musica">Música / Louvor</option>
                <option value="sermao">Sermão</option>
                <option value="podcast">Podcast</option>
                <option value="estudo">Estudo Bíblico</option>
                <option value="outro">Testemunho / Outro</option>
              </select>
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
            <div>
              <label className="block text-xs text-gray-400 mb-1">Publicação</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTrackScheduleMode('now')}
                  className={`py-2 rounded-lg text-xs font-medium border ${
                    trackScheduleMode === 'now'
                      ? 'bg-purple-600/30 border-purple-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  Publicar agora
                </button>
                <button
                  type="button"
                  onClick={() => setTrackScheduleMode('scheduled')}
                  className={`py-2 rounded-lg text-xs font-medium border ${
                    trackScheduleMode === 'scheduled'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  Agendar lançamento
                </button>
              </div>
              {trackScheduleMode === 'scheduled' && (
                <input
                  type="datetime-local"
                  required
                  value={trackScheduledAt}
                  onChange={(e) => setTrackScheduledAt(e.target.value)}
                  className="mt-2 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>
            <button
              type="submit"
              disabled={savingTrack}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingTrack ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {trackScheduleMode === 'scheduled' ? 'Agendar Lançamento' : 'Publicar Lançamento'}
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
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/5 border border-white/10 rounded-2xl p-4 transition-all ${
        onClick ? 'cursor-pointer hover:bg-white/10 hover:border-purple-500/40 hover:-translate-y-0.5' : ''
      }`}
    >
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
