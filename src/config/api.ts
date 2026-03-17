import Cookies from "js-cookie";

// Detecta ambiente
const isDevelopment = process.env.NODE_ENV === "development";

// Base URL dinâmica
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (isDevelopment
    ? "http://localhost:3000"
    : "https://opticaapi-production.up.railway.app");

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

  SEGURADORAS: "/seguradoras",
  SEGURADORAS_ATIVAS: "/seguradoras/ativas",

  PLANOS: "/planos",
  PLANOS_ATIVOS: "/planos/ativos",

  COBERTURAS: "/coberturas",
  AUTORIZACOES: "/autorizacoes",

  CONFIGURACOES_SISTEMA: "/configuracoes-sistema",
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