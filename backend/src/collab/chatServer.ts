import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { logger } from '../lib/logger';
import { canAccessSession, getSessionOwner, grantLobbyAccess } from '../lib/lobby';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  color: string;
  timestamp: number;
}

// deterministic color from userId
function userColor(userId: string): string {
  const colors = ['#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#8b5cf6'];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function setupChat(io: Server) {
  const chatNsp = io.of('/chat');

  chatNsp.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = jwt.verify(token, config.jwtSecret) as { userId: string; username: string };
      socket.data.userId = payload.userId;
      socket.data.username = payload.username || 'Anonymous';
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  chatNsp.on('connection', (socket) => {
    const { userId, username } = socket.data;
    const color = userColor(userId);

    socket.on('join:room', async (sessionId: string) => {
      if (!await canAccessSession(sessionId, userId)) return;
      socket.join(sessionId);
      socket.to(sessionId).emit('user:joined', { username, color });
    });

    socket.on('chat:message', async (data: { sessionId: string; text: string }) => {
      if (!await canAccessSession(data.sessionId, userId)) return;
      const message: ChatMessage = {
        id: `${Date.now()}-${userId}`,
        userId,
        username,
        text: data.text,
        color,
        timestamp: Date.now(),
      };
      chatNsp.to(data.sessionId).emit('chat:message', message);
    });

    socket.on('lobby:request', async (data: { sessionId: string; username: string }) => {
      const ownerId = await getSessionOwner(data.sessionId);
      if (!ownerId || String(ownerId) === String(userId)) return;

      socket.join(`lobby:${data.sessionId}`);
      socket.to(data.sessionId).emit('lobby:request', {
        username,
        userId,
        color,
        socketId: socket.id,
        sessionId: data.sessionId,
      });
    });

    socket.on('lobby:respond', async (data: { socketId: string; approved: boolean; sessionId: string }) => {
      const ownerId = await getSessionOwner(data.sessionId);
      if (ownerId !== userId) return;

      if (data.approved) {
        const guestSocket = chatNsp.sockets.get(data.socketId);
        if (guestSocket?.data.userId) {
          await grantLobbyAccess(data.sessionId, guestSocket.data.userId);
        }
      }

      chatNsp.to(data.socketId).emit('lobby:response', {
        approved: data.approved,
        sessionId: data.sessionId,
      });
    });

    socket.on('disconnect', () => {
      socket.broadcast.emit('user:left', { username });
    });
  });

  console.log('Chat server ready');
  logger.info('Chat server ready');
}