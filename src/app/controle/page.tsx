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
  Plus,
  Lock,
  Unlock,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  XCircle,
  Calendar,
  Database,
  Download,
  FileText,
  RefreshCw,
  Globe,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import PlayerBar from '@/components/PlayerBar';
import AddVideoModal from '@/components/AddVideoModal';
import ActionModal, { ActionModalConfig } from '@/components/ActionModal';
import PaymentManagementTab from '@/components/PaymentManagementTab';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoUpload } from '@/contexts/VideoUploadContext';
import { fetchWithAuth } from '@/config/api';
import { resolveCoverUrl, resolveThumbUrl } from '@/lib/media';
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

type TabKey = 'overview' | 'users' | 'artist-requests' | 'reports' | 'pitches' | 'support' | 'music' | 'videos' | 'comments' | 'events' | 'catalog' | 'series' | 'notifications' | 'payments' | 'branding' | 'footer' | 'backups' | 'logs';

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
  const { reopenModalPath, clearReopenModal, lastCompletedAt } = useVideoUpload();
  const userType = String(
    (user as any)?.role || (user as any)?.type || (user as any)?.perfil || ''
  ).toLowerCase();
  const isFullAdmin = Boolean(user && userType === 'admin');
  const isOwner = Boolean(user && (userType === 'admin' || userType === 'moderator'));

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
  const [topMusicStats, setTopMusicStats] = useState<any[]>([]);
  const [topArtistsStats, setTopArtistsStats] = useState<any[]>([]);
  const [playsByPeriod, setPlaysByPeriod] = useState<Array<{ day: string; total: number }>>([]);
  const [periodDays, setPeriodDays] = useState<7 | 14 | 30>(14);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [artistRequests, setArtistRequests] = useState<any[]>([]);
  const [docPreviewModal, setDocPreviewModal] = useState<{
    artistName: string;
    loading: boolean;
    selfie?: string;
    biFront?: string;
    biBack?: string;
    error?: string;
  } | null>(null);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [pitchesList, setPitchesList] = useState<any[]>([]);
  const [supportList, setSupportList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventCategory, setEventCategory] = useState<'evento' | 'publicidade'>('evento');
  const [eventLinkUrl, setEventLinkUrl] = useState('');
  const [eventBanner, setEventBanner] = useState<File | null>(null);
  const [eventScheduledAt, setEventScheduledAt] = useState('');
  const [eventExpiresAt, setEventExpiresAt] = useState('');
  const [eventNotify, setEventNotify] = useState(true);
  const [savingEvent, setSavingEvent] = useState(false);
  const [showAddAudioModal, setShowAddAudioModal] = useState(false);
  const [audioTitle, setAudioTitle] = useState('');
  const [audioArtist, setAudioArtist] = useState('PodFéPlay');
  const [audioCategory, setAudioCategory] = useState('sermao');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioCover, setAudioCover] = useState<File | null>(null);
  const [savingAudio, setSavingAudio] = useState(false);
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [staffFullName, setStaffFullName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<'moderator' | 'admin'>('moderator');
  const [creatingStaff, setCreatingStaff] = useState(false);

  // Backups & Logs
  const [backupList, setBackupList] = useState<any[]>([]);
  const [backupSchedule, setBackupSchedule] = useState<{
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    time_of_day: string;
    retention_count: number;
    last_run_at: string | null;
    next_run_at: string | null;
  }>({
    enabled: false,
    frequency: 'daily',
    time_of_day: '03:00',
    retention_count: 10,
    last_run_at: null,
    next_run_at: null,
  });
  const [runningBackup, setRunningBackup] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [logEntries, setLogEntries] = useState<any[]>([]);
  const [logSummary, setLogSummary] = useState({ total: 0, errors: 0, warnings: 0, successes: 0 });
  const [logLevel, setLogLevel] = useState<'all' | 'error' | 'warn' | 'success' | 'info'>('all');
  const [logSearch, setLogSearch] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [modalConfig, setModalConfig] = useState<ActionModalConfig | null>(null);

  // Rodapé gerenciável
  const [footerConfig, setFooterConfig] = useState<{
    columns: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
    social: { instagram?: string; facebook?: string; youtube?: string; tiktok?: string; whatsapp?: string };
    copyright: string;
    tagline?: string;
  }>({
    columns: [],
    social: {},
    copyright: '',
    tagline: '',
  });
  const [savingFooter, setSavingFooter] = useState(false);

  const [userSearch, setUserSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [musicList, setMusicList] = useState<any[]>([]);
  const [videoList, setVideoList] = useState<any[]>([]);
  const [videoSearch, setVideoSearch] = useState('');
  const [videosPage, setVideosPage] = useState(1);
  const [videoComments, setVideoComments] = useState<any[]>([]);
  const [commentSearch, setCommentSearch] = useState('');
  const [onlyFlaggedComments, setOnlyFlaggedComments] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [moderatingOffensive, setModeratingOffensive] = useState(false);
  const [artists, setArtists] = useState<any[]>([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [artistsPage, setArtistsPage] = useState(1);
  const [albums, setAlbums] = useState<any[]>([]);
  const [albumSearch, setAlbumSearch] = useState('');
  const [albumsPage, setAlbumsPage] = useState(1);
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
      const [statsRes, overviewRes, usersRes, mediaRes, artistsRes, albumsRes, seriesRes, requestsRes, eventsRes, reportsRes, pitchesRes, supportRes, commentsRes] =
        await Promise.all([
          fetchWithAuth('/api/v1/admin/stats'),
          fetchWithAuth('/api/v1/admin/stats/overview'),
          fetchWithAuth(`/api/v1/admin/users?page=1&limit=50${q}`),
          fetchWithAuth('/api/v1/admin/moderation/media'),
          fetchWithAuth('/api/v1/artists?page=1&limit=50'),
          fetchWithAuth('/api/v1/albums?page=1&limit=50'),
          fetchWithAuth('/api/v1/series?all=true'),
          fetchWithAuth('/api/v1/admin/artist-requests'),
          fetchWithAuth('/api/v1/admin/events'),
          fetchWithAuth('/api/v1/admin/reports'),
          fetchWithAuth('/api/v1/admin/pitches'),
          fetchWithAuth('/api/v1/admin/support'),
          fetchWithAuth('/api/v1/admin/video-comments'),
        ]);

      const [statsBody, overviewBody, usersBody, mediaBody, artistsBody, albumsBody, seriesBody, requestsBody, eventsBody, reportsBody, pitchesBody, supportBody, commentsBody] =
        await Promise.all([
          statsRes.json().catch(() => null),
          overviewRes.json().catch(() => null),
          usersRes.json().catch(() => null),
          mediaRes.json().catch(() => null),
          artistsRes.json().catch(() => null),
          albumsRes.json().catch(() => null),
          seriesRes.json().catch(() => null),
          requestsRes.json().catch(() => null),
          eventsRes.json().catch(() => null),
          reportsRes.json().catch(() => null),
          pitchesRes.json().catch(() => null),
          supportRes.json().catch(() => null),
          commentsRes.json().catch(() => null),
        ]);

      if (statsRes.ok && statsBody?.success) {
        setStats(statsBody.data);
      }
      if (overviewRes.ok && overviewBody?.success) {
        setOverview(overviewBody.data?.totals || null);
        setTopMusicStats(Array.isArray(overviewBody.data?.topMusic) ? overviewBody.data.topMusic : []);
        setTopArtistsStats(Array.isArray(overviewBody.data?.topArtists) ? overviewBody.data.topArtists : []);
      }
      if (usersRes.ok && usersBody?.success) setUsers(usersBody.data?.users || []);
      if (requestsRes.ok && requestsBody?.success) setArtistRequests(Array.isArray(requestsBody.data) ? requestsBody.data : []);
      if (eventsRes.ok && eventsBody?.success) setEventsList(Array.isArray(eventsBody.data) ? eventsBody.data : []);
      if (reportsRes.ok && reportsBody?.success) setReportsList(Array.isArray(reportsBody.data) ? reportsBody.data : []);
      if (pitchesRes.ok && pitchesBody?.success) setPitchesList(Array.isArray(pitchesBody.data) ? pitchesBody.data : []);
      if (supportRes.ok && supportBody?.success) setSupportList(Array.isArray(supportBody.data) ? supportBody.data : []);
      if (commentsRes.ok && commentsBody?.success) setVideoComments(Array.isArray(commentsBody.data?.comments) ? commentsBody.data.comments : []);
      if (mediaRes.ok && mediaBody?.success) {
        setMusicList(Array.isArray(mediaBody.data?.music) ? mediaBody.data.music : []);
        setVideoList(Array.isArray(mediaBody.data?.videos) ? mediaBody.data.videos : []);
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

  useEffect(() => {
    if (reopenModalPath === '/controle') {
      setTab('videos');
      setShowAddVideoModal(true);
      clearReopenModal();
    }
  }, [reopenModalPath, clearReopenModal]);

  useEffect(() => {
    if (lastCompletedAt && isOwner) {
      loadAll();
    }
  }, [lastCompletedAt, isOwner, loadAll]);

  useEffect(() => {
    if (!isOwner) return;
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - periodDays * 86400_000).toISOString().slice(0, 10);
    fetchWithAuth(`/api/v1/admin/stats/plays-by-period?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((b) => {
        if (!b?.success) return;
        const raw: Array<{ day: string; total: number }> = b.data?.days || [];
        const map = new Map(
          raw.map((d) => [String(d.day).slice(0, 10), Number(d.total || 0)])
        );
        const filled: Array<{ day: string; total: number }> = [];
        for (let i = periodDays - 1; i >= 0; i--) {
          const dt = new Date(Date.now() - i * 86400_000);
          const iso = dt.toISOString().slice(0, 10);
          filled.push({
            day: `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`,
            total: map.get(iso) || 0,
          });
        }
        setPlaysByPeriod(filled);
      })
      .catch(() => {});
  }, [isOwner, periodDays]);

  const loadBackups = useCallback(async () => {
    if (!isFullAdmin) return;
    try {
      const res = await fetchWithAuth('/api/v1/admin/backups');
      const body = await res.json();
      if (res.ok && body?.success && body?.data) {
        setBackupList(Array.isArray(body.data.backups) ? body.data.backups : []);
        if (body.data.schedule) setBackupSchedule(body.data.schedule);
      }
    } catch {}
  }, [isFullAdmin]);

  const loadLogs = useCallback(async () => {
    if (!isFullAdmin) return;
    try {
      setLoadingLogs(true);
      const q = new URLSearchParams({ level: logLevel, limit: '250' });
      if (logSearch.trim()) q.set('search', logSearch.trim());
      const res = await fetchWithAuth(`/api/v1/admin/logs?${q.toString()}`);
      const body = await res.json();
      if (res.ok && body?.success && body?.data) {
        setLogEntries(Array.isArray(body.data.entries) ? body.data.entries : []);
        if (body.data.summary) setLogSummary(body.data.summary);
      }
    } catch {
    } finally {
      setLoadingLogs(false);
    }
  }, [isFullAdmin, logLevel, logSearch]);

  useEffect(() => {
    if (tab === 'backups') loadBackups();
    if (tab === 'logs') loadLogs();
    if (tab === 'footer') {
      fetchWithAuth('/api/v1/footer')
        .then((r) => r.json())
        .then((b) => {
          if (b?.success && b?.data) setFooterConfig(b.data);
        })
        .catch(() => {});
    }
  }, [tab, loadBackups, loadLogs]);

  const handleSaveFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingFooter(true);
      setError(null);
      const res = await fetchWithAuth('/api/v1/admin/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(footerConfig),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao guardar rodapé');
      if (body.data) setFooterConfig(body.data);
      window.dispatchEvent(new CustomEvent('podplay:footer-updated', { detail: body.data }));
      notify('Rodapé atualizado com sucesso!');
    } catch (e: any) {
      setError(e?.message || 'Erro ao guardar rodapé');
    } finally {
      setSavingFooter(false);
    }
  };

  const handleRunBackupNow = async () => {
    try {
      setRunningBackup(true);
      setError(null);
      const res = await fetchWithAuth('/api/v1/admin/backups/run', { method: 'POST' });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao gerar backup');
      notify(`Backup "${body.data?.filename}" gerado com sucesso!`);
      await loadBackups();
    } catch (e: any) {
      setError(e?.message || 'Erro ao gerar backup');
    } finally {
      setRunningBackup(false);
    }
  };

  const handleSaveBackupSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSchedule(true);
      setError(null);
      const res = await fetchWithAuth('/api/v1/admin/backups/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupSchedule),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao guardar agendamento');
      if (body.data) setBackupSchedule(body.data);
      notify('Agendamento de backups guardado!');
    } catch (e: any) {
      setError(e?.message || 'Erro ao guardar agendamento');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      const res = await fetchWithAuth(`/api/v1/admin/backups/${encodeURIComponent(filename)}/download`);
      if (!res.ok) throw new Error('Erro ao descarregar backup');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || 'Erro ao descarregar backup');
    }
  };

  const handleDeleteBackup = (filename: string) => {
    setModalConfig({
      mode: 'confirm',
      title: 'Remover backup',
      message: `Tens a certeza que queres remover o backup "${filename}"?`,
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetchWithAuth(`/api/v1/admin/backups/${encodeURIComponent(filename)}`, {
            method: 'DELETE',
          });
          const body = await res.json();
          if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao remover backup');
          notify('Backup removido.');
          await loadBackups();
        } catch (e: any) {
          setError(e?.message || 'Erro ao remover backup');
        }
      },
    });
  };

  const handleClearLogs = () => {
    setModalConfig({
      mode: 'confirm',
      title: 'Limpar logs da plataforma',
      message: 'Tens a certeza que queres apagar todos os registos de logs atuais?',
      confirmLabel: 'Limpar logs',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetchWithAuth('/api/v1/admin/logs', { method: 'DELETE' });
          const body = await res.json();
          if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao limpar logs');
          notify('Logs limpos com sucesso.');
          await loadLogs();
        } catch (e: any) {
          setError(e?.message || 'Erro ao limpar logs');
        }
      },
    });
  };

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

  const handleDeleteUser = (u: AdminUser) => {
    setModalConfig({
      mode: 'confirm',
      title: 'Apagar utilizador',
      message: `Apagar permanentemente o utilizador "${u.username}"? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Apagar permanentemente',
      danger: true,
      onConfirm: async () => {
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
      },
    });
  };

  const handleDeleteMusic = (id: number, title: string) => {
    setModalConfig({
      mode: 'confirm',
      title: 'Remover música',
      message: `Remover a música "${title}" da plataforma?`,
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: async () => {
        try {
          setBusyId(`music-${id}`);
          const res = await fetchWithAuth(`/api/v1/admin/content/music/${id}`, { method: 'DELETE' });
          const body = await res.json();
          if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao remover música');
          notify(`Música "${title}" removida.`);
          await loadAll();
        } catch (e: any) {
          setError(e?.message || 'Erro ao remover música');
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const handleModerateMedia = (
    type: 'music' | 'video',
    id: number,
    action: 'approve' | 'block' | 'unblock'
  ) => {
    const runModeration = async (reason?: string) => {
      try {
        setBusyId(`mod-${type}-${id}`);
        const res = await fetchWithAuth(`/api/v1/admin/content/${type}/${id}/moderation`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, reason }),
        });
        const body = await res.json();
        if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao moderar conteúdo');
        notify(
          action === 'block'
            ? 'Conteúdo bloqueado.'
            : action === 'approve'
              ? 'Conteúdo aprovado!'
              : 'Conteúdo desbloqueado.'
        );
        await loadAll();
      } catch (e: any) {
        setError(e?.message || 'Erro ao moderar conteúdo');
      } finally {
        setBusyId(null);
      }
    };

    if (action === 'block') {
      setModalConfig({
        mode: 'prompt',
        title: 'Bloquear conteúdo',
        message: 'Indica o motivo do bloqueio (opcional):',
        inputLabel: 'Motivo',
        inputPlaceholder: 'Ex: Violação das diretrizes de conteúdo...',
        confirmLabel: 'Bloquear',
        danger: true,
        onConfirm: (val) => runModeration(val || ''),
      });
      return;
    }

    runModeration(undefined);
  };

  const handleSetUserRole = async (u: AdminUser, role: 'user' | 'creator' | 'moderator' | 'admin') => {
    try {
      setBusyId(`role-${u.id}`);
      const res = await fetchWithAuth(`/api/v1/admin/users/${u.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao alterar papel');
      const roleLabels: Record<string, string> = {
        admin: 'Administrador',
        moderator: 'Revisor',
        creator: 'Artista/Criador',
        user: 'Utilizador',
      };
      notify(`Permissão de ${u.full_name || u.username} alterada para ${roleLabels[role] || role}.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Erro ao alterar papel');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateStaffUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUsername.trim() || !staffEmail.trim()) return;
    try {
      setCreatingStaff(true);
      setError(null);
      const res = await fetchWithAuth('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: staffFullName.trim() || staffUsername.trim(),
          username: staffUsername.trim(),
          email: staffEmail.trim(),
          role: staffRole,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao criar utilizador');
      setShowCreateStaffModal(false);
      setStaffFullName('');
      setStaffUsername('');
      setStaffEmail('');
      setStaffRole('moderator');
      notify(body?.message || 'Utilizador criado e credenciais enviadas por email!');
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar utilizador');
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    try {
      setSavingEvent(true);
      setError(null);
      const fd = new FormData();
      fd.append('title', eventTitle.trim());
      if (eventDesc.trim()) fd.append('description', eventDesc.trim());
      if (eventDate.trim()) fd.append('event_date', eventDate.trim());
      if (eventLocation.trim()) fd.append('location', eventLocation.trim());
      fd.append('category', eventCategory);
      if (eventLinkUrl.trim()) fd.append('link_url', eventLinkUrl.trim());
      if (eventScheduledAt) fd.append('scheduled_at', new Date(eventScheduledAt).toISOString());
      if (eventExpiresAt) fd.append('expires_at', new Date(eventExpiresAt).toISOString());
      fd.append('notifyUsers', String(eventNotify));
      if (eventBanner) fd.append('banner', eventBanner);

      const res = await fetchWithAuth('/api/v1/admin/events', {
        method: 'POST',
        body: fd,
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao publicar');
      setEventTitle('');
      setEventDesc('');
      setEventDate('');
      setEventLocation('');
      setEventLinkUrl('');
      setEventBanner(null);
      setEventScheduledAt('');
      setEventExpiresAt('');
      notify(eventCategory === 'publicidade' ? 'Publicidade publicada na página principal!' : 'Evento publicado na plataforma!');
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Erro ao publicar');
    } finally {
      setSavingEvent(false);
    }
  };

  const handlePublishPlatformAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioTitle.trim() || !audioFile) return;
    try {
      setSavingAudio(true);
      setError(null);
      const fd = new FormData();
      fd.append('title', audioTitle.trim());
      fd.append('artist_name', audioArtist.trim() || 'PodFéPlay');
      fd.append('category', audioCategory);
      fd.append('file', audioFile);
      if (audioCover) fd.append('coverImage', audioCover);
      const res = await fetchWithAuth('/api/v1/admin/content/audio', {
        method: 'POST',
        body: fd,
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao publicar conteúdo');
      setShowAddAudioModal(false);
      setAudioTitle('');
      setAudioArtist('PodFéPlay');
      setAudioCategory('sermao');
      setAudioFile(null);
      setAudioCover(null);
      notify('Conteúdo oficial publicado na plataforma!');
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Erro ao publicar conteúdo');
    } finally {
      setSavingAudio(false);
    }
  };

  const handleDeleteAdminComment = (comment: any) => {
    setModalConfig({
      mode: 'prompt',
      title: 'Remover comentário',
      message: `Remover o comentário de ${comment.full_name || comment.username || 'Utilizador'}? O autor será notificado na plataforma.`,
      inputLabel: 'Motivo (opcional)',
      inputPlaceholder: 'Ex: Linguagem imprópria ou fora de contexto',
      confirmLabel: 'Remover comentário',
      danger: true,
      onConfirm: async (reason) => {
        try {
          setBusyId(`comment-${comment.id}`);
          const res = await fetchWithAuth(`/api/v1/admin/video-comments/${comment.id}`, {
            method: 'DELETE',
            body: JSON.stringify({ reason: reason?.trim() || undefined }),
          });
          const body = await res.json().catch(() => null);
          if (!res.ok || !body?.success) {
            throw new Error(body?.message || 'Erro ao remover comentário');
          }
          setVideoComments((prev) =>
            prev.filter((c) => c.id !== comment.id && Number(c.parent_id) !== Number(comment.id))
          );
          notify('Comentário removido e utilizador notificado!');
        } catch (e: any) {
          setError(e?.message || 'Erro ao remover comentário');
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const handleRunOffensiveModeration = () => {
    setModalConfig({
      mode: 'confirm',
      title: 'Avaliar e remover comentários ofensivos',
      message:
        'O sistema irá analisar todos os comentários de vídeos, remover automaticamente os que contiverem linguagem ofensiva e notificar os respetivos autores.',
      confirmLabel: 'Executar avaliação',
      danger: true,
      onConfirm: async () => {
        try {
          setModeratingOffensive(true);
          const res = await fetchWithAuth('/api/v1/admin/video-comments/moderate-offensive', {
            method: 'POST',
          });
          const body = await res.json().catch(() => null);
          if (!res.ok || !body?.success) {
            throw new Error(body?.message || 'Erro ao avaliar comentários');
          }
          notify(body.message || 'Avaliação concluída!');
          await loadAll();
        } catch (e: any) {
          setError(e?.message || 'Erro ao avaliar comentários');
        } finally {
          setModeratingOffensive(false);
        }
      },
    });
  };

  const handleDeleteEvent = (id: number) => {
    setModalConfig({
      mode: 'confirm',
      title: 'Remover evento / publicidade',
      message: 'Remover este evento/publicidade da plataforma?',
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: async () => {
        try {
          setBusyId(`event-${id}`);
          const res = await fetchWithAuth(`/api/v1/admin/events/${id}`, { method: 'DELETE' });
          const body = await res.json();
          if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao remover evento');
          notify('Evento removido.');
          await loadAll();
        } catch (e: any) {
          setError(e?.message || 'Erro ao remover evento');
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  useEffect(() => {
    fetchWithAuth('/api/v1/branding', { cache: 'no-store' })
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
      try {
        if (nextUrl) localStorage.setItem('podplay_branding_logo', nextUrl);
        else localStorage.removeItem('podplay_branding_logo');
      } catch {}
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
      try {
        localStorage.removeItem('podplay_branding_logo');
      } catch {}
      window.dispatchEvent(new CustomEvent('podplay:branding-updated', { detail: { logo_url: null } }));
      notify('Logo restaurada para o padrão.');
    } catch (e: any) {
      setError(e?.message || 'Erro ao restaurar logo');
    } finally {
      setSavingLogo(false);
    }
  };

  const handleDeleteVideo = (id: number, title: string) => {
    setModalConfig({
      mode: 'confirm',
      title: 'Remover vídeo',
      message: `Remover o vídeo "${title}" da plataforma?`,
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: async () => {
        try {
          setBusyId(`video-${id}`);
          const res = await fetchWithAuth(`/api/v1/admin/content/video/${id}`, { method: 'DELETE' });
          const body = await res.json();
          if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao remover vídeo');
          notify(`Vídeo "${title}" removido.`);
          await loadAll();
        } catch (e: any) {
          setError(e?.message || 'Erro ao remover vídeo');
        } finally {
          setBusyId(null);
        }
      },
    });
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

  const handleDeleteArtist = (id: number, name: string) => {
    setModalConfig({
      mode: 'confirm',
      title: 'Remover artista',
      message: `Remover o artista "${name}" da plataforma?`,
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: async () => {
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
      },
    });
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
              <div className="flex flex-nowrap overflow-x-auto no-scrollbar md:flex-wrap gap-2 mb-6 border-b border-white/10 pb-3">
                {[
                  { key: 'overview', label: 'Visão Geral', icon: BarChart3 },
                  { key: 'users', label: `Utilizadores (${users.length})`, icon: Users },
                  {
                    key: 'artist-requests',
                    label: `Artistas (${artistRequests.filter((r) => r.status === 'pending').length})`,
                    icon: CheckCircle,
                  },
                  {
                    key: 'reports',
                    label: `Denúncias (${reportsList.filter((r) => r.status === 'pending').length})`,
                    icon: AlertCircle,
                  },
                  {
                    key: 'pitches',
                    label: `Pitching (${pitchesList.filter((p) => p.status === 'pending').length})`,
                    icon: ListMusic,
                  },
                  {
                    key: 'support',
                    label: `Suporte (${supportList.filter((s) => s.status === 'open').length})`,
                    icon: FileText,
                  },
                  { key: 'music', label: `Músicas (${musicList.length})`, icon: Music },
                  { key: 'videos', label: `Vídeos (${videoList.length})`, icon: VideoIcon },
                  { key: 'comments', label: `Comentários (${videoComments.length})`, icon: MessageSquare },
                  { key: 'events', label: `Eventos & Publicidades (${eventsList.length})`, icon: Calendar },
                  { key: 'catalog', label: `Artistas & Álbuns`, icon: DiscAlbum },
                  { key: 'series', label: `Séries (${seriesList.length})`, icon: VideoIcon },
                  { key: 'notifications', label: 'Notificar Todos', icon: Bell },
                  ...(isFullAdmin
                    ? [
                        { key: 'payments', label: 'GESTÃO DE PAGAMENTOS', icon: CreditCard },
                        { key: 'backups', label: 'Backups', icon: Database },
                        { key: 'logs', label: 'Logs', icon: FileText },
                        { key: 'footer', label: 'Rodapé', icon: Globe },
                        { key: 'branding', label: 'Logo', icon: ImageIcon },
                      ]
                    : []),
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key as TabKey)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
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
                  {/* TAB: VISÃO GERAL INTERATIVA */}
                  {tab === 'overview' && (
                    <div className="space-y-6">
                      {/* KPI Cards Interativos */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatBox
                          icon={<Users size={20} className="text-sky-400" />}
                          label="Utilizadores Ativos"
                          value={stats?.totalUsers ?? 0}
                          sub={`+${stats?.newUsersThisMonth ?? 0} este mês`}
                          onClick={() => setTab('users')}
                        />
                        <StatBox
                          icon={<Play size={20} className="text-emerald-400" />}
                          label="Reproduções Totais"
                          value={overview?.total_plays ?? 0}
                          sub={`${overview?.unique_listeners ?? 0} ouvintes únicos`}
                          onClick={() => setTab('music')}
                        />
                        <StatBox
                          icon={<Music size={20} className="text-purple-400" />}
                          label="Músicas no Catálogo"
                          value={overview?.total_music ?? musicList.length}
                          sub={`${videoList.length} vídeos publicados`}
                          onClick={() => setTab('music')}
                        />
                        <StatBox
                          icon={<DiscAlbum size={20} className="text-amber-400" />}
                          label="Artistas & Álbuns"
                          value={overview?.total_artists ?? artists.length}
                          sub={`${overview?.total_albums ?? albums.length} álbuns · ${stats?.totalFavorites ?? 0} favoritos`}
                          onClick={() => setTab('catalog')}
                        />
                      </div>

                      {/* Ações rápidas de gestão */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                          type="button"
                          onClick={() => setTab('artist-requests')}
                          className="text-left p-4 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/10 border border-purple-500/30 hover:border-purple-400/60 transition-all"
                        >
                          <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
                            Verificações Pendentes
                          </p>
                          <p className="text-2xl font-bold text-white mt-1">
                            {artistRequests.filter((r) => r.status === 'pending').length}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Clique para aprovar ou rejeitar artistas →</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTab('events')}
                          className="text-left p-4 rounded-2xl bg-gradient-to-br from-sky-600/20 to-cyan-600/10 border border-sky-500/30 hover:border-sky-400/60 transition-all"
                        >
                          <p className="text-xs text-sky-300 font-semibold uppercase tracking-wider">
                            Eventos Publicados
                          </p>
                          <p className="text-2xl font-bold text-white mt-1">{eventsList.length}</p>
                          <p className="text-xs text-gray-400 mt-1">Clique para gerir eventos & avisos →</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTab('music')}
                          className="text-left p-4 rounded-2xl bg-gradient-to-br from-amber-600/20 to-red-600/10 border border-amber-500/30 hover:border-amber-400/60 transition-all"
                        >
                          <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                            Conteúdos Bloqueados
                          </p>
                          <p className="text-2xl font-bold text-white mt-1">
                            {musicList.filter((m) => m.is_blocked).length +
                              videoList.filter((v) => v.is_blocked).length}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Clique para revisar moderação →</p>
                        </button>
                      </div>

                      {/* Linha 1 de Gráficos: Reproduções por Período + Distribuição de Utilizadores */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                              <h3 className="font-bold text-base text-white">Reproduções por Dia</h3>
                              <p className="text-xs text-gray-400">
                                Tendência de consumo de áudio na plataforma
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-full border border-white/10">
                              {([7, 14, 30] as const).map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => setPeriodDays(d)}
                                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                    periodDays === d
                                      ? 'bg-purple-600 text-white shadow'
                                      : 'text-gray-400 hover:text-white'
                                  }`}
                                >
                                  {d} dias
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={playsByPeriod} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="playsGradient" x1="0" y1="0" x2="0" y2="1">
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
                                  name="Reproduções"
                                  stroke="#C084FC"
                                  strokeWidth={2.5}
                                  fill="url(#playsGradient)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col">
                          <h3 className="font-bold text-base text-white">Equipa & Utilizadores</h3>
                          <p className="text-xs text-gray-400 mb-3">Distribuição por tipo de conta</p>
                          {(() => {
                            const roleCounts = [
                              {
                                name: 'Utilizadores',
                                value: users.filter((u) => u.role === 'user').length,
                                color: '#38BDF8',
                              },
                              {
                                name: 'Artistas',
                                value: users.filter((u) => u.role === 'creator').length,
                                color: '#A855F7',
                              },
                              {
                                name: 'Revisores',
                                value: users.filter((u) => u.role === 'moderator').length,
                                color: '#10B981',
                              },
                              {
                                name: 'Admins',
                                value: users.filter((u) => u.role === 'admin').length,
                                color: '#F59E0B',
                              },
                            ].filter((item) => item.value > 0);
                            return (
                              <>
                                <div className="h-48 w-full flex-1">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={roleCounts}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={45}
                                        outerRadius={72}
                                        paddingAngle={4}
                                      >
                                        {roleCounts.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
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
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {roleCounts.map((rc) => (
                                    <div key={rc.name} className="flex items-center justify-between text-xs bg-white/5 px-2.5 py-1.5 rounded-lg">
                                      <span className="flex items-center gap-1.5 text-gray-300">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rc.color }} />
                                        {rc.name}
                                      </span>
                                      <span className="font-bold text-white">{rc.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Linha 2 de Gráficos: Top Músicas & Top Artistas */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                          <h3 className="font-bold text-base text-white mb-1">Top Músicas Mais Tocadas</h3>
                          <p className="text-xs text-gray-400 mb-4">Desempenho das faixas mais reproduzidas</p>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={topMusicStats.slice(0, 6).map((m) => ({
                                  name: String(m.title || '').slice(0, 14),
                                  plays: Number(m.plays || 0),
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
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                          <h3 className="font-bold text-base text-white mb-1">Top Artistas Mais Ouvidos</h3>
                          <p className="text-xs text-gray-400 mb-4">Total de reproduções por artista</p>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={topArtistsStats.slice(0, 6).map((a) => ({
                                  name: String(a.name || '').slice(0, 14),
                                  plays: Number(a.total_plays || 0),
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
                                <Bar dataKey="plays" name="Plays" fill="#EC4899" radius={[8, 8, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: UTILIZADORES */}
                  {tab === 'users' && (() => {
                    const USERS_PER_PAGE = 12;
                    const qUser = userSearch.trim().toLowerCase();
                    const filteredUsers = qUser
                      ? users.filter(
                          (u) =>
                            String(u.full_name || '').toLowerCase().includes(qUser) ||
                            String(u.username || '').toLowerCase().includes(qUser) ||
                            String(u.email || '').toLowerCase().includes(qUser) ||
                            String(u.phone || '').toLowerCase().includes(qUser) ||
                            String(u.role || '').toLowerCase().includes(qUser)
                        )
                      : users;
                    const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
                    const safeUsersPage = Math.min(usersPage, totalUserPages);
                    const paginatedUsers = filteredUsers.slice(
                      (safeUsersPage - 1) * USERS_PER_PAGE,
                      safeUsersPage * USERS_PER_PAGE
                    );
                    return (
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="relative max-w-sm w-full">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => {
                              setUserSearch(e.target.value);
                              setUsersPage(1);
                            }}
                            placeholder="Pesquisar utilizador..."
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        {isFullAdmin && (
                          <button
                            type="button"
                            onClick={() => setShowCreateStaffModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors flex-shrink-0"
                          >
                            <Plus size={16} />
                            <span>Novo Membro de Gestão</span>
                          </button>
                        )}
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
                            {paginatedUsers.map((u) => {
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
                                      {isFullAdmin && u.id !== (user as any)?.id && (
                                        <select
                                          value={u.role}
                                          disabled={busyId === `role-${u.id}`}
                                          onChange={(e) =>
                                            handleSetUserRole(
                                              u,
                                              e.target.value as 'user' | 'creator' | 'moderator' | 'admin'
                                            )
                                          }
                                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                          title="Dar ou retirar permissão"
                                        >
                                          <option value="user">Utilizador</option>
                                          <option value="creator">Artista / Criador</option>
                                          <option value="moderator">Revisor</option>
                                          <option value="admin">Administrador</option>
                                        </select>
                                      )}
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
                                      {isFullAdmin && (
                                        <button
                                          onClick={() => handleDeleteUser(u)}
                                          disabled={busyId === `user-del-${u.id}`}
                                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                          title="Apagar utilizador"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <PaginationBar
                        page={safeUsersPage}
                        totalPages={totalUserPages}
                        totalItems={filteredUsers.length}
                        onPageChange={setUsersPage}
                      />
                    </div>
                    );
                  })()}

                  {/* TAB: MÚSICAS & CONTEÚDOS DE ÁUDIO */}
                  {tab === 'music' && (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowAddAudioModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                        >
                          <Plus size={16} />
                          <span>Lançar Sermão / Podcast / Estudo</span>
                        </button>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/10">
                        {musicList.map((m) => {
                          const blocked = Boolean(m.is_blocked);
                          const catLabels: Record<string, string> = {
                            sermao: 'Sermão',
                            podcast: 'Podcast',
                            estudo: 'Estudo',
                            musica: 'Música',
                            outro: 'Outro',
                          };
                          return (
                            <div key={m.id} className="flex items-center justify-between gap-4 p-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={resolveCoverUrl(m.cover_image)}
                                  alt={m.title}
                                  className="w-11 h-11 rounded-lg object-cover bg-slate-800 flex-shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm truncate">{m.title}</p>
                                    {m.category && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                                        {catLabels[m.category] || m.category}
                                      </span>
                                    )}
                                    {blocked && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                                        Bloqueado
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400 truncate">
                                    {m.artist_name || m.artist} · {m.plays ?? 0} plays
                                    {m.block_reason ? ` · ${m.block_reason}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {blocked ? (
                                  <button
                                    onClick={() => handleModerateMedia('music', m.id, 'unblock')}
                                    disabled={busyId === `mod-music-${m.id}`}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium inline-flex items-center gap-1"
                                  >
                                    <CheckCircle size={13} /> Aprovar / Desbloquear
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleModerateMedia('music', m.id, 'block')}
                                    disabled={busyId === `mod-music-${m.id}`}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium inline-flex items-center gap-1"
                                  >
                                    <Lock size={13} /> Bloquear
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteMusic(m.id, m.title)}
                                  disabled={busyId === `music-${m.id}`}
                                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                  title="Remover música"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {musicList.length === 0 && (
                          <p className="p-8 text-center text-gray-400 text-sm">Nenhuma música registada.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: VÍDEOS */}
                  {tab === 'videos' && (() => {
                    const VIDEOS_PER_PAGE = 12;
                    const qVideo = videoSearch.trim().toLowerCase();
                    const filteredVideos = qVideo
                      ? videoList.filter(
                          (v) =>
                            String(v.title || '').toLowerCase().includes(qVideo) ||
                            String(v.category || '').toLowerCase().includes(qVideo) ||
                            String(v.artist_name || '').toLowerCase().includes(qVideo)
                        )
                      : videoList;
                    const totalVideoPages = Math.max(1, Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE));
                    const safeVideosPage = Math.min(videosPage, totalVideoPages);
                    const paginatedVideos = filteredVideos.slice(
                      (safeVideosPage - 1) * VIDEOS_PER_PAGE,
                      safeVideosPage * VIDEOS_PER_PAGE
                    );
                    return (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="relative max-w-sm w-full">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={videoSearch}
                            onChange={(e) => {
                              setVideoSearch(e.target.value);
                              setVideosPage(1);
                            }}
                            placeholder="Pesquisar vídeo por título ou categoria..."
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <button
                          onClick={() => setShowAddVideoModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                        >
                          <Plus size={16} />
                          <span>Adicionar Vídeo</span>
                        </button>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/10">
                        {paginatedVideos.map((v) => {
                          const locked = Boolean(v.comments_locked);
                          const blocked = Boolean(v.is_blocked);
                          return (
                            <div key={v.id} className="flex items-center justify-between gap-4 p-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={resolveThumbUrl(v.thumbnail_path)}
                                  alt={v.title}
                                  className="w-16 h-10 rounded-lg object-cover bg-slate-800 flex-shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm truncate">{v.title}</p>
                                    {v.category && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                                        {v.category === 'sermao'
                                          ? 'Sermão'
                                          : v.category === 'podcast'
                                            ? 'Podcast'
                                            : v.category === 'estudo'
                                              ? 'Estudo'
                                              : v.category === 'culto'
                                                ? 'Culto'
                                                : v.category === 'video'
                                                  ? 'Vídeo'
                                                  : v.category}
                                      </span>
                                    )}
                                    {blocked && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                                        Bloqueado
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400 truncate">
                                    {v.views ?? 0} visualizações · {new Date(v.created_at).toLocaleDateString('pt-PT')}
                                    {locked && ' · Comentários trancados'}
                                    {v.block_reason ? ` · ${v.block_reason}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {blocked ? (
                                  <button
                                    onClick={() => handleModerateMedia('video', v.id, 'unblock')}
                                    disabled={busyId === `mod-video-${v.id}`}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium inline-flex items-center gap-1"
                                  >
                                    <CheckCircle size={13} /> Desbloquear
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleModerateMedia('video', v.id, 'block')}
                                    disabled={busyId === `mod-video-${v.id}`}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium inline-flex items-center gap-1"
                                  >
                                    <Lock size={13} /> Bloquear
                                  </button>
                                )}
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
                        {filteredVideos.length === 0 && (
                          <p className="p-8 text-center text-gray-400 text-sm">
                            {videoSearch.trim() ? 'Nenhum vídeo encontrado para esta pesquisa.' : 'Nenhum vídeo registado.'}
                          </p>
                        )}
                      </div>
                      <PaginationBar
                        page={safeVideosPage}
                        totalPages={totalVideoPages}
                        totalItems={filteredVideos.length}
                        onPageChange={setVideosPage}
                      />

                      <AddVideoModal
                        open={showAddVideoModal}
                        onClose={() => setShowAddVideoModal(false)}
                        onSuccess={() => {
                          notify('Vídeo publicado com sucesso!');
                          loadAll();
                        }}
                      />
                    </div>
                    );
                  })()}

                  {/* TAB: COMENTÁRIOS DE VÍDEOS & MODERAÇÃO */}
                  {tab === 'comments' && (() => {
                    const COMMENTS_PER_PAGE = 12;
                    const qComment = commentSearch.trim().toLowerCase();
                    const filteredComments = videoComments.filter((c) => {
                      if (onlyFlaggedComments && !c.is_offensive) return false;
                      if (!qComment) return true;
                      return (
                        String(c.content || '').toLowerCase().includes(qComment) ||
                        String(c.video_title || '').toLowerCase().includes(qComment) ||
                        String(c.username || '').toLowerCase().includes(qComment) ||
                        String(c.full_name || '').toLowerCase().includes(qComment)
                      );
                    });
                    const totalCommentPages = Math.max(
                      1,
                      Math.ceil(filteredComments.length / COMMENTS_PER_PAGE)
                    );
                    const safeCommentsPage = Math.min(commentsPage, totalCommentPages);
                    const paginatedComments = filteredComments.slice(
                      (safeCommentsPage - 1) * COMMENTS_PER_PAGE,
                      safeCommentsPage * COMMENTS_PER_PAGE
                    );
                    const flaggedCount = videoComments.filter((c) => c.is_offensive).length;

                    return (
                      <div className="space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3 flex-1">
                            <div className="relative max-w-sm w-full">
                              <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              />
                              <input
                                type="text"
                                value={commentSearch}
                                onChange={(e) => {
                                  setCommentSearch(e.target.value);
                                  setCommentsPage(1);
                                }}
                                placeholder="Pesquisar por comentário, vídeo ou utilizador..."
                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setOnlyFlaggedComments((v) => !v);
                                setCommentsPage(1);
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                                onlyFlaggedComments
                                  ? 'bg-red-500/20 border-red-400/50 text-red-200'
                                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              Só ofensivos ({flaggedCount})
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleRunOffensiveModeration}
                            disabled={moderatingOffensive}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                          >
                            {moderatingOffensive ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Shield size={16} />
                            )}
                            <span>Avaliar e remover ofensivos</span>
                          </button>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/10">
                          {paginatedComments.map((c) => {
                            const authorName = c.full_name || c.username || 'Utilizador';
                            return (
                              <div
                                key={c.id}
                                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.03]"
                              >
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-white">
                                      {authorName}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      @{c.username}
                                    </span>
                                    {c.parent_id && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                                        Resposta
                                      </span>
                                    )}
                                    {c.is_offensive && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-semibold">
                                        Ofensivo ({c.moderation_reason || 'detectado'})
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-200 whitespace-pre-line break-words">
                                    {c.content}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                    <span>
                                      Vídeo: <strong className="text-purple-300">{c.video_title}</strong>
                                    </span>
                                    <span>{c.likes_count || 0} gostos</span>
                                    <span>
                                      {new Date(c.created_at).toLocaleString('pt-PT', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAdminComment(c)}
                                    disabled={busyId === `comment-${c.id}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-medium transition-colors disabled:opacity-50"
                                  >
                                    {busyId === `comment-${c.id}` ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={14} />
                                    )}
                                    <span>Remover</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {filteredComments.length === 0 && (
                            <p className="p-8 text-center text-gray-400 text-sm">
                              {commentSearch.trim() || onlyFlaggedComments
                                ? 'Nenhum comentário encontrado para estes filtros.'
                                : 'Nenhum comentário registado.'}
                            </p>
                          )}
                        </div>

                        <PaginationBar
                          page={safeCommentsPage}
                          totalPages={totalCommentPages}
                          totalItems={filteredComments.length}
                          onPageChange={setCommentsPage}
                        />
                      </div>
                    );
                  })()}

                  {/* TAB: ARTISTAS & ÁLBUNS */}
                  {tab === 'catalog' && (() => {
                    const CATALOG_PER_PAGE = 12;
                    const qArtist = artistSearch.trim().toLowerCase();
                    const filteredArtists = qArtist
                      ? artists.filter(
                          (a) =>
                            String(a.name || '').toLowerCase().includes(qArtist) ||
                            String(a.genre || '').toLowerCase().includes(qArtist)
                        )
                      : artists;
                    const totalArtistPages = Math.max(1, Math.ceil(filteredArtists.length / CATALOG_PER_PAGE));
                    const safeArtistsPage = Math.min(artistsPage, totalArtistPages);
                    const paginatedArtists = filteredArtists.slice(
                      (safeArtistsPage - 1) * CATALOG_PER_PAGE,
                      safeArtistsPage * CATALOG_PER_PAGE
                    );

                    const qAlbum = albumSearch.trim().toLowerCase();
                    const filteredAlbums = qAlbum
                      ? albums.filter(
                          (al) =>
                            String(al.title || '').toLowerCase().includes(qAlbum) ||
                            String(al.artist_name || '').toLowerCase().includes(qAlbum)
                        )
                      : albums;
                    const totalAlbumPages = Math.max(1, Math.ceil(filteredAlbums.length / CATALOG_PER_PAGE));
                    const safeAlbumsPage = Math.min(albumsPage, totalAlbumPages);
                    const paginatedAlbums = filteredAlbums.slice(
                      (safeAlbumsPage - 1) * CATALOG_PER_PAGE,
                      safeAlbumsPage * CATALOG_PER_PAGE
                    );

                    return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <h3 className="font-bold text-base flex items-center gap-2">
                            <Mic size={16} className="text-pink-400" /> Artistas ({filteredArtists.length})
                          </h3>
                          <div className="relative sm:w-56 w-full">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={artistSearch}
                              onChange={(e) => {
                                setArtistSearch(e.target.value);
                                setArtistsPage(1);
                              }}
                              placeholder="Pesquisar artista..."
                              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                        <div className="divide-y divide-white/10 flex-1">
                          {paginatedArtists.map((a) => (
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
                          {filteredArtists.length === 0 && (
                            <p className="py-6 text-center text-gray-400 text-xs">
                              {artistSearch.trim() ? 'Nenhum artista encontrado.' : 'Nenhum artista registado.'}
                            </p>
                          )}
                        </div>
                        <PaginationBar
                          page={safeArtistsPage}
                          totalPages={totalArtistPages}
                          totalItems={filteredArtists.length}
                          onPageChange={setArtistsPage}
                        />
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <h3 className="font-bold text-base flex items-center gap-2">
                            <DiscAlbum size={16} className="text-amber-400" /> Álbuns ({filteredAlbums.length})
                          </h3>
                          <div className="relative sm:w-56 w-full">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={albumSearch}
                              onChange={(e) => {
                                setAlbumSearch(e.target.value);
                                setAlbumsPage(1);
                              }}
                              placeholder="Pesquisar álbum..."
                              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                        <div className="divide-y divide-white/10 flex-1">
                          {paginatedAlbums.map((al) => (
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
                          {filteredAlbums.length === 0 && (
                            <p className="py-6 text-center text-gray-400 text-xs">
                              {albumSearch.trim() ? 'Nenhum álbum encontrado.' : 'Nenhum álbum registado.'}
                            </p>
                          )}
                        </div>
                        <PaginationBar
                          page={safeAlbumsPage}
                          totalPages={totalAlbumPages}
                          totalItems={filteredAlbums.length}
                          onPageChange={setAlbumsPage}
                        />
                      </div>
                    </div>
                    );
                  })()}

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

                  {/* TAB: BACKUPS DA BASE DE DADOS */}
                  {tab === 'backups' && isFullAdmin && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Backup Manual */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <Database size={18} className="text-purple-400" />
                              Backup Manual da Base de Dados
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                              Gera um ficheiro <code className="text-purple-300">.sql</code> completo com todas as tabelas e registos atuais da plataforma para download seguro.
                            </p>
                            {backupSchedule.last_run_at && (
                              <p className="text-xs text-emerald-300 mt-3">
                                Último backup: {new Date(backupSchedule.last_run_at).toLocaleString('pt-PT')}
                              </p>
                            )}
                            {backupSchedule.enabled && backupSchedule.next_run_at && (
                              <p className="text-xs text-sky-300 mt-1">
                                Próximo agendado: {new Date(backupSchedule.next_run_at).toLocaleString('pt-PT')}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleRunBackupNow}
                            disabled={runningBackup}
                            className="w-full py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {runningBackup ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                            {runningBackup ? 'A gerar backup...' : 'Fazer Backup Agora'}
                          </button>
                        </div>

                        {/* Agendamento Regular */}
                        <form
                          onSubmit={handleSaveBackupSchedule}
                          className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <Calendar size={18} className="text-sky-400" />
                              Agendamento Automático
                            </h3>
                            <label className="inline-flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={backupSchedule.enabled}
                                onChange={(e) =>
                                  setBackupSchedule((prev) => ({ ...prev, enabled: e.target.checked }))
                                }
                                className="rounded border-white/20 bg-white/10 text-purple-600"
                              />
                              Ativo
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Frequência</label>
                              <select
                                value={backupSchedule.frequency}
                                onChange={(e) =>
                                  setBackupSchedule((prev) => ({
                                    ...prev,
                                    frequency: e.target.value as 'hourly' | 'daily' | 'weekly',
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-sm text-white"
                              >
                                <option value="hourly">De hora em hora</option>
                                <option value="daily">Diário</option>
                                <option value="weekly">Semanal</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Horário</label>
                              <input
                                type="time"
                                value={backupSchedule.time_of_day}
                                onChange={(e) =>
                                  setBackupSchedule((prev) => ({ ...prev, time_of_day: e.target.value }))
                                }
                                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Retenção (máx.)</label>
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={backupSchedule.retention_count}
                                onChange={(e) =>
                                  setBackupSchedule((prev) => ({
                                    ...prev,
                                    retention_count: Number(e.target.value) || 10,
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={savingSchedule}
                            className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {savingSchedule ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                            Guardar Agendamento
                          </button>
                        </form>
                      </div>

                      {/* Histórico de Backups */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                          <h3 className="font-bold text-base text-white">
                            Histórico de Backups ({backupList.length})
                          </h3>
                          <button
                            type="button"
                            onClick={loadBackups}
                            className="text-xs text-purple-300 hover:text-white inline-flex items-center gap-1"
                          >
                            <RefreshCw size={13} /> Atualizar
                          </button>
                        </div>
                        {backupList.length === 0 ? (
                          <p className="p-8 text-center text-gray-400 text-sm">
                            Nenhum backup gerado ainda. Clica em &quot;Fazer Backup Agora&quot; para criar o primeiro.
                          </p>
                        ) : (
                          <div className="divide-y divide-white/10">
                            {backupList.map((b) => (
                              <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-mono text-xs sm:text-sm text-white truncate">{b.filename}</p>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                        b.status === 'success'
                                          ? 'bg-emerald-500/20 text-emerald-300'
                                          : 'bg-red-500/20 text-red-300'
                                      }`}
                                    >
                                      {b.status === 'success' ? 'Sucesso' : 'Erro'}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                                      {b.trigger_type === 'scheduled' ? 'Agendado' : 'Manual'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(b.created_at).toLocaleString('pt-PT')} · {b.tables_count} tabelas · {Number(b.rows_count || 0).toLocaleString('pt-PT')} registos · {(Number(b.size_bytes || 0) / 1024).toFixed(1)} KB
                                  </p>
                                  {b.error_message && (
                                    <p className="text-xs text-red-300 mt-0.5">{b.error_message}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {b.file_exists && (
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadBackup(b.filename)}
                                      className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-medium inline-flex items-center gap-1"
                                    >
                                      <Download size={13} /> Descarregar
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBackup(b.filename)}
                                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                    title="Remover backup"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: LOGS DA PLATAFORMA */}
                  {tab === 'logs' && isFullAdmin && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <p className="text-xs text-gray-400">Total Analisado</p>
                          <p className="text-2xl font-bold text-white mt-1">{logSummary.total}</p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4">
                          <p className="text-xs text-emerald-300">Sucessos</p>
                          <p className="text-2xl font-bold text-emerald-200 mt-1">{logSummary.successes}</p>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4">
                          <p className="text-xs text-amber-300">Avisos</p>
                          <p className="text-2xl font-bold text-amber-200 mt-1">{logSummary.warnings}</p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4">
                          <p className="text-xs text-red-300">Erros</p>
                          <p className="text-2xl font-bold text-red-200 mt-1">{logSummary.errors}</p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-1.5">
                          {(
                            [
                              { key: 'all', label: 'Todos' },
                              { key: 'error', label: 'Erros' },
                              { key: 'warn', label: 'Avisos' },
                              { key: 'success', label: 'Sucessos' },
                              { key: 'info', label: 'Info' },
                            ] as const
                          ).map((f) => (
                            <button
                              key={f.key}
                              type="button"
                              onClick={() => setLogLevel(f.key)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                logLevel === f.key
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={logSearch}
                              onChange={(e) => setLogSearch(e.target.value)}
                              placeholder="Filtrar mensagem ou rota..."
                              className="pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={loadLogs}
                            disabled={loadingLogs}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium inline-flex items-center gap-1"
                          >
                            <RefreshCw size={13} className={loadingLogs ? 'animate-spin' : ''} /> Atualizar
                          </button>
                          <button
                            type="button"
                            onClick={handleClearLogs}
                            className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium inline-flex items-center gap-1"
                          >
                            <Trash2 size={13} /> Limpar
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950/90 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="max-h-[480px] overflow-y-auto divide-y divide-white/5 font-mono text-xs">
                          {logEntries.length === 0 ? (
                            <p className="p-8 text-center text-gray-500">
                              Nenhum registo encontrado para os filtros selecionados.
                            </p>
                          ) : (
                            logEntries.map((entry) => (
                              <div key={entry.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-white/[0.03]">
                                <span className="text-gray-500 flex-shrink-0 w-36">
                                  {entry.timestamp || '—'}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${
                                    entry.category === 'error'
                                      ? 'bg-red-500/20 text-red-300'
                                      : entry.category === 'warn'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : entry.category === 'success'
                                          ? 'bg-emerald-500/20 text-emerald-300'
                                          : 'bg-sky-500/20 text-sky-300'
                                  }`}
                                >
                                  {entry.category}
                                </span>
                                <span className="text-gray-200 break-all">{entry.message}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: RODAPÉ GERENCIÁVEL */}
                  {tab === 'footer' && isFullAdmin && (
                    <form onSubmit={handleSaveFooter} className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3.5">
                          <h3 className="font-bold text-base text-white">Redes Sociais</h3>
                          <p className="text-xs text-gray-400">
                            Deixa em branco as redes que não quiseres exibir no rodapé.
                          </p>
                          {(
                            [
                              { key: 'instagram', label: 'Instagram URL' },
                              { key: 'facebook', label: 'Facebook URL' },
                              { key: 'youtube', label: 'YouTube URL' },
                              { key: 'tiktok', label: 'TikTok URL' },
                              { key: 'whatsapp', label: 'WhatsApp URL (ex: https://wa.me/...)' },
                            ] as const
                          ).map((item) => (
                            <div key={item.key}>
                              <label className="block text-xs text-gray-400 mb-1">{item.label}</label>
                              <input
                                type="text"
                                value={footerConfig.social?.[item.key] || ''}
                                onChange={(e) =>
                                  setFooterConfig((prev) => ({
                                    ...prev,
                                    social: { ...prev.social, [item.key]: e.target.value },
                                  }))
                                }
                                placeholder="https://..."
                                className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                          <h3 className="font-bold text-base text-white">Textos & Direitos</h3>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Copyright</label>
                            <input
                              type="text"
                              value={footerConfig.copyright || ''}
                              onChange={(e) =>
                                setFooterConfig((prev) => ({ ...prev, copyright: e.target.value }))
                              }
                              className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Versículo / Tagline</label>
                            <input
                              type="text"
                              value={footerConfig.tagline || ''}
                              onChange={(e) =>
                                setFooterConfig((prev) => ({ ...prev, tagline: e.target.value }))
                              }
                              className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={savingFooter}
                            className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {savingFooter ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                            Guardar Rodapé
                          </button>
                        </div>
                      </div>

                      {/* Colunas de Links */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(footerConfig.columns || []).map((col, colIdx) => (
                          <div key={`fcol-${colIdx}`} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                            <input
                              type="text"
                              value={col.title}
                              onChange={(e) =>
                                setFooterConfig((prev) => {
                                  const cols = [...prev.columns];
                                  cols[colIdx] = { ...cols[colIdx], title: e.target.value };
                                  return { ...prev, columns: cols };
                                })
                              }
                              className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-sm font-bold text-white"
                            />
                            <div className="space-y-2">
                              {col.links.map((lnk, lnkIdx) => (
                                <div key={`flnk-${colIdx}-${lnkIdx}`} className="flex gap-1.5">
                                  <input
                                    type="text"
                                    value={lnk.label}
                                    placeholder="Texto"
                                    onChange={(e) =>
                                      setFooterConfig((prev) => {
                                        const cols = [...prev.columns];
                                        const links = [...cols[colIdx].links];
                                        links[lnkIdx] = { ...links[lnkIdx], label: e.target.value };
                                        cols[colIdx] = { ...cols[colIdx], links };
                                        return { ...prev, columns: cols };
                                      })
                                    }
                                    className="w-1/2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white"
                                  />
                                  <input
                                    type="text"
                                    value={lnk.href}
                                    placeholder="/rota"
                                    onChange={(e) =>
                                      setFooterConfig((prev) => {
                                        const cols = [...prev.columns];
                                        const links = [...cols[colIdx].links];
                                        links[lnkIdx] = { ...links[lnkIdx], href: e.target.value };
                                        cols[colIdx] = { ...cols[colIdx], links };
                                        return { ...prev, columns: cols };
                                      })
                                    }
                                    className="w-1/2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </form>
                  )}

                  {/* TAB: LOGO / IDENTIDADE */}
                  {/* TAB: GESTÃO DE PAGAMENTOS (EXCLUSIVO ADMIN + 2ª AUTENTICAÇÃO) */}
                  {tab === 'payments' && isFullAdmin && <PaymentManagementTab />}

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

                  {/* TAB: EVENTOS DA PLATAFORMA */}
                  {tab === 'events' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <form
                        onSubmit={handleCreateEvent}
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
                      >
                        <h3 className="font-bold text-base flex items-center gap-2">
                          <Calendar size={16} className="text-purple-400" />
                          Publicar Evento ou Publicidade
                        </h3>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Tipo *</label>
                          <select
                            value={eventCategory}
                            onChange={(e) => setEventCategory(e.target.value as 'evento' | 'publicidade')}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="evento">Evento / Culto / Aviso</option>
                            <option value="publicidade">Publicidade / Banner na Página Principal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Título *</label>
                          <input
                            type="text"
                            required
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            placeholder="Ex: Culto de Celebração — Domingo"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Data / Horário</label>
                            <input
                              type="text"
                              value={eventDate}
                              onChange={(e) => setEventDate(e.target.value)}
                              placeholder="Ex: Domingo 09:00"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Local / Canal</label>
                            <input
                              type="text"
                              value={eventLocation}
                              onChange={(e) => setEventLocation(e.target.value)}
                              placeholder="Ex: Auditório Central / Ao vivo"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Descrição</label>
                          <textarea
                            rows={3}
                            value={eventDesc}
                            onChange={(e) => setEventDesc(e.target.value)}
                            placeholder="Detalhes sobre o evento, publicidade ou aviso..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Link de Destino (opcional)</label>
                            <input
                              type="text"
                              value={eventLinkUrl}
                              onChange={(e) => setEventLinkUrl(e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Imagem Banner (opcional)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setEventBanner(e.target.files?.[0] || null)}
                              className="w-full text-xs text-gray-300 pt-1.5"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Publicação Agendada (opcional)</label>
                            <input
                              type="datetime-local"
                              value={eventScheduledAt}
                              onChange={(e) => setEventScheduledAt(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Remoção Agendada (opcional)</label>
                            <input
                              type="datetime-local"
                              value={eventExpiresAt}
                              onChange={(e) => setEventExpiresAt(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={eventNotify}
                            onChange={(e) => setEventNotify(e.target.checked)}
                            className="rounded border-white/20 bg-white/10 text-purple-600"
                          />
                          Notificar todos os utilizadores da plataforma sobre este evento
                        </label>
                        <button
                          type="submit"
                          disabled={savingEvent}
                          className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {savingEvent ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                          Publicar Evento
                        </button>
                      </form>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                        <h3 className="font-bold text-base">Eventos Publicados ({eventsList.length})</h3>
                        {eventsList.length === 0 ? (
                          <p className="text-sm text-gray-400 py-8 text-center">
                            Nenhum evento publicado ainda.
                          </p>
                        ) : (
                          <div className="divide-y divide-white/10">
                            {eventsList.map((ev) => (
                              <div key={ev.id} className="py-3 flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                  {ev.banner_url && (
                                    <img
                                      src={resolveCoverUrl(ev.banner_url)}
                                      alt={ev.title}
                                      className="w-16 h-11 rounded-lg object-cover bg-slate-800 flex-shrink-0"
                                    />
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-sm text-white truncate">{ev.title}</p>
                                      <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                          ev.category === 'publicidade'
                                            ? 'bg-pink-500/20 text-pink-300'
                                            : 'bg-sky-500/20 text-sky-300'
                                        }`}
                                      >
                                        {ev.category === 'publicidade' ? 'Publicidade' : 'Evento'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-purple-300 mt-0.5">
                                      {[ev.event_date, ev.location].filter(Boolean).join(' · ') || 'Plataforma'}
                                    </p>
                                    {ev.description && (
                                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ev.description}</p>
                                    )}
                                    {(ev.scheduled_at || ev.expires_at) && (
                                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {ev.scheduled_at && new Date(ev.scheduled_at).getTime() > Date.now() && (
                                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                                            Agendado: {new Date(ev.scheduled_at).toLocaleString('pt-PT')}
                                          </span>
                                        )}
                                        {ev.expires_at && (
                                          <span
                                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                                              new Date(ev.expires_at).getTime() <= Date.now()
                                                ? 'bg-red-500/20 text-red-300'
                                                : 'bg-amber-500/20 text-amber-300'
                                            }`}
                                          >
                                            {new Date(ev.expires_at).getTime() <= Date.now()
                                              ? 'Expirado'
                                              : `Remove em: ${new Date(ev.expires_at).toLocaleString('pt-PT')}`}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEvent(ev.id)}
                                  disabled={busyId === `event-${ev.id}`}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                                  title="Remover evento"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: DENÚNCIAS & COMPLIANCE */}
                  {tab === 'reports' && (
                    <div className="space-y-3">
                      {reportsList.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400 text-sm">
                          Nenhuma denúncia registada.
                        </div>
                      ) : (
                        reportsList.map((rep) => (
                          <div
                            key={rep.id}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    rep.severity === 'critica'
                                      ? 'bg-red-600/30 text-red-200 border border-red-500/40'
                                      : rep.severity === 'grave'
                                        ? 'bg-orange-500/25 text-orange-200'
                                        : rep.severity === 'moderada'
                                          ? 'bg-amber-500/20 text-amber-300'
                                          : 'bg-sky-500/20 text-sky-300'
                                  }`}
                                >
                                  {rep.severity}
                                </span>
                                <span className="font-semibold text-sm text-white">
                                  {rep.content_title || `${rep.content_type} #${rep.content_id}`}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  ({rep.status === 'pending' ? 'Pendente' : rep.action_taken || rep.status})
                                </span>
                              </div>
                              <p className="text-xs text-gray-300">Motivo: {rep.reason}</p>
                              {rep.details && <p className="text-xs text-gray-400">{rep.details}</p>}
                            </div>
                            {rep.status === 'pending' && (
                              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await fetchWithAuth(`/api/v1/admin/reports/${rep.id}/resolve`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ action: 'strike' }),
                                    });
                                    notify('Strike (1 pt) aplicado e conteúdo bloqueado.');
                                    await loadAll();
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-xs font-medium"
                                >
                                  Strike + Bloquear
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await fetchWithAuth(`/api/v1/admin/reports/${rep.id}/resolve`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ action: 'remove' }),
                                    });
                                    notify('Conteúdo removido.');
                                    await loadAll();
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-xs font-medium"
                                >
                                  Remover Conteúdo
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await fetchWithAuth(`/api/v1/admin/reports/${rep.id}/resolve`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ action: 'dismiss' }),
                                    });
                                    notify('Denúncia arquivada.');
                                    await loadAll();
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium"
                                >
                                  Arquivar
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB: PITCHING EDITORIAL */}
                  {tab === 'pitches' && (
                    <div className="space-y-3">
                      {pitchesList.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400 text-sm">
                          Nenhuma submissão de pitching editorial ainda.
                        </div>
                      ) : (
                        pitchesList.map((pitch) => (
                          <div
                            key={pitch.id}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-white">{pitch.music_title}</span>
                                <span className="text-xs text-purple-300">por {pitch.artist_name || 'Criador'}</span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                    pitch.status === 'approved'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : pitch.status === 'rejected'
                                        ? 'bg-red-500/20 text-red-300'
                                        : 'bg-amber-500/20 text-amber-300'
                                  }`}
                                >
                                  {pitch.status === 'approved' ? 'Aprovado' : pitch.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-300">{pitch.ministerial_context}</p>
                              {pitch.target_audience && (
                                <p className="text-xs text-gray-400">Público: {pitch.target_audience}</p>
                              )}
                            </div>
                            {pitch.status === 'pending' && (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await fetchWithAuth(`/api/v1/admin/pitches/${pitch.id}/review`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ decision: 'approved' }),
                                    });
                                    notify('Faixa aprovada para playlist editorial!');
                                    await loadAll();
                                  }}
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium"
                                >
                                  Aprovar
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await fetchWithAuth(`/api/v1/admin/pitches/${pitch.id}/review`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ decision: 'rejected' }),
                                    });
                                    notify('Submissão rejeitada.');
                                    await loadAll();
                                  }}
                                  className="px-3.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-xs font-medium"
                                >
                                  Rejeitar
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB: MENSAGENS DE SUPORTE (apenas em aberto) */}
                  {tab === 'support' && (
                    <div className="space-y-3">
                      {(() => {
                        const openSupport = supportList.filter((tk) => tk.status === 'open');
                        if (openSupport.length === 0) {
                          return (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400 text-sm">
                              Nenhum pedido de suporte em aberto no momento.
                            </div>
                          );
                        }
                        return openSupport.map((tk) => (
                          <div
                            key={tk.id}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-sm text-white">
                                  #{tk.id} · {tk.subject}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 uppercase">
                                  {tk.category || 'geral'}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300">
                                  Em aberto
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">
                                De: {tk.name || 'Utilizador'} {tk.email ? `(${tk.email})` : ''} ·{' '}
                                {new Date(tk.created_at).toLocaleString('pt-PT')}
                              </p>
                              <p className="text-xs text-gray-200 whitespace-pre-line mt-1">{tk.message}</p>
                              {tk.attachment_url && (
                                <a
                                  href={tk.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-purple-300 hover:text-purple-200 underline"
                                >
                                  Ver anexo enviado
                                </a>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setModalConfig({
                                  mode: 'prompt',
                                  title: `Resolver Suporte #${tk.id}`,
                                  message: `Pedido: "${tk.subject}" — Ao confirmar, o utilizador será notificado na plataforma e por email e o pedido sairá da fila.`,
                                  inputLabel: 'Resposta para o utilizador (opcional)',
                                  inputPlaceholder: 'Escreve a solução ou resposta para o utilizador...',
                                  confirmLabel: 'Responder & Resolver',
                                  onConfirm: async (reply) => {
                                    await fetchWithAuth(`/api/v1/admin/support/${tk.id}/resolve`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ reply: reply || '' }),
                                    });
                                    notify('Pedido resolvido e utilizador notificado!');
                                    await loadAll();
                                  },
                                })
                              }
                              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium flex-shrink-0"
                            >
                              Responder & Resolver
                            </button>
                          </div>
                        ));
                      })()}
                    </div>
                  )}

                  {/* TAB: SOLICITAÇÕES DE ARTISTA */}
                  {tab === 'artist-requests' && (
                    <div className="space-y-3">
                      {artistRequests.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400 text-sm">
                          Nenhuma solicitação de verificação de artista registada.
                        </div>
                      ) : (
                        artistRequests.map((reqItem) => {
                          const isPending = reqItem.status === 'pending';
                          const isApproved = reqItem.status === 'approved';
                          return (
                            <div
                              key={reqItem.id}
                              className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-white text-sm">
                                    {reqItem.artist_name}
                                  </span>
                                  <span
                                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                                      isApproved
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : isPending
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    }`}
                                  >
                                    {isApproved ? 'Aprovado & Verificado' : isPending ? 'Pendente' : 'Rejeitado'}
                                  </span>
                                  {reqItem.genre && (
                                    <span className="text-xs text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full">
                                      {reqItem.genre}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400">
                                  Utilizador: {reqItem.full_name || reqItem.username} ({reqItem.email || `@${reqItem.username}`})
                                </p>
                                {reqItem.bio && (
                                  <p className="text-xs text-gray-300 line-clamp-2">{reqItem.bio}</p>
                                )}
                                {reqItem.rejection_reason && (
                                  <p className="text-xs text-red-300">Motivo: {reqItem.rejection_reason}</p>
                                )}
                                {(reqItem.has_selfie || reqItem.has_bi_front || reqItem.has_bi_back || reqItem.selfie_url || reqItem.bi_front_url || reqItem.bi_back_url) && (
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setDocPreviewModal({
                                          artistName: reqItem.artist_name,
                                          loading: true,
                                        });
                                        try {
                                          const loadDoc = async (docType: 'selfie' | 'bi_front' | 'bi_back') => {
                                            const r = await fetchWithAuth(
                                              `/api/v1/admin/artist-requests/${reqItem.id}/document/${docType}`
                                            );
                                            if (!r.ok) return undefined;
                                            const blob = await r.blob();
                                            return URL.createObjectURL(blob);
                                          };
                                          const [selfie, biFront, biBack] = await Promise.all([
                                            loadDoc('selfie'),
                                            loadDoc('bi_front'),
                                            loadDoc('bi_back'),
                                          ]);
                                          setDocPreviewModal({
                                            artistName: reqItem.artist_name,
                                            loading: false,
                                            selfie,
                                            biFront,
                                            biBack,
                                          });
                                        } catch {
                                          setDocPreviewModal({
                                            artistName: reqItem.artist_name,
                                            loading: false,
                                            error: 'Não foi possível carregar os documentos.',
                                          });
                                        }
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/30 text-purple-200 text-xs font-medium inline-flex items-center gap-1.5"
                                    >
                                      Ver documentos (Rosto + BI)
                                    </button>
                                  </div>
                                )}
                              </div>

                              {isPending && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    type="button"
                                    disabled={busyId === `req-${reqItem.id}`}
                                    onClick={async () => {
                                      try {
                                        setBusyId(`req-${reqItem.id}`);
                                        const res = await fetchWithAuth(`/api/v1/admin/artist-requests/${reqItem.id}/approve`, {
                                          method: 'POST',
                                        });
                                        const b = await res.json();
                                        if (!res.ok || !b?.success) throw new Error(b?.message || 'Erro ao aprovar');
                                        notify(`Artista "${reqItem.artist_name}" aprovado e verificado!`);
                                        await loadAll();
                                      } catch (e: any) {
                                        setError(e?.message || 'Erro ao aprovar');
                                      } finally {
                                        setBusyId(null);
                                      }
                                    }}
                                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
                                  >
                                    <CheckCircle size={14} /> Aprovar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyId === `req-${reqItem.id}`}
                                    onClick={() =>
                                      setModalConfig({
                                        mode: 'prompt',
                                        title: `Rejeitar solicitação de "${reqItem.artist_name}"`,
                                        message: 'Indica o motivo da rejeição para o utilizador (opcional):',
                                        inputLabel: 'Motivo da rejeição',
                                        inputPlaceholder: 'Ex: Documento ilegível ou perfil incompleto...',
                                        confirmLabel: 'Rejeitar',
                                        danger: true,
                                        onConfirm: async (reason) => {
                                          try {
                                            setBusyId(`req-${reqItem.id}`);
                                            const res = await fetchWithAuth(`/api/v1/admin/artist-requests/${reqItem.id}/reject`, {
                                              method: 'POST',
                                              body: JSON.stringify({ reason: reason || '' }),
                                            });
                                            const b = await res.json();
                                            if (!res.ok || !b?.success) throw new Error(b?.message || 'Erro ao rejeitar');
                                            notify('Solicitação rejeitada.');
                                            await loadAll();
                                          } catch (e: any) {
                                            setError(e?.message || 'Erro ao rejeitar');
                                          } finally {
                                            setBusyId(null);
                                          }
                                        },
                                      })
                                    }
                                    className="px-3.5 py-2 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
                                  >
                                    <XCircle size={14} /> Rejeitar
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {showAddAudioModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddAudioModal(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Mic size={18} className="text-purple-400" />
                Lançar Conteúdo da Plataforma
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAudioModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>
            <form onSubmit={handlePublishPlatformAudio} className="space-y-3.5">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Categoria *</label>
                <select
                  value={audioCategory}
                  onChange={(e) => setAudioCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="sermao">Sermão</option>
                  <option value="podcast">Podcast</option>
                  <option value="estudo">Estudo Bíblico</option>
                  <option value="musica">Música / Louvor</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={audioTitle}
                  onChange={(e) => setAudioTitle(e.target.value)}
                  placeholder="Ex: Estudo sobre Romanos 8"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Autor / Pregador / Apresentador</label>
                <input
                  type="text"
                  value={audioArtist}
                  onChange={(e) => setAudioArtist(e.target.value)}
                  placeholder="PodFéPlay"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Ficheiro de Áudio *</label>
                <input
                  type="file"
                  required
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Capa (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAudioCover(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-300"
                />
              </div>
              <button
                type="submit"
                disabled={savingAudio}
                className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingAudio ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Publicar Conteúdo
              </button>
            </form>
          </div>
        </div>
      )}

      {showCreateStaffModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCreateStaffModal(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-purple-400" />
                Novo Membro de Gestão
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateStaffModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateStaffUser} className="space-y-3.5">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome completo</label>
                <input
                  type="text"
                  value={staffFullName}
                  onChange={(e) => setStaffFullName(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  placeholder="Ex: maria.revisora"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="maria@podfeplay.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 text-xs text-purple-200">
                A palavra-passe será gerada automaticamente pelo sistema e enviada com os dados de acesso para o email indicado.
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Função / Permissão *</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as 'moderator' | 'admin')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="moderator">
                    Revisor — revisa, aprova, bloqueia, remove conteúdos e publica eventos
                  </option>
                  <option value="admin">
                    Administrador — controlo total, cria equipa e gere permissões
                  </option>
                </select>
              </div>
              <button
                type="submit"
                disabled={creatingStaff}
                className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creatingStaff ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Criar Utilizador de Gestão
              </button>
            </form>
          </div>
        </div>
      )}

      <PlayerBar />
      {docPreviewModal && (
        <div
          className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (docPreviewModal.selfie) URL.revokeObjectURL(docPreviewModal.selfie);
            if (docPreviewModal.biFront) URL.revokeObjectURL(docPreviewModal.biFront);
            if (docPreviewModal.biBack) URL.revokeObjectURL(docPreviewModal.biBack);
            setDocPreviewModal(null);
          }}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Documentos de Verificação — {docPreviewModal.artistName}
                </h3>
                <p className="text-xs text-gray-400">
                  Compara a foto do rosto com a frente e o verso do Bilhete de Identidade.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (docPreviewModal.selfie) URL.revokeObjectURL(docPreviewModal.selfie);
                  if (docPreviewModal.biFront) URL.revokeObjectURL(docPreviewModal.biFront);
                  if (docPreviewModal.biBack) URL.revokeObjectURL(docPreviewModal.biBack);
                  setDocPreviewModal(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
              >
                Fechar
              </button>
            </div>

            {docPreviewModal.loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-purple-400" size={32} />
              </div>
            ) : docPreviewModal.error ? (
              <p className="text-sm text-red-300 py-6 text-center">{docPreviewModal.error}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Foto do Rosto (Selfie)', src: docPreviewModal.selfie },
                  { label: 'BI — Parte Frontal', src: docPreviewModal.biFront },
                  { label: 'BI — Parte Traseira', src: docPreviewModal.biBack },
                ].map((doc) => (
                  <div
                    key={doc.label}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2"
                  >
                    <p className="text-xs font-semibold text-gray-200">{doc.label}</p>
                    {doc.src ? (
                      <a href={doc.src} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={doc.src}
                          alt={doc.label}
                          className="w-full aspect-[4/3] object-cover rounded-lg border border-white/10 hover:opacity-90 transition"
                        />
                      </a>
                    ) : (
                      <div className="w-full aspect-[4/3] rounded-lg bg-white/5 flex items-center justify-center text-xs text-gray-500">
                        Não enviado
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ActionModal config={modalConfig} onClose={() => setModalConfig(null)} />
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/5 border border-white/10 rounded-2xl p-4 transition-all ${
        onClick ? 'cursor-pointer hover:bg-white/10 hover:border-purple-500/40 hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString('pt-PT')}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-purple-300 mt-1">{sub}</p>}
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (nextPage: number) => void;
}) {
  if (totalItems === 0 || totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-white/10 text-xs text-gray-400">
      <span>
        Página <strong className="text-white">{page}</strong> de{' '}
        <strong className="text-white">{totalPages}</strong> ({totalItems} registos)
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Seguinte
        </button>
      </div>
    </div>
  );
}
