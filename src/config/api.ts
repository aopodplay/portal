import Cookies from "js-cookie";

// Base URL da API
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Endpoints da API da Óptica
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  ME: "/auth/me",

  // Dashboard
  DASHBOARD: "/dashboard",

  // Cadastros base
  USUARIOS: "/usuarios",
  PACIENTES: "/pacientes",
  CATEGORIAS: "/categorias",
  PRODUTOS: "/produtos",

  // Fluxo de atendimento
  ATENDIMENTOS: "/atendimentos",
  CONSULTAS: "/consultas",
  RECEITAS: "/receitas",
  SERVICOS: "/servicos",

  // Vendas e financeiro
  VENDAS: "/vendas",
  VENDA_ITENS: "/venda-itens",
  FATURAS: "/faturas",
  PAGAMENTOS: "/pagamentos",

  // MÓDULO DE SEGURO
  SEGURADORAS: "/seguradoras",
  SEGURADORAS_ATIVAS: "/seguradoras/ativas",

  PLANOS: "/planos",
  PLANOS_ATIVOS: "/planos/ativos",

  COBERTURAS: "/coberturas",
  AUTORIZACOES: "/autorizacoes",

  // Configurações do sistema
  CONFIGURACOES_SISTEMA: "/configuracoes-sistema",
};

// Monta a URL completa
export const getApiUrl = (endpoint: string) =>
  `${API_BASE_URL}${endpoint}`;

// Headers padrão
export const defaultHeaders: HeadersInit = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// Headers com autenticação (corrigido para não quebrar no SSR)
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