'use client';

import { useEffect, useState } from 'react';

export type AppLanguage = 'pt' | 'en' | 'es';

export const MENU_TRANSLATIONS: Record<
  AppLanguage,
  {
    home: string;
    music: string;
    videos: string;
    trending: string;
    library: string;
    playlists: string;
    studio: string;
    support: string;
    control: string;
    reviewPanel: string;
    searchPlaceholder: string;
    settingsProfile: string;
    favorites: string;
    history: string;
    logout: string;
    login: string;
    register: string;
  }
> = {
  pt: {
    home: 'Início',
    music: 'Músicas',
    videos: 'Vídeos',
    trending: 'Em Alta',
    library: 'Biblioteca',
    playlists: 'Playlists',
    studio: 'Estúdio',
    support: 'Suporte',
    control: 'Controlo Geral',
    reviewPanel: 'Painel de Revisão',
    searchPlaceholder: 'O que queres ouvir ou assistir?',
    settingsProfile: 'Definições & Perfil',
    favorites: 'Meus Favoritos',
    history: 'Histórico',
    logout: 'Terminar sessão',
    login: 'Entrar',
    register: 'Criar conta',
  },
  en: {
    home: 'Home',
    music: 'Music',
    videos: 'Videos',
    trending: 'Trending',
    library: 'Library',
    playlists: 'Playlists',
    studio: 'Studio',
    support: 'Support',
    control: 'Platform Control',
    reviewPanel: 'Review Panel',
    searchPlaceholder: 'What do you want to listen to or watch?',
    settingsProfile: 'Settings & Profile',
    favorites: 'My Favorites',
    history: 'History',
    logout: 'Sign out',
    login: 'Sign in',
    register: 'Create account',
  },
  es: {
    home: 'Inicio',
    music: 'Música',
    videos: 'Videos',
    trending: 'Tendencias',
    library: 'Biblioteca',
    playlists: 'Playlists',
    studio: 'Estudio',
    support: 'Soporte',
    control: 'Control General',
    reviewPanel: 'Panel de Revisión',
    searchPlaceholder: '¿Qué quieres escuchar o ver?',
    settingsProfile: 'Configuración y Perfil',
    favorites: 'Mis Favoritos',
    history: 'Historial',
    logout: 'Cerrar sesión',
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
  },
};

export function useLanguage(): AppLanguage {
  const [lang, setLang] = useState<AppLanguage>('pt');

  useEffect(() => {
    const readLang = () => {
      try {
        const raw = localStorage.getItem('podplay_preferences');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.language === 'en' || parsed?.language === 'es' || parsed?.language === 'pt') {
            setLang(parsed.language);
            return;
          }
        }
      } catch {}
      setLang('pt');
    };

    readLang();
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.language === 'en' || detail?.language === 'es' || detail?.language === 'pt') {
        setLang(detail.language);
      } else {
        readLang();
      }
    };
    window.addEventListener('podplay:preferences-updated', onUpdate);
    return () => window.removeEventListener('podplay:preferences-updated', onUpdate);
  }, []);

  return lang;
}
