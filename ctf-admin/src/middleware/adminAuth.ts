import type { Request, Response, NextFunction } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'

export interface AdminAuthRequest extends Request {
  admin?: {
    id?: string
    email?: string
    role?: string
    [key: string]: unknown
  }
}

type AdminJwtPayload = JwtPayload & {
  id?: string
  email?: string
  role?: string
}

const getTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) return null

  return token
}

export const adminAuth = (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const token = getTokenFromHeader(req.headers.authorization)

  if (!token) {
    res.status(401).json({ message: 'Admin authentication required' })
    return
  }

  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    res.status(500).json({ message: 'JWT secret is not configured' })
    return
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AdminJwtPayload | string

    if (typeof decoded === 'string') {
      res.status(401).json({ message: 'Invalid authentication token' })
      return
    }

    req.admin = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      ...decoded,
    }

    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired authentication token' })
  }
}

export const requireAdminRole = (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.admin) {
    res.status(401).json({ message: 'Admin authentication required' })
    return
  }

  if (req.admin.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' })
    return
  }

  next()
}

export default adminAuth
