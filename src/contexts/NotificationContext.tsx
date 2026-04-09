'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  socket: any;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, socket } = useAuth();
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Buscar notificações iniciais
  const fetchNotifications = async () => {
    if (!user?.token) return;

    try {
      const res = await fetch(getApiUrl('/notificacoes/minhas'), {
        headers: getAuthHeaders()
      });
      
      if (!res.ok) throw new Error('Erro ao buscar notificações');
      
      const data = await res.json();
      setNotifications(data);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar notificações', err);
      setError('Erro ao carregar notificações.');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Socket tempo real
  useEffect(() => {
    if (!socket) return;

    const handleNovaNotificacao = (nova: Notificacao) => {
      console.log('Nova notificação recebida:', nova);
      setNotifications(prev => {
        const exists = prev.some(n => n.id === nova.id);
        if (exists) return prev;
        return [nova, ...prev];
      });
    };

    const handleNotificacaoRemovida = ({ id }: { id: number }) => {
      console.log('Notificação removida:', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    };

    socket.on('nova_notificacao', handleNovaNotificacao);
    socket.on('notificacao_removida', handleNotificacaoRemovida);

    return () => {
      socket.off('nova_notificacao', handleNovaNotificacao);
      socket.off('notificacao_removida', handleNotificacaoRemovida);
    };
  }, [socket]);

  // Marcar como lida
  const markAsRead = async (id: number) => {
    // Atualiza imediatamente no frontend
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, lida: true } : n))
    );

    if (!user?.token) return;

    try {
      const res = await fetch(getApiUrl(`/notificacoes/${id}/lida`), {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (!res.ok) throw new Error('Erro ao marcar como lida');
      
      // A notificação será removida pelo backend após 1 minuto
    } catch (err) {
      console.error('Erro ao marcar como lida', err);
      // Se der erro, desfaz a atualização local
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, lida: false } : n))
      );
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    if (!user?.token) return;

    try {
      const res = await fetch(getApiUrl('/notificacoes/marcar-todas-lidas'), {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (!res.ok) throw new Error('Erro ao marcar todas como lidas');
      
      // Atualiza localmente
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      
    } catch (err) {
      console.error('Erro ao marcar todas como lidas', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, error, socket }}
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