import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
export default function Login() {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'register') {
                await register(username, email, password);
                toast.success('Account created!');
            }
            else {
                await login(email, password);
                toast.success('Welcome back!');
            }
            navigate('/');
        }
        catch (err) {
            toast.error(err?.response?.data?.error || 'Something went wrong');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { style: {
            minHeight: '100vh', display: 'flex',
            background: 'var(--bg-primary)', fontFamily: 'var(--font-sans)',
        }, children: [_jsxs("div", { style: {
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: 48,
                }, children: [_jsxs("div", { style: { marginBottom: 40, textAlign: 'center' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }, children: [_jsx("span", { style: { fontSize: 28, color: 'var(--accent)' }, children: '{' }), _jsx("span", { style: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }, children: "collab" }), _jsx("span", { style: { fontSize: 28, color: 'var(--accent)' }, children: '}' })] }), _jsx("p", { style: { fontSize: 13, color: 'var(--text-muted)' }, children: "Real-time collaborative code editor" })] }), _jsxs("div", { style: {
                            width: '100%', maxWidth: 380,
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)', padding: '32px',
                        }, children: [_jsx("h2", { style: { fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }, children: mode === 'login' ? 'Sign in' : 'Create account' }), _jsx("p", { style: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }, children: mode === 'login' ? 'Welcome back' : 'Start collaborating in seconds' }), _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: 14 }, children: [mode === 'register' && (_jsxs("div", { children: [_jsx("label", { style: labelStyle, children: "Username" }), _jsx("input", { placeholder: "yourname", value: username, onChange: e => setUsername(e.target.value), style: inputStyle, required: true })] })), _jsxs("div", { children: [_jsx("label", { style: labelStyle, children: "Email" }), _jsx("input", { type: "email", placeholder: "you@example.com", value: email, onChange: e => setEmail(e.target.value), style: inputStyle, required: true })] }), _jsxs("div", { children: [_jsx("label", { style: labelStyle, children: "Password" }), _jsx("input", { type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: e => setPassword(e.target.value), style: inputStyle, required: true })] }), _jsx("button", { type: "submit", disabled: loading, style: {
                                            padding: '11px', borderRadius: 'var(--radius-md)',
                                            background: loading ? 'var(--bg-hover)' : 'var(--accent)',
                                            color: loading ? 'var(--text-muted)' : '#fff',
                                            border: 'none', fontSize: 14, fontWeight: 500,
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            marginTop: 4, transition: 'background 0.2s',
                                        }, children: loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account' })] }), _jsxs("p", { style: { marginTop: 20, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }, children: [mode === 'login' ? "Don't have an account? " : 'Already have an account? ', _jsx("span", { onClick: () => setMode(mode === 'login' ? 'register' : 'login'), style: { color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }, children: mode === 'login' ? 'Register' : 'Sign in' })] })] })] }), _jsx("div", { style: {
                    flex: 1, background: 'var(--bg-secondary)',
                    borderLeft: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 48,
                }, children: _jsxs("div", { style: {
                        background: 'var(--bg-primary)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)', padding: '24px 28px',
                        fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.8,
                        color: 'var(--text-secondary)', maxWidth: 380, width: '100%',
                    }, children: [_jsx("div", { style: { color: '#546e7a', marginBottom: 4 }, children: '// collab.ts' }), _jsxs("div", { children: [_jsx("span", { style: { color: '#c792ea' }, children: "const" }), " ", _jsx("span", { style: { color: '#82aaff' }, children: "room" }), " ", _jsx("span", { style: { color: '#89ddff' }, children: "=" }), " ", _jsx("span", { style: { color: '#c3e88d' }, children: "'aB3kR7xQ'" })] }), _jsxs("div", { style: { marginTop: 8 }, children: [_jsx("span", { style: { color: '#c792ea' }, children: "await" }), " ", _jsx("span", { style: { color: '#82aaff' }, children: "joinRoom" }), _jsx("span", { style: { color: '#89ddff' }, children: "(room)" })] }), _jsx("div", { style: { marginTop: 8, color: '#546e7a' }, children: '// ✅ 3 users connected' }), _jsx("div", { style: { marginTop: 8, color: '#546e7a' }, children: '// ✅ changes syncing' }), _jsx("div", { style: { marginTop: 8, color: '#546e7a' }, children: '// ✅ no conflicts' })] }) })] }));
}
const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: 6,
};
const inputStyle = {
    width: '100%', padding: '10px 12px',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
    background: 'var(--bg-primary)', fontSize: 13,
    color: 'var(--text-primary)', outline: 'none',
    fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
};
