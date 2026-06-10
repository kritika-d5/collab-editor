import { redis } from '../db/redis';
import { pool } from '../db/postgres';

const APPROVED_TTL = 60 * 60 * 24;

const approvedKey = (slug: string) => `lobby:approved:${slug}`;

export type SessionAccess = 'owner' | 'approved' | 'pending' | 'not_found';

export async function getSessionOwner(slug: string): Promise<string | null> {
  const { rows } = await pool.query(
    'SELECT owner_id FROM sessions WHERE slug = $1',
    [slug]
  );
  return rows[0]?.owner_id ?? null;
}

export async function getSessionAccess(slug: string, userId: string): Promise<SessionAccess> {
  const ownerId = await getSessionOwner(slug);
  if (!ownerId) return 'not_found';
  if (String(ownerId) === String(userId)) return 'owner';
  if (await redis.sIsMember(approvedKey(slug), userId)) return 'approved';
  return 'pending';
}

export async function grantLobbyAccess(slug: string, userId: string): Promise<void> {
  await redis.sAdd(approvedKey(slug), userId);
  await redis.expire(approvedKey(slug), APPROVED_TTL);
}

export async function canAccessSession(slug: string, userId: string): Promise<boolean> {
  const access = await getSessionAccess(slug, userId);
  return access === 'owner' || access === 'approved';
}
