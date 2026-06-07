import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  username: string;
  text: string;
  color: string;
  timestamp: number;
  system?: boolean;
}

interface Props { sessionId: string; }

export default function ChatSidebar({ sessionId }: Props) {
  const { user, accessToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accessToken) return;
    const s = io('http://localhost:4000/chat', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    s.emit('join:room', sessionId);
    s.on('chat:message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });
    s.on('user:joined', ({ username, color }: { username: string; color: string }) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), username, text: `${username} joined`, color, timestamp: Date.now(), system: true
      }]);
    });
    s.on('user:left', ({ username }: { username: string }) => {
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
    if (!input.trim() || !socket) return;
    socket.emit('chat:message', { sessionId, text: input.trim() });
    setInput('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
            No messages yet. Say hi! 👋
          </p>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{ opacity: msg.system ? 0.5 : 1 }}>
            {!msg.system && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: msg.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: msg.color }}>{msg.username}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            <p style={{
              fontSize: msg.system ? 11 : 12,
              color: msg.system ? 'var(--text-muted)' : 'var(--text-secondary)',
              paddingLeft: msg.system ? 0 : 12,
              fontStyle: msg.system ? 'italic' : 'normal',
              lineHeight: 1.5,
              textAlign: msg.system ? 'center' : 'left',
            }}>{msg.system ? msg.text : msg.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Message..."
          style={{
            flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: 12,
            color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)',
          }}
        />
        <button onClick={sendMessage} style={{
          background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)',
          padding: '6px 10px', color: '#fff', fontSize: 13, cursor: 'pointer',
        }}>→</button>
      </div>
    </div>
  );
}