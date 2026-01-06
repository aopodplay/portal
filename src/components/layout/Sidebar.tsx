'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  ShoppingCart,
  FileText,
  User,
  Calendar,
  MessageSquare,
  Settings,
  CreditCard, // para Pagamentos
  Package,    // para Produtos
  FileText as ReceitaIcon, // para Receita (reaproveitando FileText)
} from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Pacientes', href: '/dashboard/pacientes', icon: <Users size={20} /> },
    { label: 'Atendimentos', href: '/dashboard/atendimentos', icon: <Stethoscope size={20} /> }, //
    { label: 'Consultas', href: '/dashboard/consultas', icon: <Stethoscope size={20} /> },
    { label: 'Vendas', href: '/dashboard/vendas', icon: <ShoppingCart size={20} /> },
    { label: 'Faturas', href: '/dashboard/faturas', icon: <FileText size={20} /> },
    { label: 'Usuários', href: '/dashboard/usuarios', icon: <User size={20} /> },
    { label: 'Pagamentos', href: '/dashboard/pagamentos', icon: <CreditCard size={20} /> },
    { label: 'Produtos', href: '/dashboard/produtos', icon: <Package size={20} /> },
    { label: 'Receita', href: '/dashboard/receita', icon: <ReceitaIcon size={20} /> },
    { label: 'Agenda', href: '/dashboard/calendar', icon: <Calendar size={20} /> },
    { label: 'Mensagens', href: '/dashboard/messages', icon: <MessageSquare size={20} /> },
    { label: 'Configurações', href: '/dashboard/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 p-6">
      {/* Logo / Título */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Prestígio Óptica
        </h1>
      </div>

      {/* Menu */}
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-blue-600 transition-colors"
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
