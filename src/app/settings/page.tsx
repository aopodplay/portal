// app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
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
  Home,
  Search,
  Flame,
  Library,
  Plus,
  Menu,
  Eye,
  EyeOff,
  Trash2,
  Moon,
  Sun,
  Volume2,
  Wifi,
  Download,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from '@/config/api';

// Interface para sessão ativa
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

// Interface para preferências
interface Preferences {
  autoPlay?: boolean;
  quality?: string;
  language?: string;
  theme?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

// Sidebar Component
const PodfSidebar = ({ collapsed = false }: { collapsed?: boolean }) => {
  const menuItems = [
    { icon: Home, label: 'Inicio', href: '/' },
    { icon: Search, label: 'Pesquisa', href: '/search' },
    { icon: Flame, label: 'Em Alta', href: '/trending' },
    { icon: Library, label: 'Biblioteca', href: '/library' },
    { icon: User, label: 'Perfil', href: '/profile' },
    { icon: Settings, label: 'Configurações', href: '/settings' },
  ];

  const playlists = [
    'As Minhas Favoritas',
    'Oração da Manhã',
    'Louvores com a Família',
    'Pregações – Pr. Carlos',
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-black/60 backdrop-blur-xl border-r border-white/10 transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Headphones size={18} className="text-white" />
          </div>
          {!collapsed && <h1 className="text-xl font-bold text-white">Podfá Play</h1>}
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? item.label : ''}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {!collapsed && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                AS TUAS PLAYLISTS
              </h3>
              <button className="text-gray-400 hover:text-white">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {playlists.map((playlist) => (
                <Link
                  key={playlist}
                  href="#"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <div className="w-1 h-1 bg-purple-400 rounded-full" />
                  <span className="truncate">{playlist}</span>
                </Link>
              ))}
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all w-full">
                <Plus size={14} />
                <span>Nova playlist</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

// Componente de seção de configuração
const SettingsSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden mb-6">
    <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
      <Icon size={18} className="text-purple-400" />
      <h2 className="text-white font-medium">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// Componente de toggle switch
const ToggleSwitch = ({ enabled, onChange, label, description }: { enabled: boolean; onChange: () => void; label: string; description?: string }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-white text-sm">{label}</p>
      {description && <p className="text-gray-400 text-xs">{description}</p>}
    </div>
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-purple-600' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

// Componente de select
const SelectOption = ({ value, label, selected, onChange }: { value: string; label: string; selected: boolean; onChange: (value: string) => void }) => (
  <button
    onClick={() => onChange(value)}
    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
      selected ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
    }`}
  >
    {label}
  </button>
);

import { Settings } from 'lucide-react';
import { Headphones } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Preferências
  const [preferences, setPreferences] = useState<Preferences>({
    autoPlay: true,
    quality: 'auto',
    language: 'pt',
    theme: 'dark',
    emailNotifications: true,
    pushNotifications: true,
  });
  
  // Alterar senha
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Sessões ativas
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  
  // Carregar dados
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('podplay_token');
        if (!token) {
          router.push('/login');
          return;
        }
        
        // Carregar preferências
        const prefsRes = await fetch(getApiUrl(API_ENDPOINTS.PROFILE_PREFERENCES), {
          headers: getAuthHeaders(),
        });
        const prefsData = await prefsRes.json();
        if (prefsData.success && prefsData.data) {
          setPreferences({
            autoPlay: prefsData.data.preferences?.autoPlay ?? true,
            quality: prefsData.data.preferences?.quality ?? 'auto',
            language: prefsData.data.language ?? 'pt',
            theme: prefsData.data.theme ?? 'dark',
            emailNotifications: prefsData.data.notifications_enabled ?? true,
            pushNotifications: prefsData.data.preferences?.pushNotifications ?? true,
          });
        }
        
        // Carregar sessões ativas
        const sessionsRes = await fetch(getApiUrl('/api/v1/sessions/active'), {
          headers: getAuthHeaders(),
        });
        const sessionsData = await sessionsRes.json();
        if (sessionsData.success) {
          setSessions(sessionsData.data);
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [router]);
  
  // Atualizar preferência
  const updatePreference = async (key: keyof Preferences, value: any) => {
    setSaving(true);
    setError('');
    
    try {
      const updatedPrefs = { ...preferences, [key]: value };
      
      const response = await fetch(getApiUrl(API_ENDPOINTS.PROFILE_PREFERENCES), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          preferences: updatedPrefs,
          language: updatedPrefs.language,
          theme: updatedPrefs.theme,
          notifications_enabled: updatedPrefs.emailNotifications,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPreferences(updatedPrefs);
        setSuccess('Preferência atualizada!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Erro ao atualizar');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };
  
  // Alterar senha
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('As novas senhas não coincidem');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setChangingPassword(true);
    
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.CHANGE_PASSWORD), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess('Senha alterada com sucesso!');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setShowChangePassword(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Erro ao alterar senha');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setChangingPassword(false);
    }
  };
  
  // Revogar sessão
  const revokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId);
    
    try {
      const response = await fetch(getApiUrl(`/api/v1/sessions/${sessionId}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSessions(sessions.filter(s => s.session_id !== sessionId));
        setSuccess('Sessão encerrada com sucesso');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Erro ao encerrar sessão');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setRevokingSession(null);
    }
  };
  
  // Revogar todas as sessões exceto a atual
  const revokeAllSessions = async () => {
    if (!confirm('Tem certeza que deseja encerrar todas as sessões em outros dispositivos?')) return;
    
    try {
      const response = await fetch(getApiUrl('/api/v1/sessions/revoke-all'), {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSessions(sessions.filter(s => s.is_current));
        setSuccess('Todas as outras sessões foram encerradas');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Erro ao encerrar sessões');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return <Smartphone size={16} />;
    if (userAgent.includes('Tablet')) return <Monitor size={16} />;
    return <Monitor size={16} />;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 size={40} className="text-purple-500 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodfSidebar collapsed={sidebarCollapsed} />
      
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} min-h-screen`}>
        <Header />
        
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Botão mobile */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-purple-600 rounded-full shadow-lg"
          >
            <Menu size={20} className="text-white" />
          </button>
          
          {/* Título */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Configurações</h1>
            <p className="text-gray-400 text-sm">Gerencie suas preferências e segurança</p>
          </div>
          
          {/* Mensagens */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                ✕
              </button>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}
          
          {/* Preferências de Reprodução */}
          <SettingsSection title="Reprodução" icon={Volume2}>
            <ToggleSwitch
              enabled={preferences.autoPlay || false}
              onChange={() => updatePreference('autoPlay', !preferences.autoPlay)}
              label="Auto-play"
              description="Iniciar reprodução automaticamente"
            />
            
            <div className="pt-3">
              <label className="block text-gray-400 text-xs mb-2">Qualidade de streaming</label>
              <div className="flex gap-2">
                {['auto', 'low', 'medium', 'high'].map((q) => (
                  <SelectOption
                    key={q}
                    value={q}
                    label={q === 'auto' ? 'Auto' : q === 'low' ? 'Baixa' : q === 'medium' ? 'Média' : 'Alta'}
                    selected={preferences.quality === q}
                    onChange={(val) => updatePreference('quality', val)}
                  />
                ))}
              </div>
            </div>
          </SettingsSection>
          
          {/* Preferências de Idioma e Aparência */}
          <SettingsSection title="Idioma e Aparência" icon={Globe}>
            <div className="mb-4">
              <label className="block text-gray-400 text-xs mb-2">Idioma</label>
              <div className="flex gap-2">
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
              <label className="block text-gray-400 text-xs mb-2">Tema</label>
              <div className="flex gap-2">
                {[
                  { value: 'dark', label: 'Escuro', icon: <Moon size={14} /> },
                  { value: 'light', label: 'Claro', icon: <Sun size={14} /> },
                ].map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => updatePreference('theme', theme.value)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                      preferences.theme === theme.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {theme.icon}
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
          </SettingsSection>
          
          {/* Notificações */}
          <SettingsSection title="Notificações" icon={Bell}>
            <ToggleSwitch
              enabled={preferences.emailNotifications || false}
              onChange={() => updatePreference('emailNotifications', !preferences.emailNotifications)}
              label="Notificações por email"
              description="Receba novidades e atualizações por email"
            />
            
            <ToggleSwitch
              enabled={preferences.pushNotifications || false}
              onChange={() => updatePreference('pushNotifications', !preferences.pushNotifications)}
              label="Notificações push"
              description="Alertas sobre novos episódios e transmissões"
            />
          </SettingsSection>
          
          {/* Segurança - Alterar Senha */}
          <SettingsSection title="Segurança" icon={Shield}>
            {!showChangePassword ? (
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock size={18} className="text-purple-400" />
                  <div className="text-left">
                    <p className="text-white text-sm">Alterar senha</p>
                    <p className="text-gray-400 text-xs">Mantenha sua conta segura</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-500" />
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Senha atual</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Digite sua senha atual"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Nova senha</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Confirmar nova senha</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Digite a nova senha novamente"
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
                    className="flex-1 px-4 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex-1 px-4 py-2 bg-purple-600 rounded-lg text-white text-sm font-medium hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {changingPassword ? <Loader2 size={16} className="animate-spin" /> : 'Alterar senha'}
                  </button>
                </div>
              </form>
            )}
          </SettingsSection>
          
          {/* Sessões Ativas */}
          <SettingsSection title="Sessões Ativas" icon={Monitor}>
            {sessions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Nenhuma sessão ativa</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.session_id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.user_agent || '')}
                      <div>
                        <p className="text-white text-sm">
                          {session.is_current ? 'Este dispositivo' : session.user_agent?.split(' ')[0] || 'Dispositivo'}
                          {session.is_current && <span className="ml-2 text-xs text-purple-400">(Atual)</span>}
                        </p>
                        <p className="text-gray-400 text-xs">Última atividade: {formatDate(session.last_activity)}</p>
                      </div>
                    </div>
                    {!session.is_current && (
                      <button
                        onClick={() => revokeSession(session.session_id)}
                        disabled={revokingSession === session.session_id}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
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
                
                {sessions.filter(s => !s.is_current).length > 0 && (
                  <button
                    onClick={revokeAllSessions}
                    className="w-full mt-3 py-2 text-center text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Encerrar todas as outras sessões
                  </button>
                )}
              </div>
            )}
          </SettingsSection>
        </div>
      </main>
    </div>
  );
}