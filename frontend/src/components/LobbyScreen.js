import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
export default function LobbyScreen({ username, variant, onCancel }) {
    return (_jsxs("div", { style: {
            position: 'fixed', inset: 0, background: 'var(--bg-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999, fontFamily: 'var(--font-sans)',
        }, children: [_jsx("div", { style: {
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '40px 48px',
                    textAlign: 'center', maxWidth: 400, width: '100%',
                }, children: variant === 'not_found' ? (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 40, marginBottom: 16 }, children: "\uD83D\uDD0D" }), _jsx("h2", { style: { fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }, children: "Room not found" }), _jsx("p", { style: { fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }, children: "This session doesn't exist or the link is invalid." }), _jsx("button", { onClick: onCancel, style: {
                                padding: '10px 24px', borderRadius: 'var(--radius-md)',
                                background: 'var(--accent)', color: '#fff',
                                border: 'none', fontSize: 14, cursor: 'pointer',
                            }, children: "Go back" })] })) : variant === 'denied' ? (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 40, marginBottom: 16 }, children: "\uD83D\uDEAB" }), _jsx("h2", { style: { fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }, children: "Entry denied" }), _jsx("p", { style: { fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }, children: "The host didn't let you in." }), _jsx("button", { onClick: onCancel, style: {
                                padding: '10px 24px', borderRadius: 'var(--radius-md)',
                                background: 'var(--accent)', color: '#fff',
                                border: 'none', fontSize: 14, cursor: 'pointer',
                            }, children: "Go back" })] })) : variant === 'checking' ? (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 40, marginBottom: 16 }, children: "\u23F3" }), _jsx("h2", { style: { fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }, children: "Checking access" }), _jsx("p", { style: { fontSize: 14, color: 'var(--text-secondary)' }, children: "Verifying room permissions..." })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 40, marginBottom: 16 }, children: "\u23F3" }), _jsx("h2", { style: { fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }, children: "Waiting for host" }), _jsxs("p", { style: { fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }, children: [_jsx("strong", { style: { color: 'var(--text-primary)' }, children: username }), ", your request to join has been sent."] }), _jsx("p", { style: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }, children: "The host will let you in soon..." }), _jsx("div", { style: { display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }, children: [0, 1, 2].map(i => (_jsx("div", { style: {
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: 'var(--accent)',
                                    animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                                } }, i))) }), _jsx("button", { onClick: onCancel, style: {
                                padding: '8px 20px', borderRadius: 'var(--radius-md)',
                                background: 'transparent', color: 'var(--text-muted)',
                                border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer',
                            }, children: "Cancel" })] })) }), _jsx("style", { children: `
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      ` })] }));
}
