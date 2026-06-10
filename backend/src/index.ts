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
import rateLimit from 'express-rate-limit';
import { logger } from './lib/logger';
import { runMigrations } from './db/migrate';

const app = express();
const httpServer = createServer(app);

if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again after 15 minutes.' },
});

export const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());

app.get('/health', async (_req, res) => {
  const checks = { db: 'ok' as 'ok' | 'error', redis: 'ok' as 'ok' | 'error' };
  try {
    await pool.query('SELECT 1');
  } catch {
    checks.db = 'error';
  }
  try {
    await redis.ping();
  } catch {
    checks.redis = 'error';
  }
  const healthy = checks.db === 'ok' && checks.redis === 'ok';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    env: config.nodeEnv,
    ...checks,
  });
});
app.use('/auth', authLimiter, authRoutes);
app.use('/sessions', sessionRoutes);

setupYjs(httpServer);
setupChat(io);

async function start() {
  await connectDB();
  await runMigrations();
  await connectRedis();
  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    logger.info({ port: config.port }, 'Server running');
  });
}

start().catch(console.error);