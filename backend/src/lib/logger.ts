import pino from 'pino';
import { config } from '../config/env';

export const logger = pino({
  level: 'info',
  transport: config.nodeEnv === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,   // plain JSON in production
});