import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api, { setAuthToken } from '@/lib/api';
import toast from 'react-hot-toast';

interface Session { id: string; slug: string; language: string; created_at: string; }

export default function Landing() {
  const { user, logout, accessToken } = useAuth();
  const navigate = useNavigate();
  const [joinSlug, setJoinSlug]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [sessions, setSessions]   = useState<Session[]>([]);

  useEffect(() => {
  if (!user) { navigate('/login'); return; }
  setAuthToken(accessToken);
  api.get('/sessions').then(({ data }) => setSessions(data)).catch(() => {});
}, [user]);

  async function createRoom() {
    setLoading(true);
    try {
      const { data } = await api.post('/sessions', { language: 'javascript' });
      navigate(`/editor/${data.slug}`);
    } catch {
      toast.error('Failed to create room');
    } finally {
      setLoading(false);
    }
  }

  function joinRoom() {
    const slug = joinSlug.trim();
    if (!slug) return toast.error('Enter a session ID');
    navigate(`/editor/${slug}`);
  }

  if (!user) return null;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Navbar */}
      <nav style={{
        height: 56, borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 32px',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 20, color: 'var(--accent)' }}>{'{'}</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>collab</span>
          <span style={{ fontSize: 20, color: 'var(--accent)' }}>{'}'}</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, color: '#fff',
          }}>{user.username[0].toUpperCase()}</div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.username}</span>
          <button onClick={logout} style={{
            fontSize: 12, color: 'var(--text-muted)', background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            padding: '4px 10px', cursor: 'pointer',
          }}>Log out</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: '64px 32px 32px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <h1 style={{
          fontSize: 36, fontWeight: 700, color: 'var(--text-primary)',
          letterSpacing: -0.5, marginBottom: 12,
        }}>
          Code together,<br />
          <span style={{ color: 'var(--accent)' }}>in real time.</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.6 }}>
          Create a room, shareeeee the link, and collaborate instantly.
          No setup, no frictio.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
          <button onClick={createRoom} disabled={loading} style={{
            padding: '12px 28px', borderRadius: 'var(--radius-md)',
            background: 'var(--accent)', color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
          }}>
            {loading ? 'Creating...' : '+ New room'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="Paste session ID to join..."
              value={joinSlug}
              onChange={e => setJoinSlug(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && joinRoom()}
              style={{
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                fontSize: 14, color: 'var(--text-primary)', outline: 'none',
                width: 260, fontFamily: 'var(--font-sans)',
              }}
            />
            <button onClick={joinRoom} style={{
              padding: '12px 20px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)', color: 'var(--text-primary)',
              border: '1px solid var(--border)', fontSize: 14, cursor: 'pointer',
            }}>Join</button>
          </div>
        </div>

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>
              Your recent rooms
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.slice(0, 5).map(s => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/editor/${s.slug}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-hover)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>{'</>'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {s.slug}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {s.language} · {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--accent)' }}>Open →</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}