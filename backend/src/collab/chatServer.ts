import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

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

    socket.on('join:room', (sessionId: string) => {
      socket.join(sessionId);
      socket.to(sessionId).emit('user:joined', { username, color });
    });

    socket.on('chat:message', (data: { sessionId: string; text: string }) => {
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

    socket.on('disconnect', () => {
      socket.broadcast.emit('user:left', { username });
    });
  });

  console.log('Chat server ready');
}