import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { connectDB } from './db/postgres';
import { connectRedis } from './db/redis';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', env: config.nodeEnv }));
app.use('/auth', authRoutes);
app.use('/sessions', sessionRoutes);

async function start() {
  await connectDB();
  await connectRedis();
  app.listen(config.port, () => {
    console.log(`🚀 Backend running on port ${config.port}`);
  });
}

start().catch(console.error);
