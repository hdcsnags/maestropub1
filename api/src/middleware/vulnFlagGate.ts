import type { NextFunction, Request, Response } from 'express';

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on', 'enabled']);

const normalizeEnvValue = (value: string | undefined): string =>
  (value ?? '').trim().toLowerCase();

const isFlagEnabled = (value: string | undefined): boolean =>
  TRUE_VALUES.has(normalizeEnvValue(value));

const isVulnModeEnabled = (): boolean =>
  isFlagEnabled(process.env.ENABLE_VULN_ROUTES) ||
  isFlagEnabled(process.env.VULN_MODE) ||
  isFlagEnabled(process.env.ALLOW_VULNERABLE_ROUTES);

export const vulnFlagGate = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (isVulnModeEnabled()) {
    next();
    return;
  }

  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist.',
  });
};

export default vulnFlagGate;
