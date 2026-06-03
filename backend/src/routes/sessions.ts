import { Router, Response } from 'express';
import { nanoid } from 'nanoid';
import { pool } from '../db/postgres';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ── Create session ───────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  const { language = 'javascript' } = req.body;
  const slug = nanoid(8);

  try {
    const { rows } = await pool.query(
      `INSERT INTO sessions (slug, owner_id, language)
       VALUES ($1, $2, $3)
       RETURNING id, slug, language, created_at`,
      [slug, req.userId, language]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create session' });
  }
});

// ── Get session by slug ──────────────────────────────────
router.get('/:slug', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.slug, s.language, s.created_at, u.username as owner
       FROM sessions s
       JOIN users u ON u.id = s.owner_id
       WHERE s.slug = $1`,
      [req.params.slug]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Session not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
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
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
