import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TOKEN_COOKIE_NAME = 'csrf-token';
const TOKEN_HEADER_NAMES = ['x-csrf-token', 'x-xsrf-token'];
const TOKEN_BODY_FIELDS = ['csrfToken', '_csrf'];
const TOKEN_BYTE_LENGTH = 32;
const COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 8;

function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTE_LENGTH).toString('hex');
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function getCookieToken(req: Request): string | undefined {
  const cookies = (req as Request & { cookies?: Record<string, unknown> }).cookies;
  const token = cookies?.[TOKEN_COOKIE_NAME];
  return typeof token === 'string' && token.length > 0 ? token : undefined;
}

function getRequestToken(req: Request): string | undefined {
  for (const headerName of TOKEN_HEADER_NAMES) {
    const headerValue = req.header(headerName);
    if (typeof headerValue === 'string' && headerValue.trim().length > 0) {
      return headerValue.trim();
    }
  }

  const body = (req as Request & { body?: Record<string, unknown> }).body;
  if (body && typeof body === 'object') {
    for (const field of TOKEN_BODY_FIELDS) {
      const value = body[field];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
  }

  return undefined;
}

function shouldSkipValidation(req: Request): boolean {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return true;
  }

  const contentType = req.header('content-type');
  if (contentType && contentType.startsWith('multipart/form-data')) {
    return false;
  }

  return false;
}

function setCsrfCookie(req: Request, res: Response, token: string): void {
  const secure = req.secure || req.header('x-forwarded-proto') === 'https';

  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: 'lax',
    secure,
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });

  res.locals.csrfToken = token;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  let cookieToken = getCookieToken(req);

  if (!cookieToken) {
    cookieToken = generateToken();
    setCsrfCookie(req, res, cookieToken);
  } else {
    res.locals.csrfToken = cookieToken;
  }

  if (shouldSkipValidation(req)) {
    next();
    return;
  }

  const requestToken = getRequestToken(req);

  if (!requestToken || !timingSafeEqual(cookieToken, requestToken)) {
    res.status(403).json({
      error: 'Invalid CSRF token',
    });
    return;
  }

  next();
}

export default csrfProtection;
