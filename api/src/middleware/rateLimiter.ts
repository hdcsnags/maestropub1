import rateLimit, { type Options } from 'express-rate-limit';
import type { Request, Response } from 'express';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 100;

const resolveClientIp = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
    return forwardedFor.split(',')[0]?.trim() || req.ip || 'unknown';
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]?.trim() || req.ip || 'unknown';
  }

  return req.ip || 'unknown';
};

const rateLimitHandler = (_req: Request, res: Response): void => {
  res.status(429).json({
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
  });
};

const rateLimiterConfig: Partial<Options> = {
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveClientIp,
  handler: rateLimitHandler,
};

export const rateLimiter = rateLimit(rateLimiterConfig);

export default rateLimiter;
