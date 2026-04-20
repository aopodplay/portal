// src/config/api.ts
import Cookies from "js-cookie";

// URL da API (apenas ambiente local)
export const API_BASE_URL = "http://localhost:3000";

// Endpoints da API da Óptica
export const API_ENDPOINTS = {
  LOGIN: "/auth/login",
  ME: "/auth/me",

  DASHBOARD: "/dashboard",

  USUARIOS: "/usuarios",
  PACIENTES: "/pacientes",
  CATEGORIAS: "/categorias",
  PRODUTOS: "/produtos",

  ATENDIMENTOS: "/atendimentos",
  CONSULTAS: "/consultas",
  RECEITAS: "/receitas",
  SERVICOS: "/servicos",

  VENDAS: "/vendas",
  VENDA_ITENS: "/venda-itens",
  FATURAS: "/faturas",
  PAGAMENTOS: "/pagamentos",

  // Encomendas de Óculos - CORRIGIDO
  ENCOMENDAS_OCULOS: "/encomendas-oculos",
  ENCOMENDAS_STATUS: "/encomendas-oculos/status", // usado para PUT /:id/status

  // NOTAS DE ENTREGA
  NOTAS_ENTREGA: "/notas-entrega",
  NOTA_ENTREGA_ID: (id: number | string) => `/notas-entrega/${id}`,
  NOTA_ENTREGA_ENTREGAR: (id: number | string) => `/notas-entrega/${id}/entregar`,
  NOTA_ENTREGA_CANCELAR: (id: number | string) => `/notas-entrega/${id}/cancelar`,
  NOTAS_ENTREGA_POR_PACIENTE: (pacienteId: number | string) => `/notas-entrega/paciente/${pacienteId}`,

  // RECIBOS
  RECIBOS: "/recibos",
  RECIBO_ID: (id: number | string) => `/recibos/${id}`,
  RECIBO_CANCELAR: (id: number | string) => `/recibos/${id}/cancelar`,
  RECIBOS_POR_PACIENTE: (pacienteId: number | string) => `/recibos/paciente/${pacienteId}`,

  // JUSTIFICATIVOS MÉDICOS
  JUSTIFICATIVOS_MEDICOS: "/justificativos-medicos",
  JUSTIFICATIVO_MEDICO_ID: (id: number | string) => `/justificativos-medicos/${id}`,
  JUSTIFICATIVO_MEDICO_CANCELAR: (id: number | string) => `/justificativos-medicos/${id}/cancelar`,
  JUSTIFICATIVOS_POR_PACIENTE: (pacienteId: number | string) => `/justificativos-medicos/paciente/${pacienteId}`,
  JUSTIFICATIVOS_POR_PERIODO: "/justificativos-medicos/periodo/buscar",

  SEGURADORAS: "/seguradoras",
  SEGURADORAS_ATIVAS: "/seguradoras/ativas",

  PLANOS: "/planos",
  PLANOS_ATIVOS: "/planos/ativos",

  COBERTURAS: "/coberturas",
  AUTORIZACOES: "/autorizacoes",

  CONFIGURACOES_SISTEMA: "/configuracoes-sistema",

  // Endpoint agregado para Gestão Comercial
  GESTAO_COMERCIAL: "/gestao-comercial",

  // src/config/api.ts - adicione
  RELATORIOS: "/relatorios",
  
  // PARCELAMENTO - CORRIGIDO
  PARCELAMENTO: {
    // Configurações
    CONFIGURACOES: "/parcelamentos/configuracoes",
    CONFIGURACAO_ID: (id: number | string) => `/parcelamentos/configuracoes/${id}`,
    
    // Simulação
    SIMULAR: "/parcelamentos/simular",
    
    // Parcelamentos
    LISTAR: "/parcelamentos",
    BUSCAR: (id: number | string) => `/parcelamentos/${id}`,
    CRIAR: "/parcelamentos",
    CANCELAR: (id: number | string) => `/parcelamentos/${id}/cancelar`,
    
    // Dashboard e Relatórios
    DASHBOARD: "/parcelamentos/dashboard",
    RELATORIO: "/parcelamentos/relatorio",
    
    // Parcelas
    PAGAR_PARCELA: (parcelaId: number | string) => `/parcelamentos/parcelas/${parcelaId}/pagar`,
    
    // Filtros
    POR_CLIENTE: (clienteId: number | string) => `/parcelamentos?cliente_id=${clienteId}`,
    POR_STATUS: (status: string) => `/parcelamentos?status=${status}`,
  },

  // FATURAS PRÓ-FORMA
  FATURAS_PROFORMA: {
    // Listar todas (com filtros)
    LISTAR: "/faturas-proforma",
    
    // Dashboard/Estatísticas
    DASHBOARD: "/faturas-proforma/dashboard",
    
    // Buscar por ID
    BUSCAR: (id: number | string) => `/faturas-proforma/${id}`,
    
    // Criar nova
    CRIAR: "/faturas-proforma",
    
    // Atualizar
    ATUALIZAR: (id: number | string) => `/faturas-proforma/${id}`,
    
    // Excluir (soft delete)
    EXCLUIR: (id: number | string) => `/faturas-proforma/${id}`,
    
    // Converter para fatura final
    CONVERTER: (id: number | string) => `/faturas-proforma/${id}/converter`,
    
    // Cancelar
    CANCELAR: (id: number | string) => `/faturas-proforma/${id}/cancelar`,
    
    // Enviar por e-mail
    ENVIAR_EMAIL: (id: number | string) => `/faturas-proforma/${id}/enviar-email`,
    
    // Filtros específicos
    POR_CLIENTE: (clienteId: number | string) => `/faturas-proforma?cliente_id=${clienteId}`,
    POR_STATUS: (status: string) => `/faturas-proforma?status=${status}`,
    POR_PERIODO: (dataInicio: string, dataFim: string) => `/faturas-proforma?data_inicio=${dataInicio}&data_fim=${dataFim}`,
  },
};

// Monta URL completa
export const getApiUrl = (endpoint: string) =>
  `${API_BASE_URL}${endpoint}`;

// Headers padrão
export const defaultHeaders: HeadersInit = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// Headers com autenticação
export const getAuthHeaders = (): HeadersInit => {
  let token = Cookies.get("token");

  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("token") || undefined;
  }

  return token
    ? {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    : {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
};