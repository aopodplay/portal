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
  socket: any;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, socket } = useAuth();
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar notificações iniciais
  const fetchNotifications = useCallback(async () => {
    // Verificar se tem token válido
    const token = localStorage.getItem('token') || Cookies.get('token');
    
    if (!user?.id || !token) {
      console.log('Usuário não autenticado ou token não encontrado, pulando busca de notificações');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Buscando notificações para usuário:', user.id);
      
      const headers = getAuthHeaders();
      
      // Verificar se o token está presente nos headers (sem acessar propriedade diretamente)
      const hasToken = token ? true : false;
      if (!hasToken) {
        console.warn('Token não encontrado');
        setLoading(false);
        return;
      }
      
      const res = await fetch(getApiUrl('/notificacoes/minhas'), {
        headers: headers
      });
      
      // Se for erro 401 (não autorizado), limpar token e recarregar página
      if (res.status === 401) {
        console.error('Token inválido ou expirado');
        localStorage.removeItem('token');
        Cookies.remove('token');
        localStorage.removeItem('user');
        setError('Sessão expirada. Faça login novamente.');
        setNotifications([]);
        setLoading(false);
        
        // Opcional: redirecionar para login após 2 segundos
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
      console.log('Notificações recebidas:', data);
      
      // Garantir que data é um array
      const notificationsArray = Array.isArray(data) ? data : [];
      setNotifications(notificationsArray);
    } catch (err: any) {
      console.error('Erro detalhado ao buscar notificações:', err);
      // Não mostrar erro para o usuário se for apenas falha de conexão
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

  // Socket tempo real
  useEffect(() => {
    if (!socket) {
      console.log('Socket não disponível, aguardando conexão...');
      return;
    }

    console.log('Configurando listeners de socket para notificações');

    const handleNovaNotificacao = (nova: Notificacao) => {
      console.log('Nova notificação recebida via socket:', nova);
      setNotifications(prev => {
        const exists = prev.some(n => n.id === nova.id);
        if (exists) return prev;
        return [nova, ...prev];
      });
    };

    const handleNotificacaoAtualizada = (notif: Notificacao) => {
      console.log('Notificação atualizada via socket:', notif);
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? notif : n)
      );
    };

    const handleNotificacaoRemovida = ({ id }: { id: number }) => {
      console.log('Notificação removida via socket:', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Registrar listeners
    socket.on('nova_notificacao', handleNovaNotificacao);
    socket.on('notificacao_atualizada', handleNotificacaoAtualizada);
    socket.on('notificacao_removida', handleNotificacaoRemovida);

    return () => {
      console.log('Removendo listeners de socket');
      socket.off('nova_notificacao', handleNovaNotificacao);
      socket.off('notificacao_atualizada', handleNotificacaoAtualizada);
      socket.off('notificacao_removida', handleNotificacaoRemovida);
    };
  }, [socket]);

  // Marcar como lida
  const markAsRead = async (id: number) => {
    const token = localStorage.getItem('token') || Cookies.get('token');
    
    if (!user?.id && !token) {
      console.warn('Tentativa de marcar notificação como lida sem token');
      return;
    }

    // Atualiza imediatamente no frontend (otimista)
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, lida: true } : n))
    );

    try {
      console.log(`Marcando notificação ${id} como lida`);
      
      const res = await fetch(getApiUrl(`/notificacoes/${id}/lida`), {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      // Se token expirou, não tentar novamente
      if (res.status === 401) {
        console.warn('Token expirado ao marcar notificação');
        return;
      }
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao marcar como lida');
      }
      
      const data = await res.json();
      console.log('Resposta do servidor:', data);
      
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
      // Se der erro, desfaz a atualização local
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, lida: false } : n))
      );
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    const token = localStorage.getItem('token') || Cookies.get('token');
    
    if (!user?.id && !token) return;

    const previousNotifications = [...notifications];
    
    // Atualiza localmente otimisticamente
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })));

    try {
      console.log('Marcando todas notificações como lidas');
      
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
      
      const data = await res.json();
      console.log('Resposta do servidor:', data);
      
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
      // Reverte a atualização local em caso de erro
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
        socket 
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