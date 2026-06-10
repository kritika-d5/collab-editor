import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCollabEditor } from '@/hooks/useCollabEditor';
import ChatSidebar from '@/components/ChatSidebar';
import PresenceBar from '@/components/PresenceBar';
import HistoryTimeline from '@/components/HistoryTimeline';
import LobbyScreen from '@/components/LobbyScreen';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';
import { CHAT_URL } from '@/lib/config';
import { useEffect } from 'react';


import toast from 'react-hot-toast';

const LANGUAGES = ['javascript','typescript','python','go','rust','html','css','json'];

export default function Editor() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, accessToken } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [lineCol, setLineCol] = useState('Ln 1, Col 1');
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'users'>('chat');
  const [showHistory, setShowHistory] = useState(false);
  const monacoRef = useRef<any>(null);
  type LobbyState = 'checking' | 'waiting' | 'denied' | 'enter' | 'not_found';
  const [lobbyState, setLobbyState] = useState<LobbyState>('checking');
  const socketRef                   = useRef<Socket | null>(null);

  const canEnter = lobbyState === 'enter';

  const { bindEditor, connected, peers, color, language, changeLanguage } = useCollabEditor({
    sessionId: sessionId!,
    userId: user?.id || 'anonymous',
    username: user?.username || 'Anonymous',
    enabled: canEnter,
  });

  const handleEditorMount = useCallback((editor: any) => {
    monacoRef.current = editor;
    console.log('Editor mounted, getValue test:', editor.getValue());
    bindEditor(editor);
    editor.onDidChangeCursorPosition((e: any) => {
      setLineCol(`Ln ${e.position.lineNumber}, Col ${e.position.column}`);
    });
  }, [bindEditor]);

  useEffect(() => {
    if (!user || !sessionId || !accessToken) return;

    setLobbyState('checking');
    socketRef.current?.disconnect();
    socketRef.current = null;

    const s = io(CHAT_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = s;

    const joinRoom = () => s.emit('join:room', sessionId);

    const setupOwner = () => {
      s.on('connect', joinRoom);
      s.on('lobby:request', (data: { username: string; socketId: string; color: string; userId: string }) => {
        if (String(data.userId) === String(user.id)) return;
        toast((t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
              <span style={{ color: data.color }}>●</span> {data.username} wants to join
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  socketRef.current?.emit('lobby:respond', {
                    socketId: data.socketId,
                    approved: true,
                    sessionId,
                  });
                  toast.dismiss(t.id);
                  toast.success(`${data.username} let in`);
                }}
                style={{
                  padding: '5px 14px', borderRadius: 6,
                  background: '#22c55e', color: '#fff',
                  border: 'none', cursor: 'pointer', fontSize: 12,
                }}
              >Accept</button>
              <button
                onClick={() => {
                  socketRef.current?.emit('lobby:respond', {
                    socketId: data.socketId,
                    approved: false,
                    sessionId,
                  });
                  toast.dismiss(t.id);
                }}
                style={{
                  padding: '5px 14px', borderRadius: 6,
                  background: '#ef4444', color: '#fff',
                  border: 'none', cursor: 'pointer', fontSize: 12,
                }}
              >Reject</button>
            </div>
          </div>
        ), { duration: 30000 });
      });
      if (s.connected) joinRoom();
      setLobbyState('enter');
    };

    const setupApprovedGuest = () => {
      s.on('connect', joinRoom);
      if (s.connected) joinRoom();
      setLobbyState('enter');
    };

    const setupPendingGuest = () => {
      let requested = false;
      const requestEntry = () => {
        if (requested) return;
        requested = true;
        s.emit('lobby:request', { sessionId, username: user.username });
        setLobbyState('waiting');
      };

      s.on('connect', requestEntry);
      s.on('lobby:response', ({ approved }: { approved: boolean }) => {
        if (approved) {
          joinRoom();
          setLobbyState('enter');
          toast.success('You\'ve been let in!');
        } else {
          setLobbyState('denied');
        }
      });

      if (s.connected) requestEntry();
    };

    const justCreated = (location.state as { justCreated?: boolean } | null)?.justCreated;
    if (justCreated) {
      window.history.replaceState({}, '', location.pathname);
      setupOwner();
      return () => {
        socketRef.current?.disconnect();
        socketRef.current = null;
      };
    }

    api.get(`/sessions/${sessionId}`)
      .then(({ data }) => {
        const { access, owner_id } = data as {
          access: 'owner' | 'approved' | 'pending';
          owner_id: string;
        };
        const isOwner = String(owner_id) === String(user.id);

        if (isOwner || access === 'owner') {
          setupOwner();
        } else if (access === 'approved') {
          setupApprovedGuest();
        } else if (access === 'pending') {
          setupPendingGuest();
        } else {
          setLobbyState('denied');
        }
      })
      .catch((err) => {
        s.disconnect();
        socketRef.current = null;
        if (err.response?.status === 404) setLobbyState('not_found');
        else setLobbyState('denied');
      });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user, sessionId, accessToken, location.pathname, location.state]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  }

  function downloadFile() {
    // try monacoRef first, then query the DOM model
    let content = monacoRef.current?.getValue();
    
    if (!content) {
      // fallback — get all text from Monaco's model
      const models = (window as any).monaco?.editor?.getModels();
      if (models?.length) content = models[0].getValue();
    }

    if (!content) {
      toast.error('Editor is empty');
      return;
    }

    const extensions: Record<string, string> = {
      javascript: 'js', typescript: 'ts', python: 'py',
      go: 'go', rust: 'rs', html: 'html', css: 'css', json: 'json',
    };
    const ext  = extensions[language] || 'txt';
    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${sessionId}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded as ${sessionId}.${ext}`);
  }

  if (!user) { navigate('/login'); return null; }

  if (lobbyState !== 'enter') {
    return (
      <LobbyScreen
        username={user.username}
        variant={lobbyState}
        onCancel={() => navigate('/')}
      />
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 44, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0,
      }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16, color: 'var(--accent)' }}>{'{'}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.3 }}>collab</span>
          <span style={{ fontSize: 16, color: 'var(--accent)' }}>{'}'}</span>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        <div style={{
          fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-hover)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          padding: '3px 10px', fontFamily: 'var(--font-mono)',
        }}>{sessionId}</div>

        {/* Language selector — writes to Yjs, syncs to all users */}
        <select
          value={language}
          onChange={e => changeLanguage(e.target.value)}
          style={{
            fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-hover)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            padding: '3px 8px', outline: 'none', cursor: 'pointer',
          }}
        >
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <div style={{ flex: 1 }} />

        <PresenceBar peers={peers} currentUser={user.username} currentColor={color} />
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        <button onClick={copyLink} style={{
          fontSize: 11, color: 'var(--accent)', background: 'transparent',
          border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)',
          padding: '4px 12px', cursor: 'pointer',
        }}>⎘ Share</button>

        <button onClick={downloadFile} style={{
          fontSize: 11, color: 'var(--text-secondary)', background: 'transparent',
          border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)',
          padding: '4px 12px', cursor: 'pointer',
        }}>⬇ Download</button>

        <button onClick={() => setShowHistory(true)} style={{
          fontSize: 11, color: 'var(--text-secondary)', background: 'transparent',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          padding: '4px 12px', cursor: 'pointer',
        }}>⏱ History</button>

        <button onClick={toggle} style={{
          background: 'transparent', border: 'none', fontSize: 16,
          cursor: 'pointer', color: 'var(--text-secondary)',
        }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <MonacoEditor
            height="100%"
            language={language}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            onMount={handleEditorMount}
            options={{
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
            }}
          />
        </div>

        {/* Sidebar */}
        <div style={{
          width: 260, background: 'var(--bg-tertiary)',
          borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {(['chat', 'users'] as const).map(tab => (
              <button key={tab} onClick={() => setSidebarTab(tab)} style={{
                flex: 1, padding: '9px 0', fontSize: 11, fontWeight: 500,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: sidebarTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: `2px solid ${sidebarTab === tab ? 'var(--accent)' : 'transparent'}`,
                textTransform: 'capitalize',
              }}>
                {tab === 'chat' ? '💬 Chat' : '👥 Users'}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            {sidebarTab === 'chat' ? (
              <ChatSidebar sessionId={sessionId!} />
            ) : (
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ username: user.username, color }, ...peers].map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-hover)',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: p.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0,
                    }}>{p.username[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {p.username}{i === 0 ? ' (you)' : ''}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--green)' }}>● online</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div style={{
        height: 22, background: connected ? 'var(--accent)' : 'var(--red)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 16, flexShrink: 0,
        transition: 'background 0.3s',
      }}>
        {[
          connected ? '⚡ Connected' : '✕ Disconnected',
          `${peers.length + 1} online`,
          language,
          lineCol,
        ].map((item, i) => (
          <span key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>{item}</span>
        ))}
      </div>
      <HistoryTimeline
        sessionId={sessionId!}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={(content) => {
          monacoRef.current?.setValue(content);
          setShowHistory(false);
          toast.success('Version restored!');
        }}
      />
    </div>
  );
}