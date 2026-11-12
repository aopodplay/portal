// app/profile/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import {
  User,
  Mail,
  Phone,
  Church,
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  Heart,
  Clock,
  Play,
  Music,
  BookOpen,
  Shield,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from '@/config/api';

// =====================================================================
// TIPOS
// =====================================================================

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  birth_date?: string;
  gender?: 'M' | 'F' | 'OTHER';
  church_id?: string;
  church_name?: string;
  church_logo?: string;
  role: string;
  created_at: string;
  last_login?: string;
}

interface ProfileStats {
  total_playlists: number;
  total_favorites: number;
  total_downloads?: number;
  total_listening_time?: number;
}

// =====================================================================
// SUB-COMPONENTES
// =====================================================================

const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number | string;
}) => (
  <div className="bg-white/5 rounded-xl p-4 text-center">
    <Icon size={24} className="text-purple-400 mx-auto mb-2" />
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-gray-400">{label}</p>
  </div>
);

const EditableField = ({
  label,
  value,
  name,
  type = 'text',
  icon: Icon,
  isEditing,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  name: string;
  type?: string;
  icon: any;
  isEditing: boolean;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
}) => (
  <div className="border-b border-white/10 py-3">
    <label className="block text-xs text-gray-400 mb-1">{label}</label>
    <div className="flex items-center gap-2">
      <Icon size={16} className="text-gray-500" />
      {isEditing ? (
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          className="flex-1 bg-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder={placeholder}
        />
      ) : (
        <span className="text-white text-sm">{value || 'Não informado'}</span>
      )}
    </div>
  </div>
);

// =====================================================================
// PÁGINA
// =====================================================================

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    birth_date: '',
    gender: '',
  });

  // ---------- Carregar dados do perfil ----------
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('podplay_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const profileResponse = await fetch(getApiUrl(API_ENDPOINTS.PROFILE), {
          headers: getAuthHeaders(),
        });
        const profileResult = await profileResponse.json();

        if (profileResult.success) {
          setProfile(profileResult.data);
          setEditForm({
            full_name: profileResult.data.full_name || '',
            bio: profileResult.data.bio || '',
            birth_date: profileResult.data.birth_date?.split('T')[0] || '',
            gender: profileResult.data.gender || '',
          });
        }

        const statsResponse = await fetch(getApiUrl(API_ENDPOINTS.PROFILE_STATS), {
          headers: getAuthHeaders(),
        });
        const statsResult = await statsResponse.json();

        if (statsResult.success) {
          setStats(statsResult.data);
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        setError('Erro ao carregar dados do perfil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  // ---------- Guardar perfil ----------
  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.PROFILE), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          full_name: editForm.full_name,
          bio: editForm.bio,
          birth_date: editForm.birth_date,
          gender: editForm.gender,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
        updateUser({ fullName: result.data.full_name });
        setSuccess('Perfil atualizado com sucesso!');
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Erro ao atualizar perfil');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Avatar ----------
  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    setUploadingAvatar(true);

    try {
      const token = localStorage.getItem('podplay_token');
      const response = await fetch(getApiUrl(API_ENDPOINTS.PROFILE_AVATAR), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const avatarUrl = result.data.avatar_url;
        setProfile((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : null));
        setAvatarKey(Date.now());
        setSuccess('Foto atualizada com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Erro ao atualizar foto');
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      setError('Erro ao enviar imagem');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione uma imagem válida');
        return;
      }
      handleAvatarUpload(file);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const formatMemberSince = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  const getFullAvatarUrl = () => {
    if (!profile?.avatar_url) return null;
    if (profile.avatar_url.startsWith('http')) {
      return `${profile.avatar_url}?t=${avatarKey}`;
    }
    return `${getApiUrl(profile.avatar_url)}?t=${avatarKey}`;
  };

  const fullAvatarUrl = getFullAvatarUrl();

  // =====================================================================
  // RENDER
  // =====================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <PodPlaySidebar />
        <main className="ml-64 min-h-screen flex items-center justify-center">
          <Loader2 size={40} className="text-purple-500 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-64 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="max-w-4xl mx-auto px-4 py-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                <X size={14} />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Card do Perfil */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden mb-6">
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-purple-600 to-pink-600" />
              <div className="absolute -bottom-12 left-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg border-4 border-white/20 overflow-hidden">
                    {uploadingAvatar ? (
                      <Loader2 size={24} className="text-white animate-spin" />
                    ) : fullAvatarUrl ? (
                      <img
                        src={fullAvatarUrl}
                        alt={profile?.full_name || profile?.username || 'Profile'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const span = document.createElement('span');
                            span.className = 'text-white text-3xl font-bold';
                            span.textContent = (
                              profile?.full_name?.charAt(0) ||
                              profile?.username?.charAt(0) ||
                              'U'
                            ).toUpperCase();
                            parent.appendChild(span);
                          }
                        }}
                      />
                    ) : (
                      <span className="text-white text-3xl font-bold">
                        {(
                          profile?.full_name?.charAt(0) ||
                          profile?.username?.charAt(0) ||
                          'U'
                        ).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 p-1.5 bg-purple-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    <Camera size={14} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="pt-16 pb-6 px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {profile?.full_name || profile?.username}
                  </h1>
                  <p className="text-gray-400 text-sm">@{profile?.username}</p>
                  {profile?.church_name && (
                    <div className="flex items-center gap-1 mt-1">
                      <Church size={12} className="text-purple-400" />
                      <span className="text-gray-400 text-xs">{profile.church_name}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Editar Perfil
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        {saving ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        Salvar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {profile?.bio && !isEditing && (
                <p className="mt-4 text-gray-300 text-sm">{profile.bio}</p>
              )}

              {isEditing && (
                <div className="mt-6 space-y-1">
                  <EditableField
                    label="Nome completo"
                    name="full_name"
                    value={editForm.full_name}
                    icon={User}
                    isEditing={isEditing}
                    onChange={(name, value) =>
                      setEditForm((prev) => ({ ...prev, [name]: value }))
                    }
                    placeholder="Seu nome completo"
                  />
                  <EditableField
                    label="Biografia"
                    name="bio"
                    value={editForm.bio}
                    icon={BookOpen}
                    isEditing={isEditing}
                    onChange={(name, value) =>
                      setEditForm((prev) => ({ ...prev, [name]: value }))
                    }
                    placeholder="Conte um pouco sobre você..."
                  />
                  <EditableField
                    label="Data de nascimento"
                    name="birth_date"
                    type="date"
                    value={editForm.birth_date}
                    icon={Calendar}
                    isEditing={isEditing}
                    onChange={(name, value) =>
                      setEditForm((prev) => ({ ...prev, [name]: value }))
                    }
                  />
                  <div className="border-b border-white/10 py-3">
                    <label className="block text-xs text-gray-400 mb-1">Género</label>
                    <div className="flex gap-4">
                      {[
                        { value: 'M', label: 'Masculino' },
                        { value: 'F', label: 'Feminino' },
                        { value: 'OTHER', label: 'Outro' },
                      ].map((g) => (
                        <label key={g.value} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="gender"
                            value={g.value}
                            checked={editForm.gender === g.value}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, gender: e.target.value }))
                            }
                            className="text-purple-500 focus:ring-purple-500"
                          />
                          <span className="text-white text-sm">{g.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!isEditing && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profile?.email && (
                    <div className="flex items-center gap-2 text-gray-300 text-sm">
                      <Mail size={14} className="text-gray-500" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-gray-300 text-sm">
                      <Phone size={14} className="text-gray-500" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Calendar size={14} className="text-gray-500" />
                    <span>Membro desde {formatMemberSince(profile?.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Shield size={14} className="text-gray-500" />
                    <span className="capitalize">{profile?.role}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Music} label="Playlists" value={stats?.total_playlists || 0} />
            <StatCard icon={Heart} label="Favoritos" value={stats?.total_favorites || 0} />
            <StatCard
              icon={Clock}
              label="Tempo ouvido"
              value={`${Math.floor((stats?.total_listening_time || 0) / 60)}h`}
            />
            <StatCard icon={Play} label="Downloads" value={stats?.total_downloads || 0} />
          </div>

          {/* Ações rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/favorites"
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Heart size={20} className="text-pink-500" />
                <div>
                  <p className="text-white font-medium">Meus Favoritos</p>
                  <p className="text-gray-400 text-xs">Ver conteúdos guardados</p>
                </div>
              </div>
              <ChevronRight
                size={20}
                className="text-gray-500 group-hover:text-purple-400 transition-colors"
              />
            </Link>

            <Link
              href="/history"
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-blue-500" />
                <div>
                  <p className="text-white font-medium">Histórico</p>
                  <p className="text-gray-400 text-xs">Conteúdos reproduzidos</p>
                </div>
              </div>
              <ChevronRight
                size={20}
                className="text-gray-500 group-hover:text-purple-400 transition-colors"
              />
            </Link>

            <Link
              href="/playlists"
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Music size={20} className="text-green-500" />
                <div>
                  <p className="text-white font-medium">Minhas Playlists</p>
                  <p className="text-gray-400 text-xs">Gerir as suas playlists</p>
                </div>
              </div>
              <ChevronRight
                size={20}
                className="text-gray-500 group-hover:text-purple-400 transition-colors"
              />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}