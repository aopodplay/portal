'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  lida: boolean;
  createdAt: string;
}

interface NotificationContextData {
  notifications: Notificacao[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  error: string | null;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, socket } = useAuth();
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Buscar notificações iniciais
  useEffect(() => {
    if (!user?.token) return;

    const carregarNotificacoes = async () => {
      try {
        const response = await axios.get('https://opticaapi-production.up.railway.app/notificacoes/minhas', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setNotifications(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Erro ao buscar notificações', err);
        setError('Erro ao carregar notificações.');
      }
    };

    carregarNotificacoes();
  }, [user]);

  // Socket tempo real
  useEffect(() => {
    if (!socket) return;

    const handleNovaNotificacao = (nova: Notificacao) => {
      setNotifications(prev => {
        const exists = prev.some(n => n.id === nova.id && n.createdAt === nova.createdAt);
        if (exists) return prev;
        return [nova, ...prev];
      });
    };

    socket.on('nova_notificacao', handleNovaNotificacao);

    return () => {
      socket.off('nova_notificacao', handleNovaNotificacao);
    };
  }, [socket]);

  //  Marcar como lida (agora também atualiza imediatamente no frontend)
  const markAsRead = async (id: number) => {
    // Atualiza imediatamente no frontend
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, lida: true } : n))
    );

    if (!user?.token) return;

    try {
      await axios.put(
        `https://opticaapi-production.up.railway.app/notificacoes/${id}/lida`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      // O backend confirma, mas o frontend já foi atualizado
    } catch (err) {
      console.error('Erro ao marcar como lida', err);
      // Se der erro, desfaz a atualização local
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, lida: false } : n))
      );
    }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, error }}
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