'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { io, type Socket } from 'socket.io-client';
import { API_ENDPOINTS, getApiUrl, defaultHeaders } from '@/config/api';

interface Usuario {
  id: number;
  nome: string;
  perfil: string;
  token?: string;
}

interface AuthContextType {
  user: Usuario | null;
  socket: Socket | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sessão e inicializar socket
  useEffect(() => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      const parsedUser: Usuario = JSON.parse(storedUser);
      setUser(parsedUser);

      // Criar socket
      const s = io('http://localhost:3000', {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        auth: { token },
      });

      // Conectar socket e entrar na sala do perfil
      s.connect();
      s.emit('join_perfil', parsedUser.perfil);

      setSocket(s);
    }

    setLoading(false);

    // Desconectar socket ao desmontar
    return () => {
      socket?.disconnect();
    };
  }, []);

  // Login
  const login = async (email: string, senha: string) => {
    setLoading(true);

    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro no login');

      const { token, usuario } = data;
      const userWithToken = { ...usuario, token };

      // Salvar token e usuário
      Cookies.set('token', token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userWithToken));
      setUser(userWithToken);

      // Criar e conectar socket
      const s = io('http://localhost:3000', {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        auth: { token },
      });

      s.connect();
      s.emit('join_perfil', userWithToken.perfil);

      setSocket(s);

    } catch (err: any) {
      console.error('Login error:', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    Cookies.remove('token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    socket?.disconnect();
    setUser(null);
    setSocket(null);
  };

  return (
    <AuthContext.Provider value={{ user, socket, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);