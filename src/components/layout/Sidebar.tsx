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
  CreditCard,
  Package,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

type Perfil = 'admin' | 'funcionario' | 'caixa';

export default function Sidebar() {
  const { user, loading } = useAuth();
  const perfil = user?.perfil as Perfil | undefined;

  if (loading) return null;

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={20} />,
      roles: ['admin', 'funcionario', 'caixa'],
    },
    {
      label: 'Pacientes',
      href: '/dashboard/pacientes',
      icon: <Users size={20} />,
      roles: ['admin', 'funcionario'],
    },
    {
      label: 'Atendimentos',
      href: '/dashboard/atendimentos',
      icon: <Stethoscope size={20} />,
      roles: ['admin', 'funcionario'],
    },
    {
      label: 'Consultas',
      href: '/dashboard/consultas',
      icon: <Stethoscope size={20} />,
      roles: ['admin', 'funcionario'],
    },
    {
      label: 'Receitas',
      href: '/dashboard/receita',
      icon: <FileText size={20} />,
      roles: ['admin', 'funcionario'], // só admin e funcionario podem acessar
    },
    {
      label: 'Vendas',
      href: '/dashboard/vendas',
      icon: <ShoppingCart size={20} />,
      roles: ['admin', 'caixa'],
    },
    {
      label: 'Faturas',
      href: '/dashboard/faturas',
      icon: <FileText size={20} />,
      roles: ['admin', 'caixa'],
    },
    {
      label: 'Pagamentos',
      href: '/dashboard/pagamentos',
      icon: <CreditCard size={20} />,
      roles: ['admin', 'caixa'],
    },
    {
      label: 'Produtos',
      href: '/dashboard/produtos',
      icon: <Package size={20} />,
      roles: ['admin'],
    },
    {
      label: 'Usuários',
      href: '/dashboard/usuarios',
      icon: <User size={20} />,
      roles: ['admin'],
    },
    {
      label: 'Configurações',
      href: '/dashboard/settings',
      icon: <Settings size={20} />,
      roles: ['admin'],
    },
  ];

  const allowedMenu = menuItems.filter(
    (item) => perfil && item.roles.includes(perfil)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Prestígio Óptica
        </h1>
        {user && (
          <p className="text-sm text-gray-500 mt-1">
            {user.nome} • {user.perfil}
          </p>
        )}
      </div>

      <nav className="space-y-1">
        {allowedMenu.map((item) => (
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
