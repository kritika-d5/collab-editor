interface Props {
  isOpen: boolean;
  isRunning: boolean;
  result: {
    stdout: string | null;
    stderr: string | null;
    compile_output: string | null;
    status: string;
    time: string | null;
    memory: number | null;
  } | null;
  onClose: () => void;
}

export default function OutputPanel({ isOpen, isRunning, result, onClose }: Props) {
  if (!isOpen) return null;

  const hasError = result?.stderr || result?.compile_output;

  return (
    <div style={{
      height: 200, background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
            OUTPUT
          </span>
          {result && (
            <span style={{
              fontSize: 10, color: hasError ? 'var(--red)' : 'var(--green)',
              padding: '2px 8px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-hover)',
            }}>
              {result.status}
            </span>
          )}
          {result?.time && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {result.time}s · {result.memory ? `${Math.round(result.memory / 1024)}MB` : ''}
            </span>
          )}
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: 14, padding: '2px 6px',
        }}>✕</button>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '10px 14px',
        fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {isRunning ? (
          <span style={{ color: 'var(--text-muted)' }}>Running...</span>
        ) : !result ? (
          <span style={{ color: 'var(--text-muted)' }}>Click ▶ Run to execute your code</span>
        ) : (
          <>
            {result.compile_output && (
              <div style={{ color: 'var(--red)', marginBottom: 8 }}>{result.compile_output}</div>
            )}
            {result.stdout && (
              <div style={{ color: 'var(--text-primary)' }}>{result.stdout}</div>
            )}
            {result.stderr && (
              <div style={{ color: 'var(--red)' }}>{result.stderr}</div>
            )}
            {!result.stdout && !result.stderr && !result.compile_output && (
              <span style={{ color: 'var(--text-muted)' }}>No output</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}