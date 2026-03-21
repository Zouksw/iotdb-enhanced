/**
 * Cache Decorator Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import { cacheRoute, invalidateCache } from '../cacheDecorator';
import { getRedisClient } from '@/lib/redisPool';
import { metrics } from '@/middleware/prometheus';

// Mock dependencies
jest.mock('@/lib/redisPool');
jest.mock('@/lib/logger');
jest.mock('@/middleware/prometheus');

describe('cacheDecorator', () => {
  let mockRedis: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let originalJson: any;
  let originalStatus: any;
  let originalSet: any;

  beforeEach(() => {
    // Mock Redis client
    mockRedis = {
      get: jest.fn(),
      setEx: jest.fn(),
      keys: jest.fn(),
      del: jest.fn(),
    };
    (getRedisClient as jest.Mock).mockResolvedValue(mockRedis);

    // Mock metrics
    (metrics.recordCacheHit as jest.Mock).mockImplementation(() => {});
    (metrics.recordCacheMiss as jest.Mock).mockImplementation(() => {});

    // Mock request
    mockReq = {
      method: 'GET',
      path: '/api/datasets',
      query: {},
      params: {},
    };

    // Mock response with proper chaining
    let lastJsonResult: any = undefined;
    const mockResponseObj: any = {
      json: jest.fn(function(this: any, body: any) {
        lastJsonResult = { body, cachePromise: undefined };
        return lastJsonResult;
      }),
      status: jest.fn(function(this: any) {
        return this;
      }),
      set: jest.fn(function(this: any) {
        return this;
      }),
      setHeader: jest.fn(),
    };

    mockRes = mockResponseObj;
    originalJson = mockRes.json;
    originalStatus = mockRes.status;
    originalSet = mockRes.set;

    // Helper to get the last json result with cachePromise
    (mockRes as any).getLastJsonResult = () => lastJsonResult;

    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('cacheRoute', () => {
    describe('cache HIT', () => {
      it('should return cached response', async () => {
        const cachedData = {
          statusCode: 200,
          body: { datasets: [{ id: '1', name: 'Dataset 1' }] },
          headers: { 'Content-Type': 'application/json' },
        };
        mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

        const middleware = cacheRoute('datasets:list', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        // Verify response was sent from cache
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.set).toHaveBeenCalledWith(cachedData.headers);
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
        expect(mockRes.json).toHaveBeenCalledWith(cachedData.body);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should record cache hit metric (10% sampling)', async () => {
        const cachedData = {
          statusCode: 200,
          body: { data: 'cached' },
          headers: {},
        };
        mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

        // Force metric recording by setting random to < 0.1
        const originalRandom = Math.random;
        Math.random = () => 0.05;

        const middleware = cacheRoute('test:key', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(metrics.recordCacheHit).toHaveBeenCalledWith('redis');

        Math.random = originalRandom;
      });
    });

    describe('cache MISS', () => {
      it('should call next and cache response', async () => {
        mockRedis.get.mockResolvedValue(null);

        const middleware = cacheRoute('datasets:list', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        // Verify middleware called next()
        expect(mockNext).toHaveBeenCalled();

        // The middleware sets X-Cache header when it calls next
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');

        // Simulate route handler sending response
        const responseData = { datasets: [{ id: '1', name: 'Dataset 1' }] };

        // Call the intercepted json method and await cache promise
        mockRes.json(responseData);
        const result = (mockRes as any).getLastJsonResult();
        await result.cachePromise;

        // Verify cache was set
        expect(mockRedis.setEx).toHaveBeenCalled();
        const setExCall = mockRedis.setEx.mock.calls[0];
        expect(setExCall[0]).toBe('datasets:list:/api/datasets');
        expect(setExCall[1]).toBe(60);

        const cachedResponse = JSON.parse(setExCall[2]);
        expect(cachedResponse.body).toEqual(responseData);
        expect(cachedResponse.statusCode).toBe(200);
      });

      it('should not cache non-2xx responses', async () => {
        mockRedis.get.mockResolvedValue(null);

        const middleware = cacheRoute('datasets:list', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        // Simulate error response - status is changed to 404
        mockRes.status(404);

        // Send response
        mockRes.json({ error: 'Not found' });
        const result = (mockRes as any).getLastJsonResult();
        await result.cachePromise;

        // Verify cache was NOT set for 404
        expect(mockRedis.setEx).not.toHaveBeenCalled();
      });
    });

    describe('cache key generation', () => {
      it('should generate basic key from path', async () => {
        mockRedis.get.mockResolvedValue(null);

        const middleware = cacheRoute('test', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        const result = mockRes.json({ data: 'test' });
        await (result as any).cachePromise;

        expect(mockRedis.setEx).toHaveBeenCalledWith(
          'test:/api/datasets',
          60,
          expect.any(String)
        );
      });

      it('should include query string in key', async () => {
        mockReq.query = { search: 'test', page: '1' };
        mockRedis.get.mockResolvedValue(null);

        const middleware = cacheRoute('test', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        const result = mockRes.json({ data: 'test' });
        await (result as any).cachePromise;

        const cacheKey = mockRedis.setEx.mock.calls[0][0];
        expect(cacheKey).toContain('search=test');
        expect(cacheKey).toContain('page=1');
      });

      it('should use custom key generator', async () => {
        mockReq.query = { q: 'search term' };
        mockRedis.get.mockResolvedValue(null);

        const middleware = cacheRoute('search', 60, {
          keyGenerator: (req) => (req.query.q as string) || 'empty',
        });
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        const result = mockRes.json({ results: [] });
        await (result as any).cachePromise;

        expect(mockRedis.setEx).toHaveBeenCalledWith(
          'search:search term',
          60,
          expect.any(String)
        );
      });

      it('should vary cache by user when enabled', async () => {
        (mockReq as any).user = { id: 'user-123' };
        mockRedis.get.mockResolvedValue(null);

        const middleware = cacheRoute('mydata', 60, { varyByUser: true });
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        const result = mockRes.json({ data: 'user-specific' });
        await (result as any).cachePromise;

        const cacheKey = mockRedis.setEx.mock.calls[0][0];
        expect(cacheKey).toContain('user:user-123');
      });
    });

    describe('HTTP method filtering', () => {
      it('should skip caching for non-GET requests', async () => {
        mockReq.method = 'POST';

        const middleware = cacheRoute('datasets', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRedis.get).not.toHaveBeenCalled();
        expect(mockRedis.setEx).not.toHaveBeenCalled();
      });

      it('should skip caching for PUT requests', async () => {
        mockReq.method = 'PUT';

        const middleware = cacheRoute('datasets', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRedis.get).not.toHaveBeenCalled();
      });

      it('should skip caching for DELETE requests', async () => {
        mockReq.method = 'DELETE';

        const middleware = cacheRoute('datasets', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRedis.get).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should handle Redis get errors gracefully', async () => {
        mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

        const middleware = cacheRoute('test', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        // Should continue to next middleware on error
        expect(mockNext).toHaveBeenCalled();
      });

      it('should handle Redis set errors gracefully', async () => {
        mockRedis.get.mockResolvedValue(null);
        mockRedis.setEx.mockRejectedValue(new Error('Redis write failed'));

        const middleware = cacheRoute('test', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        const result = mockRes.json({ data: 'test' });
        await (result as any).cachePromise.catch(() => {}); // Ignore cache errors

        // Response should still be sent even if caching fails
        expect(mockRes.json).toHaveBeenCalled();
      });

      it('should handle JSON parse errors', async () => {
        mockRedis.get.mockResolvedValue('invalid json');

        const middleware = cacheRoute('test', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        // Should continue to next middleware on parse error
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('cache miss metrics', () => {
      it('should record cache miss metric (10% sampling)', async () => {
        mockRedis.get.mockResolvedValue(null);

        // Force metric recording
        const originalRandom = Math.random;
        Math.random = () => 0.05;

        const middleware = cacheRoute('test:key', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(metrics.recordCacheMiss).toHaveBeenCalledWith('redis');

        Math.random = originalRandom;
      });

      it('should not record cache miss metric 90% of the time', async () => {
        mockRedis.get.mockResolvedValue(null);

        // Force metric skip
        const originalRandom = Math.random;
        Math.random = () => 0.5;

        const middleware = cacheRoute('test:key', 60);
        await middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(metrics.recordCacheMiss).not.toHaveBeenCalled();

        Math.random = originalRandom;
      });
    });
  });

  describe('invalidateCache', () => {
    it('should delete all keys matching pattern', async () => {
      mockRedis.keys.mockResolvedValue(['datasets:list', 'datasets:123', 'datasets:456']);
      mockRedis.del.mockResolvedValue(3);

      const deleted = await invalidateCache('datasets:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('datasets:*');
      expect(mockRedis.del).toHaveBeenCalledWith(['datasets:list', 'datasets:123', 'datasets:456']);
      expect(deleted).toBe(3);
    });

    it('should return 0 when no keys match', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const deleted = await invalidateCache('nonexistent:*');

      expect(deleted).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      const deleted = await invalidateCache('datasets:*');

      expect(deleted).toBe(0);
    });

    it('should return 0 when Redis client is unavailable', async () => {
      (getRedisClient as jest.Mock).mockResolvedValue(null);

      const deleted = await invalidateCache('datasets:*');

      expect(deleted).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should work with typical dataset list route', async () => {
      mockReq.path = '/api/datasets';
      mockReq.query = {};
      mockRedis.get.mockResolvedValue(null);

      const middleware = cacheRoute('datasets:list', 300);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate route handler
      const datasets = [
        { id: '1', name: 'Dataset 1', description: 'First dataset' },
        { id: '2', name: 'Dataset 2', description: 'Second dataset' },
      ];

      const result = mockRes.json(datasets);
      await (result as any).cachePromise;

      // Verify cache was set with 5 minute TTL
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'datasets:list:/api/datasets',
        300,
        expect.stringContaining('Dataset 1')
      );
    });

    it('should vary cache by search query', async () => {
      mockReq.path = '/api/datasets';
      mockReq.query = { search: 'temperature' };
      mockRedis.get.mockResolvedValue(null);

      const middleware = cacheRoute('datasets:search', 60);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const result = mockRes.json({ datasets: [] });
      await (result as any).cachePromise;

      const cacheKey = mockRedis.setEx.mock.calls[0][0];
      expect(cacheKey).toContain('search=temperature');
    });

    it('should handle user-specific caches', async () => {
      (mockReq as any).user = { id: 'user-abc', name: 'Test User' };
      mockReq.path = '/api/my-datasets';
      mockRedis.get.mockResolvedValue(null);

      const middleware = cacheRoute('datasets:my', 60, { varyByUser: true });
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const result = mockRes.json({ datasets: [] });
      await (result as any).cachePromise;

      const cacheKey = mockRedis.setEx.mock.calls[0][0];
      expect(cacheKey).toContain('user:user-abc');
    });
  });

  describe('response interception', () => {
    it('should preserve custom headers', async () => {
      mockRedis.get.mockResolvedValue(null);

      const middleware = cacheRoute('test', 60);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate route setting headers
      mockRes.set({ 'X-Custom-Header': 'custom-value' });

      // Send response
      const result = mockRes.json({ data: 'test' });
      await (result as any).cachePromise;

      // Verify headers were cached
      const cachedResponse = JSON.parse(mockRedis.setEx.mock.calls[0][2]);
      expect(cachedResponse.headers).toEqual({
        'X-Custom-Header': 'custom-value',
      });
    });

    it('should handle status code changes', async () => {
      mockRedis.get.mockResolvedValue(null);

      const middleware = cacheRoute('test', 60);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate route changing status
      mockRes.status(201);

      // Send response
      const result = mockRes.json({ data: 'created' });
      await (result as any).cachePromise;

      // Verify status was cached
      const cachedResponse = JSON.parse(mockRedis.setEx.mock.calls[0][2]);
      expect(cachedResponse.statusCode).toBe(201);
    });
  });
});
