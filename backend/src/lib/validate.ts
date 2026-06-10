import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };

// Schemas
export const registerSchema = z.object({
  username: z.string().min(3).max(32).regex(/^\w+$/, 'Alphanumeric + underscore only'),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createSessionSchema = z.object({
  language: z.enum(['javascript', 'typescript', 'python', 'go', 'rust', 'html', 'css', 'json']),
});