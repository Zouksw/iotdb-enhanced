/**
 * Tests for rate limiter middleware
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import {
  createRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  aiRateLimiter,
  ingestionRateLimiter,
  passwordResetRateLimiter,
  registrationRateLimiter,
  apiKeyCreationLimiter,
} from '@/middleware/rateLimiter';

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn((options) => {
    return jest.fn((req: Request, res: Response, next: NextFunction) => {
      // Simulate rate limit check - always allow for tests
      // In real tests, you'd want to test the actual limiting behavior
      (req as any).rateLimit = options;
      next();
    });
  });
});

describe('rate limiter middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      ip: '127.0.0.1',
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('createRateLimiter', () => {
    it('should create rate limiter with default options', () => {
      const rateLimit = require('express-rate-limit');
      const limiter = createRateLimiter({});

      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        handler: expect.any(Function),
      });
      expect(typeof limiter).toBe('function');
    });

    it('should create rate limiter with custom options', () => {
      const rateLimit = require('express-rate-limit');
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 10,
        message: 'Custom rate limit message',
        skipSuccessfulRequests: true,
      });

      expect(rateLimit).toHaveBeenCalledWith({
        windowMs: 60000,
        max: 10,
        message: 'Custom rate limit message',
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
        handler: expect.any(Function),
      });
      expect(typeof limiter).toBe('function');
    });

    it('should call next when allowed', async () => {
      const limiter = createRateLimiter({ windowMs: 60000, max: 5 });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should attach rate limit config to request', async () => {
      const limiter = createRateLimiter({ windowMs: 60000, max: 5 });

      await limiter(mockReq as Request, mockRes as Response, mockNext);

      expect((mockReq as any).rateLimit).toBeDefined();
      expect((mockReq as any).rateLimit.max).toBe(5);
    });
  });

  describe('preconfigured rate limiters', () => {
    it('auth rate limiter should be a function', () => {
      expect(typeof authRateLimiter).toBe('function');
    });

    it('API rate limiter should be a function', () => {
      expect(typeof apiRateLimiter).toBe('function');
    });

    it('AI rate limiter should be a function', () => {
      expect(typeof aiRateLimiter).toBe('function');
    });

    it('ingestion rate limiter should be a function', () => {
      expect(typeof ingestionRateLimiter).toBe('function');
    });

    it('password reset rate limiter should be a function', () => {
      expect(typeof passwordResetRateLimiter).toBe('function');
    });

    it('registration rate limiter should be a function', () => {
      expect(typeof registrationRateLimiter).toBe('function');
    });

    it('API key creation limiter should be a function', () => {
      expect(typeof apiKeyCreationLimiter).toBe('function');
    });

    it('should call next when allowed through preconfigured limiters', async () => {
      await authRateLimiter(mockReq as Request, mockRes as Response, mockNext);
      await apiRateLimiter(mockReq as Request, mockRes as Response, mockNext);
      await aiRateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(3);
    });
  });

  describe('rate limit handler', () => {
    it('should return 429 status when rate limited', () => {
      const rateLimit = require('express-rate-limit');
      const customLimiter = createRateLimiter({
        max: 1,
        message: 'Rate limit exceeded',
      });

      // Get the handler function from the mock call
      const mockCall = rateLimit.mock.calls[0];
      const handler = mockCall[0].handler;

      handler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Too many requests',
        message: 'Rate limit exceeded',
        retryAfter: expect.any(Number),
      });
    });
  });
});
