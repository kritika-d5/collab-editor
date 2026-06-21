import { Router, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../lib/validate';
import { logger } from '../lib/logger';

const router = Router();
router.use(authMiddleware);

const JUDGE0_BASE = 'https://ce.judge0.com';

// Judge0 language IDs for the languages your editor supports
const LANGUAGE_IDS: Record<string, number> = {
  javascript: 63,  // Node.js
  typescript: 74,
  python: 71,
  go: 60,
  rust: 73,
};

const executeSchema = z.object({
  language: z.enum(['javascript', 'typescript', 'python', 'go', 'rust']),
  code: z.string().min(1).max(50000),
});

router.post('/', validate(executeSchema), async (req: AuthRequest, res: Response) => {
  const { language, code } = req.body;
  const languageId = LANGUAGE_IDS[language];

  if (!languageId) {
    return res.status(400).json({ error: `Running ${language} is not supported` });
  }

  try {
    // 1. Submit the code
    const { data: submission } = await axios.post(
      `${JUDGE0_BASE}/submissions?base64_encoded=false&wait=false`,
      {
        source_code: code,
        language_id: languageId,
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const token = submission.token;

    // 2. Poll for the result (max ~10 seconds)
    let result;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const { data } = await axios.get(
        `${JUDGE0_BASE}/submissions/${token}?base64_encoded=false`,
        { timeout: 10000 }
      );
      // status.id 1 = In Queue, 2 = Processing — keep polling until neither
      if (data.status.id !== 1 && data.status.id !== 2) {
        result = data;
        break;
      }
    }

    if (!result) {
      return res.status(504).json({ error: 'Execution timed out' });
    }

    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      status: result.status.description,
      time: result.time,
      memory: result.memory,
    });
  } catch (err) {
    logger.error({ err }, 'Judge0 execution failed');
    res.status(500).json({ error: 'Code execution failed' });
  }
});

export default router;