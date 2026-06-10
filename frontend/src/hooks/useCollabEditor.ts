import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import * as monaco from 'monaco-editor';
import { YJS_URL } from '@/lib/config';

const USER_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#8b5cf6'];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

// unique per browser tab, stable across re-renders but not across refreshes
// this prevents ghost users — each page load gets a fresh clientID
const TAB_CLIENT_ID = Math.floor(Math.random() * 0xFFFFFFFF);

interface UseCollabEditorProps {
  sessionId: string;
  userId: string;
  username: string;
  enabled?: boolean;
}

export function useCollabEditor({ sessionId, userId, username, enabled = true }: UseCollabEditorProps) {
  const ydocRef          = useRef<Y.Doc | null>(null);
  const providerRef      = useRef<WebsocketProvider | null>(null);
  const editorRef        = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef   = useRef<string[]>([]);
  const isApplyingRemote = useRef(false);
  const [connected, setConnected] = useState(false);
  const [peers, setPeers]         = useState<{ username: string; color: string }[]>([]);
  const [language, setLanguage]   = useState('javascript');
  const color = getUserColor(userId);

  useEffect(() => {
    if (!enabled) return;

    const token = sessionStorage.getItem('auth_token');
    const ydoc  = new Y.Doc({ guid: `${sessionId}-${TAB_CLIENT_ID}` });
    const ytext = ydoc.getText('content');
    const ymeta = ydoc.getMap('meta');

    const provider = new WebsocketProvider(
      YJS_URL,
      sessionId,
      ydoc,
      { connect: true, resyncInterval: 3000, params: { token: token ?? '' } }
    );

    const awareness = provider.awareness;
    
    ydocRef.current    = ydoc;
    providerRef.current = provider;

    awareness.setLocalStateField('user', { username, color, userId });

    provider.on('status', ({ status }: { status: string }) => {
      setConnected(status === 'connected');
    });

    // language sync
    const onMetaChange = () => {
      const lang = ymeta.get('language') as string | undefined;
      if (lang) setLanguage(lang);
    };
    ymeta.observe(onMetaChange);

    // debounced peer list — filter by userId not clientID to avoid duplicates
    let peerTimer: ReturnType<typeof setTimeout>;
    const seenUserIds = new Set<string>();

    awareness.on('change', () => {
    clearTimeout(peerTimer);
    peerTimer = setTimeout(() => {
      seenUserIds.clear();
      const others: { username: string; color: string }[] = [];
      awareness.getStates().forEach((state, clientId) => {
        if (clientId === ydoc.clientID) return;
        const u = state.user;
        if (!u?.userId || !u?.username) return;
        if (seenUserIds.has(u.userId)) return;
        seenUserIds.add(u.userId);
        others.push({ username: u.username, color: u.color });
      });
      setPeers(others.filter(p => p.username !== username));
    }, 150);
  });

    // remote Yjs → Monaco
    ytext.observe(() => {
      const editor = editorRef.current;
      if (!editor) return;
      const model = editor.getModel();
      if (!model) return;
      const newValue = ytext.toString();
      if (model.getValue() === newValue) return;
      isApplyingRemote.current = true;
      const pos = editor.getPosition();
      model.pushEditOperations(
        [],
        [{ range: model.getFullModelRange(), text: newValue }],
        () => null
      );
      if (pos) editor.setPosition(pos);
      isApplyingRemote.current = false;
    });

    return () => {
      clearTimeout(peerTimer);
      // tell all peers this client is gone before destroying
      awareness.setLocalState(null);
      setTimeout(() => {
        provider.destroy();
        ydoc.destroy();
      }, 100); // small delay so null state broadcasts first
    };
  }, [sessionId, userId, username, color, enabled]);

  const changeLanguage = useCallback((lang: string) => {
    const ymeta = ydocRef.current?.getMap('meta');
    if (ymeta) ymeta.set('language', lang);
  }, []);

  function bindEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    editorRef.current = editor;
    const ydoc     = ydocRef.current!;
    const ytext    = ydoc.getText('content');
    const provider = providerRef.current!;
    const awareness = provider.awareness;

    // Monaco → Yjs
    editor.onDidChangeModelContent(event => {
      if (isApplyingRemote.current) return;
      ydoc.transact(() => {
        event.changes
          .sort((a, b) => b.rangeOffset - a.rangeOffset)
          .forEach(change => {
            if (change.rangeLength > 0) ytext.delete(change.rangeOffset, change.rangeLength);
            if (change.text) ytext.insert(change.rangeOffset, change.text);
          });
      });
    });

    // throttled cursor broadcast
    let cursorTimer: ReturnType<typeof setTimeout>;
    editor.onDidChangeCursorPosition(e => {
      clearTimeout(cursorTimer);
      cursorTimer = setTimeout(() => {
        const model = editor.getModel();
        if (!model) return;
        awareness.setLocalStateField('cursor', {
          offset: model.getOffsetAt(e.position),
          username, color,
          line: e.position.lineNumber,
          col: e.position.column,
        });
      }, 50);
    });

    // render remote cursors
    let decorTimer: ReturnType<typeof setTimeout>;
    awareness.on('change', () => {
      clearTimeout(decorTimer);
      decorTimer = setTimeout(() => {
        const model = editor.getModel();
        if (!model) return;
        const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];
        awareness.getStates().forEach((state, clientId) => {
          if (clientId === ydoc.clientID) return;
          const cursor = state.cursor;
          const user   = state.user;
          if (!cursor || !user) return;
          try {
            const pos = model.getPositionAt(cursor.offset);
            newDecorations.push({
              range: new monaco.Range(
                pos.lineNumber, pos.column,
                pos.lineNumber, pos.column
              ),
              options: {
                className: 'remote-cursor-line',
                beforeContentClassName: 'remote-cursor-block',
                stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              },
            });
          } catch {}
        });
        decorationsRef.current = editor.deltaDecorations(
          decorationsRef.current,
          newDecorations
        );
      }, 50);
    });
  }

  return { bindEditor, connected, peers, color, language, changeLanguage };
}