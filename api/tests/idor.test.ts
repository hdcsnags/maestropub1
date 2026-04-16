import request from 'supertest';
import { describe, it, expect } from 'vitest';

describe('IDOR protections', () => {
  const baseUrl = process.env.TEST_API_BASE_URL || process.env.API_BASE_URL || 'http://127.0.0.1:3000';

  it('rejects unauthenticated access to common object endpoints', async () => {
    const candidatePaths = [
      '/api/users/1',
      '/api/orders/1',
      '/api/projects/1',
      '/api/invoices/1',
      '/api/accounts/1',
      '/api/profile/1',
    ];

    const agent = request(baseUrl);
    const responses = await Promise.all(candidatePaths.map((path) => agent.get(path)));

    const protectedResponses = responses.filter((response) => [401, 403, 404].includes(response.status));
    expect(protectedResponses.length).toBeGreaterThan(0);

    const idorIndicators = responses.filter((response) => {
      if (response.status < 200 || response.status >= 300) return false;

      const body = response.body;
      if (!body || typeof body !== 'object') return false;

      const bodyString = JSON.stringify(body).toLowerCase();
      return bodyString.includes('email') || bodyString.includes('user') || bodyString.includes('account');
    });

    expect(idorIndicators).toHaveLength(0);
  });

  it('does not allow arbitrary object id enumeration on parameterized endpoints', async () => {
    const objectIds = ['1', '2', '3', '9999', 'me'];
    const templates = [
      '/api/users/:id',
      '/api/orders/:id',
      '/api/projects/:id',
    ];

    const paths = templates.flatMap((template) => objectIds.map((id) => template.replace(':id', id)));
    const agent = request(baseUrl);
    const responses = await Promise.all(paths.map((path) => agent.get(path)));

    const successfulResponses = responses.filter((response) => response.status >= 200 && response.status < 300);

    const suspiciousSuccesses = successfulResponses.filter((response) => {
      const body = response.body;
      if (!body || typeof body !== 'object') return false;
      const serialized = JSON.stringify(body).toLowerCase();
      return !serialized.includes('public') && !serialized.includes('health') && !serialized.includes('status');
    });

    expect(suspiciousSuccesses).toHaveLength(0);
  });
});
