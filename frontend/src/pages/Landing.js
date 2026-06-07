import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api, { setAuthToken } from '@/lib/api';
import toast from 'react-hot-toast';
export default function Landing() {
    const { user, accessToken, logout } = useAuth();
    const navigate = useNavigate();
    const [joinSlug, setJoinSlug] = useState('');
    const [loading, setLoading] = useState(false);
    if (!user) {
        navigate('/login');
        return null;
    }
    setAuthToken(accessToken);
    async function createRoom() {
        setLoading(true);
        try {
            const { data } = await api.post('/sessions', { language: 'javascript' });
            navigate(`/editor/${data.slug}`);
        }
        catch {
            toast.error('Failed to create room');
        }
        finally {
            setLoading(false);
        }
    }
    function joinRoom() {
        const slug = joinSlug.trim();
        if (!slug)
            return toast.error('Enter a session ID');
        navigate(`/editor/${slug}`);
    }
    return (_jsxs("div", { style: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', gap: 32 }, children: [_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("h1", { style: { fontSize: 32, marginBottom: 8 }, children: "Collab Editor" }), _jsxs("p", { style: { color: '#6b7280' }, children: ["Welcome, ", user.username] })] }), _jsxs("div", { style: { display: 'flex', gap: 16 }, children: [_jsx("button", { onClick: createRoom, disabled: loading, style: btnPrimary, children: loading ? 'Creating...' : '+ New room' }), _jsx("button", { onClick: logout, style: btnSecondary, children: "Log out" })] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("input", { placeholder: "Paste session ID to join", value: joinSlug, onChange: e => setJoinSlug(e.target.value), onKeyDown: e => e.key === 'Enter' && joinRoom(), style: { padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, width: 260 } }), _jsx("button", { onClick: joinRoom, style: btnSecondary, children: "Join" })] })] }));
}
const btnPrimary = {
    padding: '10px 20px', borderRadius: 8, background: '#6366f1',
    color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer',
};
const btnSecondary = {
    padding: '10px 20px', borderRadius: 8, background: '#fff',
    color: '#374151', border: '1px solid #e5e7eb', fontSize: 14, cursor: 'pointer',
};
