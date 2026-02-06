import Cookies from "js-cookie";

// Base URL da API
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Endpoints da API da Óptica (alinhados com o backend)
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

  // Vendas e financeiro
  VENDAS: "/vendas",
  VENDA_ITENS: "/venda-itens",
  FATURAS: "/faturas",
  PAGAMENTOS: "/pagamentos",

  // Configurações do sistema
  CONFIGURACOES_SISTEMA: "/configuracoes-sistema",
};

// Monta a URL completa
export const getApiUrl = (endpoint: string) =>
  `${API_BASE_URL}${endpoint}`;

// Headers padrão
export const defaultHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// Headers com autenticação
export const getAuthHeaders = () => {
  const token =
    Cookies.get("token") || localStorage.getItem("token");

  return {
    ...defaultHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
