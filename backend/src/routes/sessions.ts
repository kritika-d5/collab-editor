import { Router, Response } from 'express';
import { nanoid } from 'nanoid';
import { pool } from '../db/postgres';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate, createSessionSchema } from '../lib/validate';
import { getSessionAccess } from '../lib/lobby';
import { logger } from '../lib/logger';

const router = Router();
router.use(authMiddleware);

// ── Create session ───────────────────────────────────────
router.post('/', validate(createSessionSchema), async (req: AuthRequest, res: Response) => {
  const { language = 'javascript' } = req.body;
  const slug = nanoid(8);

  try {
    const { rows } = await pool.query(
      `INSERT INTO sessions (slug, owner_id, language)
       VALUES ($1, $2, $3)
       RETURNING id, slug, language, created_at`,
      [slug, req.userId, language]
    );
    res.status(201).json({ ...rows[0], owner_id: req.userId, access: 'owner' });
  } catch (err) {
    console.error(err);
    logger.error({ error: err }, 'Could not create session');
    res.status(500).json({ error: 'Could not create session' });
  }
});

// ── Get session by slug ──────────────────────────────────
  router.get('/:slug', async (req: AuthRequest, res: Response) => {
    try {
      const { rows } = await pool.query(
        `SELECT s.id, s.slug, s.language, s.created_at, 
                u.username as owner, s.owner_id
        FROM sessions s
        JOIN users u ON u.id = s.owner_id
        WHERE s.slug = $1`,
        [req.params.slug]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Session not found' });
      const access = await getSessionAccess(req.params.slug, req.userId!);
      res.json({ ...rows[0], access });
  } catch (err) {
    console.error(err);
    logger.error({ error: err, slug: req.params.slug }, 'Could not fetch session');
    res.status(500).json({ error: 'Server error' });
  }
});

// ── List my sessions ─────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, language, created_at
       FROM sessions WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    logger.error({ error: err, userId: req.userId }, 'Could not list sessions');
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Get session history snapshots ────────────────────────
router.get('/:slug/history', async (req: AuthRequest, res: Response) => {
  try {
    const { rows: sessionRows } = await pool.query(
      'SELECT id FROM sessions WHERE slug = $1', [req.params.slug]
    );
    if (!sessionRows[0]) return res.status(404).json({ error: 'Session not found' });

    const { rows } = await pool.query(
      `SELECT seq, payload, created_at
       FROM operations
       WHERE session_id = $1
       ORDER BY seq ASC`,
      [sessionRows[0].id]
    );

    // return as base64 so JSON can carry binary
    const ops = rows.map(r => ({
      seq: r.seq,
      payload: Buffer.from(r.payload).toString('base64'),
      created_at: r.created_at,
    }));

    res.json({ ops, total: ops.length });
  } catch (err) {
    console.error(err);
    logger.error({ error: err, slug: req.params.slug }, 'Could not fetch session history');
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
