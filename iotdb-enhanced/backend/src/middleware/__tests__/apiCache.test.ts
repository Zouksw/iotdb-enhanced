/**
 * Tests for ApiCacheMiddleware
 * Advanced caching middleware with Redis backend
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { ApiCacheMiddleware } from '../apiCache';

// Mock the redisPool module
jest.mock('../../lib/redisPool', () => ({
  getRedisClient: jest.fn(),
}));

import { getRedisClient } from '../../lib/redisPool';

describe('ApiCacheMiddleware', () => {
  let mockRedis: any;
  let middleware: ApiCacheMiddleware;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Redis client
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      setEx: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
    };

    (getRedisClient as jest.Mock).mockResolvedValue(mockRedis);
    middleware = new ApiCacheMiddleware({ prefix: 'test_cache' });

    // Reset stats - NOTE: cacheStats is module-level global, so this affects ALL instances
    middleware.resetStats();
  });

  describe('Constructor', () => {
    test('should create instance with default config', () => {
      const m = new ApiCacheMiddleware({ prefix: 'test' });
      expect(m).toBeInstanceOf(ApiCacheMiddleware);
    });

    test('should create instance with custom config', () => {
      const config = {
        prefix: 'custom_prefix',
        ttl: 600,
        methods: ['GET', 'POST'],
        includeRoutes: ['/api/users'],
        excludeRoutes: ['/api/admin'],
        includeQuery: true,
        successOnly: false,
      };
      const m = new ApiCacheMiddleware(config);
      expect(m).toBeInstanceOf(ApiCacheMiddleware);
    });
  });

  describe('shouldCache', () => {
    test('should cache GET requests by default', async () => {
      const req = { method: 'GET', path: '/api/test' } as Request;
      const result = await (middleware as any).shouldCache(req);
      expect(result).toBe(true);
    });

    test('should not cache POST requests by default', async () => {
      const req = { method: 'POST', path: '/api/test' } as Request;
      const result = await (middleware as any).shouldCache(req);
      expect(result).toBe(false);
    });

    test('should respect excluded routes', async () => {
      const m = new ApiCacheMiddleware({
        prefix: 'test',
        excludeRoutes: ['/api/admin'],
      });
      const req = { method: 'GET', path: '/api/admin/users' } as Request;
      const result = await (m as any).shouldCache(req);
      expect(result).toBe(false);
    });

    test('should respect included routes', async () => {
      const m = new ApiCacheMiddleware({
        prefix: 'test',
        includeRoutes: ['/api/users'],
      });
      const req = { method: 'GET', path: '/api/users' } as Request;
      const result = await (m as any).shouldCache(req);
      expect(result).toBe(true);
    });

    test('should cache all routes when wildcard is used', async () => {
      const m = new ApiCacheMiddleware({
        prefix: 'test',
        includeRoutes: ['*'],
      });
      const req = { method: 'GET', path: '/api/test' } as Request;
      const result = await (m as any).shouldCache(req);
      expect(result).toBe(true);
    });

    test('should cache custom methods when configured', async () => {
      const m = new ApiCacheMiddleware({
        prefix: 'test',
        methods: ['GET', 'POST'],
      });
      const req = { method: 'POST', path: '/api/test' } as Request;
      const result = await (m as any).shouldCache(req);
      expect(result).toBe(true);
    });
  });

  describe('generateCacheKey', () => {
    test('should generate key with method and path', async () => {
      const m = new ApiCacheMiddleware({
        prefix: 'test_cache',
      });
      const req = { method: 'GET', path: '/api/users', query: {} } as Request;

      const key = (m as any).generateCacheKey(req);
      expect(key).toBe('test_cache:GET:/api/users');
    });

    test('should include query parameters when configured', async () => {
      const m = new ApiCacheMiddleware({
        prefix: 'test_cache',
        includeQuery: true,
      });
      const req = {
        method: 'GET',
        path: '/api/users',
        query: { page: '1', limit: '10' },
      } as Request;

      const key = (m as any).generateCacheKey(req);
      expect(key).toContain('page=1&limit=10');
    });

    test('should not include query parameters when disabled', async () => {
      const m = new ApiCacheMiddleware({
        prefix: 'test_cache',
        includeQuery: false,
      });
      const req = {
        method: 'GET',
        path: '/api/users',
        query: { page: '1' },
      } as Request;

      const key = (m as any).generateCacheKey(req);
      expect(key).toBe('test_cache:GET:/api/users');
    });

    test('should include user context when available', async () => {
      const m = new ApiCacheMiddleware({ prefix: 'test_cache' });
      const req = {
        method: 'GET',
        path: '/api/users',
        query: {},
        user: { id: 'user-123' },
      } as any;

      const key = (m as any).generateCacheKey(req);
      expect(key).toContain('user:user-123');
    });

    test('should use custom key generator when provided', async () => {
      const customGen = jest.fn(() => 'custom:key');
      const m = new ApiCacheMiddleware({
        prefix: 'test_cache',
        keyGenerator: customGen,
      });
      const req = { method: 'GET', path: '/api/test', query: {} } as Request;

      (m as any).generateCacheKey(req);
      expect(customGen).toHaveBeenCalledWith(req);
    });
  });

  describe('getCached', () => {
    test('should return cached response', async () => {
      const cachedData = { statusCode: 200, headers: {}, body: { data: 'test' } };
      (mockRedis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await (middleware as any).getCached('test:key');
      expect(result).toEqual(cachedData);
      expect(mockRedis.get).toHaveBeenCalledWith('test:key');
    });

    test('should return null when cache miss', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      const result = await (middleware as any).getCached('test:key');
      expect(result).toBeNull();
    });

    test('should return null on Redis error', async () => {
      (mockRedis.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      const result = await (middleware as any).getCached('test:key');
      expect(result).toBeNull();
    });

    test('should increment stats correctly', async () => {
      const cachedData = { statusCode: 200, headers: {}, body: { data: 'test' } };

      // Hit
      (mockRedis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData));
      await (middleware as any).getCached('hit:key');

      // Miss - need to reset the mock to return null for second call
      (mockRedis.get as jest.Mock).mockResolvedValueOnce(null);
      await (middleware as any).getCached('miss:key');

      const stats = middleware.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('setCached', () => {
    test('should set cached response with TTL', async () => {
      const cachedData = { statusCode: 200, headers: {}, body: { data: 'test' }, timestamp: Date.now() };

      await (middleware as any).setCached('test:key', cachedData);

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'test:key',
        60, // default TTL from DEFAULT_CACHE_CONFIG
        expect.stringContaining('"data":"test"')
      );
    });

    test('should handle Redis errors gracefully', async () => {
      (mockRedis.setEx as jest.Mock).mockRejectedValue(new Error('Set failed'));

      await expect((middleware as any).setCached('test:key', { data: 'test' })).resolves.not.toThrow();
    });
  });

  describe('deleteCached', () => {
    test('should delete cached response', async () => {
      await (middleware as any).deleteCached('test:key');
      expect(mockRedis.del).toHaveBeenCalledWith('test:key');
    });

    test('should handle Redis errors gracefully', async () => {
      (mockRedis.del as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      await expect((middleware as any).deleteCached('test:key')).resolves.not.toThrow();
    });
  });

  describe('clearPattern', () => {
    test('should clear all keys matching pattern', async () => {
      (mockRedis.keys as jest.Mock).mockResolvedValue(['key1', 'key2']);

      const count = await middleware.clearPattern('test:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('test_cache:test:*');
      expect(mockRedis.del).toHaveBeenCalledWith(['key1', 'key2']);
      expect(count).toBe(2);
    });

    test('should return 0 when no keys match', async () => {
      (mockRedis.keys as jest.Mock).mockResolvedValue([]);

      const count = await middleware.clearPattern('test:*');
      expect(count).toBe(0);
    });

    test('should return 0 on Redis error', async () => {
      (mockRedis.keys as jest.Mock).mockRejectedValue(new Error('Keys failed'));

      const count = await middleware.clearPattern('test:*');
      expect(count).toBe(0);
    });
  });

  describe('middleware integration', () => {
    test('should call next() for non-cached requests', async () => {
      const m = new ApiCacheMiddleware({ prefix: 'test', methods: ['GET'] });
      m.resetStats(); // Reset global stats before test
      (mockRedis.get as jest.Mock).mockResolvedValue(null);

      const req = { method: 'GET', path: '/api/test', query: {} } as Request;
      const mockRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        set: jest.fn().mockReturnThis(),
        locals: {},
      } as any;
      const mockNext = jest.fn();

      await m.middleware()(req, mockRes, mockNext);

      // Verify next was called (cache miss flow)
      expect(mockNext).toHaveBeenCalled();

      // Now simulate the actual response by calling the intercepted json
      mockRes.json({ data: 'test' });

      // After json is called, X-Cache header should be set
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    });

    test('should return cached response on hit', async () => {
      const m = new ApiCacheMiddleware({ prefix: 'test', methods: ['GET'] });
      m.resetStats(); // Reset global stats before test
      const cachedData = { statusCode: 200, headers: { 'content-type': 'application/json' }, body: { data: 'test' }, timestamp: Date.now() };
      (mockRedis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const req = { method: 'GET', path: '/api/test', query: {} } as Request;
      const mockRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        locals: {},
      } as any;
      const mockNext = jest.fn();

      await m.middleware()(req, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(mockRes.json).toHaveBeenCalledWith(cachedData.body);
    });

    test('should intercept and cache successful responses', async () => {
      const m = new ApiCacheMiddleware({ prefix: 'test', methods: ['GET'] });
      m.resetStats(); // Reset global stats before test
      (mockRedis.get as jest.Mock).mockResolvedValue(null);

      const req = { method: 'GET', path: '/api/test', query: {} } as Request;
      const mockRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        set: jest.fn().mockReturnThis(),
        locals: {},
      } as any;
      const mockNext = jest.fn();

      await m.middleware()(req, mockRes, mockNext);

      // Verify it was a cache miss (next was called)
      expect(mockNext).toHaveBeenCalled();

      // Simulate response by calling the intercepted json method
      mockRes.json({ data: 'test' });

      // Verify cache was set (async operation, so we need to wait a bit)
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockRedis.setEx).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      middleware = new ApiCacheMiddleware();
      middleware.resetStats(); // Reset global stats before each test
    });

    test('should track hits and misses', async () => {
      const cachedData = { statusCode: 200, headers: {}, body: {}, timestamp: Date.now() };

      (mockRedis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData));
      await (middleware as any).getCached('hit:key');

      (mockRedis.get as jest.Mock).mockResolvedValueOnce(null);
      await (middleware as any).getCached('miss:key');

      const stats = middleware.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    test('should calculate hit rate', async () => {
      // Manually set stats by triggering cache operations
      const cachedData = { statusCode: 200, headers: {}, body: {}, timestamp: Date.now() };

      // Generate 8 hits
      for (let i = 0; i < 8; i++) {
        (mockRedis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData));
        await (middleware as any).getCached(`hit:key${i}`);
      }

      // Generate 2 misses
      for (let i = 0; i < 2; i++) {
        (mockRedis.get as jest.Mock).mockResolvedValueOnce(null);
        await (middleware as any).getCached(`miss:key${i}`);
      }

      const rate = middleware.getHitRate();
      expect(rate).toBe(0.8);
    });

    test('should return 0 for no requests', async () => {
      const rate = middleware.getHitRate();
      expect(rate).toBe(0);
    });

    test('should reset stats', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      await (middleware as any).getCached('key');

      middleware.resetStats();
      const stats = middleware.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.sets).toBe(0);
      expect(stats.deletes).toBe(0);
      expect(stats.errors).toBe(0);
    });

    test('should return copy of stats', async () => {
      const stats1 = middleware.getStats();
      const stats2 = middleware.getStats();
      expect(stats1).toEqual(stats2);
      expect(stats1).not.toBe(stats2);
    });
  });

  describe('Error handling edge cases', () => {
    test('should handle getRedis failure', async () => {
      (getRedisClient as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));

      const m = new ApiCacheMiddleware({ prefix: 'test_cache' });
      const result = await (m as any).getCached('test:key');

      expect(result).toBeNull();
    });

    test('should handle setCached when Redis unavailable', async () => {
      (getRedisClient as jest.Mock).mockResolvedValue(null);

      const m = new ApiCacheMiddleware({ prefix: 'test_cache' });

      await expect((m as any).setCached('test:key', { data: 'test' })).resolves.not.toThrow();
    });

    test('should handle clearPattern when Redis unavailable', async () => {
      (getRedisClient as jest.Mock).mockResolvedValue(null);

      const m = new ApiCacheMiddleware({ prefix: 'test_cache' });

      const result = await m.clearPattern('test:*');
      expect(result).toBe(0);
    });

    test('should include headers in cache key when configured', async () => {
      const m = new ApiCacheMiddleware({
        prefix: 'test_cache',
        includeHeaders: ['authorization', 'accept-language'],
      });

      const req = {
        method: 'GET',
        path: '/api/users',
        query: {},
        headers: {
          authorization: 'Bearer token123',
          'accept-language': 'en-US',
        },
      } as Request;

      const key = (m as any).generateCacheKey(req);

      expect(key).toContain('Bearer token123');
      expect(key).toContain('en-US');
    });

    test('should filter out empty headers from cache key', async () => {
      const m = new ApiCacheMiddleware({
        prefix: 'test_cache',
        includeHeaders: ['authorization', 'x-custom'],
      });

      const req = {
        method: 'GET',
        path: '/api/users',
        query: {},
        headers: {
          authorization: 'Bearer token123',
          // x-custom is not set
        },
      } as Request;

      const key = (m as any).generateCacheKey(req);

      expect(key).toContain('Bearer token123');
      expect(key).not.toContain('undefined');
      expect(key).not.toContain(':::'); // No double colon from empty header
    });
  });

  describe('Additional edge cases for coverage', () => {
    test('should not cache when includeRoutes does not match', async () => {
      const m = new ApiCacheMiddleware({
        prefix: 'test_cache',
        includeRoutes: ['/api/users', '/api/posts'],
      });

      const req = { method: 'GET', path: '/api/other', query: {} } as Request;
      const result = await (m as any).shouldCache(req);

      expect(result).toBe(false); // Line 130
    });

    test('should handle setCached Redis error', async () => {
      (mockRedis.setEx as jest.Mock).mockRejectedValue(new Error('Redis set failed'));

      const m = new ApiCacheMiddleware({ prefix: 'test_cache' });

      await expect((m as any).setCached('test:key', { data: 'test' })).resolves.not.toThrow();
      // Error should be caught and logged (line 227)
    });

    test('should call next() when shouldCache returns false', async () => {
      const m = new ApiCacheMiddleware({
        prefix: 'test_cache',
        methods: ['POST'], // Cache POST only
        excludeRoutes: [],
      });

      const req = { method: 'GET', path: '/api/test', query: {} } as Request;
      const mockRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        locals: {},
      } as any;
      const mockNext = jest.fn();

      await m.middleware()(req, mockRes, mockNext);

      // shouldCache returns false for GET when methods is ['POST']
      expect(mockNext).toHaveBeenCalled(); // Line 271
    });

    test('should intercept res.set with object header', async () => {
      const m = new ApiCacheMiddleware({
        prefix: 'test_cache',
        methods: ['GET'],
        successOnly: false, // Cache all responses
      });
      m.resetStats();
      (mockRedis.get as jest.Mock).mockResolvedValue(null);

      const req = { method: 'GET', path: '/api/test', query: {} } as Request;
      const mockRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        locals: {},
      } as any;
      const mockNext = jest.fn();

      await m.middleware()(req, mockRes, mockNext);

      // After middleware runs, res.set is intercepted
      // Test that calling set with object doesn't throw (lines 300-305)
      mockRes.set({ 'content-type': 'application/json' });

      // Trigger json to verify caching
      mockRes.json({ data: 'test' });

      // Wait for async cache operation
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify caching was attempted
      expect(mockRedis.setEx).toHaveBeenCalled();
    });

    test('should intercept res.status and cache with custom status code', async () => {
      const m = new ApiCacheMiddleware({
        prefix: 'test_cache',
        methods: ['GET'],
        successOnly: false, // Cache all responses
      });
      m.resetStats();
      (mockRedis.get as jest.Mock).mockResolvedValue(null);

      const req = { method: 'GET', path: '/api/test', query: {} } as Request;
      const mockRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        locals: {},
      } as any;
      const mockNext = jest.fn();

      await m.middleware()(req, mockRes, mockNext);

      // After middleware runs, res.status is intercepted (lines 311-312)
      mockRes.status(201);

      // Call json to trigger caching
      mockRes.json({ data: 'test' });

      // Wait for async cache operation
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify caching was attempted
      expect(mockRedis.setEx).toHaveBeenCalled();
    });

    test('should handle cache setting error asynchronously', async () => {
      const m = new ApiCacheMiddleware({ prefix: 'test_cache', methods: ['GET'] });
      m.resetStats();

      // Mock setEx to fail after a delay
      (mockRedis.setEx as jest.Mock).mockImplementation(async () => {
        throw new Error('Cache set failed');
      });

      (mockRedis.get as jest.Mock).mockResolvedValue(null);

      const req = { method: 'GET', path: '/api/test', query: {} } as Request;
      const mockRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        set: jest.fn().mockReturnThis(),
        locals: {},
      } as any;
      const mockNext = jest.fn();

      await m.middleware()(req, mockRes, mockNext);

      // Call json - error should be caught asynchronously (line 328)
      await mockRes.json({ data: 'test' });

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 10));

      // Response should still succeed despite cache error
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    });

    test('should test convenience functions', async () => {
      // Import the module functions
      const apiCacheModule = await import('../apiCache');

      // Test clearRouteCache (lines 406-407)
      mockRedis.keys.mockResolvedValue(['key1', 'key2']);
      const cleared = await apiCacheModule.clearRouteCache('test:*');
      expect(cleared).toBe(2);

      // Test getCacheStats (line 414)
      const stats = apiCacheModule.getCacheStats();
      expect(stats).toHaveProperty('hits');

      // Test resetCacheStats (line 421)
      apiCacheModule.resetCacheStats();
      const resetStats = apiCacheModule.getCacheStats();
      expect(resetStats.hits).toBe(0);
    });
  });
});
