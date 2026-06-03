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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', gap: 32 }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Collab Editor</h1>
        <p style={{ color: '#6b7280' }}>Welcome, {user.username}</p>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <button onClick={createRoom} disabled={loading} style={btnPrimary}>
          {loading ? 'Creating...' : '+ New room'}
        </button>
        <button onClick={logout} style={btnSecondary}>Log out</button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="Paste session ID to join"
          value={joinSlug}
          onChange={e => setJoinSlug(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && joinRoom()}
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, width: 260 }}
        />
        <button onClick={joinRoom} style={btnSecondary}>Join</button>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 8, background: '#6366f1',
  color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 8, background: '#fff',
  color: '#374151', border: '1px solid #e5e7eb', fontSize: 14, cursor: 'pointer',
};
