import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { connectDB, pool } from './db/postgres';
import { connectRedis, redis } from './db/redis';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import { setupYjs } from './collab/yjsServer';
import { setupChat } from './collab/chatServer';

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', env: config.nodeEnv }));
app.use('/auth', authRoutes);
app.use('/sessions', sessionRoutes);

setupYjs(httpServer);
setupChat(io);

async function start() {
  await connectDB();
  await connectRedis();
  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

start().catch(console.error);