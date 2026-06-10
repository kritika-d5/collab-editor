import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import api from '@/lib/api';
export default function HistoryTimeline({ sessionId, isOpen, onClose, onRestore }) {
    const [ops, setOps] = useState([]);
    const [scrubPos, setScrubPos] = useState(100); // percentage 0-100
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const sliderRef = useRef(null);
    useEffect(() => {
        if (!isOpen)
            return;
        setLoading(true);
        api.get(`/sessions/${sessionId}/history`)
            .then(({ data }) => {
            setOps(data.ops);
            setScrubPos(100);
        })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [isOpen, sessionId]);
    useEffect(() => {
        if (!ops.length)
            return;
        // each op is now a full snapshot — just pick the one at scrubPos
        const index = Math.max(0, Math.round((scrubPos / 100) * (ops.length - 1)));
        const op = ops[index];
        if (!op)
            return;
        try {
            const doc = new Y.Doc();
            const bytes = Uint8Array.from(atob(op.payload), c => c.charCodeAt(0));
            Y.applyUpdate(doc, bytes);
            setPreview(doc.getText('content').toString());
            doc.destroy();
        }
        catch (err) {
            console.error('Failed to reconstruct snapshot:', err);
        }
    }, [scrubPos, ops]);
    if (!isOpen)
        return null;
    const count = Math.max(1, Math.round((scrubPos / 100) * ops.length));
    const currentOp = ops[count - 1];
    return (_jsx("div", { style: {
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 24,
        }, children: _jsxs("div", { style: {
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 800,
                maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }, children: [_jsxs("div", { style: {
                        padding: '16px 20px', borderBottom: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }, children: "Session History" }), _jsxs("div", { style: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }, children: [ops.length, " operations recorded"] })] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [ops.length > 0 && scrubPos < 100 && (_jsx("button", { onClick: () => {
                                        console.log('Restoring content:', preview);
                                        onRestore(preview);
                                    }, style: {
                                        fontSize: 12, padding: '6px 14px',
                                        background: 'var(--accent)', color: '#fff',
                                        border: 'none', borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer', fontWeight: 500,
                                    }, children: "\u21A9 Restore this version" })), _jsx("button", { onClick: onClose, style: {
                                        background: 'transparent', border: 'none', fontSize: 18,
                                        cursor: 'pointer', color: 'var(--text-muted)',
                                    }, children: "\u2715" })] })] }), _jsxs("div", { style: { padding: '20px 24px', borderBottom: '1px solid var(--border)' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 }, children: [_jsx("span", { style: { fontSize: 11, color: 'var(--text-muted)' }, children: "Start" }), _jsxs("span", { style: { fontSize: 11, color: 'var(--accent)', fontWeight: 500 }, children: [loading ? 'Loading...' : `Op ${count} of ${ops.length}`, currentOp && (_jsx("span", { style: { color: 'var(--text-muted)', marginLeft: 8 }, children: new Date(currentOp.created_at).toLocaleTimeString() }))] }), _jsx("span", { style: { fontSize: 11, color: 'var(--text-muted)' }, children: "Now" })] }), _jsx("input", { ref: sliderRef, type: "range", min: 0, max: 100, value: scrubPos, onChange: e => setScrubPos(Number(e.target.value)), disabled: loading || !ops.length, style: { width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' } })] }), _jsx("div", { style: { flex: 1, overflow: 'auto', padding: 20 }, children: loading ? (_jsx("div", { style: { color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }, children: "Loading history..." })) : !ops.length ? (_jsx("div", { style: { color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }, children: "No history yet \u2014 start editing to record operations." })) : (_jsx("pre", { style: {
                            fontFamily: 'var(--font-mono)', fontSize: 13,
                            color: 'var(--text-primary)', whiteSpace: 'pre-wrap',
                            lineHeight: 1.6, margin: 0,
                        }, children: preview || '(empty)' })) })] }) }));
}
