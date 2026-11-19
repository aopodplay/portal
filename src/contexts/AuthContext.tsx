// src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';
import { API_ENDPOINTS, fetchWithAuth, getApiUrl, refreshSessionToken } from '@/config/api';

function getTokenExpirationMs(token: string | null | undefined): number | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export type Perfil = 'admin' | 'recepcao' | 'caixa' | 'optometrista';

export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  fullName?: string;
  nome?: string;      
  perfil?: Perfil;     
  foto?: string | null; 
  role?: string;       
  churchId?: number;
  avatarUrl?: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ user: User; accessToken: string; refreshToken: string }>;
  register: (data: RegisterData) => Promise<any>;
  verifyAccount: (identifier: string, code: string) => Promise<any>;
  resendVerificationCode: (identifier: string) => Promise<any>;
  forgotPassword: (identifier: string) => Promise<any>;
  resetPassword: (identifier: string, code: string, newPassword: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  updateUser: (userData: Partial<User>) => void;
}

interface RegisterData {
  username: string;
  email?: string;
  phone?: string;
  password: string;
  fullName?: string;
  churchId?: string;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUserData = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    Cookies.remove('podplay_token', { path: '/' });
    Cookies.remove('podplay_refresh_token', { path: '/' });
    localStorage.removeItem('podplay_token');
    localStorage.removeItem('podplay_refresh_token');
    localStorage.removeItem('podplay_user');
    setUser(null);
  }, []);

  const syncUserProfile = useCallback(async () => {
    try {
      const response = await fetchWithAuth(API_ENDPOINTS.PROFILE);
      if (!response.ok) return;
      const result = await response.json();
      if (result?.success && result?.data) {
        const profileData = result.data;
        setUser((prev) => {
          if (!prev) return prev;
          const merged: User = {
            ...prev,
            username: profileData.username || prev.username,
            email: profileData.email ?? prev.email,
            phone: profileData.phone ?? prev.phone,
            fullName: profileData.full_name ?? prev.fullName,
            avatarUrl: profileData.avatar_url ?? prev.avatarUrl,
            foto: profileData.avatar_url ?? prev.foto,
          };
          localStorage.setItem('podplay_user', JSON.stringify(merged));
          return merged;
        });
      }
    } catch {
      // Silencioso: mantém dados em cache se offline
    }
  }, []);

  const scheduleProactiveRefresh = useCallback((token: string | null) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    const expMs = getTokenExpirationMs(token);
    if (!expMs) return;

    // Renovar 60 segundos antes de expirar (mínimo 5s)
    const delayMs = Math.max(expMs - Date.now() - 60_000, 5_000);
    refreshTimerRef.current = setTimeout(async () => {
      const newToken = await refreshSessionToken();
      if (newToken) {
        scheduleProactiveRefresh(newToken);
      }
    }, delayMs);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      let token = Cookies.get('podplay_token') || localStorage.getItem('podplay_token');
      const refreshToken = Cookies.get('podplay_refresh_token') || localStorage.getItem('podplay_refresh_token');
      const storedUser = localStorage.getItem('podplay_user');

      if (storedUser && (token || refreshToken)) {
        try {
          const parsedUser: User = JSON.parse(storedUser);
          setUser(parsedUser);

          // Se o token está ausente, expirado ou a menos de 2 min de expirar, renova já
          const expMs = getTokenExpirationMs(token);
          if (!token || (expMs && expMs - Date.now() < 120_000)) {
            const renewed = await refreshSessionToken();
            if (renewed) {
              token = renewed;
            }
          }

          if (token) {
            scheduleProactiveRefresh(token);
            syncUserProfile();
          }
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
          clearUserData();
        }
      }
      setLoading(false);
    };

    loadUser();

    const handleTokenRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent<{ accessToken: string }>;
      if (customEvent.detail?.accessToken) {
        scheduleProactiveRefresh(customEvent.detail.accessToken);
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      const token = localStorage.getItem('podplay_token') || Cookies.get('podplay_token');
      const expMs = getTokenExpirationMs(token);
      if (token && expMs && expMs - Date.now() < 120_000) {
        const renewed = await refreshSessionToken();
        if (renewed) {
          scheduleProactiveRefresh(renewed);
        }
      }
    };

    window.addEventListener('podplay:token-refreshed', handleTokenRefreshed);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      window.removeEventListener('podplay:token-refreshed', handleTokenRefreshed);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearUserData, scheduleProactiveRefresh, syncUserProfile]);

  const login = async (identifier: string, password: string) => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.LOGIN), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro no login');
    }

    const { user: userData, accessToken, refreshToken } = result.data;

    Cookies.set('podplay_token', accessToken, { expires: 7, path: '/' });
    Cookies.set('podplay_refresh_token', refreshToken, { expires: 7, path: '/' });
    localStorage.setItem('podplay_token', accessToken);
    localStorage.setItem('podplay_refresh_token', refreshToken);
    localStorage.setItem('podplay_user', JSON.stringify(userData));

    setUser(userData);
    scheduleProactiveRefresh(accessToken);
    syncUserProfile();

    return { user: userData, accessToken, refreshToken };
  };

  const register = async (data: RegisterData) => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.REGISTER), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Erro no registro');
    return result.data;
  };

  const verifyAccount = async (identifier: string, code: string) => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.VERIFY_ACCOUNT), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Erro na verificação');
    return result.data;
  };

  const resendVerificationCode = async (identifier: string) => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.RESEND_CODE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Erro ao reenviar código');
    return result.data;
  };

  const forgotPassword = async (identifier: string) => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.FORGOT_PASSWORD), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Erro ao solicitar recuperação');
    return result.data;
  };

  const resetPassword = async (identifier: string, code: string, newPassword: string) => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.RESET_PASSWORD), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code, newPassword }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Erro ao redefinir senha');
    return result.data;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('podplay_refresh_token');
      const token = Cookies.get('podplay_token') || localStorage.getItem('podplay_token');
      
      if (refreshToken && token) {
        await fetch(getApiUrl(API_ENDPOINTS.LOGOUT), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      clearUserData();
      window.location.replace('/');
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    const newAccessToken = await refreshSessionToken();
    if (newAccessToken) {
      scheduleProactiveRefresh(newAccessToken);
      return newAccessToken;
    }
    return null;
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...userData };
      localStorage.setItem('podplay_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyAccount,
        resendVerificationCode,
        forgotPassword,
        resetPassword,
        logout,
        refreshAccessToken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);