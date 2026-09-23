// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import {
  Users,
  Music,
  Video,
  Podcast,
  Church,
  Heart,
  Eye,
  Download,
  TrendingUp,
  Calendar,
  DollarSign,
  Shield,
  Settings,
  Home,
  Search,
  Flame,
  Library,
  User,
  Plus,
  Menu,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  Check,
  X,
} from 'lucide-react';
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from '@/config/api';

// Componente de Card de Estatística
const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: any; color: string }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-full bg-${color}-500/20 flex items-center justify-center`}>
        <Icon size={20} className={`text-${color}-400`} />
      </div>
    </div>
  </div>
);

// Componente de Usuário na Tabela
const UserRow = ({ user, onAction }: { user: any; onAction: (action: string, userId: number) => void }) => (
  <div className="flex items-center justify-between p-3 border-b border-white/10 hover:bg-white/5 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
        <span className="text-white text-xs font-medium">{user.username?.charAt(0).toUpperCase()}</span>
      </div>
      <div>
        <p className="text-white text-sm font-medium">{user.full_name || user.username}</p>
        <p className="text-gray-400 text-xs">{user.email || user.phone}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
        user.role === 'moderator' ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-blue-500/20 text-blue-400'
      }`}>
        {user.role}
      </span>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      }`}>
        {user.is_active ? 'Ativo' : 'Inativo'}
      </span>
      <button
        onClick={() => onAction('edit', user.id)}
        className="p-1 text-gray-400 hover:text-white transition-colors"
      >
        <Edit size={16} />
      </button>
      <button
        onClick={() => onAction(user.is_active ? 'disable' : 'enable', user.id)}
        className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
      >
        {user.is_active ? <Ban size={16} /> : <Check size={16} />}
      </button>
      {user.role !== 'admin' && (
        <button
          onClick={() => onAction('delete', user.id)}
          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  </div>
);

// Componente de Conteúdo na Tabela
const ContentRow = ({ content, onAction }: { content: any; onAction: (action: string, id: number) => void }) => (
  <div className="flex items-center justify-between p-3 border-b border-white/10 hover:bg-white/5 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
        {content.type === 'music' && <Music size={18} className="text-purple-400" />}
        {content.type === 'video' && <Video size={18} className="text-blue-400" />}
        {content.type === 'podcast' && <Podcast size={18} className="text-green-400" />}
      </div>
      <div>
        <p className="text-white text-sm font-medium">{content.title}</p>
        <p className="text-gray-400 text-xs">{content.type} • {content.views || 0} visualizações</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        content.is_published ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
      }`}>
        {content.is_published ? 'Publicado' : 'Rascunho'}
      </span>
      <button
        onClick={() => onAction('edit', content.id)}
        className="p-1 text-gray-400 hover:text-white transition-colors"
      >
        <Edit size={16} />
      </button>
      <button
        onClick={() => onAction('toggle', content.id)}
        className="p-1 text-gray-400 hover:text-purple-400 transition-colors"
      >
        {content.is_published ? <X size={16} /> : <Check size={16} />}
      </button>
      <button
        onClick={() => onAction('delete', content.id)}
        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);

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

import { Headphones } from 'lucide-react';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'stats'>('stats');
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estatísticas
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalContent: 0,
    totalPlaylists: 0,
    totalFavorites: 0,
    totalViews: 0,
    totalDownloads: 0,
    newUsersThisMonth: 0,
    newContentThisMonth: 0,
  });
  
  // Usuários
  const [users, setUsers] = useState<any[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  
  // Conteúdos
  const [contents, setContents] = useState<any[]>([]);
  const [contentsPage, setContentsPage] = useState(1);
  const [contentsTotal, setContentsTotal] = useState(0);
  
  // Verificar permissão
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'admin' && user.role !== 'moderator') {
        router.push('/');
      }
    }
  }, [user, authLoading, router]);
  
  // Carregar dados
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'moderator')) {
      loadData();
    }
  }, [user, activeTab, usersPage, contentsPage]);
  
  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (activeTab === 'stats') {
        // Carregar estatísticas
        const statsRes = await fetch(getApiUrl('/api/v1/admin/stats'), {
          headers: getAuthHeaders(),
        });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      } else if (activeTab === 'users') {
        // Carregar usuários
        const usersRes = await fetch(getApiUrl(`/api/v1/admin/users?page=${usersPage}&limit=20`), {
          headers: getAuthHeaders(),
        });
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.data.users);
          setUsersTotal(usersData.data.total);
        }
      } else if (activeTab === 'content') {
        // Carregar conteúdos
        const contentsRes = await fetch(getApiUrl(`/api/v1/admin/contents?page=${contentsPage}&limit=20`), {
          headers: getAuthHeaders(),
        });
        const contentsData = await contentsRes.json();
        if (contentsData.success) {
          setContents(contentsData.data.contents);
          setContentsTotal(contentsData.data.total);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUserAction = async (action: string, userId: number) => {
    try {
      let response;
      switch (action) {
        case 'disable':
          response = await fetch(getApiUrl(`/api/v1/admin/users/${userId}/disable`), {
            method: 'POST',
            headers: getAuthHeaders(),
          });
          break;
        case 'enable':
          response = await fetch(getApiUrl(`/api/v1/admin/users/${userId}/enable`), {
            method: 'POST',
            headers: getAuthHeaders(),
          });
          break;
        case 'delete':
          if (!confirm('Tem certeza que deseja deletar este usuário?')) return;
          response = await fetch(getApiUrl(`/api/v1/admin/users/${userId}`), {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
          break;
        default:
          return;
      }
      
      const result = await response?.json();
      if (result?.success) {
        setSuccess(`Usuário ${action === 'disable' ? 'desativado' : action === 'enable' ? 'ativado' : 'deletado'} com sucesso`);
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result?.message || 'Erro ao executar ação');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    }
  };
  
  const handleContentAction = async (action: string, contentId: number) => {
    try {
      let response;
      switch (action) {
        case 'toggle':
          response = await fetch(getApiUrl(`/api/v1/admin/contents/${contentId}/toggle`), {
            method: 'POST',
            headers: getAuthHeaders(),
          });
          break;
        case 'delete':
          if (!confirm('Tem certeza que deseja deletar este conteúdo?')) return;
          response = await fetch(getApiUrl(`/api/v1/admin/contents/${contentId}`), {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
          break;
        default:
          return;
      }
      
      const result = await response?.json();
      if (result?.success) {
        setSuccess(`Conteúdo ${action === 'toggle' ? 'publicado/despublicado' : 'deletado'} com sucesso`);
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result?.message || 'Erro ao executar ação');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    }
  };
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 size={40} className="text-purple-500 animate-spin" />
      </div>
    );
  }
  
  // Verificar permissão novamente
  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodfSidebar collapsed={sidebarCollapsed} />
      
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} min-h-screen`}>
        <Header />
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Botão mobile */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-purple-600 rounded-full shadow-lg"
          >
            <Menu size={20} className="text-white" />
          </button>
          
          {/* Título */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Administração</h1>
            <p className="text-gray-400 text-sm">Gerencie usuários, conteúdos e acompanhe estatísticas</p>
          </div>
          
          {/* Mensagens */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto">✕</button>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}
          
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp size={16} className="inline mr-2" />
              Estatísticas
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Usuários
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'content'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Music size={16} className="inline mr-2" />
              Conteúdos
            </button>
          </div>
          
          {/* Estatísticas */}
          {activeTab === 'stats' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total de Usuários" value={stats.totalUsers} icon={Users} color="purple" />
                <StatCard title="Total de Conteúdos" value={stats.totalContent} icon={Music} color="blue" />
                <StatCard title="Total de Playlists" value={stats.totalPlaylists} icon={Library} color="green" />
                <StatCard title="Total de Favoritos" value={stats.totalFavorites} icon={Heart} color="pink" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="Visualizações" value={stats.totalViews} icon={Eye} color="yellow" />
                <StatCard title="Downloads" value={stats.totalDownloads} icon={Download} color="orange" />
              </div>
              <div className="mt-6 bg-white/5 rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">Resumo do Mês</h3>
                <div className="flex justify-around">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{stats.newUsersThisMonth}</p>
                    <p className="text-gray-400 text-xs">Novos Usuários</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{stats.newContentThisMonth}</p>
                    <p className="text-gray-400 text-xs">Novos Conteúdos</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Usuários */}
          {activeTab === 'users' && (
            <div className="bg-white/5 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-medium">Lista de Usuários</h3>
              </div>
              <div>
                {users.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">Nenhum usuário encontrado</div>
                ) : (
                  users.map((u) => (
                    <UserRow key={u.id} user={u} onAction={handleUserAction} />
                  ))
                )}
              </div>
              {usersTotal > 20 && (
                <div className="p-4 border-t border-white/10 flex justify-between items-center">
                  <button
                    onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                    disabled={usersPage === 1}
                    className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-gray-400 text-sm">Página {usersPage} de {Math.ceil(usersTotal / 20)}</span>
                  <button
                    onClick={() => setUsersPage(p => p + 1)}
                    disabled={usersPage >= Math.ceil(usersTotal / 20)}
                    className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Conteúdos */}
          {activeTab === 'content' && (
            <div className="bg-white/5 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-medium">Lista de Conteúdos</h3>
              </div>
              <div>
                {contents.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">Nenhum conteúdo encontrado</div>
                ) : (
                  contents.map((c) => (
                    <ContentRow key={c.id} content={c} onAction={handleContentAction} />
                  ))
                )}
              </div>
              {contentsTotal > 20 && (
                <div className="p-4 border-t border-white/10 flex justify-between items-center">
                  <button
                    onClick={() => setContentsPage(p => Math.max(1, p - 1))}
                    disabled={contentsPage === 1}
                    className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-gray-400 text-sm">Página {contentsPage} de {Math.ceil(contentsTotal / 20)}</span>
                  <button
                    onClick={() => setContentsPage(p => p + 1)}
                    disabled={contentsPage >= Math.ceil(contentsTotal / 20)}
                    className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}