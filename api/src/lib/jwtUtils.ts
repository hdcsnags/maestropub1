import jwt, { SignOptions, Secret, JwtPayload } from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload extends JwtPayload {
  userId: string;
  email?: string;
  role?: string;
  tokenVersion?: number;
  type?: 'access' | 'refresh';
}

function getAccessTokenSecret(): Secret {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return secret;
}

function getRefreshTokenSecret(): Secret {
  return process.env.JWT_REFRESH_SECRET || getAccessTokenSecret();
}

export function generateAccessToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp' | 'nbf' | 'jti'>): string {
  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  };

  return jwt.sign({ ...payload, type: 'access' }, getAccessTokenSecret(), options);
}

export function generateRefreshToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp' | 'nbf' | 'jti'>): string {
  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  };

  return jwt.sign({ ...payload, type: 'refresh' }, getRefreshTokenSecret(), options);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, getAccessTokenSecret()) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, getRefreshTokenSecret()) as TokenPayload;
}

export function decodeToken(token: string): TokenPayload | null {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === 'string') {
    return null;
  }

  return decoded as TokenPayload;
}

export function generateTokenPair(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp' | 'nbf' | 'jti'>): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
