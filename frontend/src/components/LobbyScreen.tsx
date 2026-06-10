type LobbyVariant = 'checking' | 'waiting' | 'denied' | 'not_found';

interface Props {
  username: string;
  variant: LobbyVariant;
  onCancel: () => void;
}

export default function LobbyScreen({ username, variant, onCancel }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999, fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '40px 48px',
        textAlign: 'center', maxWidth: 400, width: '100%',
      }}>
        {variant === 'not_found' ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Room not found
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              This session doesn't exist or the link is invalid.
            </p>
            <button onClick={onCancel} style={{
              padding: '10px 24px', borderRadius: 'var(--radius-md)',
              background: 'var(--accent)', color: '#fff',
              border: 'none', fontSize: 14, cursor: 'pointer',
            }}>Go back</button>
          </>
        ) : variant === 'denied' ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Entry denied
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              The host didn't let you in.
            </p>
            <button onClick={onCancel} style={{
              padding: '10px 24px', borderRadius: 'var(--radius-md)',
              background: 'var(--accent)', color: '#fff',
              border: 'none', fontSize: 14, cursor: 'pointer',
            }}>Go back</button>
          </>
        ) : variant === 'checking' ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Checking access
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Verifying room permissions...
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Waiting for host
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{username}</strong>, your request to join has been sent.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
              The host will let you in soon...
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <button onClick={onCancel} style={{
              padding: '8px 20px', borderRadius: 'var(--radius-md)',
              background: 'transparent', color: 'var(--text-muted)',
              border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer',
            }}>Cancel</button>
          </>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
