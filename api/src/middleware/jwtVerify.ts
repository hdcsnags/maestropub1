import type { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | string;
    }
  }
}

const getBearerToken = (authorization?: string): string | null => {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');

  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token;
};

const jwtVerify = (req: Request, res: Response, next: NextFunction): void => {
  const token = getBearerToken(req.headers.authorization);
  const secret = process.env.JWT_SECRET;

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  if (!secret) {
    res.status(500).json({ message: 'JWT secret is not configured.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (_error) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export default jwtVerify;
