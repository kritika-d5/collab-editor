import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ProtectedRoute from '@/router/ProtectedRoute';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Editor from '@/pages/Editor';
export default function App() {
    return (_jsx(ThemeProvider, { children: _jsx(AuthProvider, { children: _jsxs(BrowserRouter, { children: [_jsx(Toaster, { position: "top-right", toastOptions: {
                            style: {
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border)',
                                fontSize: 13,
                            }
                        } }), _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(Landing, {}) }) }), _jsx(Route, { path: "/editor/:sessionId", element: _jsx(ProtectedRoute, { children: _jsx(Editor, {}) }) })] })] }) }) }));
}
