// src/components/Header.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Heart,
  Clock,
  Headphones,
  X,
} from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'new_episode' | 'reminder';
  read: boolean;
  createdAt: string;
  link?: string;
}

export default function Header() {
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Novo episódio disponível',
      message: '"40 Dias de Oração - Episódio 25" já está disponível',
      type: 'new_episode',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/series/40-dias-de-oracao/25',
    },
    {
      id: 2,
      title: 'Lembrete de transmissão ao vivo',
      message: 'Transmissão ao vivo em 30 minutos: Culto de Domingo',
      type: 'reminder',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/live',
    },
    {
      id: 3,
      title: 'Bem-vindo à PodFélay!',
      message: 'Explore milhares de conteúdos cristãos',
      type: 'success',
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    setShowNotifications(false);
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_episode':
        return <Headphones size={16} className="text-purple-500" />;
      case 'reminder':
        return <Clock size={16} className="text-blue-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours} h atrás`;
    return `${diffDays} d atrás`;
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const userInitial = user?.username?.charAt(0) || user?.username?.charAt(0) || 'U';

  return (
    <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo e Saudação */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Headphones size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white hidden sm:block">PodFéPlay</h1>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-sm text-gray-300">
              Olá, <span className="text-white font-medium">{user?.username?.split(' ')[0] || user?.username || 'Visitante'}</span>
            </h2>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div className="hidden md:flex items-center relative max-w-md w-full mx-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            placeholder="O que você quer ouvir hoje?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400 transition-all"
          />
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {/* Botão de Pesquisa Mobile */}
          <button className="md:hidden p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Search size={20} />
          </button>

          {/* Notificações */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Notificações"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown de Notificações */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-50 max-h-[500px] overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h3 className="font-semibold text-white">Notificações</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                      <Bell size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  )}
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${
                        !notification.read ? 'bg-purple-500/10 border-l-4 border-l-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm">{notification.title}</p>
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">{formatDate(notification.createdAt)}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Perfil do Usuário */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2"
              aria-label="Menu do usuário"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-medium">{userInitial}</span>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${
                  showUserDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown do Usuário */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden">
                <div className="p-3 border-b border-white/10">
                  <p className="text-white font-medium text-sm">{user?.username || user?.username}</p>
                  <p className="text-gray-400 text-xs">{user?.email || user?.phone}</p>
                  {user?.churchId && (
                    <p className="text-purple-400 text-xs mt-1">Igreja Vida Nova</p>
                  )}
                </div>
                <div className="py-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <User size={16} />
                    <span>Meu Perfil</span>
                  </Link>
                  <Link
                    href="/favorites"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <Heart size={16} />
                    <span>Meus Favoritos</span>
                  </Link>
                  <Link
                    href="/history"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <Clock size={16} />
                    <span>Histórico</span>
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'moderator') && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <Settings size={16} />
                      <span>Administração</span>
                    </Link>
                  )}
                  <div className="border-t border-white/10 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa Mobile Expandida */}
      {searchQuery && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="O que você quer ouvir hoje?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-full bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}