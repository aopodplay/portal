'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  Users,
  Music,
  Video as VideoIcon,
  DiscAlbum,
  Play,
  Heart,
  ListMusic,
  Search,
  UserCheck,
  UserX,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Mic,
  Bell,
  Send,
  Sparkles,
  Plus,
  Lock,
  Unlock,
  Image as ImageIcon,
  Upload,
  RotateCcw,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import PlayerBar from '@/components/PlayerBar';
import AddVideoModal from '@/components/AddVideoModal';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/config/api';
import { resolveCoverUrl, resolveThumbUrl } from '@/lib/media';

type TabKey = 'overview' | 'users' | 'music' | 'videos' | 'catalog' | 'series' | 'notifications' | 'branding';

interface AdminStats {
  totalUsers: number;
  totalContent: number;
  totalPlaylists: number;
  totalFavorites: number;
  totalViews: number;
  totalDownloads?: number;
  newUsersThisMonth: number;
}

interface OverviewTotals {
  total_music: number;
  total_artists: number;
  total_albums: number;
  total_plays: number;
  total_play_events: number;
  unique_listeners: number;
}

interface AdminUser {
  id: number;
  username: string;
  email?: string | null;
  phone?: string | null;
  full_name?: string | null;
  role: string;
  is_active: number | boolean;
  is_verified: number | boolean;
  created_at: string;
}

export default function PlatformControlPage() {
  const { user, loading: authLoading } = useAuth();
  const userType = String(
    (user as any)?.role || (user as any)?.type || (user as any)?.perfil || ''
  ).toLowerCase();
  const isOwner = Boolean(user && userType === 'admin');

  const [tab, setTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);

  // Dados
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [overview, setOverview] = useState<OverviewTotals | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [musicList, setMusicList] = useState<any[]>([]);
  const [videoList, setVideoList] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesSubtitle, setSeriesSubtitle] = useState('');
  const [seriesBadge, setSeriesBadge] = useState('');
  const [seriesTargetUrl, setSeriesTargetUrl] = useState('/videos');
  const [savingSeries, setSavingSeries] = useState(false);

  // Notificação Global
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning' | 'new_episode' | 'reminder'>('info');
  const [notifLink, setNotifLink] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  const notify = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const loadAll = useCallback(async () => {
    if (!isOwner) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const q = userSearch.trim() ? `&search=${encodeURIComponent(userSearch.trim())}` : '';
      const [statsRes, overviewRes, usersRes, musicRes, videoRes, artistsRes, albumsRes, seriesRes] =
        await Promise.all([
          fetchWithAuth('/api/v1/admin/stats'),
          fetchWithAuth('/api/v1/admin/stats/overview'),
          fetchWithAuth(`/api/v1/admin/users?page=1&limit=50${q}`),
          fetchWithAuth('/api/v1/music'),
          fetchWithAuth('/api/v1/videos'),
          fetchWithAuth('/api/v1/artists?page=1&limit=50'),
          fetchWithAuth('/api/v1/albums?page=1&limit=50'),
          fetchWithAuth('/api/v1/series?all=true'),
        ]);

      const [statsBody, overviewBody, usersBody, musicBody, videoBody, artistsBody, albumsBody, seriesBody] =
        await Promise.all([
          statsRes.json().catch(() => null),
          overviewRes.json().catch(() => null),
          usersRes.json().catch(() => null),
          musicRes.json().catch(() => null),
          videoRes.json().catch(() => null),
          artistsRes.json().catch(() => null),
          albumsRes.json().catch(() => null),
          seriesRes.json().catch(() => null),
        ]);

      if (statsRes.ok && statsBody?.success) setStats(statsBody.data);
      if (overviewRes.ok && overviewBody?.success) setOverview(overviewBody.data?.totals || null);
      if (usersRes.ok && usersBody?.success) setUsers(usersBody.data?.users || []);
      if (musicRes.ok && musicBody?.success) {
        const m = Array.isArray(musicBody.data) ? musicBody.data : musicBody.data?.items || [];
        setMusicList(m);
      }
      if (videoRes.ok && videoBody?.success) {
        const v = Array.isArray(videoBody.data) ? videoBody.data : videoBody.data?.items || [];
        setVideoList(v);
      }
      if (artistsRes.ok && artistsBody?.success) {
        setArtists(artistsBody.data?.artists || []);
      }
      if (albumsRes.ok && albumsBody?.success) {
        setAlbums(albumsBody.data?.albums || []);
      }
      if (seriesRes.ok && seriesBody?.success) {
        setSeriesList(Array.isArray(seriesBody.data) ? seriesBody.data : []);
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar controlo da plataforma');
    } finally {
      setLoading(false);
    }
  }, [isOwner, userSearch]);

  useEffect(() => {
    if (!authLoading) {
      loadAll();
    }
  }, [authLoading, loadAll]);

  const handleToggleUser = async (u: AdminUser) => {
    const active = Boolean(u.is_active);
    const endpoint = active
      ? `/api/v1/admin/users/${u.id}/disable`
      : `/api/v1/admin/users/${u.id}/enable`;
    try {
      setBusyId(`user-${u.id}`);
      const res = await fetchWithAuth(endpoint, { method: 'POST' });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao atualizar utilizador');
      notify(active ? `Conta "${u.username}" desativada.` : `Conta "${u.username}" ativada.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Erro ao atualizar utilizador');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteUser = async (u: AdminUser) => {
    if (!confirm(`Apagar permanentemente o utilizador "${u.username}"?`)) return;
    try {
      setBusyId(`user-del-${u.id}`);
      const res = await fetchWithAuth(`/api/v1/admin/users/${u.id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao apagar utilizador');
      notify(`Utilizador "${u.username}" removido.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Erro ao apagar utilizador');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteMusic = async (id: number, title: string) => {
    if (!confirm(`Remover a música "${title}" da plataforma?`)) return;
    try {
      setBusyId(`music-${id}`);
      const res = await fetchWithAuth(`/api/v1/music/${id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao remover música');
      notify(`Música "${title}" removida.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Erro ao remover música');
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    fetchWithAuth('/api/v1/branding')
      .then((r) => r.json())
      .then((b) => {
        if (b?.success && b?.data) setLogoUrl(b.data.logo_url || null);
      })
      .catch(() => {});
  }, []);

  const handleUploadLogo = async (file: File) => {
    try {
      setSavingLogo(true);
      setError(null);
      const fd = new FormData();
      fd.append('logo', file);
      const res = await fetchWithAuth('/api/v1/admin/branding/logo', {
        method: 'POST',
        body: fd,
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao atualizar logo');
      const nextUrl = body.data?.logo_url || null;
      setLogoUrl(nextUrl);
      window.dispatchEvent(new CustomEvent('podplay:branding-updated', { detail: { logo_url: nextUrl } }));
      notify('Logo da plataforma atualizada!');
    } catch (e: any) {
      setError(e?.message || 'Erro ao atualizar logo');
    } finally {
      setSavingLogo(false);
    }
  };

  const handleResetLogo = async () => {
    try {
      setSavingLogo(true);
      setError(null);
      const res = await fetchWithAuth('/api/v1/admin/branding/logo', { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao restaurar logo');
      setLogoUrl(null);
      window.dispatchEvent(new CustomEvent('podplay:branding-updated', { detail: { logo_url: null } }));
      notify('Logo restaurada para o padrão.');
    } catch (e: any) {
      setError(e?.message || 'Erro ao restaurar logo');
    } finally {
      setSavingLogo(false);
    }
  };

  const handleDeleteVideo = async (id: number, title: string) => {
    if (!confirm(`Remover o vídeo "${title}" da plataforma?`)) return;
    try {
      setBusyId(`video-${id}`);
      const res = await fetchWithAuth(`/api/v1/videos/${id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao remover vídeo');
      notify(`Vídeo "${title}" removido.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Erro ao remover vídeo');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleVideoCommentsLock = async (id: number, currentlyLocked: boolean) => {
    try {
      setBusyId(`video-lock-${id}`);
      const nextLocked = !currentlyLocked;
      const res = await fetchWithAuth(`/api/v1/videos/${id}/comments-lock`, {
        method: 'PATCH',
        body: JSON.stringify({ comments_locked: nextLocked }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.message || 'Erro ao alterar estado dos comentários');
      }
      notify(nextLocked ? 'Comentários trancados.' : 'Comentários destrancados.');
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Erro ao alterar estado dos comentários');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteArtist = async (id: number, name: string) => {
    if (!confirm(`Remover o artista "${name}" da plataforma?`)) return;
    try {
      setBusyId(`artist-${id}`);
      const res = await fetchWithAuth(`/api/v1/artists/${id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao remover artista');
      notify(`Artista "${name}" removido.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Erro ao remover artista');
    } finally {
      setBusyId(null);
    }
  };

  const handleBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    try {
      setSendingNotif(true);
      setError(null);
      const res = await fetchWithAuth('/api/v1/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          type: notifType,
          link: notifLink.trim() || null,
          onlyActive: true,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.message || 'Erro ao enviar notificação');
      }
      setNotifTitle('');
      setNotifMessage('');
      setNotifLink('');
      notify(body.message || 'Notificação enviada para todos os utilizadores!');
    } catch (e: any) {
      setError(e?.message || 'Erro ao enviar notificação');
    } finally {
      setSendingNotif(false);
    }
  };

  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesTitle.trim()) return;
    try {
      setSavingSeries(true);
      const res = await fetchWithAuth('/api/v1/series', {
        method: 'POST',
        body: JSON.stringify({
          title: seriesTitle.trim(),
          subtitle: seriesSubtitle.trim() || null,
          badge: seriesBadge.trim() || null,
          target_url: seriesTargetUrl.trim() || '/videos',
          is_featured: true,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao criar série');
      setSeriesTitle('');
      setSeriesSubtitle('');
      setSeriesBadge('');
      notify('Série em Destaque adicionada!');
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar série');
    } finally {
      setSavingSeries(false);
    }
  };

  const handleToggleSeries = async (id: number) => {
    try {
      const res = await fetchWithAuth(`/api/v1/series/${id}/toggle`, { method: 'PATCH' });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao atualizar série');
      notify('Destaque da série atualizado.');
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Erro ao atualizar série');
    }
  };

  const handleDeleteSeries = async (id: number, title: string) => {
    if (!confirm(`Remover a série "${title}"?`)) return;
    try {
      const res = await fetchWithAuth(`/api/v1/series/${id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao remover série');
      notify('Série removida.');
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Erro ao remover série');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950/60 text-white">
      <PodPlaySidebar />

      <main className="ml-0 md:ml-64 min-h-screen pb-28 transition-all duration-300">
        <Header />

        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full">
                <Shield size={13} /> Controlo Geral PodPlay
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold mt-2">Gestão da Plataforma</h1>
              <p className="text-sm text-gray-400">
                Área exclusiva dos proprietários para controlar utilizadores, catálogo, vídeos e métricas do sistema.
              </p>
            </div>
          </div>

          {!authLoading && !isOwner ? (
            <div className="p-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
              <Shield size={40} className="text-red-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-white">Acesso Restrito</h2>
              <p className="text-sm text-gray-400 mt-1">
                Esta área é exclusiva para administradores/proprietários da plataforma PodPlay.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-sm font-medium"
              >
                Voltar ao Início
              </Link>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-3">
                {[
                  { key: 'overview', label: 'Visão Geral', icon: BarChart3 },
                  { key: 'users', label: `Utilizadores (${users.length})`, icon: Users },
                  { key: 'music', label: `Músicas (${musicList.length})`, icon: Music },
                  { key: 'videos', label: `Vídeos (${videoList.length})`, icon: VideoIcon },
                  { key: 'catalog', label: `Artistas & Álbuns`, icon: DiscAlbum },
                  { key: 'series', label: `Séries (${seriesList.length})`, icon: Sparkles },
                  { key: 'notifications', label: 'Notificar Todos', icon: Bell },
                  { key: 'branding', label: 'Logo', icon: ImageIcon },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key as TabKey)}
                    className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                      tab === t.key
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <t.icon size={15} />
                    {t.label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-sm flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>{success}</span>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 size={36} className="text-purple-400 animate-spin" />
                </div>
              ) : (
                <>
                  {/* TAB: VISÃO GERAL */}
                  {tab === 'overview' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatBox
                        icon={<Users size={20} className="text-sky-400" />}
                        label="Utilizadores Ativos"
                        value={stats?.totalUsers ?? 0}
                        sub={`+${stats?.newUsersThisMonth ?? 0} este mês`}
                      />
                      <StatBox
                        icon={<Play size={20} className="text-emerald-400" />}
                        label="Reproduções Totais"
                        value={overview?.total_plays ?? 0}
                        sub={`${overview?.unique_listeners ?? 0} ouvintes únicos`}
                      />
                      <StatBox
                        icon={<Music size={20} className="text-purple-400" />}
                        label="Músicas no Catálogo"
                        value={overview?.total_music ?? musicList.length}
                      />
                      <StatBox
                        icon={<VideoIcon size={20} className="text-pink-400" />}
                        label="Vídeos Publicados"
                        value={videoList.length}
                      />
                      <StatBox
                        icon={<Mic size={20} className="text-rose-400" />}
                        label="Artistas"
                        value={overview?.total_artists ?? artists.length}
                      />
                      <StatBox
                        icon={<DiscAlbum size={20} className="text-amber-400" />}
                        label="Álbuns"
                        value={overview?.total_albums ?? albums.length}
                      />
                      <StatBox
                        icon={<ListMusic size={20} className="text-teal-400" />}
                        label="Playlists"
                        value={stats?.totalPlaylists ?? 0}
                      />
                      <StatBox
                        icon={<Heart size={20} className="text-red-400" />}
                        label="Favoritos"
                        value={stats?.totalFavorites ?? 0}
                      />
                    </div>
                  )}

                  {/* TAB: UTILIZADORES */}
                  {tab === 'users' && (
                    <div>
                      <div className="relative max-w-sm mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Pesquisar utilizador..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-white/5 text-xs uppercase text-gray-300">
                            <tr>
                              <th className="px-4 py-3">Utilizador</th>
                              <th className="px-4 py-3">Contacto</th>
                              <th className="px-4 py-3">Perfil</th>
                              <th className="px-4 py-3">Estado</th>
                              <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {users.map((u) => {
                              const active = Boolean(u.is_active);
                              return (
                                <tr key={u.id} className="hover:bg-white/5">
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-white">{u.full_name || u.username}</p>
                                    <p className="text-xs text-gray-400">@{u.username}</p>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-300">
                                    {u.email || u.phone || '—'}
                                  </td>
                                  <td className="px-4 py-3 text-xs">
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                                      {u.role}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs">
                                    <span
                                      className={`px-2 py-0.5 rounded-full font-medium ${
                                        active
                                          ? 'bg-emerald-500/20 text-emerald-300'
                                          : 'bg-red-500/20 text-red-300'
                                      }`}
                                    >
                                      {active ? 'Ativo' : 'Desativado'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="inline-flex items-center gap-2">
                                      <button
                                        onClick={() => handleToggleUser(u)}
                                        disabled={busyId === `user-${u.id}`}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 ${
                                          active
                                            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                                        }`}
                                      >
                                        {active ? <UserX size={13} /> : <UserCheck size={13} />}
                                        {active ? 'Desativar' : 'Ativar'}
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUser(u)}
                                        disabled={busyId === `user-del-${u.id}`}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                        title="Apagar utilizador"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB: MÚSICAS */}
                  {tab === 'music' && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/10">
                      {musicList.map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-4 p-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={resolveCoverUrl(m.cover_image)}
                              alt={m.title}
                              className="w-11 h-11 rounded-lg object-cover bg-slate-800 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{m.title}</p>
                              <p className="text-xs text-gray-400 truncate">
                                {m.artist} · {m.plays ?? 0} plays
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteMusic(m.id, m.title)}
                            disabled={busyId === `music-${m.id}`}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                            title="Remover música"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {musicList.length === 0 && (
                        <p className="p-8 text-center text-gray-400 text-sm">Nenhuma música registada.</p>
                      )}
                    </div>
                  )}

                  {/* TAB: VÍDEOS */}
                  {tab === 'videos' && (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowAddVideoModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                        >
                          <Plus size={16} />
                          <span>Adicionar Vídeo</span>
                        </button>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/10">
                        {videoList.map((v) => {
                          const locked = Boolean(v.comments_locked);
                          return (
                            <div key={v.id} className="flex items-center justify-between gap-4 p-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={resolveThumbUrl(v.thumbnail_path)}
                                  alt={v.title}
                                  className="w-16 h-10 rounded-lg object-cover bg-slate-800 flex-shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{v.title}</p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {v.views ?? 0} visualizações · {new Date(v.created_at).toLocaleDateString('pt-PT')}
                                    {locked && ' · Comentários trancados'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleToggleVideoCommentsLock(v.id, locked)}
                                  disabled={busyId === `video-lock-${v.id}`}
                                  className={`p-2 rounded-lg transition-colors ${
                                    locked
                                      ? 'text-amber-300 bg-amber-500/15 hover:bg-amber-500/25'
                                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                                  }`}
                                  title={locked ? 'Destrancar comentários' : 'Trancar comentários'}
                                >
                                  {locked ? <Lock size={16} /> : <Unlock size={16} />}
                                </button>
                                <button
                                  onClick={() => handleDeleteVideo(v.id, v.title)}
                                  disabled={busyId === `video-${v.id}`}
                                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                  title="Remover vídeo"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {videoList.length === 0 && (
                          <p className="p-8 text-center text-gray-400 text-sm">Nenhum vídeo registado.</p>
                        )}
                      </div>

                      <AddVideoModal
                        open={showAddVideoModal}
                        onClose={() => setShowAddVideoModal(false)}
                        onSuccess={() => {
                          notify('Vídeo publicado com sucesso!');
                          loadAll();
                        }}
                      />
                    </div>
                  )}

                  {/* TAB: ARTISTAS & ÁLBUNS */}
                  {tab === 'catalog' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                          <Mic size={16} className="text-pink-400" /> Artistas ({artists.length})
                        </h3>
                        <div className="divide-y divide-white/10">
                          {artists.map((a) => (
                            <div key={a.id} className="flex items-center justify-between py-2.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={resolveCoverUrl(a.image_url)}
                                  alt={a.name}
                                  className="w-9 h-9 rounded-full object-cover bg-slate-800"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{a.name}</p>
                                  <p className="text-xs text-gray-400">
                                    {a.tracks_count ?? 0} músicas · {a.total_plays ?? 0} plays
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteArtist(a.id, a.name)}
                                disabled={busyId === `artist-${a.id}`}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                          <DiscAlbum size={16} className="text-amber-400" /> Álbuns ({albums.length})
                        </h3>
                        <div className="divide-y divide-white/10">
                          {albums.map((al) => (
                            <div key={al.id} className="flex items-center justify-between py-2.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={resolveCoverUrl(al.cover_url)}
                                  alt={al.title}
                                  className="w-9 h-9 rounded-lg object-cover bg-slate-800"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{al.title}</p>
                                  <p className="text-xs text-gray-400">
                                    {al.artist_name || 'Artista'} · {al.tracks_count ?? 0} faixas
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: SÉRIES EM DESTAQUE */}
                  {tab === 'series' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                          <Plus size={16} className="text-purple-400" />
                          Nova Série em Destaque
                        </h3>
                        <form onSubmit={handleCreateSeries} className="space-y-3">
                          <input
                            type="text"
                            required
                            value={seriesTitle}
                            onChange={(e) => setSeriesTitle(e.target.value)}
                            placeholder="Título (ex: 40 Dias de Oração)"
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-sm text-white"
                          />
                          <input
                            type="text"
                            value={seriesSubtitle}
                            onChange={(e) => setSeriesSubtitle(e.target.value)}
                            placeholder="Subtítulo (ex: Série Podfé Original)"
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-sm text-white"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={seriesBadge}
                              onChange={(e) => setSeriesBadge(e.target.value)}
                              placeholder="Etiqueta (ex: 40 EP.)"
                              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-sm text-white"
                            />
                            <input
                              type="text"
                              value={seriesTargetUrl}
                              onChange={(e) => setSeriesTargetUrl(e.target.value)}
                              placeholder="Link (ex: /videos)"
                              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-sm text-white"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={savingSeries}
                            className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white inline-flex items-center gap-2"
                          >
                            {savingSeries ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            Adicionar Série
                          </button>
                        </form>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <h3 className="font-bold text-base mb-4">Séries Cadastradas</h3>
                        <div className="space-y-2.5">
                          {seriesList.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{s.title}</p>
                                <p className="text-xs text-gray-400 truncate">
                                  {s.subtitle || 'Sem subtítulo'} {s.badge ? `· ${s.badge}` : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleToggleSeries(s.id)}
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                    s.is_featured
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-white/10 text-gray-400'
                                  }`}
                                >
                                  {s.is_featured ? 'Em Destaque' : 'Oculta'}
                                </button>
                                <button
                                  onClick={() => handleDeleteSeries(s.id, s.title)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: NOTIFICAR TODOS */}
                  {tab === 'notifications' && (
                    <div className="max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                        <Bell size={18} className="text-purple-400" />
                        Enviar Notificação Global na Plataforma
                      </h3>
                      <p className="text-xs text-gray-400 mb-5">
                        A notificação aparecerá imediatamente no sino de notificações de todos os utilizadores ativos.
                      </p>

                      <form onSubmit={handleBroadcastNotification} className="space-y-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Título *</label>
                          <input
                            type="text"
                            required
                            value={notifTitle}
                            onChange={(e) => setNotifTitle(e.target.value)}
                            placeholder="Ex: Novo lançamento disponível no PodPlay!"
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Mensagem *</label>
                          <textarea
                            required
                            rows={3}
                            value={notifMessage}
                            onChange={(e) => setNotifMessage(e.target.value)}
                            placeholder="Escreve a mensagem que todos os utilizadores vão receber..."
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                            <select
                              value={notifType}
                              onChange={(e) => setNotifType(e.target.value as any)}
                              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="info">Aviso Geral</option>
                              <option value="new_episode">Novo Lançamento / Episódio</option>
                              <option value="reminder">Lembrete / Evento</option>
                              <option value="success">Novidade</option>
                              <option value="warning">Importante</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Link de destino (opcional)</label>
                            <input
                              type="text"
                              value={notifLink}
                              onChange={(e) => setNotifLink(e.target.value)}
                              placeholder="Ex: /videos ou /music"
                              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={sendingNotif}
                          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-sm font-semibold text-white inline-flex items-center gap-2 disabled:opacity-50"
                        >
                          {sendingNotif ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                          Enviar para Todos os Utilizadores
                        </button>
                      </form>
                    </div>
                  )}

                  {/* TAB: LOGO / IDENTIDADE */}
                  {tab === 'branding' && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-xl">
                      <h3 className="font-bold text-base mb-1 flex items-center gap-2">
                        <ImageIcon size={18} className="text-purple-400" />
                        Logo da Plataforma
                      </h3>
                      <p className="text-xs text-gray-400 mb-5">
                        Altere a logo exibida na barra lateral e na identidade da Podfe Play.
                      </p>

                      <div className="flex items-center gap-5 p-4 rounded-xl bg-white/5 border border-white/10 mb-5">
                        <div className="w-16 h-16 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {logoUrl ? (
                            <img
                              src={resolveCoverUrl(logoUrl)}
                              alt="Logo atual"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <ImageIcon size={26} className="text-purple-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">
                            {logoUrl ? 'Logo personalizada ativa' : 'Ícone padrão ativo'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Recomendado: PNG, SVG ou WebP transparente (ex: 256×256).
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <label className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors">
                          {savingLogo ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Upload size={16} />
                          )}
                          <span>{savingLogo ? 'A guardar...' : 'Escolher nova logo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={savingLogo}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadLogo(file);
                              e.target.value = '';
                            }}
                          />
                        </label>

                        {logoUrl && (
                          <button
                            type="button"
                            onClick={handleResetLogo}
                            disabled={savingLogo}
                            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-gray-200 text-sm font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50"
                          >
                            <RotateCcw size={15} />
                            <span>Restaurar padrão</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      <PlayerBar />
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString('pt-PT')}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-purple-300 mt-1">{sub}</p>}
    </div>
  );
}
