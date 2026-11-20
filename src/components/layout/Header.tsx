// src/components/Header.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resolveCoverUrl, resolveMediaUrl } from '@/lib/media';
import { API_ENDPOINTS, fetchWithAuth, getApiUrl } from '@/config/api';
import { useLanguage, MENU_TRANSLATIONS } from '@/lib/i18n';
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Heart,
  Clock,
  Headphones,
  X,
  ListMusic,
  Mic2,
  HelpCircle,
  Flag,
} from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'new_episode' | 'reminder';
  read: boolean;
  createdAt: string;
  link?: string;
}

export default function Header() {
  const { user, logout } = useAuth();
  const lang = useLanguage();
  const t = MENU_TRANSLATIONS[lang];
  const router = useRouter();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      const cached = localStorage.getItem('podplay_branding_logo');
      if (cached) setLogoUrl(cached);
    } catch {}

    fetch(getApiUrl('/api/v1/branding'))
      .then((r) => r.json())
      .then((b) => {
        if (!cancelled && b?.success) {
          const url = b.data?.logo_url ?? null;
          setLogoUrl(url);
          try {
            if (url) localStorage.setItem('podplay_branding_logo', url);
            else localStorage.removeItem('podplay_branding_logo');
          } catch {}
        }
      })
      .catch(() => {});

    const onBrandingUpdated = (e: Event) => {
      const url = (e as CustomEvent)?.detail?.logo_url ?? null;
      setLogoUrl(url);
    };
    window.addEventListener('podplay:branding-updated', onBrandingUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('podplay:branding-updated', onBrandingUpdated);
    };
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      try {
        const res = await fetchWithAuth(API_ENDPOINTS.NOTIFICATIONS);
        if (!res.ok) return;
        const body = await res.json();
        const rawList = Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body?.data?.notifications)
            ? body.data.notifications
            : [];

        const mapped: Notification[] = rawList.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type || 'info',
          read: Boolean(n.is_read ?? n.read),
          createdAt: n.created_at || n.createdAt || new Date().toISOString(),
          link: n.link || undefined,
        }));
        setNotifications(mapped);
      } catch {
        // Silencioso
      }
    };

    loadNotifications();
    const onRefresh = () => loadNotifications();
    window.addEventListener('podplay:notifications-updated', onRefresh);
    return () => window.removeEventListener('podplay:notifications-updated', onRefresh);
  }, [user?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await fetchWithAuth(API_ENDPOINTS.NOTIFICATION_READ, {
        method: 'POST',
        body: JSON.stringify({ notificationIds: [id] }),
      });
    } catch {
      // Silencioso
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetchWithAuth(API_ENDPOINTS.NOTIFICATION_READ_ALL, { method: 'POST' });
    } catch {
      // Silencioso
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    setShowNotifications(false);
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_episode':
        return <Headphones size={16} className="text-purple-500" />;
      case 'reminder':
        return <Clock size={16} className="text-blue-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours} h atrás`;
    return `${diffDays} d atrás`;
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const displayName = user?.fullName || user?.nome || user?.username || 'Visitante';
  const userInitial = displayName.charAt(0).toUpperCase() || 'U';
  const avatarSrc = resolveMediaUrl(user?.avatarUrl || user?.foto);
  const headerUserRole = String((user as any)?.role || (user as any)?.type || '').toLowerCase();
  const isPlatformOnly = Boolean(user && ((user as any)?.platformOnly || headerUserRole === 'support'));

  useEffect(() => {
    setAvatarError(false);
  }, [avatarSrc]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/search');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#09090d]/85 backdrop-blur-xl border-b border-white/[0.07]">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        {/* Logo oficial da plataforma no mobile (sem sidebar no mobile) */}
        <div className="flex items-center">
          <Link href={isPlatformOnly ? '/controle' : '/'} className="md:hidden flex items-center gap-2 text-white font-bold text-base">
            {logoUrl ? (
              <img
                src={resolveCoverUrl(logoUrl)}
                alt="PodFéPlay"
                className="w-8 h-8 rounded-lg object-contain bg-white/5 flex-shrink-0"
              />
            ) : (
              <span className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
                <Headphones size={15} className="text-white" />
              </span>
            )}
            <span>PodFéPlay</span>
          </Link>
        </div>

        {/* Barra de Pesquisa (ocultada para utilizadores exclusivos do painel) */}
        {!isPlatformOnly ? (
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="search"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white/[0.06] border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:bg-white/10 text-sm text-white placeholder:text-gray-400 transition-all"
            />
          </form>
        ) : (
          <div className="hidden md:flex items-center text-xs font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
            {t.exclusiveAdminAccess}
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-2.5">
          {/* Botão de Pesquisa Mobile */}
          {!isPlatformOnly && (
            <button
              onClick={() => setShowMobileSearch((prev) => !prev)}
              className="md:hidden p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Pesquisar"
            >
              <Search size={20} />
            </button>
          )}

          {!user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/register"
                className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-colors"
              >
                Inscrever-se
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-full bg-white text-slate-950 hover:bg-gray-100 text-xs sm:text-sm font-bold transition-all shadow-sm"
              >
                Iniciar sessão
              </Link>
            </div>
          ) : (
            <>
              {/* Notificações */}
              <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Notificações"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown de Notificações */}
            {showNotifications && (
              <div className="fixed left-3 right-3 top-14 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-50 max-h-[60vh] sm:max-h-[480px] overflow-hidden flex flex-col">
                <div className="p-3 sm:p-4 border-b border-white/10 flex justify-between items-center shrink-0">
                  <h3 className="font-semibold text-white text-sm sm:text-base">Notificações</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-[50vh] sm:max-h-96 overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="p-6 sm:p-8 text-center text-gray-400">
                      <Bell size={28} className="mx-auto mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm">Nenhuma notificação</p>
                    </div>
                  )}
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 sm:p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${
                        !notification.read ? 'bg-purple-500/10 border-l-4 border-l-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-xs sm:text-sm">{notification.title}</p>
                          <p className="text-gray-400 text-[11px] sm:text-xs mt-0.5 line-clamp-2">{notification.message}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{formatDate(notification.createdAt)}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Perfil do Usuário */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2"
              aria-label="Menu do usuário"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg overflow-hidden">
                {avatarSrc && !avatarError ? (
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="text-white text-sm font-medium">{userInitial}</span>
                )}
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${
                  showUserDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown do Usuário */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden">
                <div className="p-3 border-b border-white/10">
                  <p className="text-white font-medium text-sm truncate">{displayName}</p>
                  <p className="text-gray-400 text-xs truncate">{user?.email || user?.phone || `@${user?.username}`}</p>
                  {user?.churchId && (
                    <p className="text-purple-400 text-xs mt-1">Igreja Vida Nova</p>
                  )}
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <User size={16} />
                    <span>{t.settingsProfile}</span>
                  </Link>
                  {!isPlatformOnly && (
                    <>
                      <Link
                        href="/favorites"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <Heart size={16} />
                        <span>{t.favorites}</span>
                      </Link>
                      <Link
                        href="/history"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <Clock size={16} />
                        <span>{t.history}</span>
                      </Link>
                      <Link
                        href="/playlists"
                        className="md:hidden flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <ListMusic size={16} />
                        <span>{t.playlists}</span>
                      </Link>
                      <Link
                        href="/studio"
                        className="md:hidden flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <Mic2 size={16} />
                        <span>{t.studio}</span>
                      </Link>
                      <Link
                        href="/support"
                        className="md:hidden flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <HelpCircle size={16} />
                        <span>{t.support}</span>
                      </Link>
                      <Link
                        href="/reports"
                        className="md:hidden flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <Flag size={16} />
                        <span>{t.reports}</span>
                      </Link>
                    </>
                  )}
                  {['admin', 'moderator', 'support'].includes(headerUserRole) && (
                    <Link
                      href="/controle"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <Settings size={16} />
                      <span>
                        {headerUserRole === 'support'
                          ? t.supportPanel
                          : headerUserRole === 'moderator'
                            ? t.reviewPanel
                            : t.control}
                      </span>
                    </Link>
                  )}
                  <div className="border-t border-white/10 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>{t.logout}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </div>

      {/* Barra de Pesquisa Mobile Expandida */}
      {(showMobileSearch || searchQuery) && (
        <form onSubmit={handleSearchSubmit} className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="O que você quer ouvir ou assistir hoje?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-full bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowMobileSearch(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </form>
      )}
    </header>
  );
}