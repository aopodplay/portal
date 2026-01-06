"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import { API_ENDPOINTS, getApiUrl, defaultHeaders } from "@/config/api";

interface Usuario {
  id: number;
  nome: string;
  perfil: string;
}

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar usuário do localStorage ou Cookie
  useEffect(() => {
    const token = Cookies.get("token") || localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // Função de login
  const login = async (email: string, senha: string) => {
    setLoading(true);

    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.LOGIN), {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro no login");
      }

      // Salvar token e usuário
      const { token, usuario } = data;
      Cookies.set("token", token);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(usuario));

      setUser(usuario);
    } catch (err: any) {
      console.error("Login error:", err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    Cookies.remove("token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar AuthContext
export const useAuth = () => useContext(AuthContext);
