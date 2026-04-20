'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  ShoppingCart,
  ClipboardList,
  FileText,
  User,
  Settings,
  CreditCard,
  Activity,
  Package,
  Glasses,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  HelpCircle,
  TrendingUp,
  CalendarCheck,
  Briefcase,
  FlaskConical,
  AlertCircle,
  ChevronDown,
  Receipt,
  Truck,
  FileCheck,
  FileWarning,
  Wallet,
  Calendar,
  DollarSign,
  FilePlus,        // Ícone para Fatura Pró-Forma
  FileSignature    // Ícone alternativo (opcional)
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl, getAuthHeaders } from '@/config/api';

type Perfil = 'admin' | 'recepcao' | 'caixa' | 'optometrista';

interface SubMenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Perfil[];
}

interface MenuGroup {
  label: string;
  icon: React.ReactNode;
  roles: Perfil[];
  subItems: SubMenuItem[];
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Perfil[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const perfil = user?.perfil as Perfil | undefined;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [imageVersion, setImageVersion] = useState<number>(Date.now());
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Foto do usuário
  const fotoUrl = user?.foto 
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/uploads/${user.foto}`
    : null;

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/configuracoes-sistema'), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setConfig(data);
      setImageVersion(Date.now());
    } catch (err) {
      console.error('Erro ao carregar config:', err);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    const handleConfigUpdate = () => {
      fetchConfig();
    };
    window.addEventListener('configUpdated', handleConfigUpdate);
    return () => {
      window.removeEventListener('configUpdated', handleConfigUpdate);
    };
  }, [fetchConfig]);

  // Fechar menu mobile ao redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileOpen]);

  // Impedir scroll do body quando menu mobile estiver aberto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    router.push('/login');
  };

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }));
  };

  // Função para verificar se o usuário tem permissão para um item
  const hasPermission = (roles: Perfil[]) => {
    if (!perfil) return false;
    return roles.includes(perfil);
  };

  // Menu items normais (sem submenu)
  const menuItems: MenuItem[] = [
    { 
      label: 'Dashboard', 
      href: '/dashboard', 
      icon: <LayoutDashboard size={20} />, 
      roles: ['admin', 'optometrista', 'caixa', 'recepcao'] 
    },
    { 
      label: 'Gestão Comercial', 
      href: '/dashboard/gestao-comercial', 
      icon: <ShoppingCart size={20} />, 
      roles: ['admin', 'optometrista', 'caixa', 'recepcao'] 
    },
    { 
      label: 'Parcelas',
      href: '/dashboard/parcelas', 
      icon: <Wallet size={20} />, 
      roles: ['admin', 'caixa']
    },
    { 
      label: 'Relatórios', 
      href: '/dashboard/relatorios', 
      icon: <TrendingUp size={20} />, 
      roles: ['admin'] 
    },
    { 
      label: 'Configurações', 
      href: '/dashboard/settings', 
      icon: <Settings size={20} />, 
      roles: ['admin'] 
    },
  ];

  // Menu groups (com submenus)
  const menuGroups: MenuGroup[] = [
    {
      label: 'Documentos',
      icon: <FileText size={20} />,
      roles: ['admin', 'optometrista', 'caixa'],
      subItems: [
        {
          label: 'Faturas',
          href: '/dashboard/faturas',
          icon: <Receipt size={18} />,
          roles: ['admin', 'caixa']
        },
        {
          label: 'Fatura Pró-Forma', 
          href: '/dashboard/fatura-proforma',
          icon: <FilePlus size={18} />, 
          roles: ['admin', 'caixa']  
        },
        {
          label: 'Nota de Entrega',
          href: '/dashboard/nota-entrega',
          icon: <Truck size={18} />,
          roles: ['admin', 'caixa']
        },
        {
          label: 'Recibo',
          href: '/dashboard/recibo',
          icon: <FileCheck size={18} />,
          roles: ['admin', 'caixa']
        },
        {
          label: 'Justificativos',
          href: '/dashboard/justificativos',
          icon: <FileWarning size={18} />,
          roles: ['admin', 'optometrista']
        }
      ]
    }
  ];

  // Filtrar menu items normais baseado no perfil
  const allowedMenu = menuItems.filter(
    (item) => perfil && item.roles.includes(perfil)
  );

  // Filtrar grupos baseado no perfil (se o grupo tem alguma role que o usuário tem)
  const allowedGroups = menuGroups.filter(
    (group) => perfil && group.roles.includes(perfil)
  );

  // Para cada grupo, filtrar os subItems baseado no perfil do usuário
  const filteredGroups = allowedGroups.map(group => ({
    ...group,
    subItems: group.subItems.filter(subItem => hasPermission(subItem.roles))
  })).filter(group => group.subItems.length > 0); // Remove grupos que ficaram sem subitens

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Verificar se algum subitem do grupo está ativo
  const isGroupActive = (group: MenuGroup) => {
    return group.subItems.some(subItem => pathname.startsWith(subItem.href));
  };

  const logoUrl = config?.logo ? `${getApiUrl(config.logo)}?v=${imageVersion}` : null;
  const empresaNome = config?.empresa_nome || config?.nome_sistema || 'Sistema Óptica';

  if (loading) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo e Nome da Empresa */}
      <div className="mb-8 px-2">
        {logoUrl ? (
          <div className="flex justify-center">
            <img
              src={logoUrl}
              alt="Logo"
              className={`object-contain transition-all duration-300 ${
                collapsed ? 'h-10 w-10 rounded-full' : 'h-14'
              }`}
            />
          </div>
        ) : (
          <div className={`text-center ${collapsed ? 'text-xs' : 'text-sm'}`}>
            <div className="w-12 h-12 mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Glasses className="text-white" size={24} />
            </div>
            {!collapsed && (
              <p className="font-bold text-gray-800 mt-2 text-sm">{empresaNome}</p>
            )}
          </div>
        )}
      </div>

      {/* Informações do Usuário com Dropdown */}
      {!collapsed && user && (
        <div className="relative mb-6">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="w-full p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={user.nome}
                  className="w-10 h-10 rounded-full object-cover border-2 border-indigo-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {user.nome?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-800 text-sm truncate">{user.nome}</p>
                <p className="text-xs text-gray-500 capitalize">{user.perfil}</p>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </button>

          {/* Dropdown Menu */}
          {showUserDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserDropdown(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <User size={16} className="text-gray-400" />
                  <span>Meu Perfil</span>
                </Link>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t"
                >
                  <LogOut size={16} />
                  <span>Sair</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Versão colapsada - apenas avatar */}
      {collapsed && user && (
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg hover:opacity-80 transition-opacity"
            title={user.nome}
          >
            {user.nome?.charAt(0).toUpperCase()}
          </button>
        </div>
      )}

      {/* Menu de Navegação */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {/* Menu items normais */}
        {allowedMenu.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                active
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <span className={active ? 'text-white' : 'text-gray-500 group-hover:text-indigo-600'}>
                {item.icon}
              </span>
              {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
            </Link>
          );
        })}

        {/* Menu groups com submenus - já filtrados por perfil */}
        {filteredGroups.map((group) => {
          const groupActive = isGroupActive(group);
          const isOpen = openGroups[group.label] || groupActive;
          
          return (
            <div key={group.label} className="space-y-1">
              {/* Botão do grupo */}
              <button
                onClick={() => !collapsed && toggleGroup(group.label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  groupActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? group.label : ''}
              >
                <span className={groupActive ? 'text-white' : 'text-gray-500 group-hover:text-indigo-600'}>
                  {group.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left font-medium text-sm">{group.label}</span>
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </>
                )}
              </button>

              {/* Submenus - apenas os que o usuário tem permissão */}
              {!collapsed && isOpen && (
                <div className="ml-6 space-y-1 border-l-2 border-gray-100 pl-2">
                  {group.subItems.map((subItem) => {
                    const active = pathname === subItem.href;
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                          active
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
                        }`}
                      >
                        <span className={active ? 'text-indigo-600' : 'text-gray-400'}>
                          {subItem.icon}
                        </span>
                        <span className="text-sm">{subItem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer com Botões */}
      <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
        {/* Botão de Ajuda */}
        <button
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors group ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Ajuda' : ''}
          onClick={() => window.open('/help', '_blank')}
        >
          <HelpCircle size={20} className="group-hover:text-indigo-600" />
          {!collapsed && <span className="text-sm">Ajuda</span>}
        </button>

        {/* Botão de Colapsar (Desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-xs">Recolher menu</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Botão do Menu Mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md text-gray-600 hover:text-indigo-600 transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarContent />
        </div>
      </aside>

      {/* Sidebar Mobile */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-transform duration-300 transform lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } w-72`}
      >
        <div className="flex flex-col h-full">
          {/* Header Mobile */}
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Glasses className="text-white" size={16} />
                </div>
              )}
              <span className="font-bold text-gray-800">{empresaNome}</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Conteúdo Mobile */}
          <div className="flex-1 overflow-y-auto p-4">
            <SidebarContent />
          </div>
        </div>
      </aside>

      {/* Modal de Confirmação de Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut className="text-red-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Confirmar Saída</h2>
                <p className="text-sm text-gray-500">Tem certeza que deseja sair do sistema?</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Você será redirecionado para a página de login e precisará inserir suas credenciais novamente para acessar o sistema.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sim, Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Espaçamento para o conteúdo principal */}
      <div className={`hidden lg:block transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`} />
    </>
  );
}