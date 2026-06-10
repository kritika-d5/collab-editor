import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import api, { setAuthToken } from '@/lib/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        // rehydrate from sessionStorage on page load
        try {
            const saved = sessionStorage.getItem('auth_user');
            return saved ? JSON.parse(saved) : null;
        }
        catch {
            return null;
        }
    });
    const [accessToken, setAccessToken] = useState(() => {
        return sessionStorage.getItem('auth_token');
    });
    // keep sessionStorage in sync
    useEffect(() => {
        if (user && accessToken) {
            sessionStorage.setItem('auth_user', JSON.stringify(user));
            sessionStorage.setItem('auth_token', accessToken);
            // set on both axios instances globally
            setAuthToken(accessToken);
        }
        else {
            sessionStorage.removeItem('auth_user');
            sessionStorage.removeItem('auth_token');
            setAuthToken(null);
        }
    }, [user, accessToken]);
    async function register(username, email, password) {
        const { data } = await api.post('/auth/register', { username, email, password });
        setUser(data.user);
        setAccessToken(data.accessToken);
    }
    async function login(email, password) {
        const { data } = await api.post('/auth/login', { email, password });
        setUser(data.user);
        setAccessToken(data.accessToken);
    }
    function logout() {
        if (user)
            api.post('/auth/logout', { userId: user.id });
        setUser(null);
        setAccessToken(null);
    }
    return (_jsx(AuthContext.Provider, { value: { user, accessToken, login, register, logout }, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
