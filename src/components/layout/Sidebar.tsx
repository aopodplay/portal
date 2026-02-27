'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  ShoppingCart,
  FileText,
  User,
  Settings,
  CreditCard,
  Activity,
  Package,
  Glasses,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl, getAuthHeaders } from '@/config/api';

type Perfil = 'admin' | 'funcionario' | 'caixa' | 'optometrista';

export default function Sidebar() {
  const { user, loading } = useAuth();
  const perfil = user?.perfil as Perfil | undefined;

  const [config, setConfig] = useState<any>(null);
  const [imageVersion, setImageVersion] = useState<number>(Date.now());

  // usar useCallback para evitar recriação
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/configuracoes-sistema'), {
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      setConfig(data);

      // força atualização da imagem (quebra cache)
      setImageVersion(Date.now());

    } catch (err) {
      console.error('Erro ao carregar config:', err);
    }
  }, []);

  // carrega ao montar
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // escuta evento global
  useEffect(() => {
    const handleConfigUpdate = () => {
      fetchConfig();
    };

    window.addEventListener('configUpdated', handleConfigUpdate);

    return () => {
      window.removeEventListener('configUpdated', handleConfigUpdate);
    };
  }, [fetchConfig]);

  if (loading) return null;

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin','optometrista','caixa', 'recepcao'] },
    { label: 'Pacientes', href: '/dashboard/pacientes', icon: <Users size={20} />, roles: ['admin','caixa', 'recepcao'] },
    { label: 'Consultas', href: '/dashboard/consultas', icon: <Stethoscope size={20} />, roles: ['admin','optometrista'] },
    { label: 'Receitas', href: '/dashboard/receita', icon: <FileText size={20} />, roles: ['admin','optometrista'] },
    { label: 'Vendas', href: '/dashboard/vendas', icon: <ShoppingCart size={20} />, roles: ['admin','caixa'] },
    { label: 'Pagamentos', href: '/dashboard/pagamentos', icon: <CreditCard size={20} />, roles: ['admin','caixa'] },
    { label: 'Faturas', href: '/dashboard/faturas', icon: <FileText size={20} />, roles: ['admin','caixa'] },
    { label: 'Atendimentos', href: '/dashboard/atendimentos', icon: <Activity size={20} />, roles: ['admin','caixa','optometrista', 'recepcao'] },
    { label: 'Serviços', href: '/dashboard/servicos', icon: <Glasses size={20} />, roles: ['admin','caixa','recepcao'] },
    { label: 'Produtos', href: '/dashboard/produtos', icon: <Package size={20} />, roles: ['admin'] },
    { label: 'Usuários', href: '/dashboard/usuarios', icon: <User size={20} />, roles: ['admin'] },
    { label: 'Configurações', href: '/dashboard/settings', icon: <Settings size={20} />, roles: ['admin'] },
  ];

  const allowedMenu = menuItems.filter(
    (item) => perfil && item.roles.includes(perfil)
  );

  // adicionamos ?v=timestamp para quebrar cache
  const logoUrl =
    config?.logo
      ? `${getApiUrl(config.logo)}?v=${imageVersion}`
      : null;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 p-6">

      <div className="mb-8">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="h-14 object-contain mb-2"
          />
        ) : (
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {config?.nome_sistema || 'Sistema Óptica'}
          </h1>
        )}

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