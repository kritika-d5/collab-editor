interface Peer { username: string; color: string; }
interface Props { peers: Peer[]; currentUser: string; currentColor: string; }

export default function PresenceBar({ peers, currentUser, currentColor }: Props) {
  const all = [{ username: currentUser, color: currentColor }, ...peers];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {all.map((p, i) => (
        <div key={i} title={p.username} style={{
          width: 28, height: 28, borderRadius: '50%',
          background: p.color, border: '2px solid var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: '#fff',
          marginLeft: i === 0 ? 0 : -6, cursor: 'default',
          zIndex: all.length - i,
          position: 'relative',
        }}>
          {p.username[0].toUpperCase()}
        </div>
      ))}
      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
        {all.length} online
      </span>
    </div>
  );
}