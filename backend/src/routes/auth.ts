import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/postgres';
import { redis } from '../db/redis';
import { config } from '../config/env';
import { validate, registerSchema, loginSchema } from '../lib/validate';


const router = Router();

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hash]
    );
    const user = rows[0];
    const { accessToken, refreshToken } = generateTokens(user.id, user.username);
    await storeRefreshToken(user.id, refreshToken);
    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err: any) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Username or email already taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, password FROM users WHERE email = $1', [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const { accessToken, refreshToken } = generateTokens(user.id, user.username);
    await storeRefreshToken(user.id, refreshToken);
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
  try {
    const payload = jwt.verify(refreshToken, config.jwtRefreshSecret) as { userId: string; username: string };
    const stored = await redis.get(`refresh:${payload.userId}`);
    if (stored !== refreshToken) return res.status(401).json({ error: 'Invalid refresh token' });
    const { accessToken, refreshToken: newRefresh } = generateTokens(payload.userId, payload.username);
    await storeRefreshToken(payload.userId, newRefresh);
    res.json({ accessToken, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (userId) await redis.del(`refresh:${userId}`);
  res.json({ message: 'Logged out' });
});

function generateTokens(userId: string, username: string) {
  const accessToken = jwt.sign({ userId, username }, config.jwtSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, username }, config.jwtRefreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

async function storeRefreshToken(userId: string, token: string) {
  await redis.set(`refresh:${userId}`, token, { EX: 60 * 60 * 24 * 7 });
}

export default router;