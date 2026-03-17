'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { io, type Socket } from 'socket.io-client';
import { API_ENDPOINTS, getApiUrl, defaultHeaders } from '@/config/api';

interface Usuario {
  id: number;
  nome: string;
  perfil: string;
  foto?: string;
  token?: string;
}

interface AuthContextType {
  user: Usuario | null;
  socket: Socket | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  updateUser: (novoUsuario: Partial<Usuario>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      const parsedUser: Usuario = JSON.parse(storedUser);
      setUser(parsedUser);

      const s = io('http://localhost:3000', {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        auth: { token },
      });

      s.connect();
      s.emit('join_perfil', parsedUser.perfil);

      setSocket(s);
    }

    setLoading(false);

    return () => {
      socket?.disconnect();
    };
  }, []);

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
      const userWithToken: Usuario = { ...usuario, token };

      Cookies.set('token', token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userWithToken));

      setUser(userWithToken);

      const s = io('https://opticaapi-production.up.railway.app', {
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

  const logout = () => {
    Cookies.remove('token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    socket?.disconnect();
    setUser(null);
    setSocket(null);
  };

  const updateUser = (novoUsuario: Partial<Usuario>) => {
    if (!user) return;
    const updatedUser = { ...user, ...novoUsuario };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, socket, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);