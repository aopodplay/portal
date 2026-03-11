'use client';

import { Bell, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, error } = useNotifications();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (id:number)=>{ markAsRead(id); setShowNotifications(false); }
  const formatDate=(dateString:string)=>{ const date=new Date(dateString); return isNaN(date.getTime())?'':date.toLocaleString('pt-BR'); }

  const fotoUrl = user?.foto ? `${process.env.NEXT_PUBLIC_API_URL || 'https://opticaapi-production.up.railway.app'}/uploads/${user.foto}` : null;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
            <input type="search" placeholder="Pesquisar..." className="pl-10 pr-4 py-2 rounded-lg bg-gray-50 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"/>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative" ref={notificationRef}>
            <button onClick={()=>setShowNotifications(prev=>!prev)} className="relative p-2 hover:bg-gray-50 rounded-lg transition">
              <Bell size={20} className="text-gray-600"/>
              {unreadCount>0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>)}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b font-semibold text-gray-700">Notificações</div>
                {error && (<div className="p-4 text-sm text-red-600 bg-red-50 border-b">{error}</div>)}
                {!error && notifications.length===0 && (<div className="p-4 text-sm text-gray-500">Nenhuma notificação</div>)}
                {notifications.map(n=>(
                  <div key={`${n.id}-${n.createdAt}`} onClick={()=>handleNotificationClick(n.id)} className={`p-4 border-b text-sm cursor-pointer hover:bg-gray-50 transition ${!n.lida?'bg-blue-50':''}`}>
                    <p className="font-medium text-gray-800">{n.titulo}</p>
                    <p className="text-gray-600">{n.mensagem}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button onClick={()=>setShowDropdown(prev=>!prev)} className="flex items-center gap-3 border-l pl-6 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {fotoUrl ? (<img src={fotoUrl} alt="Foto do usuário" className="w-full h-full object-cover"/>) : user?.nome ? (<span className="font-medium">{user.nome.charAt(0).toUpperCase()}</span>) : (<User size={20}/>)}
              </div>
              <div className="text-sm text-left">
                <p className="font-medium text-gray-700">{user?.nome || 'Usuário'}</p>
                <p className="text-gray-500">{user?.perfil || 'Usuário'}</p>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-100 z-50">
                <Link href="/dashboard/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={()=>setShowDropdown(false)}>
                  <User size={16}/> Meu Perfil
                </Link>
                <button onClick={()=>{setShowDropdown(false); logout();}} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full">
                  <LogOut size={16}/> Sair
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}