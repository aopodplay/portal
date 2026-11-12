'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import Cookies from 'js-cookie';
import { getApiUrl, getAuthHeaders } from '@/config/api';
import { useAuth } from './AuthContext';

interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  lida: boolean;
  createdAt: string;
  perfil: string;
}

interface NotificationContextData {
  notifications: Notificacao[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  error: string | null;
  loading: boolean;
  socket: any; // mantido para compatibilidade
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // 👈 removido `socket` daqui
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar notificações iniciais
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('podplay_token') || Cookies.get('podplay_token');
    
    if (!user?.id || !token) {
      console.log('Usuário não autenticado ou token não encontrado, pulando busca de notificações');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Buscando notificações para usuário:', user.id);
      
      const res = await fetch(getApiUrl('/notificacoes/minhas'), {
        headers: getAuthHeaders()
      });
      
      if (res.status === 401) {
        console.error('Token inválido ou expirado');
        localStorage.removeItem('podplay_token');
        Cookies.remove('podplay_token');
        localStorage.removeItem('podplay_user');
        setError('Sessão expirada. Faça login novamente.');
        setNotifications([]);
        setLoading(false);
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${res.status}: Falha ao buscar notificações`);
      }
      
      const data = await res.json();
      const notificationsArray = Array.isArray(data) ? data : [];
      setNotifications(notificationsArray);
    } catch (err: any) {
      console.error('Erro detalhado ao buscar notificações:', err);
      if (!err.message?.includes('Failed to fetch')) {
        setError(err.message || 'Erro ao carregar notificações.');
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Marcar como lida
  const markAsRead = async (id: number) => {
    const token = localStorage.getItem('podplay_token') || Cookies.get('podplay_token');
    
    if (!user?.id && !token) {
      console.warn('Tentativa de marcar notificação como lida sem token');
      return;
    }

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, lida: true } : n))
    );

    try {
      const res = await fetch(getApiUrl(`/notificacoes/${id}/lida`), {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (res.status === 401) {
        console.warn('Token expirado ao marcar notificação');
        return;
      }
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao marcar como lida');
      }
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, lida: false } : n))
      );
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    const token = localStorage.getItem('podplay_token') || Cookies.get('podplay_token');
    
    if (!user?.id && !token) return;

    const previousNotifications = [...notifications];
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })));

    try {
      const res = await fetch(getApiUrl('/notificacoes/marcar-todas-lidas'), {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (res.status === 401) {
        console.warn('Token expirado ao marcar todas notificações');
        return;
      }
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao marcar todas como lidas');
      }
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
      setNotifications(previousNotifications);
    }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  return (
    <NotificationContext.Provider
      value={{ 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        error, 
        loading,
        socket: null // 👈 socket desativado por agora
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};