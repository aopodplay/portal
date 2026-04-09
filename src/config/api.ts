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