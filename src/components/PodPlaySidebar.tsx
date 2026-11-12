'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Music as MusicIcon,
  Video as VideoIcon,
  Users,
  DiscAlbum,
  Flame,
  Library,
  User,
  Plus,
  Headphones,
  ListMusic,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { playlistApi, type Playlist } from '@/lib/playlistApi';

// ============================================================
// CONSTANTES
// ============================================================

const STORAGE_COLLAPSED = 'podplay_sidebar_collapsed';

const menuItems = [
  { icon: Home, label: 'Inicio', href: '/' },
  { icon: Search, label: 'Pesquisa', href: '/search' },
  { icon: MusicIcon, label: 'Músicas', href: '/music' },
  { icon: VideoIcon, label: 'Vídeos', href: '/videos' },
  { icon: Users, label: 'Artistas', href: '/artists' },
  { icon: DiscAlbum, label: 'Álbuns', href: '/albums' },
  { icon: Flame, label: 'Em Alta', href: '/trending' },
  { icon: Library, label: 'Biblioteca', href: '/library' },
  { icon: ListMusic, label: 'Playlists', href: '/playlists' },
  { icon: User, label: 'Perfil', href: '/profile' },
];

// ============================================================
// COMPONENTE
// ============================================================

export default function PodPlaySidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  // É admin?
  const isAdmin =
    user &&
    ((user as any).role === 'admin' || (user as any).role === 'ADMIN');

  // ---------- Persistir colapsado ----------
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_COLLAPSED);
    if (saved === 'true') setCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_COLLAPSED, String(collapsed));
  }, [collapsed]);

  // ---------- Carregar playlists ----------
  const loadPlaylists = useCallback(async () => {
    if (!user) {
      setPlaylists([]);
      return;
    }
    try {
      setLoadingPlaylists(true);
      const rows = await playlistApi.list();
      setPlaylists(Array.isArray(rows) ? rows.slice(0, 8) : []);
    } catch {
      setPlaylists([]);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [user]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    const onFocus = () => loadPlaylists();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadPlaylists]);

  // ---------- Ativo? ----------
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-black/60 backdrop-blur-xl border-r border-white/10 transition-all duration-300 z-30 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="p-4 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2" title="Podfe Play">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Headphones size={18} className="text-white" />
          </div>
          {!collapsed && (
            <h1 className="text-xl font-bold text-white truncate">Podfe Play</h1>
          )}
        </Link>
      </div>

      {/* Menu principal */}
      <nav className="px-2 space-y-1 flex-shrink-0">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                active
                  ? 'bg-purple-600/20 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* ADMIN — só para admins */}
        {isAdmin && (
          <Link
            href="/admin/artists"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all mt-2 border-t border-white/5 pt-3 ${
              isActive('/admin')
                ? 'bg-purple-600/20 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Admin' : ''}
          >
            <Shield size={20} className="flex-shrink-0 text-purple-400" />
            {!collapsed && <span>Admin</span>}
          </Link>
        )}
      </nav>

      {/* Playlists */}
      {!collapsed && (
        <div className="mt-6 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between px-4 mb-3 flex-shrink-0">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              As tuas playlists
            </h3>
            <Link
              href="/playlists"
              className="text-gray-400 hover:text-white transition-colors"
              title="Nova playlist"
            >
              <Plus size={16} />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
            {loadingPlaylists && playlists.length === 0 && (
              <div className="flex justify-center py-3">
                <Loader2 size={16} className="text-purple-400 animate-spin" />
              </div>
            )}

            {!loadingPlaylists && playlists.length === 0 && (
              <p className="text-gray-500 text-xs px-3 py-2">
                Ainda não tens playlists.
              </p>
            )}

            {playlists.map((p) => {
              const active = pathname === `/playlists/${p.id}`;
              return (
                <Link
                  key={p.id}
                  href={`/playlists/${p.id}`}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  title={p.title}
                >
                  <ListMusic
                    size={14}
                    className={`flex-shrink-0 ${
                      active ? 'text-purple-400' : 'text-gray-500'
                    }`}
                  />
                  <span className="truncate">{p.title}</span>
                </Link>
              );
            })}

            <Link
              href="/playlists"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <Plus size={14} />
              <span>Nova playlist</span>
            </Link>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="mt-4 px-2">
          <Link
            href="/playlists"
            className="flex items-center justify-center px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            title="Playlists"
          >
            <ListMusic size={20} />
          </Link>
        </div>
      )}

      {/* Colapsar (desktop) */}
      <div className="mt-auto p-3 border-t border-white/10 flex-shrink-0">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-xs">Recolher</span>}
        </button>
      </div>
    </aside>
  );
}