import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { CHAT_URL } from '@/lib/config';
export default function ChatSidebar({ sessionId }) {
    const { user, accessToken } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState(null);
    const bottomRef = useRef(null);
    useEffect(() => {
        if (!accessToken)
            return;
        const s = io(CHAT_URL, {
            auth: { token: accessToken },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
        });
        s.emit('join:room', sessionId);
        s.on('chat:message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });
        s.on('user:joined', ({ username, color }) => {
            setMessages(prev => [...prev, {
                    id: Date.now().toString(), username, text: `${username} joined`, color, timestamp: Date.now(), system: true
                }]);
        });
        s.on('user:left', ({ username }) => {
            setMessages(prev => [...prev, {
                    id: Date.now().toString(), username, text: `${username} left`, color: '#8b8fa8', timestamp: Date.now(), system: true
                }]);
        });
        s.on('connect_error', (err) => {
            console.error('Chat connection error:', err.message);
        });
        s.on('connect', () => {
            console.log('Chat connected');
        });
        setSocket(s);
        return () => { s.disconnect(); };
    }, [sessionId, accessToken]);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    function sendMessage() {
        if (!input.trim() || !socket)
            return;
        socket.emit('chat:message', { sessionId, text: input.trim() });
        setInput('');
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: '100%' }, children: [_jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }, children: [messages.length === 0 && (_jsx("p", { style: { fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }, children: "No messages yet. Say hi! \uD83D\uDC4B" })), messages.map(msg => (_jsxs("div", { style: { opacity: msg.system ? 0.5 : 1 }, children: [!msg.system && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }, children: [_jsx("div", { style: { width: 6, height: 6, borderRadius: '50%', background: msg.color, flexShrink: 0 } }), _jsx("span", { style: { fontSize: 11, fontWeight: 600, color: msg.color }, children: msg.username }), _jsx("span", { style: { fontSize: 10, color: 'var(--text-muted)' }, children: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] })), _jsx("p", { style: {
                                    fontSize: msg.system ? 11 : 12,
                                    color: msg.system ? 'var(--text-muted)' : 'var(--text-secondary)',
                                    paddingLeft: msg.system ? 0 : 12,
                                    fontStyle: msg.system ? 'italic' : 'normal',
                                    lineHeight: 1.5,
                                    textAlign: msg.system ? 'center' : 'left',
                                }, children: msg.system ? msg.text : msg.text })] }, msg.id))), _jsx("div", { ref: bottomRef })] }), _jsxs("div", { style: { padding: '8px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }, children: [_jsx("input", { value: input, onChange: e => setInput(e.target.value), onKeyDown: e => e.key === 'Enter' && sendMessage(), placeholder: "Message...", style: {
                            flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: 12,
                            color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)',
                        } }), _jsx("button", { onClick: sendMessage, style: {
                            background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)',
                            padding: '6px 10px', color: '#fff', fontSize: 13, cursor: 'pointer',
                        }, children: "\u2192" })] })] }));
}
