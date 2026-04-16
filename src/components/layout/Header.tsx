'use client';

import { Bell, Search, User, LogOut, Settings, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, error, socket } = useNotifications();
  const pathname = usePathname();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && showMobileMenu) {
        setShowMobileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileMenu]);

  useEffect(() => {
    if (!socket) return;

    const handleNovaNotificacao = (notificacao: any) => {
      console.log('Header - Nova notificação:', notificacao);
    };

    const handleNotificacaoRemovida = ({ id }: { id: number }) => {
      console.log('Header - Notificação removida:', id);
    };

    socket.on('nova_notificacao', handleNovaNotificacao);
    socket.on('notificacao_removida', handleNotificacaoRemovida);

    return () => {
      socket.off('nova_notificacao', handleNovaNotificacao);
      socket.off('notificacao_removida', handleNotificacaoRemovida);
    };
  }, [socket]);

  const handleNotificationClick = async (id: number) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toLocaleString('pt-BR');
  };

  const fotoUrl = user?.foto 
    ? `${process.env.NEXT_PUBLIC_API_URL || 'https://api.apisemsaida.co.ao'}/uploads/${user.foto}`
    : null;

  const getPageTitle = () => {
    const path = pathname.split('/').pop();
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard',
      'gestao-comercial': 'Gestão Comercial',
      'faturas': 'Faturas',
      'relatorios': 'Relatórios',
      'settings': 'Configurações',
      'profile': 'Meu Perfil',
      'usuarios': 'Usuários',
      'consultas': 'Consultas',
      'pagamentos': 'Pagamentos'
    };
    return titles[path || 'dashboard'] || 'Dashboard';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Pesquisando:', searchQuery);
      alert(`Pesquisando por: ${searchQuery}`);
    }
  };

  const isAdmin = user?.perfil === 'admin';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Menu"
              >
                {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
              </button>

              <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
                {getPageTitle()}
              </h1>

              <form onSubmit={handleSearch} className="hidden md:flex items-center relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="search"
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder:text-gray-400 transition-all"
                />
              </form>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                  aria-label="Notificações"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-[500px] overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800">Notificações</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {error && (
                        <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
                          {error}
                        </div>
                      )}
                      {!error && notifications.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                          <Bell size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma notificação</p>
                        </div>
                      )}
                      {notifications.map((n) => (
                        <div
                          key={`${n.id}-${n.createdAt}`}
                          onClick={() => handleNotificationClick(n.id)}
                          className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${
                            !n.lida 
                              ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                              : 'bg-white'
                          }`}
                        >
                          <p className="font-medium text-gray-800 text-sm">{n.titulo}</p>
                          <p className="text-gray-600 text-xs mt-1">{n.mensagem}</p>
                          <p className="text-xs text-gray-400 mt-2">{formatDate(n.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200 hover:opacity-80 transition-opacity"
                  aria-label="Menu do usuário"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt="Foto do usuário" className="w-full h-full object-cover" />
                    ) : user?.nome ? (
                      <span className="font-medium text-sm sm:text-base">{user.nome.charAt(0).toUpperCase()}</span>
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="font-medium text-gray-700 text-sm">{user?.nome || 'Usuário'}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.perfil || 'Usuário'}</p>
                  </div>
                  {/* <ChevronDown size={16} className="hidden sm:block text-gray-400" /> */}
                </button>

                {/* {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-1 border border-gray-100 z-50 overflow-hidden">
                    <div className="sm:hidden px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-800">{user?.nome || 'Usuário'}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.perfil || 'Usuário'}</p>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      <User size={16} className="text-gray-400" />
                      <span>Meu Perfil</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Settings size={16} className="text-gray-400" />
                        <span>Configurações</span>
                      </Link>
                    )}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        logout();
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sair</span>
                    </button>
                  </div>
                )} */}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </form>
      </header>

      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setShowMobileMenu(false)} />
      )}

      <div
        ref={mobileMenuRef}
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
          showMobileMenu ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {user?.nome?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium text-gray-800">{user?.nome || 'Usuário'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.perfil || 'Usuário'}</p>
            </div>
          </div>
        </div>
        <nav className="p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setShowMobileMenu(false)}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/dashboard/gestao-comercial"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setShowMobileMenu(false)}
          >
            <ShoppingCart size={18} />
            <span>Gestão Comercial</span>
          </Link>
          <Link
            href="/dashboard/faturas"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setShowMobileMenu(false)}
          >
            <FileText size={18} />
            <span>Faturas</span>
          </Link>
          {isAdmin && (
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setShowMobileMenu(false)}
            >
              <Settings size={18} />
              <span>Configurações</span>
            </Link>
          )}
          <div className="border-t border-gray-200 my-3 pt-3">
            <button
              onClick={() => {
                setShowMobileMenu(false);
                logout();
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}

import { LayoutDashboard, ShoppingCart, FileText } from 'lucide-react';