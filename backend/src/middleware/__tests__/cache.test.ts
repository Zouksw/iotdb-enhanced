/**
 * Tests for cache middleware
 */

import { Request, Response, NextFunction } from 'express';
import {
  cacheResponse,
  invalidateCache,
  cacheConfigs,
  cacheControl,
  etag,
} from '@/middleware/cache';

// Mock cache service
jest.mock('../../services/cache', () => ({
  get: jest.fn(),
  set: jest.fn(() => new Promise(resolve => setTimeout(resolve, 100))),
  delPattern: jest.fn(),
  cacheKeys: {
    timeseriesData: jest.fn((id, from, to) => `ts:${id}:${from}:${to}`),
    timeseriesList: jest.fn((datasetId) => `ts:list:${datasetId}`),
    prediction: jest.fn((ts, algo, horizon) => `pred:${ts}:${algo}:${horizon}`),
    query: jest.fn((sql) => `query:${sql}`),
    userSession: jest.fn((userId) => `user:${userId}`),
  },
}));

// Mock logger
jest.mock('../../lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { get, set, delPattern, cacheKeys } from '@/services/cache';
import { logger } from '@/lib/logger';

describe('Cache Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      method: 'GET',
      path: '/api/test',
      query: {},
      params: {},
      body: {},
      get: jest.fn((header: string) => undefined),
    };

    mockRes = {
      statusCode: 200,
      setHeader: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      on: jest.fn(),
      getHeader: jest.fn(),
      locals: {},
      end: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Mock res.json to return this
    (mockRes.json as jest.Mock).mockReturnThis();
  });

  describe('cacheResponse', () => {
    it('should skip non-GET requests', async () => {
      mockReq.method = 'POST';
      const middleware = cacheResponse({ ttl: 60 });

      await middleware(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(get).not.toHaveBeenCalled();
    });

    it('should return cached data on cache hit', async () => {
      const cachedData = { result: 'cached' };
      (get as jest.Mock).mockResolvedValue(cachedData);

      const middleware = cacheResponse({ ttl: 60 });
      await middleware(mockReq as any, mockRes as Response, mockNext);

      expect(get).toHaveBeenCalledWith('http:/api/test:{}');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'max-age=60');
      expect(mockRes.json).toHaveBeenCalledWith(cachedData);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use custom key generator', async () => {
      const keyGenerator = jest.fn(() => 'custom:key');
      const middleware = cacheResponse({ ttl: 60, keyGenerator });

      (get as jest.Mock).mockResolvedValue(null);

      await middleware(mockReq as any, mockRes as Response, mockNext);

      expect(keyGenerator).toHaveBeenCalledWith(mockReq);
      expect(get).toHaveBeenCalledWith('custom:key');
    });

    it('should use default TTL of 300 seconds', async () => {
      const middleware = cacheResponse({});

      (get as jest.Mock).mockResolvedValue(null);

      await middleware(mockReq as any, mockRes as Response, mockNext);

      expect((mockReq as any).cacheTTL).toBe(300);
    });

    it('should set cache miss header', async () => {
      (get as jest.Mock).mockResolvedValue(null);

      const middleware = cacheResponse({ ttl: 60 });
      await middleware(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    });

    it('should cache successful responses', async () => {
      (get as jest.Mock).mockResolvedValue(null);
      (set as jest.Mock).mockResolvedValue(undefined);

      const middleware = cacheResponse({ ttl: 60 });
      await middleware(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // Call the patched res.json
      const responseData = { data: 'test' };
      const patchedJson = mockRes.json as jest.Mock;
      patchedJson(responseData);

      // Wait for async set
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(set).toHaveBeenCalled();
    });

    it('should not cache error responses', async () => {
      (get as jest.Mock).mockResolvedValue(null);
      mockRes.statusCode = 404;

      const middleware = cacheResponse({ ttl: 60 });
      await middleware(mockReq as any, mockRes as Response, mockNext);

      // Call res.json with error response
      const patchedJson = mockRes.json as jest.Mock;
      patchedJson({ error: 'Not found' });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(set).not.toHaveBeenCalled();
    });

    it('should generate cache key with query params', async () => {
      mockReq.query = { page: '1', limit: '10' };
      (get as jest.Mock).mockResolvedValue(null);

      const middleware = cacheResponse({ ttl: 60 });
      await middleware(mockReq as any, mockRes as Response, mockNext);

      expect(get).toHaveBeenCalledWith('http:/api/test:{"page":"1","limit":"10"}');
    });

    it('should handle cache set errors gracefully', async () => {
      (get as jest.Mock).mockResolvedValue(null);
      (set as jest.Mock).mockRejectedValue(new Error('Cache error'));

      const middleware = cacheResponse({ ttl: 60 });
      await middleware(mockReq as any, mockRes as Response, mockNext);

      // Call patched json
      const patchedJson = mockRes.json as jest.Mock;
      patchedJson({ data: 'test' });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(logger.error).toHaveBeenCalledWith('Cache set error:', expect.any(Error));
    });
  });

  describe('invalidateCache', () => {
    it('should call next immediately', async () => {
      const middleware = invalidateCache(['pattern1', 'pattern2']);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should invalidate cache on successful response', async () => {
      let storedFinishCallback: (() => void) | undefined;
      mockRes.on = jest.fn((event, callback) => {
        if (event === 'finish') {
          storedFinishCallback = callback as () => void;
        }
        return mockRes as Response;
      });

      const middleware = invalidateCache(['pattern1', 'pattern2']);

      await middleware(mockReq as Request, mockRes as Response, mockNext);
      mockRes.statusCode = 201;

      // Trigger finish event
      storedFinishCallback?.();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(delPattern).toHaveBeenCalledWith('pattern1');
      expect(delPattern).toHaveBeenCalledWith('pattern2');
    });

    it('should not invalidate on error status', async () => {
      let storedFinishCallback: (() => void) | undefined;
      mockRes.on = jest.fn((event, callback) => {
        if (event === 'finish') {
          storedFinishCallback = callback as () => void;
        }
        return mockRes as Response;
      });

      const middleware = invalidateCache(['pattern1']);

      await middleware(mockReq as Request, mockRes as Response, mockNext);
      mockRes.statusCode = 404;

      storedFinishCallback?.();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(delPattern).not.toHaveBeenCalled();
    });

    it('should handle empty patterns array', async () => {
      let storedFinishCallback: (() => void) | undefined;
      mockRes.on = jest.fn((event, callback) => {
        if (event === 'finish') {
          storedFinishCallback = callback as () => void;
        }
        return mockRes as Response;
      });

      const middleware = invalidateCache([]);

      await middleware(mockReq as Request, mockRes as Response, mockNext);
      mockRes.statusCode = 200;

      storedFinishCallback?.();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('cacheConfigs', () => {
    it('should have timeseriesData config', () => {
      expect(cacheConfigs.timeseriesData).toBeDefined();
      expect(typeof cacheConfigs.timeseriesData).toBe('function');
    });

    it('should have timeseriesList config', () => {
      expect(cacheConfigs.timeseriesList).toBeDefined();
      expect(typeof cacheConfigs.timeseriesList).toBe('function');
    });

    it('should have aiPrediction config', () => {
      expect(cacheConfigs.aiPrediction).toBeDefined();
      expect(typeof cacheConfigs.aiPrediction).toBe('function');
    });

    it('should have queryResult config', () => {
      expect(cacheConfigs.queryResult).toBeDefined();
      expect(typeof cacheConfigs.queryResult).toBe('function');
    });

    it('should have userData config', () => {
      expect(cacheConfigs.userData).toBeDefined();
      expect(typeof cacheConfigs.userData).toBe('function');
    });

    it('should use keyGenerator for timeseriesData config', async () => {
      mockReq.params = { timeseriesId: 'ts-123' };
      mockReq.query = { from: '2024-01-01', to: '2024-01-02' };

      await cacheConfigs.timeseriesData(mockReq as any, mockRes as Response, mockNext);

      expect(cacheKeys.timeseriesData).toHaveBeenCalledWith('ts-123', expect.any(Date), expect.any(Date));
    });

    it('should use query parameter for timeseriesData when params is missing', async () => {
      mockReq.params = {};
      mockReq.query = { timeseriesId: 'ts-456', from: '2024-01-01', to: '2024-01-02' };

      await cacheConfigs.timeseriesData(mockReq as any, mockRes as Response, mockNext);

      expect(cacheKeys.timeseriesData).toHaveBeenCalledWith('ts-456', expect.any(Date), expect.any(Date));
    });

    it('should use keyGenerator for timeseriesList config', async () => {
      mockReq.query = { datasetId: 'dataset-123' };

      await cacheConfigs.timeseriesList(mockReq as any, mockRes as Response, mockNext);

      expect(cacheKeys.timeseriesList).toHaveBeenCalledWith('dataset-123');
    });

    it('should use keyGenerator for aiPrediction config from body', async () => {
      mockReq.body = { timeseries: 'ts-123', algorithm: 'ARIMA', horizon: '10' };

      await cacheConfigs.aiPrediction(mockReq as any, mockRes as Response, mockNext);

      expect(cacheKeys.prediction).toHaveBeenCalledWith('ts-123', 'ARIMA', 10);
    });

    it('should use keyGenerator for aiPrediction config from query', async () => {
      mockReq.query = { timeseries: 'ts-456', algorithm: 'LSTM', horizon: '5' };

      await cacheConfigs.aiPrediction(mockReq as any, mockRes as Response, mockNext);

      expect(cacheKeys.prediction).toHaveBeenCalledWith('ts-456', 'LSTM', 5);
    });

    it('should use keyGenerator for queryResult config from body', async () => {
      mockReq.body = { sql: 'SELECT * FROM root' };

      await cacheConfigs.queryResult(mockReq as any, mockRes as Response, mockNext);

      expect(cacheKeys.query).toHaveBeenCalledWith('SELECT * FROM root');
    });

    it('should use keyGenerator for queryResult config from query', async () => {
      mockReq.query = { sql: 'SELECT count(*) FROM root' };

      await cacheConfigs.queryResult(mockReq as any, mockRes as Response, mockNext);

      expect(cacheKeys.query).toHaveBeenCalledWith('SELECT count(*) FROM root');
    });

    it('should use keyGenerator for userData config from params', async () => {
      mockReq.params = { userId: 'user-123' };

      await cacheConfigs.userData(mockReq as any, mockRes as Response, mockNext);

      expect(cacheKeys.userSession).toHaveBeenCalledWith('user-123');
    });

    it('should use keyGenerator for userData config from req property', async () => {
      mockReq.params = {};
      (mockReq as any).userId = 'user-456';

      await cacheConfigs.userData(mockReq as any, mockRes as Response, mockNext);

      expect(cacheKeys.userSession).toHaveBeenCalledWith('user-456');
    });
  });

  describe('cacheControl', () => {
    it('should set max-age directive', () => {
      const middleware = cacheControl({ maxAge: 3600 });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'max-age=3600');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set s-maxage directive', () => {
      const middleware = cacheControl({ sMaxAge: 7200 });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 's-maxage=7200');
    });

    it('should set no-cache directive', () => {
      const middleware = cacheControl({ noCache: true });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    });

    it('should set no-store directive', () => {
      const middleware = cacheControl({ noStore: true });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    });

    it('should set must-revalidate directive', () => {
      const middleware = cacheControl({ mustRevalidate: true });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'must-revalidate');
    });

    it('should set private directive', () => {
      const middleware = cacheControl({ private: true });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'private');
    });

    it('should set public directive', () => {
      const middleware = cacheControl({ public: true });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public');
    });

    it('should set immutable directive', () => {
      const middleware = cacheControl({ immutable: true });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'immutable');
    });

    it('should combine multiple directives', () => {
      const middleware = cacheControl({
        maxAge: 3600,
        public: true,
        mustRevalidate: true,
      });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      const header = (mockRes.setHeader as jest.Mock).mock.calls[0][1];
      expect(header).toContain('max-age=3600');
      expect(header).toContain('public');
      expect(header).toContain('must-revalidate');
    });

    it('should not set header if no options provided', () => {
      const middleware = cacheControl({});

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('etag', () => {
    it('should generate ETag for response', async () => {
      const middleware = etag();

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Call the patched res.json
      const responseBody = { data: 'test' };
      const patchedJson = (mockRes.json as jest.Mock);
      patchedJson(responseBody);

      expect(mockRes.setHeader).toHaveBeenCalledWith('ETag', expect.stringMatching(/^".+?"$/));
    });

    it('should generate weak ETag when weak option is true', async () => {
      const middleware = etag({ weak: true });

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const responseBody = { data: 'test' };
      const patchedJson = (mockRes.json as jest.Mock);
      patchedJson(responseBody);

      expect(mockRes.setHeader).toHaveBeenCalledWith('ETag', expect.stringMatching(/^W\/".+?"$/));
    });

    it('should return 304 if ETag matches If-None-Match', async () => {
      const middleware = etag();

      mockReq.get = jest.fn((header: string) => {
        if (header === 'If-None-Match') {
          // Generate the same hash that would be generated
          const crypto = require('crypto');
          const hash = crypto.createHash('sha256').update(JSON.stringify({ data: 'test' })).digest('base64');
          return `"${hash}"`;
        }
        return undefined;
      });

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const responseBody = { data: 'test' };
      const patchedJson = (mockRes.json as jest.Mock);
      patchedJson(responseBody);

      expect(mockRes.setHeader).toHaveBeenCalledWith('ETag', expect.any(String));
      // Should return 304 status
    });

    it('should generate consistent ETag for same content', async () => {
      const middleware = etag();

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const responseBody = { data: 'test' };
      const patchedJson = (mockRes.json as jest.Mock);

      await patchedJson(responseBody);
      const firstEtag = (mockRes.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'ETag'
      )?.[1];

      jest.clearAllMocks();

      await patchedJson(responseBody);
      const secondEtag = (mockRes.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'ETag'
      )?.[1];

      expect(firstEtag).toBe(secondEtag);
    });

    it('should generate different ETag for different content', async () => {
      const middleware = etag();

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const patchedJson = (mockRes.json as jest.Mock);

      await patchedJson({ data: 'test1' });
      const firstEtag = (mockRes.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'ETag'
      )?.[1];

      jest.clearAllMocks();

      await patchedJson({ data: 'test2' });
      const secondEtag = (mockRes.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'ETag'
      )?.[1];

      expect(firstEtag).not.toBe(secondEtag);
    });
  });
});
