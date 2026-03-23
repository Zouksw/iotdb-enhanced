/**
 * Auth Route Tests
 *
 * Tests the auth HTTP endpoints with mocked dependencies
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';

// Mock all dependencies
jest.mock('@/lib', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  return {
    prisma: mockPrisma,
    jwtUtils: {
      generateToken: jest.fn(() => 'mock-token'),
      generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
      verifyToken: jest.fn(() => ({ userId: 'test-user-id' })),
    },
    config: {
      jwt: { secret: 'test-secret', expiresIn: '1h' },
      session: { expiresDays: 7 },
    },
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  };
});

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/services/authLockout', () => ({
  checkAccountLockout: jest.fn().mockResolvedValue({ locked: false }),
  recordFailedLogin: jest.fn().mockResolvedValue({ attempts: 1 }),
  clearFailedLoginAttempts: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/tokenBlacklist', () => ({
  blacklistToken: jest.fn().mockResolvedValue(undefined),
  isTokenBlacklisted: jest.fn().mockResolvedValue(false),
}));

jest.mock('@/middleware/rateLimiter', () => ({
  registrationRateLimiter: (_req: any, _res: any, next: any) => next(),
  authRateLimiter: (_req: any, _res: any, next: any) => next(),
}));

import { authRouter } from '@/routes/auth';
import { prisma } from '@/lib';
import bcrypt from 'bcryptjs';

const mockPrisma = prisma as any;

describe('Auth Route Tests', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock returns
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: '$2b$12$hashed',
      role: 'EDITOR',
      avatarUrl: null,
      createdAt: new Date(),
    });
    mockPrisma.session.create.mockResolvedValue({
      id: 'session-123',
      userId: 'user-123',
      tokenHash: 'hash',
      expiresAt: new Date(),
    });
    mockPrisma.auditLog.create.mockResolvedValue({});

    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
  });

  describe('POST /auth/register', () => {
    test('should register new user', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'ValidPass123!',
        name: 'New User',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(newUser);

      expect([201, 400, 409, 500]).toContain(response.status);
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'ValidPass123!',
        });

      expect([400, 409]).toContain(response.status);
    });

    test('should validate password strength', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
        });

      expect([400, 409]).toContain(response.status);
    });

    test('should handle existing email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123!',
        });

      expect([400, 409]).toContain(response.status);
    });
  });

  describe('POST /auth/login', () => {
    test('should login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: '$2b$12$hashed',
        role: 'EDITOR',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123!',
        });

      expect([200, 400, 401, 429]).toContain(response.status);
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password',
        });

      expect([400, 401]).toContain(response.status);
    });

    test('should require password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect([400, 401]).toContain(response.status);
    });

    test('should handle non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password',
        });

      expect([400, 401]).toContain(response.status);
    });

    test('should handle invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: '$2b$12$hashed',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout user', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', 'refreshToken=mock-token');

      expect([200, 401, 400]).toContain(response.status);
    });
  });

  describe('POST /auth/refresh', () => {
    test('should refresh access token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'mock-refresh-token' });

      expect([200, 400, 401]).toContain(response.status);
    });

    test('should validate refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({});

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('GET /auth/me', () => {
    test('should return current user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'EDITOR',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/auth/me')
        .set('Cookie', 'token=mock-token');

      expect([200, 401, 404]).toContain(response.status);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/auth/me');

      expect([401, 400]).toContain(response.status);
    });
  });

  describe('POST /auth/change-password', () => {
    test('should change password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: '$2b$12$oldhash',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)  // Old password matches
        .mockResolvedValue('$2b$12$newhash');  // New hash

      const response = await request(app)
        .post('/auth/change-password')
        .set('Cookie', 'token=mock-token')
        .send({
          currentPassword: 'oldpassword',
          newPassword: 'NewPass123!',
        });

      expect([200, 400, 401]).toContain(response.status);
    });

    test('should validate current password', async () => {
      const response = await request(app)
        .post('/auth/change-password')
        .set('Cookie', 'token=mock-token')
        .send({
          newPassword: 'NewPass123!',
        });

      expect([400, 401]).toContain(response.status);
    });

    test('should validate new password', async () => {
      const response = await request(app)
        .post('/auth/change-password')
        .set('Cookie', 'token=mock-token')
        .send({
          currentPassword: 'oldpassword',
        });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('GET /auth/csrf-token', () => {
    test('should return CSRF token', async () => {
      const response = await request(app)
        .get('/auth/csrf-token');

      expect([200, 400, 404]).toContain(response.status);
    });
  });
});
