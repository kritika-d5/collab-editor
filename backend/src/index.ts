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
let depsReady = false;

if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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
  if (!depsReady) {
    return res.status(200).json({ status: 'starting', env: config.nodeEnv });
  }

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

  res.status(200).json({
    status: checks.db === 'ok' && checks.redis === 'ok' ? 'ok' : 'degraded',
    env: config.nodeEnv,
    ...checks,
  });
});

app.use('/auth', authLimiter, authRoutes);
app.use('/sessions', sessionRoutes);

setupYjs(httpServer);
setupChat(io);

async function start() {
  httpServer.listen(config.port, '0.0.0.0', () => {
    logger.info({ port: config.port }, 'Server listening');
  });

  await connectDB();
  await runMigrations();
  await connectRedis();
  depsReady = true;
  logger.info('Dependencies connected');
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
