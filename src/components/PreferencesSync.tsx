'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, fetchWithAuth } from '@/config/api';

export interface StoredPreferences {
  autoPlay?: boolean;
  quality?: string;
  language?: string;
  theme?: string;
  reducedMotion?: boolean;
  largeText?: boolean;
}

export const DEFAULT_PREFERENCES: StoredPreferences = {
  autoPlay: true,
  quality: 'auto',
  language: 'pt',
  theme: 'dark',
  reducedMotion: false,
  largeText: false,
};

export function applyPreferencesToDocument(prefs: StoredPreferences) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = prefs.theme === 'light' ? 'light' : 'dark';
  root.lang = prefs.language || 'pt';
  root.style.fontSize = prefs.largeText ? '17px' : '';
  root.classList.toggle('reduce-motion', Boolean(prefs.reducedMotion));
}

export default function PreferencesSync() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Sem sessão ativa -> volta sempre ao tema escuro padrão e idioma 'pt'
    if (!user?.id) {
      try {
        localStorage.removeItem('podplay_preferences');
      } catch {}
      applyPreferencesToDocument(DEFAULT_PREFERENCES);
      window.dispatchEvent(
        new CustomEvent('podplay:preferences-updated', { detail: DEFAULT_PREFERENCES })
      );
      return;
    }

    let cancelled = false;
    // Aplica cache imediata se existir, depois sincroniza com a conta do utilizador
    try {
      const raw = localStorage.getItem('podplay_preferences');
      if (raw) applyPreferencesToDocument(JSON.parse(raw));
    } catch {}

    fetchWithAuth(API_ENDPOINTS.PROFILE_PREFERENCES)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled || !res?.success || !res?.data) return;
        const userPrefs: StoredPreferences = {
          autoPlay: res.data.preferences?.autoPlay ?? true,
          quality: res.data.preferences?.quality ?? 'auto',
          language: res.data.preferences?.language || res.data.language || 'pt',
          theme: res.data.preferences?.theme || res.data.theme || 'dark',
          reducedMotion: Boolean(res.data.preferences?.reducedMotion),
          largeText: Boolean(res.data.preferences?.largeText),
        };
        try {
          localStorage.setItem('podplay_preferences', JSON.stringify(userPrefs));
        } catch {}
        applyPreferencesToDocument(userPrefs);
        window.dispatchEvent(
          new CustomEvent('podplay:preferences-updated', { detail: userPrefs })
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [loading, user?.id]);

  useEffect(() => {
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail) applyPreferencesToDocument(detail);
    };
    window.addEventListener('podplay:preferences-updated', onUpdated);
    return () => window.removeEventListener('podplay:preferences-updated', onUpdated);
  }, []);

  return null;
}
