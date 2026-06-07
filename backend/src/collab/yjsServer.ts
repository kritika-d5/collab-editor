import { IncomingMessage, Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { pool } from '../db/postgres';

interface Room {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  clients: Set<WebSocket>;
}

// one room per sessionId — completely isolated
const rooms = new Map<string, Room>();

const MESSAGE_SYNC      = 0;
const MESSAGE_AWARENESS = 1;

async function getOrCreateRoom(sessionId: string): Promise<Room> {
  if (rooms.has(sessionId)) return rooms.get(sessionId)!;

  const doc       = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);
  const clients   = new Set<WebSocket>();

  // load saved state from postgres
  try {
    const { rows } = await pool.query(
      'SELECT doc_state FROM sessions WHERE slug = $1', [sessionId]
    );
    if (rows[0]?.doc_state) {
      Y.applyUpdate(doc, rows[0].doc_state);
      console.log(`📄 Loaded doc state for room: ${sessionId}`);
    }
  } catch (err) {
    console.error(`Failed to load doc state for ${sessionId}:`, err);
  }

  let seqCounter = 0;
  let snapshotTimer: ReturnType<typeof setTimeout> | null = null;

  doc.on('update', async (update: Uint8Array) => {
    // broadcast to all clients in this room
    const msg = encodeSync(update);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(msg);
    });

    // debounce snapshot saving — only save after 3s of inactivity
    if (snapshotTimer) clearTimeout(snapshotTimer);
    snapshotTimer = setTimeout(async () => {
      seqCounter++;
      const state = Y.encodeStateAsUpdate(doc);
      try {
        // save snapshot to operations table
        await pool.query(
          `INSERT INTO operations (session_id, seq, payload, user_id)
          SELECT s.id, $2, $3, s.owner_id
          FROM sessions s WHERE s.slug = $1`,
          [sessionId, seqCounter, Buffer.from(state)]
        );
        // also update doc_state
        await pool.query(
          'UPDATE sessions SET doc_state = $1 WHERE slug = $2',
          [Buffer.from(state), sessionId]
        );
        console.log(`💾 Snapshot saved for room: ${sessionId} (seq ${seqCounter})`);
      } catch (err) {
        console.error(`Failed to save snapshot for ${sessionId}:`, err);
      }
    }, 3000);
  });

  awareness.on('update', ({ added, updated, removed }: any) => {
    const changedClients = [...added, ...updated, ...removed];
    const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
    const msg    = encodeAwareness(update);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(msg);
    });
  });

  const room = { doc, awareness, clients };
  rooms.set(sessionId, room);
  return room;
}

function encodeSync(update: Uint8Array): Uint8Array {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_SYNC);
  syncProtocol.writeUpdate(encoder, update);
  return encoding.toUint8Array(encoder);
}

function encodeAwareness(update: Uint8Array): Uint8Array {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
  encoding.writeVarUint8Array(encoder, update);
  return encoding.toUint8Array(encoder);
}

export function setupYjs(httpServer: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req: IncomingMessage, socket, head) => {
    if ((req.url || '').startsWith('/yjs')) {
      wss.handleUpgrade(req, socket as any, head, ws => {
        wss.emit('connection', ws, req);
      });
    }
  });

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const url       = new URL(req.url!, `http://localhost`);
    // y-websocket sends room as the last path segment e.g. /yjs/aB3kR7xQ
    const pathParts = url.pathname.split('/').filter(Boolean);
    const sessionId = pathParts[pathParts.length - 1] || url.searchParams.get('room') || 'default';

    const room = await getOrCreateRoom(sessionId);
    room.clients.add(ws);

    console.log(`👤 Client joined room: ${sessionId} (${room.clients.size} total)`);

    // send current doc state to new client
    const syncEncoder = encoding.createEncoder();
    encoding.writeVarUint(syncEncoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(syncEncoder, room.doc);
    ws.send(encoding.toUint8Array(syncEncoder));

    // send current awareness states
    const awarenessStates = room.awareness.getStates();
    if (awarenessStates.size > 0) {
      const update = awarenessProtocol.encodeAwarenessUpdate(
        room.awareness,
        Array.from(awarenessStates.keys())
      );
      ws.send(encodeAwareness(update));
    }

    ws.on('message', (data: Buffer) => {
      try {
        const decoder     = decoding.createDecoder(new Uint8Array(data));
        const messageType = decoding.readVarUint(decoder);

        if (messageType === MESSAGE_SYNC) {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, room.doc, null);
          if (encoding.length(encoder) > 1) ws.send(encoding.toUint8Array(encoder));

        } else if (messageType === MESSAGE_AWARENESS) {
          const update = decoding.readVarUint8Array(decoder);
          // clientID 0 means broadcast from server, use ws as origin
          awarenessProtocol.applyAwarenessUpdate(room.awareness, update, ws);
        }
      } catch (err) {
        console.error('Error handling message:', err);
      }
    });

    ws.on('close', () => {
      room.clients.delete(ws);
      console.log(`👋 Client left room: ${sessionId} (${room.clients.size} remaining)`);
      // immediately remove this client's awareness state
      awarenessProtocol.removeAwarenessStates(
        room.awareness,
        Array.from(room.awareness.getStates().keys()).filter(id => {
          // find clientIDs associated with this ws connection
          return room.awareness.meta.get(id)?.clock !== undefined;
        }),
        ws
      );

      // clean up empty rooms after 30s to free memory
      if (room.clients.size === 0) {
        setTimeout(async () => {
          if (rooms.get(sessionId)?.clients.size === 0) {
            // persist final state before removing from memory
            try {
              const state = Y.encodeStateAsUpdate(room.doc);
              await pool.query(
                'UPDATE sessions SET doc_state = $1 WHERE slug = $2',
                [Buffer.from(state), sessionId]
              );
            } catch {}
            rooms.delete(sessionId);
            console.log(`🗑️  Cleaned up empty room: ${sessionId}`);
          }
        }, 30000);
      }
    });

    ws.on('error', (err) => {
      console.error(`WebSocket error in room ${sessionId}:`, err);
      room.clients.delete(ws);
    });
  });

  console.log('Yjs WebSocket server ready');
}