import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockCompare = vi.fn();
const mockHash = vi.fn();
const mockSign = vi.fn();

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: mockCompare,
    hash: mockHash,
  },
  compare: mockCompare,
  hash: mockHash,
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: mockSign,
  },
  sign: mockSign,
}));

describe('auth routes', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('registers a new user and returns a token', async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    mockHash.mockResolvedValueOnce('hashed-password');
    mockCreate.mockResolvedValueOnce({
      id: 'user-1',
      email: 'new@example.com',
      name: 'New User',
      password: 'hashed-password',
    });
    mockSign.mockReturnValueOnce('signed-jwt');

    const { default: app } = await import('../src/app');

    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'new@example.com',
        password: 'Password123!',
        name: 'New User',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      token: 'signed-jwt',
      user: {
        id: 'user-1',
        email: 'new@example.com',
        name: 'New User',
      },
    });

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: 'new@example.com' },
    });
    expect(mockHash).toHaveBeenCalledWith('Password123!', expect.any(Number));
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        email: 'new@example.com',
        name: 'New User',
        password: 'hashed-password',
      },
    });
    expect(mockSign).toHaveBeenCalledWith(
      { userId: 'user-1', email: 'new@example.com' },
      'test-secret',
      expect.objectContaining({ expiresIn: expect.any(String) })
    );
  });

  it('rejects duplicate registration', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'existing-user',
      email: 'existing@example.com',
      name: 'Existing User',
      password: 'hashed-password',
    });

    const { default: app } = await import('../src/app');

    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: expect.any(String),
      })
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('logs in an existing user and returns a token', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'user-2',
      email: 'login@example.com',
      name: 'Login User',
      password: 'stored-hash',
    });
    mockCompare.mockResolvedValueOnce(true);
    mockSign.mockReturnValueOnce('login-jwt');

    const { default: app } = await import('../src/app');

    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'login@example.com',
        password: 'Password123!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      token: 'login-jwt',
      user: {
        id: 'user-2',
        email: 'login@example.com',
        name: 'Login User',
      },
    });

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: 'login@example.com' },
    });
    expect(mockCompare).toHaveBeenCalledWith('Password123!', 'stored-hash');
    expect(mockSign).toHaveBeenCalledWith(
      { userId: 'user-2', email: 'login@example.com' },
      'test-secret',
      expect.objectContaining({ expiresIn: expect.any(String) })
    );
  });

  it('rejects invalid login credentials', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'user-3',
      email: 'invalid@example.com',
      name: 'Invalid User',
      password: 'stored-hash',
    });
    mockCompare.mockResolvedValueOnce(false);

    const { default: app } = await import('../src/app');

    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'wrong-password',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: expect.any(String),
      })
    );
    expect(mockSign).not.toHaveBeenCalled();
  });

  it('returns the current authenticated user profile', async () => {
    mockFindUnique
      .mockResolvedValueOnce({
        id: 'user-4',
        email: 'me@example.com',
        name: 'Me User',
        password: 'stored-hash',
      })
      .mockResolvedValueOnce({
        id: 'user-4',
        email: 'me@example.com',
        name: 'Me User',
      });
    mockCompare.mockResolvedValueOnce(true);
    mockSign.mockReturnValueOnce('me-jwt');

    const { default: app } = await import('../src/app');

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'me@example.com',
        password: 'Password123!',
      });

    const token = loginResponse.body.token;

    const meResponse = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toEqual({
      user: {
        id: 'user-4',
        email: 'me@example.com',
        name: 'Me User',
      },
    });
  });

  it('updates the current authenticated user profile', async () => {
    mockFindUnique
      .mockResolvedValueOnce({
        id: 'user-5',
        email: 'update@example.com',
        name: 'Update User',
        password: 'stored-hash',
      })
      .mockResolvedValueOnce({
        id: 'user-5',
        email: 'updated@example.com',
        name: 'Updated User',
      });
    mockCompare.mockResolvedValueOnce(true);
    mockSign.mockReturnValueOnce('update-jwt');
    mockUpdate.mockResolvedValueOnce({
      id: 'user-5',
      email: 'updated@example.com',
      name: 'Updated User',
    });

    const { default: app } = await import('../src/app');

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'update@example.com',
        password: 'Password123!',
      });

    const token = loginResponse.body.token;

    const response = await request(app)
      .patch('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'updated@example.com',
        name: 'Updated User',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        id: 'user-5',
        email: 'updated@example.com',
        name: 'Updated User',
      },
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-5' },
      data: {
        email: 'updated@example.com',
        name: 'Updated User',
      },
    });
  });

  it('rejects unauthenticated access to current user profile', async () => {
    const { default: app } = await import('../src/app');

    const response = await request(app).get('/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: expect.any(String),
      })
    );
  });
});
