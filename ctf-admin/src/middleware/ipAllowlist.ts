import type { Request, Response, NextFunction } from 'express';

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

function isEnabled(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return TRUE_VALUES.has(value.trim().toLowerCase());
}

function normalizeIp(ip: string): string {
  const trimmed = ip.trim();

  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice(7);
  }

  if (trimmed === '::1') {
    return '127.0.0.1';
  }

  return trimmed;
}

function extractIps(req: Request): string[] {
  const values = new Set<string>();

  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    forwardedFor
      .split(',')
      .map((entry) => normalizeIp(entry))
      .filter(Boolean)
      .forEach((ip) => values.add(ip));
  } else if (Array.isArray(forwardedFor)) {
    forwardedFor
      .flatMap((entry) => entry.split(','))
      .map((entry) => normalizeIp(entry))
      .filter(Boolean)
      .forEach((ip) => values.add(ip));
  }

  if (req.ip) {
    values.add(normalizeIp(req.ip));
  }

  const socketAddress = req.socket?.remoteAddress;
  if (socketAddress) {
    values.add(normalizeIp(socketAddress));
  }

  return Array.from(values);
}

function getAllowlist(): Set<string> {
  const raw = process.env.ADMIN_IP_ALLOWLIST ?? process.env.IP_ALLOWLIST ?? '';

  return new Set(
    raw
      .split(',')
      .map((entry) => normalizeIp(entry))
      .filter(Boolean),
  );
}

function deny(res: Response): void {
  res.status(403).json({
    error: 'forbidden',
    message: 'Access denied from this IP address.',
  });
}

export function ipAllowlist(req: Request, res: Response, next: NextFunction): void {
  const enforcementEnabled = isEnabled(process.env.ADMIN_IP_ALLOWLIST_ENABLED);

  if (!enforcementEnabled) {
    next();
    return;
  }

  const allowlist = getAllowlist();

  if (allowlist.size === 0) {
    deny(res);
    return;
  }

  const requestIps = extractIps(req);
  const isAllowed = requestIps.some((ip) => allowlist.has(ip));

  if (!isAllowed) {
    deny(res);
    return;
  }

  next();
}

export default ipAllowlist;
