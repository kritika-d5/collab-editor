import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(username, email, password);
        toast.success('Account created!');
      } else {
        await login(email, password);
        toast.success('Welcome back!');
      }
      navigate('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg-primary)', fontFamily: 'var(--font-sans)',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 48,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 28, color: 'var(--accent)' }}>{'{'}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>collab</span>
            <span style={{ fontSize: 28, color: 'var(--accent)' }}>{'}'}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Real-time collaborative code editor</p>
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 380,
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '32px',
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            {mode === 'login' ? 'Welcome back' : 'Start collaborating in seconds'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div>
                <label style={labelStyle}>Username</label>
                <input
                  placeholder="yourname"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  style={inputStyle} required
                />
              </div>
            )}
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle} required
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle} required
              />
            </div>
            <button type="submit" disabled={loading} style={{
              padding: '11px', borderRadius: 'var(--radius-md)',
              background: loading ? 'var(--bg-hover)' : 'var(--accent)',
              color: loading ? 'var(--text-muted)' : '#fff',
              border: 'none', fontSize: 14, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4, transition: 'background 0.2s',
            }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </span>
          </p>
        </div>
      </div>

      {/* Right panel — decorative */}
      <div style={{
        flex: 1, background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 48,
      }}>
        <div style={{
          background: 'var(--bg-primary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px 28px',
          fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.8,
          color: 'var(--text-secondary)', maxWidth: 380, width: '100%',
        }}>
          <div style={{ color: '#546e7a', marginBottom: 4 }}>{'// collab.ts'}</div>
          <div><span style={{ color: '#c792ea' }}>const</span> <span style={{ color: '#82aaff' }}>room</span> <span style={{ color: '#89ddff' }}>=</span> <span style={{ color: '#c3e88d' }}>'aB3kR7xQ'</span></div>
          <div style={{ marginTop: 8 }}><span style={{ color: '#c792ea' }}>await</span> <span style={{ color: '#82aaff' }}>joinRoom</span><span style={{ color: '#89ddff' }}>(room)</span></div>
          <div style={{ marginTop: 8, color: '#546e7a' }}>{'// ✅ 3 users connected'}</div>
          <div style={{ marginTop: 8, color: '#546e7a' }}>{'// ✅ changes syncing'}</div>
          <div style={{ marginTop: 8, color: '#546e7a' }}>{'// ✅ no conflicts'}</div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: 'var(--text-secondary)', marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
  background: 'var(--bg-primary)', fontSize: 13,
  color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
};