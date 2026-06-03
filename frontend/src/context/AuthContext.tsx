import { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';

interface User { id: string; username: string; email: string; }
interface AuthCtx {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  async function register(username: string, email: string, password: string) {
    const { data } = await axios.post('/api/auth/register', { username, email, password });
    setUser(data.user);
    setAccessToken(data.accessToken);
  }

  async function login(email: string, password: string) {
    const { data } = await axios.post('/api/auth/login', { email, password });
    setUser(data.user);
    setAccessToken(data.accessToken);
  }

  function logout() {
    if (user) axios.post('/api/auth/logout', { userId: user.id });
    setUser(null);
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
