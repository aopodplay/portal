import Cookies from "js-cookie";

// Base URL correta da tua API
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Endpoints da API da Ótica
export const API_ENDPOINTS = {
  LOGIN: "/auth/login",
  ME: "/auth/me",
  USUARIOS: "/usuarios",
  PACIENTES: "/pacientes",
  ATENDIMENTOS: "/atendimentos", 
  CONSULTAS: "/consultas",
  VENDAS: "/vendas",
  FATURAS: "/faturas",
  PAGAMENTOS: "/pagamentos",
  PRODUTOS: "/produtos",
  RECEITA: "/receita",
};



export const getApiUrl = (endpoint: string) =>
  `${API_BASE_URL}${endpoint}`; // monta URL completa

export const defaultHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const getAuthHeaders = () => {
  const token =
    Cookies.get("token") || localStorage.getItem("token");

  return {
    ...defaultHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
