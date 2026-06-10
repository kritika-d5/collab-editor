import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function PresenceBar({ peers, currentUser, currentColor }) {
    const all = [{ username: currentUser, color: currentColor }, ...peers];
    return (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [all.map((p, i) => (_jsx("div", { title: p.username, style: {
                    width: 28, height: 28, borderRadius: '50%',
                    background: p.color, border: '2px solid var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600, color: '#fff',
                    marginLeft: i === 0 ? 0 : -6, cursor: 'default',
                    zIndex: all.length - i,
                    position: 'relative',
                }, children: p.username[0].toUpperCase() }, i))), _jsxs("span", { style: { fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }, children: [all.length, " online"] })] }));
}
