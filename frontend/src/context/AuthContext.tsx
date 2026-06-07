import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const [user, setUser] = useState<User | null>(() => {
    // rehydrate from sessionStorage on page load
    try {
      const saved = sessionStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('auth_token');
  });

  // keep sessionStorage in sync
  useEffect(() => {
    if (user && accessToken) {
      sessionStorage.setItem('auth_user', JSON.stringify(user));
      sessionStorage.setItem('auth_token', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user, accessToken]);

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