// app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import PlayerBar from '@/components/PlayerBar';
import ActionModal, { ActionModalConfig } from '@/components/ActionModal';
import {
  User,
  Lock,
  Bell,
  Monitor,
  Globe,
  Shield,
  Smartphone,
  LogOut,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Volume2,
  Mic2,
  Accessibility,
  Trash2,
  Camera,
  Save,
} from 'lucide-react';
import { API_ENDPOINTS, fetchWithAuth } from '@/config/api';
import { resolveCoverUrl } from '@/lib/media';
import { applyPreferencesToDocument } from '@/components/PreferencesSync';

interface ActiveSession {
  session_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
  device_type?: string;
  browser?: string;
  os?: string;
  is_current?: boolean;
}

interface Preferences {
  autoPlay: boolean;
  quality: string;
  language: string;
  theme: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reducedMotion: boolean;
  largeText: boolean;
}

const I18N: Record<string, Record<string, string>> = {
  pt: {
    title: 'Definições',
    subtitle: 'Edita o teu perfil, personaliza o idioma, tema, acessibilidade e segurança da conta.',
    navProfile: 'Perfil',
    navPlayback: 'Reprodução',
    navAccessibility: 'Aparência & Idioma',
    navNotifications: 'Notificações',
    navSecurity: 'Segurança',
    navSessions: 'Sessões',
    profileTitle: 'Meu Perfil',
    profileSub: 'Atualiza os teus dados pessoais e foto de perfil',
    saveProfile: 'Guardar Perfil',
    logoutBtn: 'Terminar sessão',
    playbackTitle: 'Reprodução & Qualidade',
    playbackSub: 'Controla o comportamento do player de áudio',
    autoPlayLabel: 'Reprodução automática (Auto-play)',
    autoPlayDesc: 'Continuar automaticamente para a próxima faixa da fila',
    qualityLabel: 'Qualidade de streaming',
    accessTitle: 'Acessibilidade, Idioma & Aparência',
    accessSub: 'Adapta a leitura, animações, tema e idioma da interface',
    largeTextLabel: 'Texto ampliado',
    largeTextDesc: 'Aumenta o tamanho base da letra para facilitar a leitura',
    reducedMotionLabel: 'Reduzir animações',
    reducedMotionDesc: 'Diminui transições e efeitos visuais em movimento',
    languageLabel: 'Idioma',
    themeLabel: 'Tema',
    dark: 'Escuro',
    light: 'Claro',
    notifTitle: 'Notificações',
    notifSub: 'Escolhe como queres ser avisado sobre novos lançamentos e eventos',
    emailNotif: 'Notificações por email',
    emailNotifDesc: 'Recebe novidades, eventos e resumos da plataforma por email',
    pushNotif: 'Notificações na aplicação',
    pushNotifDesc: 'Alertas sobre novos episódios, cultos ao vivo e interações',
    secTitle: 'Segurança & Manutenção',
    secSub: 'Palavra-passe, cache local e encerramento de sessão',
    changePwd: 'Alterar palavra-passe',
    sessionsTitle: 'Sessões Ativas',
    sessionsSub: 'Dispositivos onde a tua conta está ligada',
  },
  en: {
    title: 'Settings',
    subtitle: 'Edit your profile, customize language, theme, accessibility, and account security.',
    navProfile: 'Profile',
    navPlayback: 'Playback',
    navAccessibility: 'Appearance & Language',
    navNotifications: 'Notifications',
    navSecurity: 'Security',
    navSessions: 'Sessions',
    profileTitle: 'My Profile',
    profileSub: 'Update your personal details and profile photo',
    saveProfile: 'Save Profile',
    logoutBtn: 'Sign out',
    playbackTitle: 'Playback & Quality',
    playbackSub: 'Control how the audio player behaves',
    autoPlayLabel: 'Auto-play',
    autoPlayDesc: 'Automatically play the next track in your queue',
    qualityLabel: 'Streaming quality',
    accessTitle: 'Accessibility, Language & Appearance',
    accessSub: 'Customize readability, motion, theme, and interface language',
    largeTextLabel: 'Larger text',
    largeTextDesc: 'Increase base font size for easier reading',
    reducedMotionLabel: 'Reduce motion',
    reducedMotionDesc: 'Minimize transitions and visual animations',
    languageLabel: 'Language',
    themeLabel: 'Theme',
    dark: 'Dark',
    light: 'Light',
    notifTitle: 'Notifications',
    notifSub: 'Choose how you want to be notified about new releases and events',
    emailNotif: 'Email notifications',
    emailNotifDesc: 'Receive updates, events, and platform digests by email',
    pushNotif: 'In-app notifications',
    pushNotifDesc: 'Alerts about new episodes, live services, and interactions',
    secTitle: 'Security & Maintenance',
    secSub: 'Password, local cache, and session sign-out',
    changePwd: 'Change password',
    sessionsTitle: 'Active Sessions',
    sessionsSub: 'Devices currently signed in to your account',
  },
  es: {
    title: 'Configuración',
    subtitle: 'Edita tu perfil, personaliza idioma, tema, accesibilidad y seguridad de la cuenta.',
    navProfile: 'Perfil',
    navPlayback: 'Reproducción',
    navAccessibility: 'Apariencia e Idioma',
    navNotifications: 'Notificaciones',
    navSecurity: 'Seguridad',
    navSessions: 'Sesiones',
    profileTitle: 'Mi Perfil',
    profileSub: 'Actualiza tus datos personales y foto de perfil',
    saveProfile: 'Guardar Perfil',
    logoutBtn: 'Cerrar sesión',
    playbackTitle: 'Reproducción y Calidad',
    playbackSub: 'Controla el comportamiento del reproductor de audio',
    autoPlayLabel: 'Reproducción automática (Auto-play)',
    autoPlayDesc: 'Continuar automáticamente con la siguiente pista de la cola',
    qualityLabel: 'Calidad de streaming',
    accessTitle: 'Accesibilidad, Idioma y Apariencia',
    accessSub: 'Adapta la lectura, animaciones, tema e idioma de la interfaz',
    largeTextLabel: 'Texto ampliado',
    largeTextDesc: 'Aumenta el tamaño de fuente base para facilitar la lectura',
    reducedMotionLabel: 'Reducir animaciones',
    reducedMotionDesc: 'Disminuye transiciones y efectos visuales',
    languageLabel: 'Idioma',
    themeLabel: 'Tema',
    dark: 'Oscuro',
    light: 'Claro',
    notifTitle: 'Notificaciones',
    notifSub: 'Elige cómo recibir avisos sobre nuevos lanzamientos y eventos',
    emailNotif: 'Notificaciones por correo',
    emailNotifDesc: 'Recibe novedades, eventos y resúmenes por correo electrónico',
    pushNotif: 'Notificaciones en la aplicación',
    pushNotifDesc: 'Alertas sobre nuevos episodios, cultos en vivo e interacciones',
    secTitle: 'Seguridad y Mantenimiento',
    secSub: 'Contraseña, caché local y cierre de sesión',
    changePwd: 'Cambiar contraseña',
    sessionsTitle: 'Sesiones Activas',
    sessionsSub: 'Dispositivos conectados a tu cuenta',
  },
};

const SettingsSection = ({
  id,
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  icon: any;
  children: React.ReactNode;
}) => (
  <section
    id={id}
    aria-labelledby={id ? `${id}-heading` : undefined}
    className="bg-white/[0.04] backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden mb-6 shadow-lg"
  >
    <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
      <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-purple-300" aria-hidden="true" />
      </div>
      <div>
        <h2 id={id ? `${id}-heading` : undefined} className="text-white font-semibold text-base">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const ToggleSwitch = ({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-b-0">
    <div>
      <p className="text-white text-sm font-medium">{label}</p>
      {description && <p className="text-gray-400 text-xs mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
        enabled ? 'bg-purple-600' : 'bg-white/15'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const SelectOption = ({
  value,
  label,
  selected,
  onChange,
}: {
  value: string;
  label: string;
  selected: boolean;
  onChange: (value: string) => void;
}) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={() => onChange(value)}
    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
      selected
        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
        : 'bg-white/5 text-gray-300 hover:bg-white/15 border border-white/10'
    }`}
  >
    {label}
  </button>
);

export default function SettingsPage() {
  const { user, logout, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Perfil (sem data de nascimento)
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    avatar_url: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [preferences, setPreferences] = useState<Preferences>({
    autoPlay: true,
    quality: 'auto',
    language: 'pt',
    theme: 'dark',
    emailNotifications: true,
    pushNotifications: true,
    reducedMotion: false,
    largeText: false,
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<ActionModalConfig | null>(null);

  const t = I18N[preferences.language] || I18N.pt;

  const persistPreferencesLocally = (prefs: Preferences) => {
    try {
      localStorage.setItem('podplay_preferences', JSON.stringify(prefs));
    } catch {}
    applyPreferencesToDocument(prefs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('podplay:preferences-updated', { detail: prefs }));
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const loadSettings = async () => {
      try {
        const [profileRes, prefsRes, sessionsRes] = await Promise.all([
          fetchWithAuth(API_ENDPOINTS.PROFILE),
          fetchWithAuth(API_ENDPOINTS.PROFILE_PREFERENCES),
          fetchWithAuth('/api/v1/sessions/active'),
        ]);

        const [profileData, prefsData, sessionsData] = await Promise.all([
          profileRes.json().catch(() => null),
          prefsRes.json().catch(() => null),
          sessionsRes.json().catch(() => null),
        ]);

        if (profileData?.success && profileData?.data) {
          const p = profileData.data;
          setProfileForm({
            full_name: p.full_name || user.fullName || '',
            username: p.username || user.username || '',
            email: p.email || user.email || '',
            phone: p.phone || '',
            bio: p.bio || '',
            avatar_url: p.avatar_url || user.avatarUrl || '',
          });
        } else {
          setProfileForm({
            full_name: user.fullName || '',
            username: user.username || '',
            email: user.email || '',
            phone: user.phone || '',
            bio: '',
            avatar_url: user.avatarUrl || '',
          });
        }

        if (prefsData?.success && prefsData?.data) {
          const loaded: Preferences = {
            autoPlay: prefsData.data.preferences?.autoPlay ?? true,
            quality: prefsData.data.preferences?.quality ?? 'auto',
            language: prefsData.data.language ?? 'pt',
            theme: prefsData.data.theme ?? 'dark',
            emailNotifications: prefsData.data.notifications_enabled ?? true,
            pushNotifications: prefsData.data.preferences?.pushNotifications ?? true,
            reducedMotion: Boolean(prefsData.data.preferences?.reducedMotion),
            largeText: Boolean(prefsData.data.preferences?.largeText),
          };
          setPreferences(loaded);
          persistPreferencesLocally(loaded);
        }

        if (sessionsData?.success && Array.isArray(sessionsData.data)) {
          setSessions(sessionsData.data);
        }
      } catch {
        setError('Erro ao carregar definições');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [authLoading, user, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    try {
      const response = await fetchWithAuth(API_ENDPOINTS.PROFILE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profileForm.full_name.trim(),
          username: profileForm.username.trim(),
          phone: profileForm.phone.trim() || null,
          bio: profileForm.bio.trim() || null,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Erro ao atualizar perfil');
      }
      updateUser({
        fullName: profileForm.full_name.trim(),
        username: profileForm.username.trim(),
        phone: profileForm.phone.trim() || undefined,
      });
      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Erro ao atualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploadingAvatar(true);
      setError('');
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetchWithAuth(API_ENDPOINTS.PROFILE_AVATAR, {
        method: 'POST',
        body: fd,
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.message || 'Erro ao atualizar foto');
      const nextAvatar = body.data?.avatar_url || body.data?.url || '';
      if (nextAvatar) {
        setProfileForm((prev) => ({ ...prev, avatar_url: nextAvatar }));
        updateUser({ avatarUrl: nextAvatar });
      }
      setSuccess('Foto de perfil atualizada!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Erro ao atualizar foto de perfil');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const updatePreference = async (key: keyof Preferences, value: any) => {
    const updatedPrefs = { ...preferences, [key]: value };
    setPreferences(updatedPrefs);
    persistPreferencesLocally(updatedPrefs);

    setSaving(true);
    setError('');
    try {
      const response = await fetchWithAuth(API_ENDPOINTS.PROFILE_PREFERENCES, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: updatedPrefs,
          language: updatedPrefs.language,
          theme: updatedPrefs.theme,
          notifications_enabled: updatedPrefs.emailNotifications,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('Preferência guardada!');
        setTimeout(() => setSuccess(''), 2500);
      } else {
        setError(result.message || 'Erro ao atualizar preferência');
      }
    } catch {
      setError('Erro ao ligar ao servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('As novas palavras-passe não coincidem');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('A nova palavra-passe deve ter pelo menos 6 caracteres');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetchWithAuth(API_ENDPOINTS.CHANGE_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setSuccess('Palavra-passe alterada com sucesso!');
        setShowChangePassword(false);
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(result.message || 'Erro ao alterar palavra-passe');
      }
    } catch {
      setError('Erro ao ligar ao servidor');
    } finally {
      setChangingPassword(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId);
    try {
      const response = await fetchWithAuth(`/api/v1/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
        setSuccess('Sessão encerrada!');
        setTimeout(() => setSuccess(''), 2500);
      } else {
        setError(result.message || 'Erro ao encerrar sessão');
      }
    } catch {
      setError('Erro ao ligar ao servidor');
    } finally {
      setRevokingSession(null);
    }
  };

  const revokeAllSessions = () => {
    setModalConfig({
      mode: 'confirm',
      title: 'Encerrar outras sessões',
      message: 'Tens a certeza que queres encerrar todas as outras sessões ativas?',
      confirmLabel: 'Encerrar todas',
      danger: true,
      onConfirm: async () => {
        try {
          const response = await fetchWithAuth('/api/v1/sessions/revoke-all', {
            method: 'POST',
          });
          const result = await response.json();
          if (result.success) {
            setSessions((prev) => prev.filter((s) => s.is_current));
            setSuccess('Todas as outras sessões foram encerradas!');
            setTimeout(() => setSuccess(''), 2500);
          }
        } catch {
          setError('Erro ao ligar ao servidor');
        }
      },
    });
  };

  const handleClearLocalCache = () => {
    try {
      localStorage.removeItem('podplay_branding_logo');
      localStorage.removeItem('podplay_current_music');
      localStorage.removeItem('podplay_current_time');
      localStorage.removeItem('podplay_queue');
      localStorage.removeItem('podplay_current_index');
      setSuccess('Cache local limpa com sucesso!');
      setTimeout(() => setSuccess(''), 2500);
    } catch {}
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950/80 to-slate-950 text-white">
      <PodPlaySidebar />

      <main className="ml-0 md:ml-60 min-h-screen pb-28 transition-all duration-300">
        <Header />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{t.title}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{t.subtitle}</p>
            </div>
            {saving && (
              <span className="inline-flex items-center gap-1.5 text-xs text-purple-300" aria-live="polite">
                <Loader2 size={14} className="animate-spin" /> A guardar...
              </span>
            )}
          </div>

          <nav aria-label="Secções das definições" className="flex flex-wrap gap-2 mb-6">
            {[
              { href: '#perfil', label: t.navProfile },
              { href: '#reproducao', label: t.navPlayback },
              { href: '#acessibilidade', label: t.navAccessibility },
              { href: '#notificacoes', label: t.navNotifications },
              { href: '#seguranca', label: t.navSecurity },
              { href: '#sessoes', label: t.navSessions },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-medium text-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-center gap-2"
            >
              <AlertCircle size={16} aria-hidden="true" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                aria-label="Fechar aviso de erro"
                onClick={() => setError('')}
                className="text-red-200 hover:text-white px-1"
              >
                ✕
              </button>
            </div>
          )}

          {success && (
            <div
              role="status"
              aria-live="polite"
              className="mb-5 p-3.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm flex items-center gap-2"
            >
              <CheckCircle size={16} aria-hidden="true" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={36} className="text-purple-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Edição de Perfil (sem data de nascimento) + Sair */}
              <SettingsSection
                id="perfil"
                title={t.profileTitle}
                subtitle={t.profileSub}
                icon={User}
              >
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full bg-purple-600/40 overflow-hidden border border-white/20 flex items-center justify-center flex-shrink-0">
                        {profileForm.avatar_url ? (
                          <img
                            src={resolveCoverUrl(profileForm.avatar_url)}
                            alt={profileForm.full_name || profileForm.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={26} className="text-purple-200" />
                        )}
                      </div>
                      <div>
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium cursor-pointer transition-colors">
                          {uploadingAvatar ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                          <span>{uploadingAvatar ? 'A enviar...' : 'Alterar foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingAvatar}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleAvatarUpload(file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <p className="text-[11px] text-gray-400 mt-1">{profileForm.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/studio"
                        className="px-3.5 py-2 rounded-full bg-purple-600/80 hover:bg-purple-500 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Mic2 size={14} /> Estúdio do Criador
                      </Link>
                      <button
                        type="button"
                        onClick={() => logout()}
                        className="px-3.5 py-2 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-medium text-red-300 inline-flex items-center gap-1.5 transition-colors"
                      >
                        <LogOut size={14} /> {t.logoutBtn}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="prof-fullname" className="block text-xs text-gray-300 mb-1">
                        Nome completo
                      </label>
                      <input
                        id="prof-fullname"
                        type="text"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="prof-username" className="block text-xs text-gray-300 mb-1">
                        Username
                      </label>
                      <input
                        id="prof-username"
                        type="text"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="prof-phone" className="block text-xs text-gray-300 mb-1">
                        Telefone
                      </label>
                      <input
                        id="prof-phone"
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+244 9..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="prof-bio" className="block text-xs text-gray-300 mb-1">
                        Biografia
                      </label>
                      <input
                        id="prof-bio"
                        type="text"
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        placeholder="Sobre ti..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      {t.saveProfile}
                    </button>
                  </div>
                </form>
              </SettingsSection>

              {/* Reprodução */}
              <SettingsSection
                id="reproducao"
                title={t.playbackTitle}
                subtitle={t.playbackSub}
                icon={Volume2}
              >
                <ToggleSwitch
                  enabled={preferences.autoPlay}
                  onChange={() => updatePreference('autoPlay', !preferences.autoPlay)}
                  label={t.autoPlayLabel}
                  description={t.autoPlayDesc}
                />

                <div className="pt-4">
                  <p className="text-gray-300 text-sm font-medium mb-2">{t.qualityLabel}</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label={t.qualityLabel}>
                    {[
                      { value: 'auto', label: 'Automática' },
                      { value: 'low', label: 'Baixa (poupar dados)' },
                      { value: 'medium', label: 'Média' },
                      { value: 'high', label: 'Alta (HD)' },
                    ].map((q) => (
                      <SelectOption
                        key={q.value}
                        value={q.value}
                        label={q.label}
                        selected={preferences.quality === q.value}
                        onChange={(val) => updatePreference('quality', val)}
                      />
                    ))}
                  </div>
                </div>
              </SettingsSection>

              {/* Acessibilidade, Idioma & Aparência */}
              <SettingsSection
                id="acessibilidade"
                title={t.accessTitle}
                subtitle={t.accessSub}
                icon={Accessibility}
              >
                <ToggleSwitch
                  enabled={preferences.largeText}
                  onChange={() => updatePreference('largeText', !preferences.largeText)}
                  label={t.largeTextLabel}
                  description={t.largeTextDesc}
                />

                <ToggleSwitch
                  enabled={preferences.reducedMotion}
                  onChange={() => updatePreference('reducedMotion', !preferences.reducedMotion)}
                  label={t.reducedMotionLabel}
                  description={t.reducedMotionDesc}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  <div>
                    <p className="text-gray-300 text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Globe size={15} className="text-purple-400" /> {t.languageLabel}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'pt', label: 'Português' },
                        { value: 'en', label: 'English' },
                        { value: 'es', label: 'Español' },
                      ].map((lang) => (
                        <SelectOption
                          key={lang.value}
                          value={lang.value}
                          label={lang.label}
                          selected={preferences.language === lang.value}
                          onChange={(val) => updatePreference('language', val)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-300 text-sm font-medium mb-2">{t.themeLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'dark', label: t.dark, icon: <Moon size={14} /> },
                        { value: 'light', label: t.light, icon: <Sun size={14} /> },
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          type="button"
                          aria-pressed={preferences.theme === theme.value}
                          onClick={() => updatePreference('theme', theme.value)}
                          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                            preferences.theme === theme.value
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-white/5 text-gray-300 hover:bg-white/15 border border-white/10'
                          }`}
                        >
                          {theme.icon}
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SettingsSection>

              {/* Notificações */}
              <SettingsSection
                id="notificacoes"
                title={t.notifTitle}
                subtitle={t.notifSub}
                icon={Bell}
              >
                <ToggleSwitch
                  enabled={preferences.emailNotifications}
                  onChange={() =>
                    updatePreference('emailNotifications', !preferences.emailNotifications)
                  }
                  label={t.emailNotif}
                  description={t.emailNotifDesc}
                />

                <ToggleSwitch
                  enabled={preferences.pushNotifications}
                  onChange={() =>
                    updatePreference('pushNotifications', !preferences.pushNotifications)
                  }
                  label={t.pushNotif}
                  description={t.pushNotifDesc}
                />
              </SettingsSection>

              {/* Segurança */}
              <SettingsSection
                id="seguranca"
                title={t.secTitle}
                subtitle={t.secSub}
                icon={Shield}
              >
                {!showChangePassword ? (
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(true)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  >
                    <div className="flex items-center gap-3">
                      <Lock size={18} className="text-purple-400" />
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">{t.changePwd}</p>
                        <p className="text-gray-400 text-xs">Atualiza a tua palavra-passe regularmente</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label htmlFor="old-pwd" className="block text-gray-300 text-xs mb-1">
                        Palavra-passe atual
                      </label>
                      <div className="relative">
                        <input
                          id="old-pwd"
                          type={showOldPassword ? 'text' : 'password'}
                          value={passwordData.oldPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, oldPassword: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Digita a palavra-passe atual"
                          required
                        />
                        <button
                          type="button"
                          aria-label={showOldPassword ? 'Ocultar palavra-passe atual' : 'Mostrar palavra-passe atual'}
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="new-pwd" className="block text-gray-300 text-xs mb-1">
                        Nova palavra-passe
                      </label>
                      <div className="relative">
                        <input
                          id="new-pwd"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Mínimo 6 caracteres"
                          required
                        />
                        <button
                          type="button"
                          aria-label={showNewPassword ? 'Ocultar nova palavra-passe' : 'Mostrar nova palavra-passe'}
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirm-pwd" className="block text-gray-300 text-xs mb-1">
                        Confirmar nova palavra-passe
                      </label>
                      <input
                        id="confirm-pwd"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Digita novamente a nova palavra-passe"
                        required
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowChangePassword(false);
                          setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="flex-1 px-4 py-2.5 bg-white/10 rounded-xl text-white text-sm hover:bg-white/20 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={changingPassword}
                        className="flex-1 px-4 py-2.5 bg-purple-600 rounded-xl text-white text-sm font-medium hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {changingPassword ? <Loader2 size={16} className="animate-spin" /> : 'Guardar senha'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleClearLocalCache}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-medium text-gray-200 inline-flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={14} /> Limpar cache do player
                  </button>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-medium text-red-300 inline-flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={14} /> {t.logoutBtn}
                  </button>
                </div>
              </SettingsSection>

              {/* Sessões Ativas */}
              <SettingsSection
                id="sessoes"
                title={t.sessionsTitle}
                subtitle={t.sessionsSub}
                icon={Monitor}
              >
                {sessions.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Nenhuma sessão ativa encontrada.</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.session_id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          {session.user_agent?.includes('Mobile') ? (
                            <Smartphone size={18} className="text-purple-300" />
                          ) : (
                            <Monitor size={18} className="text-purple-300" />
                          )}
                          <div>
                            <p className="text-white text-sm font-medium">
                              {session.is_current
                                ? 'Este dispositivo'
                                : session.user_agent?.split(' ')[0] || 'Dispositivo'}
                              {session.is_current && (
                                <span className="ml-2 text-xs text-emerald-300">(Atual)</span>
                              )}
                            </p>
                            <p className="text-gray-400 text-xs">
                              Última atividade: {formatDate(session.last_activity)}
                            </p>
                          </div>
                        </div>
                        {!session.is_current && (
                          <button
                            type="button"
                            aria-label="Encerrar esta sessão"
                            onClick={() => revokeSession(session.session_id)}
                            disabled={revokingSession === session.session_id}
                            className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            {revokingSession === session.session_id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <LogOut size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    ))}

                    {sessions.filter((s) => !s.is_current).length > 0 && (
                      <button
                        type="button"
                        onClick={revokeAllSessions}
                        className="w-full mt-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-center text-xs font-medium text-red-300 transition-colors"
                      >
                        Encerrar todas as outras sessões
                      </button>
                    )}
                  </div>
                )}
              </SettingsSection>
            </>
          )}
        </div>
      </main>

      <PlayerBar />
      <ActionModal config={modalConfig} onClose={() => setModalConfig(null)} />
    </div>
  );
}
