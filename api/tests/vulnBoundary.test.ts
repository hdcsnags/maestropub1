import request from 'supertest';
import express, { type Express } from 'express';

type Severity = 'critical' | 'high' | 'medium' | 'low';

type Vulnerability = {
  id: string;
  title: string;
  severity: Severity;
  score: number;
  source: 'scanner' | 'manual';
};

const severityOrder: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const fixtures: Vulnerability[] = [
  {
    id: 'vuln-001',
    title: 'Remote Code Execution in dependency',
    severity: 'critical',
    score: 9.8,
    source: 'scanner',
  },
  {
    id: 'vuln-002',
    title: 'SQL injection in reporting query',
    severity: 'high',
    score: 8.1,
    source: 'manual',
  },
  {
    id: 'vuln-003',
    title: 'Stored XSS in comments',
    severity: 'medium',
    score: 6.5,
    source: 'scanner',
  },
  {
    id: 'vuln-004',
    title: 'Verbose error disclosure',
    severity: 'low',
    score: 3.2,
    source: 'manual',
  },
];

function normalizeSeverity(value: unknown): Severity | null {
  if (typeof value !== 'string') return null;
  const lowered = value.trim().toLowerCase();
  if (lowered === 'critical' || lowered === 'high' || lowered === 'medium' || lowered === 'low') {
    return lowered;
  }
  return null;
}

function parseLimit(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) return null;
  return parsed;
}

function createApp(): Express {
  const app = express();

  app.get('/vulnerabilities', (req, res) => {
    const minSeverity = req.query.minSeverity;
    const limit = req.query.limit;

    const normalizedSeverity = minSeverity === undefined ? null : normalizeSeverity(minSeverity);
    if (minSeverity !== undefined && normalizedSeverity === null) {
      return res.status(400).json({
        error: 'Invalid minSeverity',
        allowed: ['critical', 'high', 'medium', 'low'],
      });
    }

    const parsedLimit = limit === undefined ? null : parseLimit(limit);
    if (limit !== undefined && parsedLimit === null) {
      return res.status(400).json({
        error: 'Invalid limit',
      });
    }

    let results = [...fixtures];

    if (normalizedSeverity) {
      const threshold = severityOrder[normalizedSeverity];
      results = results.filter((item) => severityOrder[item.severity] >= threshold);
    }

    results.sort((a, b) => b.score - a.score);

    if (parsedLimit !== null) {
      results = results.slice(0, parsedLimit);
    }

    return res.status(200).json({
      count: results.length,
      items: results,
    });
  });

  return app;
}

describe('vulnerability query boundaries', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
  });

  it('returns all vulnerabilities when no boundary filters are provided', async () => {
    const response = await request(app).get('/vulnerabilities');

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(4);
    expect(response.body.items.map((item: Vulnerability) => item.id)).toEqual([
      'vuln-001',
      'vuln-002',
      'vuln-003',
      'vuln-004',
    ]);
  });

  it('includes the exact severity boundary when minSeverity is set', async () => {
    const response = await request(app).get('/vulnerabilities').query({ minSeverity: 'high' });

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(2);
    expect(response.body.items.map((item: Vulnerability) => item.severity)).toEqual([
      'critical',
      'high',
    ]);
  });

  it('accepts case-insensitive severity values at the boundary', async () => {
    const response = await request(app).get('/vulnerabilities').query({ minSeverity: 'MeDiUm' });

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(3);
    expect(response.body.items.map((item: Vulnerability) => item.id)).toEqual([
      'vuln-001',
      'vuln-002',
      'vuln-003',
    ]);
  });

  it('returns a validation error for out-of-range severity values', async () => {
    const response = await request(app).get('/vulnerabilities').query({ minSeverity: 'urgent' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid minSeverity',
      allowed: ['critical', 'high', 'medium', 'low'],
    });
  });

  it('supports a zero limit boundary and returns an empty set', async () => {
    const response = await request(app).get('/vulnerabilities').query({ limit: '0' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      count: 0,
      items: [],
    });
  });

  it('applies severity and limit boundaries together', async () => {
    const response = await request(app)
      .get('/vulnerabilities')
      .query({ minSeverity: 'low', limit: '2' });

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(2);
    expect(response.body.items.map((item: Vulnerability) => item.id)).toEqual([
      'vuln-001',
      'vuln-002',
    ]);
  });

  it('rejects negative limit values', async () => {
    const response = await request(app).get('/vulnerabilities').query({ limit: '-1' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid limit',
    });
  });

  it('rejects non-numeric limit values', async () => {
    const response = await request(app).get('/vulnerabilities').query({ limit: 'ten' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid limit',
    });
  });
});
