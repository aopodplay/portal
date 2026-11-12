// src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import Cookies from 'js-cookie';
import { API_ENDPOINTS, getApiUrl } from '@/config/api';

export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  fullName?: string;
  role: 'admin' | 'user' | 'creator' | 'moderator';
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

  // Limpar dados do usuário
  const clearUserData = useCallback(() => {
    Cookies.remove('podplay_token', { path: '/' });
    Cookies.remove('podplay_refresh_token', { path: '/' });
    localStorage.removeItem('podplay_token');
    localStorage.removeItem('podplay_refresh_token');
    localStorage.removeItem('podplay_user');
    setUser(null);
  }, []);

  // Carregar usuário do localStorage
  useEffect(() => {
    const loadUser = () => {
      const token = Cookies.get('podplay_token') || localStorage.getItem('podplay_token');
      const storedUser = localStorage.getItem('podplay_user');

      if (token && storedUser) {
        try {
          const parsedUser: User = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
          clearUserData();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [clearUserData]);

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

    // Salvar tokens
    Cookies.set('podplay_token', accessToken, { expires: 7, path: '/' });
    Cookies.set('podplay_refresh_token', refreshToken, { expires: 7, path: '/' });
    localStorage.setItem('podplay_token', accessToken);
    localStorage.setItem('podplay_refresh_token', refreshToken);
    localStorage.setItem('podplay_user', JSON.stringify(userData));

    setUser(userData);

    return { user: userData, accessToken, refreshToken };
  };

  const register = async (data: RegisterData) => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.REGISTER), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro no registro');
    }

    return result.data;
  };

  const verifyAccount = async (identifier: string, code: string) => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.VERIFY_ACCOUNT), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro na verificação');
    }

    return result.data;
  };

  const resendVerificationCode = async (identifier: string) => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.RESEND_CODE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao reenviar código');
    }

    return result.data;
  };

  const forgotPassword = async (identifier: string) => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.FORGOT_PASSWORD), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao solicitar recuperação');
    }

    return result.data;
  };

  const resetPassword = async (identifier: string, code: string, newPassword: string) => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.RESET_PASSWORD), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code, newPassword }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao redefinir senha');
    }

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
      window.location.replace('/login');
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('podplay_refresh_token');
    if (!refreshToken) return null;

    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.REFRESH_TOKEN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error('Refresh token inválido');
      }

      const { accessToken, refreshToken: newRefreshToken } = result.data;

      Cookies.set('podplay_token', accessToken, { expires: 7, path: '/' });
      Cookies.set('podplay_refresh_token', newRefreshToken, { expires: 7, path: '/' });
      localStorage.setItem('podplay_token', accessToken);
      localStorage.setItem('podplay_refresh_token', newRefreshToken);

      return accessToken;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      await logout();
      return null;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('podplay_user', JSON.stringify(updatedUser));
    }
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