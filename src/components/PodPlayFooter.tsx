'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getApiUrl } from '@/config/api';
import { Instagram, Facebook, Youtube, Music2, MessageCircle } from 'lucide-react';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterConfig {
  columns: FooterColumn[];
  social: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  copyright: string;
  tagline?: string;
}

const DEFAULT_FOOTER: FooterConfig = {
  columns: [
    {
      title: 'Plataforma',
      links: [
        { label: 'Início', href: '/' },
        { label: 'Músicas & Louvores', href: '/music' },
        { label: 'Vídeos & Pregações', href: '/videos' },
        { label: 'Em Alta', href: '/trending' },
      ],
    },
    {
      title: 'Comunidades',
      links: [
        { label: 'Estúdio do Criador', href: '/studio' },
        { label: 'Artistas', href: '/artists' },
        { label: 'Álbuns', href: '/albums' },
        { label: 'Playlists', href: '/playlists' },
      ],
    },
    {
      title: 'Conta & Suporte',
      links: [
        { label: 'Minha Biblioteca', href: '/library' },
        { label: 'Histórico', href: '/history' },
        { label: 'Favoritos', href: '/favorites' },
        { label: 'Suporte', href: '/support' },
      ],
    },
  ],
  social: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
  },
  copyright: `© ${new Date().getFullYear()} PodFéPlay · Streaming Gospel`,
  tagline: 'Tudo o que fizerem, façam de coração, como para o Senhor (Colossenses 3:23)',
};

export default function PodPlayFooter() {
  const [config, setConfig] = useState<FooterConfig>(DEFAULT_FOOTER);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch(getApiUrl('/api/v1/footer'), { cache: 'no-store' })
        .then((r) => r.json())
        .then((b) => {
          if (!cancelled && b?.success && b?.data) {
            setConfig(b.data);
          }
        })
        .catch(() => {});
    };

    load();
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail) setConfig(detail);
      else load();
    };
    window.addEventListener('podplay:footer-updated', onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener('podplay:footer-updated', onUpdate);
    };
  }, []);

  const socialItems = [
    { key: 'instagram', url: config.social?.instagram, label: 'Instagram', icon: Instagram },
    { key: 'facebook', url: config.social?.facebook, label: 'Facebook', icon: Facebook },
    { key: 'youtube', url: config.social?.youtube, label: 'YouTube', icon: Youtube },
    { key: 'tiktok', url: config.social?.tiktok, label: 'TikTok', icon: Music2 },
    { key: 'whatsapp', url: config.social?.whatsapp, label: 'WhatsApp', icon: MessageCircle },
  ].filter((item) => Boolean(item.url && item.url.trim()));

  return (
    <footer className="mt-14 pt-10 pb-8 border-t border-white/10 text-sm">
      <div className="flex flex-col lg:flex-row justify-between gap-10">
        {/* Colunas estilo Spotify */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 flex-1 max-w-3xl">
          {(config.columns || []).map((col, idx) => (
            <div key={`col-${idx}`}>
              <h4 className="font-bold text-white mb-3 text-sm tracking-wide">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {(col.links || []).map((link, lIdx) => {
                  const isExternal = /^https?:\/\//i.test(link.href);
                  return (
                    <li key={`link-${idx}-${lIdx}`}>
                      {isExternal ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white hover:underline transition-colors text-xs sm:text-sm"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href || '/'}
                          className="text-gray-400 hover:text-white hover:underline transition-colors text-xs sm:text-sm"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Botões circulares de Redes Sociais estilo Spotify */}
        {socialItems.length > 0 && (
          <div className="flex items-start gap-3">
            {socialItems.map((s) => (
              <a
                key={s.key}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-purple-600 text-white flex items-center justify-center transition-all hover:scale-105 shadow"
              >
                <s.icon size={18} />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Linha inferior */}
      <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-400">
        <p>{config.copyright}</p>
        {config.tagline && <p className="text-gray-500">{config.tagline}</p>}
      </div>
    </footer>
  );
}
