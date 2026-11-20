'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  Image as ImageIcon,
  X,
  Calendar,
  Clock,
  BadgeCheck,
  Send,
  BarChart3,
  Crown,
  Wallet,
  Download,
  ListMusic,
  Camera,
  RotateCcw,
  ShieldCheck,
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
import ActionModal, { ActionModalConfig } from '@/components/ActionModal';
import PlanCheckoutModal from '@/components/PlanCheckoutModal';
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
    plan?: string;
    creator_type?: string;
    verification_type?: string;
  } | null;
  planInfo?: {
    plan: {
      key: string;
      name: string;
      priceUsd: number;
      priceAoa: number;
      monthlyUploadLimit: number | null;
      storageLimitMb: number;
      canSchedule: boolean;
      canMonetizeStreams: boolean;
      canPaywall: boolean;
      canPitchEditorial: boolean;
      canExportAnalytics: boolean;
      analyticsDays: number;
      maxManagers: number;
    };
    creator_type: string;
    verification_type: string;
    usage: {
      monthlyUploads: number;
      storageUsedMb: number;
      activeStrikePoints: number;
    };
  } | null;
  plansCatalog?: any[];
  monetization?: {
    royaltiesAoa: number;
    donationsAoa: number;
    withdrawnAoa: number;
    availableBalanceAoa: number;
    donations: any[];
    payouts: any[];
  } | null;
  pitches?: any[];
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
  const [trackIsrc, setTrackIsrc] = useState('');
  const [trackComposer, setTrackComposer] = useState('');
  const [trackLanguage, setTrackLanguage] = useState('Português');
  const [trackVisibility, setTrackVisibility] = useState<'public' | 'premium' | 'private'>('public');
  const [trackLyrics, setTrackLyrics] = useState('');
  const [trackScheduleMode, setTrackScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [trackScheduledAt, setTrackScheduledAt] = useState('');
  const [trackAudio, setTrackAudio] = useState<File | null>(null);
  const [trackCover, setTrackCover] = useState<File | null>(null);
  const [savingTrack, setSavingTrack] = useState(false);

  // Tabs & Solicitação de Verificação
  const [studioTab, setStudioTab] = useState<'analytics' | 'content' | 'schedule' | 'followers' | 'monetization' | 'pitching'>('analytics');
  const [reqArtistName, setReqArtistName] = useState('');
  const [reqCreatorType, setReqCreatorType] = useState<'artista' | 'pregador' | 'igreja' | 'podcaster'>('artista');
  const [reqVerificationType, setReqVerificationType] = useState<'identity' | 'ministerial'>('identity');
  const [reqDocumentUrl, setReqDocumentUrl] = useState('');
  const [reqSelfieFile, setReqSelfieFile] = useState<File | null>(null);
  const [reqSelfiePreview, setReqSelfiePreview] = useState<string | null>(null);
  const [reqBiFrontFile, setReqBiFrontFile] = useState<File | null>(null);
  const [reqBiFrontPreview, setReqBiFrontPreview] = useState<string | null>(null);
  const [reqBiBackFile, setReqBiBackFile] = useState<File | null>(null);
  const [reqBiBackPreview, setReqBiBackPreview] = useState<string | null>(null);
  const [activeCameraTarget, setActiveCameraTarget] = useState<'selfie' | 'bi_front' | 'bi_back' | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [reqGenre, setReqGenre] = useState('');
  const [reqBio, setReqBio] = useState('');
  const [reqInstagram, setReqInstagram] = useState('');
  const [reqPortfolio, setReqPortfolio] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  // Planos, Saques & Pitching
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<any | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'multicaixa' | 'pix' | 'paypal' | 'iban'>('multicaixa');
  const [payoutDest, setPayoutDest] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [pitchMusicId, setPitchMusicId] = useState('');
  const [pitchContext, setPitchContext] = useState('');
  const [pitchAudience, setPitchAudience] = useState('');
  const [submittingPitch, setSubmittingPitch] = useState(false);
  const [modalConfig, setModalConfig] = useState<ActionModalConfig | null>(null);

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
      if (trackIsrc.trim()) fd.append('isrc', trackIsrc.trim());
      if (trackComposer.trim()) fd.append('composer', trackComposer.trim());
      if (trackLanguage.trim()) fd.append('language', trackLanguage.trim());
      fd.append('visibility', trackVisibility);
      if (trackLyrics.trim()) fd.append('lyrics', trackLyrics.trim());
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
      setTrackIsrc('');
      setTrackComposer('');
      setTrackLanguage('Português');
      setTrackVisibility('public');
      setTrackLyrics('');
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

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActiveCameraTarget(null);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Liga o stream ao elemento <video> assim que o React o monta no DOM
  useEffect(() => {
    if (!activeCameraTarget || !videoRef.current || !streamRef.current) return;
    const videoEl = videoRef.current;
    videoEl.srcObject = streamRef.current;
    videoEl.play().catch(() => {
      // Alguns browsers exigem interação, mas autoPlay + muted já iniciam normalmente
    });
  }, [activeCameraTarget]);

  const startCamera = async (target: 'selfie' | 'bi_front' | 'bi_back' = 'selfie') => {
    setCameraError(null);
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setCameraError('A câmara requer uma ligação segura (HTTPS ou localhost).');
      return;
    }
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('A câmara não é suportada neste navegador. Envia uma foto do teu dispositivo.');
      return;
    }

    stopCamera();

    try {
      const preferredFacing = target === 'selfie' ? 'user' : 'environment';
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: preferredFacing } },
          audio: false,
        });
      } catch {
        // Fallback genérico para webcams de computador que não suportam facingMode
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setActiveCameraTarget(target);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraError('Permissão da câmara negada. Autoriza o acesso nas definições do navegador.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setCameraError('Nenhuma câmara encontrada neste dispositivo. Envia uma foto como ficheiro.');
      } else {
        setCameraError('Não foi possível abrir a câmara. Tenta enviar uma foto do dispositivo.');
      }
    }
  };

  const captureFromCamera = (target: 'selfie' | 'bi_front' | 'bi_back') => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('A câmara ainda está a inicializar. Aguarda um segundo e tenta novamente.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `${target}-${Date.now()}.jpg`, { type: 'image/jpeg' });
        if (target === 'selfie') {
          handleSelectDocFile(file, setReqSelfieFile, setReqSelfiePreview);
        } else if (target === 'bi_front') {
          handleSelectDocFile(file, setReqBiFrontFile, setReqBiFrontPreview);
        } else {
          handleSelectDocFile(file, setReqBiBackFile, setReqBiBackPreview);
        }
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  };

  const handleSelectDocFile = (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    setFile(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqArtistName.trim()) return;
    if (!reqSelfieFile || !reqBiFrontFile || !reqBiBackFile) {
      setError('É obrigatório enviar a foto do rosto (selfie) e as fotos frontal e traseira do BI.');
      return;
    }
    try {
      setSubmittingReq(true);
      setError(null);
      const fd = new FormData();
      fd.append('artist_name', reqArtistName.trim());
      fd.append('creator_type', reqCreatorType);
      fd.append('verification_type', reqVerificationType);
      if (reqDocumentUrl.trim()) fd.append('document_url', reqDocumentUrl.trim());
      if (reqGenre.trim()) fd.append('genre', reqGenre.trim());
      if (reqBio.trim()) fd.append('bio', reqBio.trim());
      if (reqInstagram.trim()) fd.append('instagram_url', reqInstagram.trim());
      if (reqPortfolio.trim()) fd.append('portfolio_url', reqPortfolio.trim());
      fd.append('selfie', reqSelfieFile);
      fd.append('bi_front', reqBiFrontFile);
      fd.append('bi_back', reqBiBackFile);

      const res = await fetchWithAuth('/api/v1/studio/request-verification', {
        method: 'POST',
        body: fd,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Não foi possível enviar a solicitação.');
      notifySuccess('Solicitação enviada! Aguarda a aprovação da administração.');
      stopCamera();
      await loadStudio();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível enviar a solicitação.');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleChangePlan = async (planKey: string) => {
    try {
      setChangingPlan(planKey);
      setError(null);
      const res = await fetchWithAuth('/api/v1/studio/plan/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao alterar plano');
      notifySuccess(body?.message || 'Plano atualizado!');
      await loadStudio();
    } catch (err: any) {
      setError(err?.message || 'Erro ao alterar plano');
    } finally {
      setChangingPlan(null);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRequestingPayout(true);
      setError(null);
      const res = await fetchWithAuth('/api/v1/studio/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_aoa: Number(payoutAmount),
          method: payoutMethod,
          destination: payoutDest.trim(),
        }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao solicitar levantamento');
      setPayoutAmount('');
      setPayoutDest('');
      notifySuccess('Pedido de levantamento registado!');
      await loadStudio();
    } catch (err: any) {
      setError(err?.message || 'Erro ao solicitar levantamento');
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleSubmitPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitchMusicId || !pitchContext.trim()) return;
    try {
      setSubmittingPitch(true);
      setError(null);
      const res = await fetchWithAuth('/api/v1/studio/pitches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          music_id: Number(pitchMusicId),
          ministerial_context: pitchContext.trim(),
          target_audience: pitchAudience.trim() || null,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao submeter pitching');
      setPitchMusicId('');
      setPitchContext('');
      setPitchAudience('');
      notifySuccess('Faixa submetida para curadoria editorial!');
      await loadStudio();
    } catch (err: any) {
      setError(err?.message || 'Erro ao submeter pitching');
    } finally {
      setSubmittingPitch(false);
    }
  };

  const handleExportCsv = () => {
    const tracks = data?.tracks || [];
    const header = 'ID,Titulo,Categoria,Album,Estado,Plays,Data\n';
    const rows = tracks
      .map((t) =>
        [
          t.id,
          `"${String(t.title || '').replace(/"/g, '""')}"`,
          t.category || 'musica',
          `"${String(t.album_title || t.album || 'Single').replace(/"/g, '""')}"`,
          t.status || 'published',
          t.plays ?? 0,
          t.created_at,
        ].join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `podfeplay_studio_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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

  const handleDeleteAlbum = (id: number, title: string) => {
    setModalConfig({
      mode: 'confirm',
      title: 'Remover álbum',
      message: `Tens a certeza que queres remover o álbum "${title}"?`,
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetchWithAuth(`/api/v1/studio/albums/${id}`, { method: 'DELETE' });
          const body = await res.json();
          if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao remover álbum');
          notifySuccess('Álbum removido.');
          await loadStudio();
        } catch (err: any) {
          setError(err?.message || 'Erro ao remover álbum');
        }
      },
    });
  };

  const handleDeleteTrack = (id: number, title: string) => {
    setModalConfig({
      mode: 'confirm',
      title: 'Remover lançamento',
      message: `Tens a certeza que queres remover o lançamento "${title}"?`,
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: async () => {
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
      },
    });
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
                      <BadgeCheck size={13} />{' '}
                      {data.planInfo?.verification_type === 'ministerial'
                        ? 'Ministério Verificado'
                        : 'Artista Verificado'}
                    </span>
                  )}
                  {data?.verification?.isVerified && data?.planInfo?.plan && (
                    <span className="text-xs font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Crown size={12} /> Plano {data.planInfo.plan.name}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Tipo de Criador *</label>
                        <select
                          value={reqCreatorType}
                          onChange={(e) => setReqCreatorType(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="artista">Artista / Músico Gospel</option>
                          <option value="pregador">Pregador / Pastor / Líder</option>
                          <option value="igreja">Igreja / Ministério / Organização</option>
                          <option value="podcaster">Criador de Podcast / Devocional</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Tipo de Verificação *</label>
                        <select
                          value={reqVerificationType}
                          onChange={(e) => setReqVerificationType(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="identity">Identidade (BI / Passaporte)</option>
                          <option value="ministerial">Ministerial (Carta de Ordenação / Instituição)</option>
                        </select>
                      </div>
                    </div>
                    {/* Verificação de Identidade: Rosto + BI Frente e Verso */}
                    <div className="rounded-2xl border border-purple-500/25 bg-purple-500/[0.06] p-4 space-y-4">
                      <div className="flex items-start gap-2.5">
                        <ShieldCheck size={18} className="text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-semibold text-white">
                            Verificação de Identidade Obrigatória
                          </h3>
                          <p className="text-xs text-gray-300 mt-0.5">
                            Envia uma foto nítida do teu rosto (selfie) e as fotos frontal e traseira do teu Bilhete de Identidade (BI). Os documentos são privados e usados apenas para validação pela equipa.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* 1. Foto do Rosto (Selfie) */}
                        <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 flex flex-col justify-between gap-2.5">
                          <div>
                            <p className="text-xs font-semibold text-white">1. Foto do Rosto (Selfie) *</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Rosto visível e boa iluminação
                            </p>
                          </div>

                          {activeCameraTarget === 'selfie' ? (
                            <div className="space-y-2">
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full aspect-square object-cover rounded-lg bg-black"
                              />
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => captureFromCamera('selfie')}
                                  className="flex-1 py-1.5 px-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white"
                                >
                                  Capturar
                                </button>
                                <button
                                  type="button"
                                  onClick={stopCamera}
                                  className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-gray-200"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : reqSelfiePreview ? (
                            <div className="relative">
                              <img
                                src={reqSelfiePreview}
                                alt="Pré-visualização da foto do rosto"
                                className="w-full aspect-square object-cover rounded-lg border border-white/10"
                              />
                              <button
                                type="button"
                                onClick={() => handleSelectDocFile(null, setReqSelfieFile, setReqSelfiePreview)}
                                aria-label="Remover foto do rosto"
                                className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition"
                              >
                                <RotateCcw size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="aspect-square rounded-lg border border-dashed border-white/20 bg-white/[0.02] flex flex-col items-center justify-center p-3 text-center gap-2">
                              <Camera size={24} className="text-purple-400/80" />
                              <span className="text-[11px] text-gray-400">
                                Tira agora ou envia uma foto
                              </span>
                            </div>
                          )}

                          {cameraError && (
                            <p className="text-[11px] text-amber-300">{cameraError}</p>
                          )}

                          {activeCameraTarget !== 'selfie' && (
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => startCamera('selfie')}
                                className="py-1.5 px-2 rounded-lg bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/30 text-[11px] font-medium text-purple-200 flex items-center justify-center gap-1"
                              >
                                <Camera size={12} /> Câmara
                              </button>
                              <label className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-medium text-gray-200 flex items-center justify-center gap-1 cursor-pointer">
                                <Upload size={12} /> Ficheiro
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="user"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleSelectDocFile(
                                      e.target.files?.[0] || null,
                                      setReqSelfieFile,
                                      setReqSelfiePreview
                                    )
                                  }
                                />
                              </label>
                            </div>
                          )}
                        </div>

                        {/* 2. BI Parte Frontal */}
                        <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 flex flex-col justify-between gap-2.5">
                          <div>
                            <p className="text-xs font-semibold text-white">2. BI — Parte Frontal *</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Frente do documento legível
                            </p>
                          </div>

                          {reqBiFrontPreview ? (
                            <div className="relative">
                              <img
                                src={reqBiFrontPreview}
                                alt="Pré-visualização da frente do BI"
                                className="w-full aspect-square object-cover rounded-lg border border-white/10"
                              />
                              <button
                                type="button"
                                onClick={() => handleSelectDocFile(null, setReqBiFrontFile, setReqBiFrontPreview)}
                                aria-label="Remover frente do BI"
                                className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition"
                              >
                                <RotateCcw size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="aspect-square rounded-lg border border-dashed border-white/20 bg-white/[0.02] flex flex-col items-center justify-center p-3 text-center gap-2">
                              <ImageIcon size={24} className="text-purple-400/80" />
                              <span className="text-[11px] text-gray-400">
                                Foto da frente do BI
                              </span>
                            </div>
                          )}

                          <label className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-medium text-gray-200 flex items-center justify-center gap-1.5 cursor-pointer">
                            <Upload size={12} /> {reqBiFrontPreview ? 'Trocar foto' : 'Enviar frente do BI'}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) =>
                                handleSelectDocFile(
                                  e.target.files?.[0] || null,
                                  setReqBiFrontFile,
                                  setReqBiFrontPreview
                                )
                              }
                            />
                          </label>
                        </div>

                        {/* 3. BI Parte Traseira */}
                        <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 flex flex-col justify-between gap-2.5">
                          <div>
                            <p className="text-xs font-semibold text-white">3. BI — Parte Traseira *</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Verso do documento legível
                            </p>
                          </div>

                          {reqBiBackPreview ? (
                            <div className="relative">
                              <img
                                src={reqBiBackPreview}
                                alt="Pré-visualização do verso do BI"
                                className="w-full aspect-square object-cover rounded-lg border border-white/10"
                              />
                              <button
                                type="button"
                                onClick={() => handleSelectDocFile(null, setReqBiBackFile, setReqBiBackPreview)}
                                aria-label="Remover verso do BI"
                                className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition"
                              >
                                <RotateCcw size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="aspect-square rounded-lg border border-dashed border-white/20 bg-white/[0.02] flex flex-col items-center justify-center p-3 text-center gap-2">
                              <ImageIcon size={24} className="text-purple-400/80" />
                              <span className="text-[11px] text-gray-400">
                                Foto do verso do BI
                              </span>
                            </div>
                          )}

                          <label className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-medium text-gray-200 flex items-center justify-center gap-1.5 cursor-pointer">
                            <Upload size={12} /> {reqBiBackPreview ? 'Trocar foto' : 'Enviar verso do BI'}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) =>
                                handleSelectDocFile(
                                  e.target.files?.[0] || null,
                                  setReqBiBackFile,
                                  setReqBiBackPreview
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>

                      {reqVerificationType === 'ministerial' && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Link de Carta Ministerial / Ordenação (opcional)
                          </label>
                          <input
                            type="text"
                            value={reqDocumentUrl}
                            onChange={(e) => setReqDocumentUrl(e.target.value)}
                            placeholder="https://drive.google.com/... (carta ministerial)"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Nome Artístico *</label>
                      <input
                        type="text"
                        required
                        value={reqArtistName}
                        onChange={(e) => setReqArtistName(e.target.value)}
                        placeholder="Ex: Ministério Vida / Nome artístico"
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
                  { key: 'monetization', label: 'Plano & Monetização', icon: Wallet },
                  { key: 'pitching', label: 'Pitching Editorial', icon: ListMusic },
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
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="text-xs text-gray-300 space-y-0.5">
                      <p>
                        <strong>Uso do Plano {data?.planInfo?.plan?.name || 'Free'}:</strong>{' '}
                        {data?.planInfo?.usage.monthlyUploads ?? 0}
                        {data?.planInfo?.plan?.monthlyUploadLimit
                          ? ` / ${data.planInfo.plan.monthlyUploadLimit} uploads este mês`
                          : ' uploads este mês (ilimitado)'}{' '}
                        · {data?.planInfo?.usage.storageUsedMb ?? 0} / {data?.planInfo?.plan?.storageLimitMb ?? 500} MB
                      </p>
                      {(data?.planInfo?.usage.activeStrikePoints ?? 0) > 0 && (
                        <p className="text-amber-300">
                          Pontos de infração ativos: {data?.planInfo?.usage.activeStrikePoints} / 3
                        </p>
                      )}
                    </div>
                    {data?.planInfo?.plan?.canExportAnalytics && (
                      <button
                        type="button"
                        onClick={handleExportCsv}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Download size={14} /> Exportar Relatório CSV
                      </button>
                    )}
                  </div>
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
              ) : studioTab === 'monetization' ? (
                <section className="space-y-8">
                  {/* Saldos */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs text-gray-400">Royalties de Streaming (70%)</p>
                      <p className="text-2xl font-bold text-emerald-300 mt-1">
                        AOA {(data?.monetization?.royaltiesAoa ?? 0).toLocaleString('pt-PT')}
                      </p>
                      {!data?.planInfo?.plan?.canMonetizeStreams && (
                        <p className="text-[11px] text-amber-300 mt-1">Disponível no plano Pro ou Ministerial</p>
                      )}
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs text-gray-400">Doações Diretas (90%)</p>
                      <p className="text-2xl font-bold text-pink-300 mt-1">
                        AOA {(data?.monetization?.donationsAoa ?? 0).toLocaleString('pt-PT')}
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs text-gray-400">Já Levantado / Pendente</p>
                      <p className="text-2xl font-bold text-gray-200 mt-1">
                        AOA {(data?.monetization?.withdrawnAoa ?? 0).toLocaleString('pt-PT')}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-600/25 to-emerald-600/20 border border-purple-500/40 rounded-2xl p-4">
                      <p className="text-xs text-purple-200">Saldo Disponível (mín. AOA 5.000)</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        AOA {(data?.monetization?.availableBalanceAoa ?? 0).toLocaleString('pt-PT')}
                      </p>
                    </div>
                  </div>

                  {/* Planos do Criador */}
                  <div>
                    <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Crown size={18} className="text-amber-400" />
                      Planos do Criador PodFéPlay
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {(data?.plansCatalog || []).map((p: any) => {
                        const isCurrent = data?.planInfo?.plan?.key === p.key;
                        return (
                          <div
                            key={p.key}
                            className={`rounded-2xl p-5 border flex flex-col justify-between ${
                              isCurrent
                                ? 'bg-purple-600/20 border-purple-400'
                                : 'bg-white/5 border-white/10'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <h3 className="font-bold text-base text-white">{p.name}</h3>
                                {isCurrent && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500 text-white font-semibold">
                                    Atual
                                  </span>
                                )}
                              </div>
                              <p className="text-xl font-bold text-white mt-2">
                                {p.priceUsd === 0 ? 'Grátis' : `$${p.priceUsd}/mês`}
                                {p.priceAoa > 0 && (
                                  <span className="text-xs font-normal text-gray-400 block">
                                    ≈ AOA {p.priceAoa.toLocaleString('pt-PT')}
                                  </span>
                                )}
                              </p>
                              <ul className="mt-3 space-y-1.5 text-xs text-gray-300">
                                <li>• {p.monthlyUploadLimit ? `${p.monthlyUploadLimit} faixas/mês` : 'Uploads ilimitados'}</li>
                                <li>• {p.storageLimitMb >= 1024 ? `${Math.round(p.storageLimitMb / 1024)} GB` : `${p.storageLimitMb} MB`}</li>
                                <li>• {p.canSchedule ? 'Agendamento ativo' : 'Sem agendamento'}</li>
                                <li>• {p.canMonetizeStreams ? 'Royalties 70% ativos' : 'Sem royalties por stream'}</li>
                                <li>• {p.canPitchEditorial ? 'Pitching Editorial' : 'Analytics básico'}</li>
                              </ul>
                            </div>
                            <button
                              type="button"
                              disabled={isCurrent || changingPlan === p.key}
                              onClick={() => {
                                if (p.priceAoa > 0) {
                                  setCheckoutPlan(p);
                                } else {
                                  handleChangePlan(p.key);
                                }
                              }}
                              className={`mt-4 w-full py-2 rounded-full text-xs font-semibold transition-colors ${
                                isCurrent
                                  ? 'bg-white/10 text-gray-400 cursor-default'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white'
                              }`}
                            >
                              {isCurrent ? 'Plano Atual' : changingPlan === p.key ? 'A atualizar...' : `Selecionar ${p.name}`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Levantamento + Histórico de Doações */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <form onSubmit={handleRequestPayout} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5">
                      <h3 className="font-bold text-base">Solicitar Levantamento</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Valor (AOA, mín. 5.000)</label>
                          <input
                            type="number"
                            min={5000}
                            required
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Método</label>
                          <select
                            value={payoutMethod}
                            onChange={(e) => setPayoutMethod(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-sm text-white"
                          >
                            <option value="multicaixa">Multicaixa Express</option>
                            <option value="iban">Transferência IBAN</option>
                            <option value="pix">PIX (Brasil)</option>
                            <option value="paypal">PayPal</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Destino (Telefone / IBAN / PIX / Email)</label>
                        <input
                          type="text"
                          required
                          value={payoutDest}
                          onChange={(e) => setPayoutDest(e.target.value)}
                          placeholder="Ex: 923 000 000"
                          className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={requestingPayout}
                        className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm disabled:opacity-50"
                      >
                        {requestingPayout ? 'A processar...' : 'Pedir Levantamento'}
                      </button>
                    </form>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                      <h3 className="font-bold text-base">Apoios & Doações Recentes</h3>
                      {!data?.monetization?.donations?.length ? (
                        <p className="text-xs text-gray-400 py-6 text-center">Nenhuma doação recebida ainda.</p>
                      ) : (
                        <div className="divide-y divide-white/10 max-h-60 overflow-y-auto">
                          {data.monetization.donations.map((d: any) => (
                            <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-semibold text-white">{d.donor_name || 'Apoiador'}</p>
                                {d.message && <p className="text-gray-400">&quot;{d.message}&quot;</p>}
                              </div>
                              <span className="font-bold text-emerald-300">
                                +AOA {Number(d.creator_share_aoa).toLocaleString('pt-PT')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ) : studioTab === 'pitching' ? (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <form onSubmit={handleSubmitPitch} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <ListMusic size={18} className="text-purple-400" />
                      Submeter Faixa para Playlists Editoriais
                    </h2>
                    <p className="text-xs text-gray-400">
                      Disponível nos planos Pro e Ministerial (máx. 2 submissões/mês). A equipa editorial avalia em até 5 dias úteis.
                    </p>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Seleciona a Faixa *</label>
                      <select
                        required
                        value={pitchMusicId}
                        onChange={(e) => setPitchMusicId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-sm text-white"
                      >
                        <option value="">Escolhe uma música...</option>
                        {(data?.tracks || []).map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.status === 'scheduled' ? 'Agendada' : 'Publicada'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Contexto Ministerial & Mensagem *</label>
                      <textarea
                        rows={3}
                        required
                        value={pitchContext}
                        onChange={(e) => setPitchContext(e.target.value)}
                        placeholder="Descreve a mensagem espiritual, tema e história da faixa..."
                        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Público-alvo / Ocasião</label>
                      <input
                        type="text"
                        value={pitchAudience}
                        onChange={(e) => setPitchAudience(e.target.value)}
                        placeholder="Ex: Jovens, Culto de Adoração, Devocional Matinal"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingPitch || !data?.planInfo?.plan?.canPitchEditorial}
                      className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 font-semibold text-sm disabled:opacity-50"
                    >
                      {!data?.planInfo?.plan?.canPitchEditorial
                        ? 'Requer Plano Pro ou Ministerial'
                        : submittingPitch
                          ? 'A enviar...'
                          : 'Enviar para Curadoria'}
                    </button>
                  </form>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                    <h3 className="font-bold text-base">As Minhas Submissões ({data?.pitches?.length ?? 0})</h3>
                    {!data?.pitches?.length ? (
                      <p className="text-xs text-gray-400 py-8 text-center">Nenhuma submissão enviada ainda.</p>
                    ) : (
                      <div className="divide-y divide-white/10">
                        {data.pitches.map((p: any) => (
                          <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-white truncate">{p.music_title}</p>
                              <p className="text-xs text-gray-400 line-clamp-1">{p.ministerial_context}</p>
                            </div>
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                                p.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : p.status === 'rejected'
                                    ? 'bg-red-500/20 text-red-300'
                                    : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {p.status === 'approved' ? 'Aprovado' : p.status === 'rejected' ? 'Não selecionado' : 'Em análise'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                    <Music size={20} className="text-purple-400" />
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

      <ActionModal config={modalConfig} onClose={() => setModalConfig(null)} />
      <PlanCheckoutModal
        plan={checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
        onPaid={() => {
          notifySuccess('Pagamento confirmado e plano ativado!');
          loadStudio();
        }}
      />

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
        <Modal
          title="Lançar Nova Música"
          onClose={() => setShowTrackModal(false)}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleCreateTrack} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-xs text-gray-400 mb-1">Visibilidade</label>
                <select
                  value={trackVisibility}
                  onChange={(e) => setTrackVisibility(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="public">Público</option>
                  <option value="premium">Exclusivo Premium</option>
                  <option value="private">Privado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Ficheiro de Áudio (MP3, WAV, M4A) *</label>
                <input
                  type="file"
                  required
                  accept="audio/*"
                  onChange={(e) => setTrackAudio(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-gray-200 hover:file:bg-white/20"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Capa da Música (opcional — usa a do álbum se vazia)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTrackCover(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-gray-200 hover:file:bg-white/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">ISRC (opcional)</label>
                <input
                  type="text"
                  value={trackIsrc}
                  onChange={(e) => setTrackIsrc(e.target.value)}
                  placeholder="Ex: AO-PF1-26-00001"
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Compositor (opcional)</label>
                <input
                  type="text"
                  value={trackComposer}
                  onChange={(e) => setTrackComposer(e.target.value)}
                  placeholder="Nome do compositor"
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Idioma</label>
                <input
                  type="text"
                  value={trackLanguage}
                  onChange={(e) => setTrackLanguage(e.target.value)}
                  placeholder="Português"
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
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
            </div>
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
  maxWidth = 'max-w-md',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/15 rounded-2xl p-6 shadow-2xl`}
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
