import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { setAuthToken } from '@/lib/api';

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
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const token = sessionStorage.getItem('auth_token');
    if (token) setAuthToken(token);
    return token;
  });

  useEffect(() => {
    if (user && accessToken) {
      sessionStorage.setItem('auth_user', JSON.stringify(user));
      sessionStorage.setItem('auth_token', accessToken);
      setAuthToken(accessToken);
    } else {
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_token');
      setAuthToken(null);
    }
  }, [user, accessToken]);

  async function register(username: string, email: string, password: string) {
    const { data } = await api.post('/auth/register', { username, email, password });
    setUser(data.user);
    setAccessToken(data.accessToken);
    sessionStorage.setItem('refresh_token', data.refreshToken);
  }

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
    setAccessToken(data.accessToken);
    sessionStorage.setItem('refresh_token', data.refreshToken);
  }

  function logout() {
    if (user) api.post('/auth/logout', { userId: user.id });
    setUser(null);
    setAccessToken(null);
    sessionStorage.removeItem('refresh_token');
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