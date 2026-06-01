import { createClient } from 'redis';
import { config } from '../config/env';

export const redis = createClient({ url: config.redisUrl });

export async function connectRedis() {
  await redis.connect();
  const pong = await redis.ping();
  console.log(`✅ Redis connected: ${pong}`);
}
