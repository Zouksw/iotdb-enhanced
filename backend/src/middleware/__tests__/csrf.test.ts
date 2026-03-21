/**
 * Tests for CSRF middleware
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import {
  generateCsrfToken,
  csrfProtection,
  refreshCsrfToken,
  revokeCsrfToken,
  getCsrfConfig,
  type CsrfRequest,
} from '@/middleware/csrf';

// Mock crypto with factory function
const mockRandomBytes = jest.fn();
jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomBytes: (...args: any[]) => mockRandomBytes(...args),
  };
});

// Mock Redis with factory function
const mockRedisSetEx = jest.fn().mockResolvedValue(undefined);
const mockRedisGet = jest.fn();
const mockRedisDel = jest.fn().mockResolvedValue(undefined);

// Mock Redis client
const mockRedisClient = {
  setEx: mockRedisSetEx,
  get: mockRedisGet,
  del: mockRedisDel,
};

jest.mock('../../lib/redis', () => ({
  redis: jest.fn(() => Promise.resolve(mockRedisClient)),
}));

// Mock logger
jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('CSRF middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock crypto.randomBytes to return predictable hex string
    mockRandomBytes.mockReturnValue({
      toString: (encoding: string) => {
        if (encoding === 'hex') {
          return 'a'.repeat(64); // 32 bytes = 64 hex chars
        }
        return 'mock-random';
      },
    });
  });

  const mockRequest = (partial: Partial<Request> = {}): CsrfRequest => ({
    path: '/api/test',
    method: 'GET',
    secure: true,
    ip: '127.0.0.1',
    headers: {},
    cookies: {},
    ...partial,
  } as CsrfRequest);

  const mockResponse = () => {
    const res: Partial<Response> = {
      cookie: jest.fn(),
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    return res as Response;
  };

  const mockNext: NextFunction = jest.fn();

  describe('generateCsrfToken', () => {
    it('should generate a token with 64 hex characters', async () => {
      const token = await generateCsrfToken();

      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('should store token in Redis when userId is provided', async () => {
      mockRedisSetEx.mockResolvedValue('OK');

      const token = await generateCsrfToken('user-123');

      expect(token).toHaveLength(64);
      expect(mockRedisSetEx).toHaveBeenCalledWith(
        'csrf:user:user-123',
        86400,
        token
      );
    });

    it('should not store token in Redis when userId is not provided', async () => {
      const token = await generateCsrfToken();

      expect(token).toHaveLength(64);
      expect(mockRedisSetEx).not.toHaveBeenCalled();
    });
  });

  describe('csrfProtection middleware', () => {
    it('should generate token for GET requests', async () => {
      const req = mockRequest({ method: 'GET', userId: 'user-123' });
      const res = mockResponse();

      mockRedisSetEx.mockResolvedValue('OK');

      await csrfProtection()(req, res, mockNext);

      expect(req.csrfToken).toHaveLength(64);
      expect(res.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        })
      );
      expect(res.setHeader).toHaveBeenCalledWith('x-csrf-token', expect.any(String));
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow POST with valid CSRF token', async () => {
      const token = 'a'.repeat(64);
      const req = mockRequest({
        method: 'POST',
        userId: 'user-123',
        headers: { 'x-csrf-token': token },
        cookies: { csrf_token: token },
      });
      const res = mockResponse();

      mockRedisGet.mockResolvedValue(token);

      await csrfProtection()(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject POST with missing CSRF token', async () => {
      const req = mockRequest({
        method: 'POST',
        userId: 'user-123',
        headers: {},
        cookies: {},
      });
      const res = mockResponse();

      await csrfProtection()(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CSRF token validation failed',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject POST with mismatched tokens', async () => {
      const req = mockRequest({
        method: 'POST',
        userId: 'user-123',
        headers: { 'x-csrf-token': 'a'.repeat(64) },
        cookies: { csrf_token: 'b'.repeat(64) },
      });
      const res = mockResponse();

      await csrfProtection()(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject POST with invalid token format', async () => {
      const req = mockRequest({
        method: 'POST',
        headers: { 'x-csrf-token': 'invalid' },
        cookies: { csrf_token: 'invalid' },
      });
      const res = mockResponse();

      await csrfProtection()(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should skip exempt paths', async () => {
      const req = mockRequest({
        method: 'POST',
        path: '/api/auth/login',
      });
      const res = mockResponse();

      await csrfProtection()(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow custom exempt paths', async () => {
      const req = mockRequest({
        method: 'POST',
        path: '/api/custom/endpoint',
      });
      const res = mockResponse();

      await csrfProtection({
        exemptPaths: ['/api/custom/endpoint'],
      })(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should skip ignored methods', async () => {
      const req = mockRequest({
        method: 'OPTIONS',
      });
      const res = mockResponse();

      await csrfProtection({
        ignoreMethods: ['OPTIONS'],
      })(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate token against Redis for authenticated users', async () => {
      const token = 'a'.repeat(64);
      const req = mockRequest({
        method: 'POST',
        userId: 'user-123',
        headers: { 'x-csrf-token': token },
        cookies: { csrf_token: token },
      });
      const res = mockResponse();

      mockRedisGet.mockResolvedValue('different-token'); // Stored token differs

      await csrfProtection()(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow HEAD requests without validation', async () => {
      const req = mockRequest({ method: 'HEAD' });
      const res = mockResponse();

      mockRedisSetEx.mockResolvedValue('OK');

      await csrfProtection()(req, res, mockNext);

      expect(req.csrfToken).toBeDefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow OPTIONS requests without validation', async () => {
      const req = mockRequest({ method: 'OPTIONS' });
      const res = mockResponse();

      mockRedisSetEx.mockResolvedValue('OK');

      await csrfProtection()(req, res, mockNext);

      expect(req.csrfToken).toBeDefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should set secure cookie on non-secure request', async () => {
      const req = mockRequest({ method: 'GET', secure: false });
      const res = mockResponse();

      mockRedisSetEx.mockResolvedValue('OK');

      await csrfProtection()(req, res, mockNext);

      expect(res.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
        })
      );
    });
  });

  describe('refreshCsrfToken', () => {
    it('should generate and return new token', async () => {
      const req = mockRequest({ userId: 'user-123' });
      const res = mockResponse();

      mockRedisSetEx.mockResolvedValue('OK');

      refreshCsrfToken(req, res, mockNext);

      // Wait for async operation
      await new Promise(resolve => setImmediate(resolve));

      expect(req.csrfToken).toHaveLength(64);
      expect(res.cookie).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('x-csrf-token', expect.any(String));
      expect(res.json).toHaveBeenCalledWith({ csrfToken: expect.any(String) });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = mockRequest({ userId: 'user-123' }); // Need userId for Redis to be called
      const res = mockResponse();

      mockRedisSetEx.mockRejectedValue(new Error('Redis error'));

      refreshCsrfToken(req, res, mockNext);

      // Wait for promise chain to complete (use multiple ticks for promise rejection)
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to generate CSRF token' });
    });
  });

  describe('revokeCsrfToken', () => {
    it('should delete token from Redis', async () => {
      mockRedisDel.mockResolvedValue(1);

      await revokeCsrfToken('user-123');

      expect(mockRedisDel).toHaveBeenCalledWith('csrf:user:user-123');
    });
  });

  describe('getCsrfConfig', () => {
    it('should return CSRF configuration', () => {
      const config = getCsrfConfig();

      expect(config).toEqual({
        headerName: 'x-csrf-token',
        cookieName: 'csrf_token',
      });
    });
  });

  describe('protected methods configuration', () => {
    it('should validate PUT requests', async () => {
      const token = 'a'.repeat(64);
      const req = mockRequest({
        method: 'PUT',
        headers: { 'x-csrf-token': token },
        cookies: { csrf_token: token },
      });
      const res = mockResponse();

      mockRedisGet.mockResolvedValue(token);

      await csrfProtection()(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate PATCH requests', async () => {
      const token = 'a'.repeat(64);
      const req = mockRequest({
        method: 'PATCH',
        headers: { 'x-csrf-token': token },
        cookies: { csrf_token: token },
      });
      const res = mockResponse();

      mockRedisGet.mockResolvedValue(token);

      await csrfProtection()(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate DELETE requests', async () => {
      const token = 'a'.repeat(64);
      const req = mockRequest({
        method: 'DELETE',
        headers: { 'x-csrf-token': token },
        cookies: { csrf_token: token },
      });
      const res = mockResponse();

      mockRedisGet.mockResolvedValue(token);

      await csrfProtection()(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
