import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';

const router = Router();

type LoginBody = {
  email?: string;
  password?: string;
};

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
};

const users = new Map<
  string,
  {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: string;
  }
>();

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const createToken = (userId: string): string => {
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64url');
};

router.post('/register', (req: Request<unknown, unknown, RegisterBody>, res: Response) => {
  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'name, email, and password are required',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (users.has(normalizedEmail)) {
    return res.status(409).json({
      error: 'user already exists',
    });
  }

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  users.set(normalizedEmail, user);

  return res.status(201).json({
    token: createToken(user.id),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

router.post('/login', (req: Request<unknown, unknown, LoginBody>, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({
      error: 'email and password are required',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = users.get(normalizedEmail);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({
      error: 'invalid credentials',
    });
  }

  return res.status(200).json({
    token: createToken(user.id),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

router.get('/me', (_req: Request, res: Response) => {
  return res.status(501).json({
    error: 'not implemented',
  });
});

export default router;
