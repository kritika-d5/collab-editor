import { createClient } from 'redis';
import { config } from '../config/env';

export const redis = createClient({
  url: config.redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

redis.on('error', (err) => {
  console.error('Redis client error:', err);
});

export async function connectRedis() {
  await redis.connect();
  const pong = await redis.ping();
  console.log(`Redis connected: ${pong}`);
}