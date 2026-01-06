'use client';

import { Bell, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="search"
              placeholder="Pesquisar..."
              className="pl-10 pr-4 py-2 rounded-lg bg-gray-50 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
            />
          </div>
        </div>

        {/* Notificações e Usuário */}
        <div className="flex items-center gap-6">
          {/* Notificação */}
          <button className="relative p-2 hover:bg-gray-50 rounded-lg">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Usuário */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 border-l pl-6 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white">
                {user?.nome ? (
                  <span className="font-medium">{user.nome.charAt(0).toUpperCase()}</span>
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-700">{user?.nome || 'Usuário'}</p>
                <p className="text-gray-500">{user?.perfil || 'Usuário'}</p>
              </div>
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-100 z-50">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowDropdown(false)}
                >
                  <User size={16} />
                  Meu Perfil
                </Link>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
