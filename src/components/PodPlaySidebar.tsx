'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Music as MusicIcon,
  Video as VideoIcon,
  Flame,
  Library,
  Headphones,
  ListMusic,
  Shield,
  Mic2,
  ChevronLeft,
  ChevronRight,
  X,
  HelpCircle,
  Flag,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/config/api';
import { resolveCoverUrl } from '@/lib/media';
import { useLanguage, MENU_TRANSLATIONS } from '@/lib/i18n';

const STORAGE_COLLAPSED = 'podplay_sidebar_collapsed';
const STORAGE_BRANDING_LOGO = 'podplay_branding_logo';

export default function PodPlaySidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const lang = useLanguage();
  const t = MENU_TRANSLATIONS[lang];

  const menuItems = [
    { icon: Home, label: t.home, href: '/' },
    { icon: MusicIcon, label: t.music, href: '/music' },
    { icon: VideoIcon, label: t.videos, href: '/videos' },
    { icon: Flame, label: t.trending, href: '/trending' },
    { icon: Library, label: t.library, href: '/library' },
    { icon: ListMusic, label: t.playlists, href: '/playlists' },
    { icon: Mic2, label: t.studio, href: '/studio' },
    { icon: HelpCircle, label: t.support, href: '/support' },
    { icon: Flag, label: t.reports, href: '/reports' },
  ];

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      const cached = localStorage.getItem(STORAGE_BRANDING_LOGO);
      if (cached) setLogoUrl(cached);
    } catch {}

    fetch(getApiUrl('/api/v1/branding'), { cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => {
        if (!cancelled && b?.success && b?.data) {
          const nextUrl = b.data.logo_url || null;
          setLogoUrl(nextUrl);
          try {
            if (nextUrl) localStorage.setItem(STORAGE_BRANDING_LOGO, nextUrl);
            else localStorage.removeItem(STORAGE_BRANDING_LOGO);
          } catch {}
        }
      })
      .catch(() => {});

    const onBrandingUpdated = (e: Event) => {
      const url = (e as CustomEvent)?.detail?.logo_url ?? null;
      setLogoUrl(url);
      try {
        if (url) localStorage.setItem(STORAGE_BRANDING_LOGO, url);
        else localStorage.removeItem(STORAGE_BRANDING_LOGO);
      } catch {}
    };
    window.addEventListener('podplay:branding-updated', onBrandingUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('podplay:branding-updated', onBrandingUpdated);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onToggle = () => setMobileOpen((prev) => !prev);
    window.addEventListener('podplay:toggle-mobile-sidebar', onToggle);
    return () => window.removeEventListener('podplay:toggle-mobile-sidebar', onToggle);
  }, []);

  // Controlo Geral / Revisão / Suporte para utilizadores com tipo/role === 'admin', 'moderator' ou 'support'
  const userType = String(
    (user as any)?.role || (user as any)?.type || (user as any)?.perfil || ''
  ).toLowerCase();
  const isPlatformOnly = Boolean(user && ((user as any)?.platformOnly || userType === 'support'));
  const isAdmin = Boolean(
    user && (userType === 'admin' || userType === 'moderator' || userType === 'support')
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_COLLAPSED);
    if (saved === 'true') setCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_COLLAPSED, String(collapsed));
  }, [collapsed]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-full bg-black/50 backdrop-blur-xl border-r border-white/10 transition-all duration-300 z-30 flex-col ${
          collapsed ? 'md:w-20' : 'md:w-60'
        }`}
      >
        {/* Logo */}
        <div className="px-4 py-5 flex-shrink-0 flex items-center justify-between">
          <Link href={isPlatformOnly ? '/controle' : '/'} className="flex items-center gap-2.5" title="Podfe Play">
            {logoUrl ? (
              <img
                src={resolveCoverUrl(logoUrl)}
                alt="Podfe Play"
                className="w-8 h-8 rounded-lg object-contain bg-white/5 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-600/30">
                <Headphones size={18} className="text-white" />
              </div>
            )}
            {(!collapsed || mobileOpen) && (
              <span className="text-lg font-bold tracking-tight text-white truncate">
                Podfe Play
              </span>
            )}
          </Link>
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navegação minimalista */}
        <nav className="px-3 space-y-1 flex-1 overflow-y-auto">
          {!isPlatformOnly &&
            menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-purple-600/20 text-white border border-purple-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  <item.icon
                    size={19}
                    className={`flex-shrink-0 ${active ? 'text-purple-400' : ''}`}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}

          {isAdmin && (
            <div className={isPlatformOnly ? '' : 'pt-3 mt-3 border-t border-white/10'}>
              <Link
                href="/controle"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive('/controle')
                    ? 'bg-amber-500/15 text-amber-200 border border-amber-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                } ${collapsed ? 'justify-center' : ''}`}
                title={
                  collapsed
                    ? userType === 'support'
                      ? t.supportPanel
                      : userType === 'moderator'
                        ? t.reviewPanel
                        : t.control
                    : ''
                }
              >
                <Shield size={19} className="flex-shrink-0 text-amber-400" />
                {!collapsed && (
                  <span>
                    {userType === 'support'
                      ? t.supportPanel
                      : userType === 'moderator'
                        ? t.reviewPanel
                        : t.control}
                  </span>
                )}
              </Link>
            </div>
          )}
        </nav>

        {/* Colapsar (desktop) */}
        <div className="mt-auto p-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            {!collapsed && <span className="text-xs">Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Barra de navegação inferior para dispositivos móveis */}
      <nav
        aria-label="Navegação móvel"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 grid grid-cols-5 items-center px-1"
      >
        {[
          { icon: Home, label: t.home, href: '/' },
          { icon: MusicIcon, label: t.music, href: '/music' },
          { icon: VideoIcon, label: t.videos, href: '/videos' },
          { icon: Flame, label: t.trending, href: '/trending' },
          { icon: Library, label: t.library, href: '/library' },
        ].map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                active ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
