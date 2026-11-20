'use client';

import { useEffect, useState } from 'react';

export type AppLanguage = 'pt' | 'en' | 'es';

export const MENU_TRANSLATIONS: Record<
  AppLanguage,
  {
    home: string;
    music: string;
    videos: string;
    trending: string;
    library: string;
    playlists: string;
    studio: string;
    support: string;
    reports: string;
    control: string;
    reviewPanel: string;
    supportPanel: string;
    exclusiveAdminAccess: string;
    searchPlaceholder: string;
    settingsProfile: string;
    favorites: string;
    history: string;
    logout: string;
    login: string;
    register: string;
  }
> = {
  pt: {
    home: 'Início',
    music: 'Músicas',
    videos: 'Vídeos',
    trending: 'Em Alta',
    library: 'Biblioteca',
    playlists: 'Playlists',
    studio: 'Estúdio',
    support: 'Suporte',
    reports: 'Denúncias',
    control: 'Controlo Geral',
    reviewPanel: 'Painel de Revisão',
    supportPanel: 'Painel de Suporte',
    exclusiveAdminAccess: 'Acesso Exclusivo: Painel Administrativo',
    searchPlaceholder: 'O que queres ouvir ou assistir?',
    settingsProfile: 'Definições & Perfil',
    favorites: 'Meus Favoritos',
    history: 'Histórico',
    logout: 'Terminar sessão',
    login: 'Entrar',
    register: 'Criar conta',
  },
  en: {
    home: 'Home',
    music: 'Music',
    videos: 'Videos',
    trending: 'Trending',
    library: 'Library',
    playlists: 'Playlists',
    studio: 'Studio',
    support: 'Support',
    reports: 'Reports',
    control: 'Platform Control',
    reviewPanel: 'Review Panel',
    supportPanel: 'Support Panel',
    exclusiveAdminAccess: 'Exclusive Access: Admin Panel',
    searchPlaceholder: 'What do you want to listen to or watch?',
    settingsProfile: 'Settings & Profile',
    favorites: 'My Favorites',
    history: 'History',
    logout: 'Sign out',
    login: 'Sign in',
    register: 'Create account',
  },
  es: {
    home: 'Inicio',
    music: 'Música',
    videos: 'Videos',
    trending: 'Tendencias',
    library: 'Biblioteca',
    playlists: 'Playlists',
    studio: 'Estudio',
    support: 'Soporte',
    reports: 'Denuncias',
    control: 'Control General',
    reviewPanel: 'Panel de Revisión',
    supportPanel: 'Panel de Soporte',
    exclusiveAdminAccess: 'Acceso Exclusivo: Panel Administrativo',
    searchPlaceholder: '¿Qué quieres escuchar o ver?',
    settingsProfile: 'Configuración y Perfil',
    favorites: 'Mis Favoritos',
    history: 'Historial',
    logout: 'Cerrar sesión',
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
  },
};

export interface ControleTranslation {
  badgeAdmin: string;
  badgeMod: string;
  badgeSupport: string;
  titleAdmin: string;
  titleSupport: string;
  subtitleAdmin: string;
  subtitleSupport: string;
  changePasswordBtn: string;
  defaultPwdBannerTitle: string;
  defaultPwdBannerDesc: string;
  redefinePwdBtn: string;
  restrictedTitle: string;
  restrictedDesc: string;
  backHome: string;
  tabs: {
    overview: string;
    users: string;
    staff: string;
    artistRequests: string;
    reports: string;
    pitches: string;
    support: string;
    music: string;
    videos: string;
    comments: string;
    events: string;
    catalog: string;
    series: string;
    notifications: string;
    payments: string;
    backups: string;
    logs: string;
    footer: string;
    branding: string;
  };
  kpi: {
    activeUsers: string;
    thisMonth: string;
    totalPlays: string;
    uniqueListeners: string;
    catalogMusic: string;
    publishedVideos: string;
    artistsAlbums: string;
    registeredAlbums: string;
    playsChartTitle: string;
    playsChartSub: string;
    days: string;
    teamUsersTitle: string;
    teamUsersSub: string;
    users: string;
    artists: string;
    support: string;
    moderators: string;
    admins: string;
  };
  usersTab: {
    searchCommunity: string;
    searchStaff: string;
    all: string;
    normalUsers: string;
    artists: string;
    support: string;
    moderators: string;
    admins: string;
    newStaffBtn: string;
    colUser: string;
    colMember: string;
    colContact: string;
    colRole: string;
    colRoleAccess: string;
    colStatus: string;
    colActions: string;
    emptyCommunity: string;
    emptyStaff: string;
    active: string;
    disabled: string;
    disable: string;
    enable: string;
    panelOnly: string;
    roleUser: string;
    roleCreator: string;
    roleChurchAdmin: string;
    roleSupport: string;
    roleModerator: string;
    roleAdmin: string;
  };
  staffModal: {
    title: string;
    fullName: string;
    username: string;
    email: string;
    pwdNotice: string;
    roleLabel: string;
    optSupport: string;
    optModerator: string;
    optAdmin: string;
    platformOnlyTitle: string;
    platformOnlyDesc: string;
    submit: string;
  };
  pwdModal: {
    title: string;
    currentPwd: string;
    newPwd: string;
    newPwdPlaceholder: string;
    confirmPwd: string;
    submit: string;
    errMin: string;
    errMismatch: string;
    success: string;
  };
  supportTab: {
    empty: string;
    resolveBtn: string;
    resolved: string;
  };
  reportsTab: {
    empty: string;
    resolveBtn: string;
  };
  commentsTab: {
    moderateBtn: string;
    searchPlaceholder: string;
    onlyFlagged: string;
    empty: string;
  };
}

export const CONTROLE_TRANSLATIONS: Record<AppLanguage, ControleTranslation> = {
  pt: {
    badgeAdmin: 'Controlo Geral PodPlay',
    badgeMod: 'Painel de Revisão PodPlay',
    badgeSupport: 'Equipa de Suporte PodPlay',
    titleAdmin: 'Gestão da Plataforma',
    titleSupport: 'Painel de Suporte',
    subtitleAdmin: 'Área exclusiva da equipa para controlar utilizadores, catálogo, vídeos e métricas do sistema.',
    subtitleSupport: 'Área de atendimento ao utilizador, gestão de denúncias e moderação de comentários.',
    changePasswordBtn: 'Alterar Palavra-passe',
    defaultPwdBannerTitle: 'Está a utilizar a palavra-passe padrão enviada por email',
    defaultPwdBannerDesc: 'Por segurança, recomendamos que redefina a sua palavra-passe para uma senha pessoal.',
    redefinePwdBtn: 'Redefinir Palavra-passe',
    restrictedTitle: 'Acesso Restrito',
    restrictedDesc: 'Esta área é exclusiva para administradores e equipa da plataforma PodPlay.',
    backHome: 'Voltar ao Início',
    tabs: {
      overview: 'Visão Geral',
      users: 'Utilizadores & Artistas',
      staff: 'Equipa & Admins',
      artistRequests: 'Artistas',
      reports: 'Denúncias',
      pitches: 'Pitching',
      support: 'Suporte',
      music: 'Músicas',
      videos: 'Vídeos',
      comments: 'Comentários',
      events: 'Eventos & Publicidades',
      catalog: 'Artistas & Álbuns',
      series: 'Séries',
      notifications: 'Notificar Todos',
      payments: 'GESTÃO DE PAGAMENTOS',
      backups: 'Backups',
      logs: 'Logs',
      footer: 'Rodapé',
      branding: 'Logo',
    },
    kpi: {
      activeUsers: 'Utilizadores Ativos',
      thisMonth: 'este mês',
      totalPlays: 'Reproduções Totais',
      uniqueListeners: 'ouvintes únicos',
      catalogMusic: 'Músicas no Catálogo',
      publishedVideos: 'vídeos publicados',
      artistsAlbums: 'Artistas & Álbuns',
      registeredAlbums: 'álbuns registados',
      playsChartTitle: 'Reproduções na Plataforma',
      playsChartSub: 'Evolução diária de streaming',
      days: 'dias',
      teamUsersTitle: 'Equipa & Utilizadores',
      teamUsersSub: 'Distribuição por tipo de conta',
      users: 'Utilizadores',
      artists: 'Artistas',
      support: 'Suporte',
      moderators: 'Revisores',
      admins: 'Admins',
    },
    usersTab: {
      searchCommunity: 'Pesquisar utilizador ou artista...',
      searchStaff: 'Pesquisar membro ou administrador...',
      all: 'Todos',
      normalUsers: 'Utilizadores',
      artists: 'Artistas',
      support: 'Suporte',
      moderators: 'Revisores',
      admins: 'Admins',
      newStaffBtn: 'Novo Membro de Gestão',
      colUser: 'Utilizador',
      colMember: 'Membro',
      colContact: 'Contacto',
      colRole: 'Perfil',
      colRoleAccess: 'Perfil / Acesso',
      colStatus: 'Estado',
      colActions: 'Ações',
      emptyCommunity: 'Nenhum utilizador ou artista encontrado.',
      emptyStaff: 'Nenhum membro da equipa encontrado.',
      active: 'Ativo',
      disabled: 'Desativado',
      disable: 'Desativar',
      enable: 'Ativar',
      panelOnly: 'Apenas Painel',
      roleUser: 'Utilizador',
      roleCreator: 'Artista / Criador',
      roleChurchAdmin: 'Admin Igreja',
      roleSupport: 'Equipa de Suporte',
      roleModerator: 'Revisor',
      roleAdmin: 'Administrador',
    },
    staffModal: {
      title: 'Novo Membro de Gestão',
      fullName: 'Nome completo',
      username: 'Username *',
      email: 'Email *',
      pwdNotice: 'Será gerada automaticamente uma palavra-passe padrão e enviada por email ao utilizador, que poderá redefini-la depois.',
      roleLabel: 'Função / Perfil *',
      optSupport: 'Suporte — atende pedidos de suporte, gere denúncias e modera comentários',
      optModerator: 'Revisor — revisa, aprova, bloqueia, remove conteúdos e publica eventos',
      optAdmin: 'Administrador — controlo total, cria equipa e gere permissões',
      platformOnlyTitle: 'Acesso exclusivo ao painel administrativo',
      platformOnlyDesc: 'O utilizador só poderá aceder à página Controlo Geral (sem acesso à área de streaming).',
      submit: 'Criar Utilizador de Gestão',
    },
    pwdModal: {
      title: 'Redefinir Palavra-passe',
      currentPwd: 'Palavra-passe atual (ou padrão) *',
      newPwd: 'Nova palavra-passe *',
      newPwdPlaceholder: 'Mínimo 6 caracteres',
      confirmPwd: 'Confirmar nova palavra-passe *',
      submit: 'Guardar Nova Palavra-passe',
      errMin: 'A nova palavra-passe deve ter pelo menos 6 caracteres.',
      errMismatch: 'As novas palavras-passe não coincidem.',
      success: 'Palavra-passe redefinida com sucesso!',
    },
    supportTab: {
      empty: 'Nenhum pedido de suporte em aberto no momento.',
      resolveBtn: 'Responder e Resolver',
      resolved: 'Resolvido',
    },
    reportsTab: {
      empty: 'Nenhuma denúncia registada.',
      resolveBtn: 'Resolver',
    },
    commentsTab: {
      moderateBtn: 'Remover Ofensivos Automaticamente',
      searchPlaceholder: 'Pesquisar comentário, utilizador ou vídeo...',
      onlyFlagged: 'Apenas ofensivos/sinalizados',
      empty: 'Nenhum comentário encontrado.',
    },
  },
  en: {
    badgeAdmin: 'PodPlay Platform Control',
    badgeMod: 'PodPlay Review Panel',
    badgeSupport: 'PodPlay Support Team',
    titleAdmin: 'Platform Management',
    titleSupport: 'Support Panel',
    subtitleAdmin: 'Exclusive team area to manage users, catalog, videos, and system metrics.',
    subtitleSupport: 'User support desk, report handling, and comment moderation.',
    changePasswordBtn: 'Change Password',
    defaultPwdBannerTitle: 'You are using the default password sent by email',
    defaultPwdBannerDesc: 'For security, we recommend resetting your password to a personal one.',
    redefinePwdBtn: 'Reset Password',
    restrictedTitle: 'Restricted Access',
    restrictedDesc: 'This area is exclusive to PodPlay administrators and platform staff.',
    backHome: 'Back to Home',
    tabs: {
      overview: 'Overview',
      users: 'Users & Artists',
      staff: 'Team & Admins',
      artistRequests: 'Artists',
      reports: 'Reports',
      pitches: 'Pitching',
      support: 'Support',
      music: 'Music',
      videos: 'Videos',
      comments: 'Comments',
      events: 'Events & Ads',
      catalog: 'Artists & Albums',
      series: 'Series',
      notifications: 'Notify All',
      payments: 'PAYMENT MANAGEMENT',
      backups: 'Backups',
      logs: 'Logs',
      footer: 'Footer',
      branding: 'Logo',
    },
    kpi: {
      activeUsers: 'Active Users',
      thisMonth: 'this month',
      totalPlays: 'Total Plays',
      uniqueListeners: 'unique listeners',
      catalogMusic: 'Tracks in Catalog',
      publishedVideos: 'published videos',
      artistsAlbums: 'Artists & Albums',
      registeredAlbums: 'registered albums',
      playsChartTitle: 'Platform Plays',
      playsChartSub: 'Daily streaming trend',
      days: 'days',
      teamUsersTitle: 'Team & Users',
      teamUsersSub: 'Distribution by account type',
      users: 'Users',
      artists: 'Artists',
      support: 'Support',
      moderators: 'Moderators',
      admins: 'Admins',
    },
    usersTab: {
      searchCommunity: 'Search user or artist...',
      searchStaff: 'Search team member or admin...',
      all: 'All',
      normalUsers: 'Users',
      artists: 'Artists',
      support: 'Support',
      moderators: 'Moderators',
      admins: 'Admins',
      newStaffBtn: 'New Team Member',
      colUser: 'User',
      colMember: 'Member',
      colContact: 'Contact',
      colRole: 'Role',
      colRoleAccess: 'Role / Access',
      colStatus: 'Status',
      colActions: 'Actions',
      emptyCommunity: 'No users or artists found.',
      emptyStaff: 'No team members found.',
      active: 'Active',
      disabled: 'Disabled',
      disable: 'Disable',
      enable: 'Enable',
      panelOnly: 'Panel Only',
      roleUser: 'User',
      roleCreator: 'Artist / Creator',
      roleChurchAdmin: 'Church Admin',
      roleSupport: 'Support Team',
      roleModerator: 'Moderator',
      roleAdmin: 'Administrator',
    },
    staffModal: {
      title: 'New Team Member',
      fullName: 'Full name',
      username: 'Username *',
      email: 'Email *',
      pwdNotice: 'A default password will be automatically generated and emailed to the user, who can reset it later.',
      roleLabel: 'Role / Profile *',
      optSupport: 'Support — handles support tickets, reports, and moderates comments',
      optModerator: 'Moderator — reviews, approves, blocks, removes content, and publishes events',
      optAdmin: 'Administrator — full control, creates team members, and manages permissions',
      platformOnlyTitle: 'Exclusive admin panel access',
      platformOnlyDesc: 'The user will only be able to access the Platform Control page (no streaming area access).',
      submit: 'Create Team Member',
    },
    pwdModal: {
      title: 'Reset Password',
      currentPwd: 'Current (or default) password *',
      newPwd: 'New password *',
      newPwdPlaceholder: 'Minimum 6 characters',
      confirmPwd: 'Confirm new password *',
      submit: 'Save New Password',
      errMin: 'New password must be at least 6 characters.',
      errMismatch: 'New passwords do not match.',
      success: 'Password reset successfully!',
    },
    supportTab: {
      empty: 'No open support tickets at the moment.',
      resolveBtn: 'Reply & Resolve',
      resolved: 'Resolved',
    },
    reportsTab: {
      empty: 'No reports registered.',
      resolveBtn: 'Resolve',
    },
    commentsTab: {
      moderateBtn: 'Auto-Remove Offensive',
      searchPlaceholder: 'Search comment, user, or video...',
      onlyFlagged: 'Only offensive/flagged',
      empty: 'No comments found.',
    },
  },
  es: {
    badgeAdmin: 'Control General PodPlay',
    badgeMod: 'Panel de Revisión PodPlay',
    badgeSupport: 'Equipo de Soporte PodPlay',
    titleAdmin: 'Gestión de la Plataforma',
    titleSupport: 'Panel de Soporte',
    subtitleAdmin: 'Área exclusiva del equipo para controlar usuarios, catálogo, videos y métricas del sistema.',
    subtitleSupport: 'Área de atención al usuario, gestión de denuncias y moderación de comentarios.',
    changePasswordBtn: 'Cambiar Contraseña',
    defaultPwdBannerTitle: 'Estás utilizando la contraseña predeterminada enviada por correo',
    defaultPwdBannerDesc: 'Por seguridad, te recomendamos restablecer tu contraseña por una personal.',
    redefinePwdBtn: 'Restablecer Contraseña',
    restrictedTitle: 'Acceso Restringido',
    restrictedDesc: 'Esta área es exclusiva para administradores y equipo de la plataforma PodPlay.',
    backHome: 'Volver al Inicio',
    tabs: {
      overview: 'Vista General',
      users: 'Usuarios y Artistas',
      staff: 'Equipo y Admins',
      artistRequests: 'Artistas',
      reports: 'Denuncias',
      pitches: 'Pitching',
      support: 'Soporte',
      music: 'Música',
      videos: 'Videos',
      comments: 'Comentarios',
      events: 'Eventos y Publicidad',
      catalog: 'Artistas y Álbumes',
      series: 'Series',
      notifications: 'Notificar a Todos',
      payments: 'GESTIÓN DE PAGOS',
      backups: 'Backups',
      logs: 'Logs',
      footer: 'Pie de página',
      branding: 'Logo',
    },
    kpi: {
      activeUsers: 'Usuarios Activos',
      thisMonth: 'este mes',
      totalPlays: 'Reproducciones Totales',
      uniqueListeners: 'oyentes únicos',
      catalogMusic: 'Música en el Catálogo',
      publishedVideos: 'videos publicados',
      artistsAlbums: 'Artistas y Álbumes',
      registeredAlbums: 'álbumes registrados',
      playsChartTitle: 'Reproducciones en la Plataforma',
      playsChartSub: 'Evolución diaria de streaming',
      days: 'días',
      teamUsersTitle: 'Equipo y Usuarios',
      teamUsersSub: 'Distribución por tipo de cuenta',
      users: 'Usuarios',
      artists: 'Artistas',
      support: 'Soporte',
      moderators: 'Revisores',
      admins: 'Admins',
    },
    usersTab: {
      searchCommunity: 'Buscar usuario o artista...',
      searchStaff: 'Buscar miembro o administrador...',
      all: 'Todos',
      normalUsers: 'Usuarios',
      artists: 'Artistas',
      support: 'Soporte',
      moderators: 'Revisores',
      admins: 'Admins',
      newStaffBtn: 'Nuevo Miembro de Gestión',
      colUser: 'Usuario',
      colMember: 'Miembro',
      colContact: 'Contacto',
      colRole: 'Perfil',
      colRoleAccess: 'Perfil / Acceso',
      colStatus: 'Estado',
      colActions: 'Acciones',
      emptyCommunity: 'No se encontró ningún usuario o artista.',
      emptyStaff: 'No se encontró ningún miembro del equipo.',
      active: 'Activo',
      disabled: 'Desactivado',
      disable: 'Desactivar',
      enable: 'Activar',
      panelOnly: 'Solo Panel',
      roleUser: 'Usuario',
      roleCreator: 'Artista / Creador',
      roleChurchAdmin: 'Admin Iglesia',
      roleSupport: 'Equipo de Soporte',
      roleModerator: 'Revisor',
      roleAdmin: 'Administrador',
    },
    staffModal: {
      title: 'Nuevo Miembro de Gestión',
      fullName: 'Nombre completo',
      username: 'Username *',
      email: 'Correo electrónico *',
      pwdNotice: 'Se generará automáticamente una contraseña predeterminada y se enviará por correo al usuario, quien podrá cambiarla después.',
      roleLabel: 'Función / Perfil *',
      optSupport: 'Soporte — atiende solicitudes de soporte, gestiona denuncias y modera comentarios',
      optModerator: 'Revisor — revisa, aprueba, bloquea, elimina contenido y publica eventos',
      optAdmin: 'Administrador — control total, crea equipo y gestiona permisos',
      platformOnlyTitle: 'Acceso exclusivo al panel administrativo',
      platformOnlyDesc: 'El usuario solo podrá acceder a la página Control General (sin acceso al área de streaming).',
      submit: 'Crear Miembro de Gestión',
    },
    pwdModal: {
      title: 'Restablecer Contraseña',
      currentPwd: 'Contraseña actual (o predeterminada) *',
      newPwd: 'Nueva contraseña *',
      newPwdPlaceholder: 'Mínimo 6 caracteres',
      confirmPwd: 'Confirmar nueva contraseña *',
      submit: 'Guardar Nueva Contraseña',
      errMin: 'La nueva contraseña debe tener al menos 6 caracteres.',
      errMismatch: 'Las nuevas contraseñas no coinciden.',
      success: '¡Contraseña restablecida con éxito!',
    },
    supportTab: {
      empty: 'No hay solicitudes de soporte abiertas en este momento.',
      resolveBtn: 'Responder y Resolver',
      resolved: 'Resuelto',
    },
    reportsTab: {
      empty: 'No hay denuncias registradas.',
      resolveBtn: 'Resolver',
    },
    commentsTab: {
      moderateBtn: 'Eliminar Ofensivos Automáticamente',
      searchPlaceholder: 'Buscar comentario, usuario o video...',
      onlyFlagged: 'Solo ofensivos/reportados',
      empty: 'No se encontraron comentarios.',
    },
  },
};

export function useLanguage(): AppLanguage {
  const [lang, setLang] = useState<AppLanguage>('pt');

  useEffect(() => {
    const readLang = () => {
      try {
        const raw = localStorage.getItem('podplay_preferences');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.language === 'en' || parsed?.language === 'es' || parsed?.language === 'pt') {
            setLang(parsed.language);
            return;
          }
        }
      } catch {}
      setLang('pt');
    };

    readLang();
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.language === 'en' || detail?.language === 'es' || detail?.language === 'pt') {
        setLang(detail.language);
      } else {
        readLang();
      }
    };
    window.addEventListener('podplay:preferences-updated', onUpdate);
    return () => window.removeEventListener('podplay:preferences-updated', onUpdate);
  }, []);

  return lang;
}
