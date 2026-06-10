import { Pool } from 'pg';
import { config } from '../config/env';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : undefined,
});

export async function connectDB() {
  const client = await pool.connect();
  console.log('✅ PostgreSQL connected');
  client.release();
}
