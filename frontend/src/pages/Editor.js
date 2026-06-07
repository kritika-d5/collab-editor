import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCollabEditor } from '@/hooks/useCollabEditor';
import ChatSidebar from '@/components/ChatSidebar';
import PresenceBar from '@/components/PresenceBar';
import toast from 'react-hot-toast';
const LANGUAGES = ['javascript', 'typescript', 'python', 'go', 'rust', 'html', 'css', 'json'];
export default function Editor() {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const [lineCol, setLineCol] = useState('Ln 1, Col 1');
    const [sidebarTab, setSidebarTab] = useState('chat');
    const { bindEditor, connected, peers, color, language, changeLanguage } = useCollabEditor({
        sessionId: sessionId,
        userId: user?.id || 'anonymous',
        username: user?.username || 'Anonymous',
    });
    const handleEditorMount = useCallback((editor) => {
        bindEditor(editor);
        editor.onDidChangeCursorPosition((e) => {
            setLineCol(`Ln ${e.position.lineNumber}, Col ${e.position.column}`);
        });
    }, [bindEditor]);
    function copyLink() {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!');
    }
    if (!user) {
        navigate('/login');
        return null;
    }
    return (_jsxs("div", { style: { height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }, children: [_jsxs("div", { style: {
                    height: 44, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0,
                }, children: [_jsxs("div", { onClick: () => navigate('/'), style: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("span", { style: { fontSize: 16, color: 'var(--accent)' }, children: '{' }), _jsx("span", { style: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.3 }, children: "collab" }), _jsx("span", { style: { fontSize: 16, color: 'var(--accent)' }, children: '}' })] }), _jsx("div", { style: { width: 1, height: 20, background: 'var(--border)' } }), _jsx("div", { style: {
                            fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-hover)',
                            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                            padding: '3px 10px', fontFamily: 'var(--font-mono)',
                        }, children: sessionId }), _jsx("select", { value: language, onChange: e => changeLanguage(e.target.value), style: {
                            fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-hover)',
                            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                            padding: '3px 8px', outline: 'none', cursor: 'pointer',
                        }, children: LANGUAGES.map(l => _jsx("option", { value: l, children: l }, l)) }), _jsx("div", { style: { flex: 1 } }), _jsx(PresenceBar, { peers: peers, currentUser: user.username, currentColor: color }), _jsx("div", { style: { width: 1, height: 20, background: 'var(--border)' } }), _jsx("button", { onClick: copyLink, style: {
                            fontSize: 11, color: 'var(--accent)', background: 'transparent',
                            border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)',
                            padding: '4px 12px', cursor: 'pointer',
                        }, children: "\u2398 Share" }), _jsx("button", { onClick: toggle, style: {
                            background: 'transparent', border: 'none', fontSize: 16,
                            cursor: 'pointer', color: 'var(--text-secondary)',
                        }, children: theme === 'dark' ? '☀️' : '🌙' })] }), _jsxs("div", { style: { flex: 1, display: 'flex', overflow: 'hidden' }, children: [_jsx("div", { style: { flex: 1, overflow: 'hidden' }, children: _jsx(MonacoEditor, { height: "100%", language: language, theme: theme === 'dark' ? 'vs-dark' : 'light', onMount: handleEditorMount, options: {
                                fontSize: 14,
                                fontFamily: 'Fira Code, Consolas, monospace',
                                fontLigatures: true,
                                minimap: { enabled: true },
                                scrollBeyondLastLine: false,
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                                renderLineHighlight: 'all',
                                bracketPairColorization: { enabled: true },
                                padding: { top: 16 },
                                wordWrap: 'on',
                            } }) }), _jsxs("div", { style: {
                            width: 260, background: 'var(--bg-tertiary)',
                            borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
                        }, children: [_jsx("div", { style: { display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }, children: ['chat', 'users'].map(tab => (_jsx("button", { onClick: () => setSidebarTab(tab), style: {
                                        flex: 1, padding: '9px 0', fontSize: 11, fontWeight: 500,
                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                        color: sidebarTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                                        borderBottom: `2px solid ${sidebarTab === tab ? 'var(--accent)' : 'transparent'}`,
                                        textTransform: 'capitalize',
                                    }, children: tab === 'chat' ? '💬 Chat' : '👥 Users' }, tab))) }), _jsx("div", { style: { flex: 1, overflow: 'hidden' }, children: sidebarTab === 'chat' ? (_jsx(ChatSidebar, { sessionId: sessionId })) : (_jsx("div", { style: { padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }, children: [{ username: user.username, color }, ...peers].map((p, i) => (_jsxs("div", { style: {
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                                            background: 'var(--bg-hover)',
                                        }, children: [_jsx("div", { style: {
                                                    width: 28, height: 28, borderRadius: '50%', background: p.color,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0,
                                                }, children: p.username[0].toUpperCase() }), _jsxs("div", { children: [_jsxs("div", { style: { fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }, children: [p.username, i === 0 ? ' (you)' : ''] }), _jsx("div", { style: { fontSize: 10, color: 'var(--green)' }, children: "\u25CF online" })] })] }, i))) })) })] })] }), _jsx("div", { style: {
                    height: 22, background: connected ? 'var(--accent)' : 'var(--red)',
                    display: 'flex', alignItems: 'center', padding: '0 12px', gap: 16, flexShrink: 0,
                    transition: 'background 0.3s',
                }, children: [
                    connected ? '⚡ Connected' : '✕ Disconnected',
                    `${peers.length + 1} online`,
                    language,
                    lineCol,
                ].map((item, i) => (_jsx("span", { style: { fontSize: 10, color: 'rgba(255,255,255,0.85)' }, children: item }, i))) })] }));
}
