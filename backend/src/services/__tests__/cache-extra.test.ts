import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock redis module
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { createClient } from 'redis';
import * as cacheService from '../cache';

describe('Cache Service - Additional Tests', () => {
  let mockRedisClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Close any existing cache connection
    await cacheService.closeCache();

    // Create mock Redis client
    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      exists: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      mGet: jest.fn(),
      multi: jest.fn(),
      dbSize: jest.fn(),
      info: jest.fn(),
      flushDb: jest.fn(),
      quit: jest.fn(),
    };

    // Setup multi() chain
    const mockPipeline = {
      set: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(undefined),
    };
    mockRedisClient.multi = jest.fn().mockReturnValue(mockPipeline);

    (createClient as jest.Mock).mockReturnValue(mockRedisClient);

    // Set Redis URL for testing
    process.env.REDIS_URL = 'redis://localhost:6379';
  });

  afterEach(async () => {
    delete process.env.REDIS_URL;
    await cacheService.closeCache();
  });

  describe('delPattern', () => {
    test('should delete keys matching pattern', async () => {
      await cacheService.initCache();
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2', 'key3']);

      await cacheService.delPattern('test:*');
      expect(mockRedisClient.keys).toHaveBeenCalledWith('test:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });

    test('should handle no keys found', async () => {
      await cacheService.initCache();
      mockRedisClient.keys.mockResolvedValue([]);

      await cacheService.delPattern('test:*');
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    test('should handle keys error', async () => {
      await cacheService.initCache();
      mockRedisClient.keys.mockRejectedValue(new Error('Keys failed'));

      await expect(cacheService.delPattern('test:*')).resolves.not.toThrow();
    });
  });

  describe('expire', () => {
    test('should set expiration time', async () => {
      await cacheService.initCache();
      await cacheService.expire('test-key', 60);
      expect(mockRedisClient.expire).toHaveBeenCalledWith('test-key', 60);
    });

    test('should handle expire error', async () => {
      await cacheService.initCache();
      mockRedisClient.expire.mockRejectedValue(new Error('Expire failed'));

      await expect(cacheService.expire('test-key', 60)).resolves.not.toThrow();
    });
  });

  describe('mget', () => {
    test('should get multiple keys', async () => {
      await cacheService.initCache();
      mockRedisClient.mGet.mockResolvedValue([
        '{"data":"test1"}',
        null,
        '{"data":"test3"}',
      ]);

      const result = await cacheService.mget<{ data: string }>(['key1', 'key2', 'key3']);
      expect(result).toEqual([
        { data: 'test1' },
        null,
        { data: 'test3' },
      ]);
    });

    test('should return empty array for no keys', async () => {
      await cacheService.initCache();
      const result = await cacheService.mget([]);
      expect(result).toEqual([]);
    });

    test('should handle mget error', async () => {
      await cacheService.initCache();
      mockRedisClient.mGet.mockRejectedValue(new Error('Mget failed'));

      const result = await cacheService.mget(['key1', 'key2']);
      expect(result).toEqual([null, null]);
    });

    test('should handle invalid JSON in mget', async () => {
      await cacheService.initCache();
      mockRedisClient.mGet.mockResolvedValue([
        '{"data":"test1"}',
        'invalid-json',
        '{"data":"test3"}',
      ]);

      const result = await cacheService.mget<{ data: string }>(['key1', 'key2', 'key3']);
      expect(result).toEqual([
        { data: 'test1' },
        null,
        { data: 'test3' },
      ]);
    });
  });

  describe('mset', () => {
    test('should set multiple keys', async () => {
      await cacheService.initCache();
      const items = [
        { key: 'key1', value: { data: 'test1' } },
        { key: 'key2', value: { data: 'test2' } },
      ];

      await cacheService.mset(items);

      expect(mockRedisClient.multi).toHaveBeenCalled();
      const pipeline = mockRedisClient.multi();
      expect(pipeline.set).toHaveBeenCalledTimes(2);
      expect(pipeline.exec).toHaveBeenCalled();
    });

    test('should handle empty items array', async () => {
      await cacheService.initCache();
      await cacheService.mset([]);
      expect(mockRedisClient.multi).not.toHaveBeenCalled();
    });

    test('should handle mset error', async () => {
      await cacheService.initCache();
      const items = [{ key: 'key1', value: { data: 'test1' } }];
      const mockPipeline = {
        set: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Mset failed')),
      };
      mockRedisClient.multi = jest.fn().mockReturnValue(mockPipeline);

      await expect(cacheService.mset(items)).resolves.not.toThrow();
    });
  });

  describe('cache wrapper', () => {
    test('should cache function results', async () => {
      await cacheService.initCache();
      const mockFn = jest.fn().mockResolvedValue({ result: 'test' });
      mockRedisClient.get.mockResolvedValueOnce(null).mockResolvedValueOnce('{"result":"test"}');
      mockRedisClient.setEx = jest.fn().mockResolvedValue(undefined);

      const cached = cacheService.cache('test:', mockFn, { ttl: 60 });

      // First call - cache miss
      const result1 = await cached('arg1');
      expect(result1).toEqual({ result: 'test' });
      expect(mockFn).toHaveBeenCalledWith('arg1');

      // Second call - cache hit
      const result2 = await cached('arg1');
      expect(result2).toEqual({ result: 'test' });
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should use custom key generator', async () => {
      await cacheService.initCache();
      const mockFn = jest.fn().mockResolvedValue({ result: 'test' });
      mockRedisClient.get.mockResolvedValueOnce(null).mockResolvedValueOnce('{"result":"test"}');
      mockRedisClient.setEx = jest.fn().mockResolvedValue(undefined);

      const keyGenerator = (arg: string) => `custom:${arg}`;
      const cached = cacheService.cache('test:', mockFn, { keyGenerator });

      await cached('arg1');

      expect(mockRedisClient.get).toHaveBeenCalledWith('test::custom:arg1');
    });

    test('should handle cache errors gracefully', async () => {
      await cacheService.initCache();
      const mockFn = jest.fn().mockResolvedValue({ result: 'test' });
      mockRedisClient.get.mockRejectedValue(new Error('Cache error'));
      mockRedisClient.setEx = jest.fn().mockResolvedValue(undefined);

      const cached = cacheService.cache('test:', mockFn);

      const result = await cached('arg1');
      expect(result).toEqual({ result: 'test' });
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });

    test('should handle cache miss properly', async () => {
      await cacheService.initCache();
      const mockFn = jest.fn().mockResolvedValue({ result: 'test' });
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx = jest.fn().mockResolvedValue(undefined);

      const cached = cacheService.cache('test:', mockFn, { ttl: 60 });

      const result = await cached('arg1');
      expect(result).toEqual({ result: 'test' });
      expect(mockFn).toHaveBeenCalledWith('arg1');
      expect(mockRedisClient.setEx).toHaveBeenCalled();
    });
  });

  describe('invalidatePattern', () => {
    test('should invalidate pattern', async () => {
      await cacheService.initCache();
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2']);

      await cacheService.invalidatePattern('test:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(['key1', 'key2']);
    });
  });

  describe('getCacheStats', () => {
    test('should return cache stats', async () => {
      await cacheService.initCache();
      mockRedisClient.info.mockResolvedValue('used_memory_human:1.5M\nother:data');
      mockRedisClient.dbSize.mockResolvedValue(100);

      const stats = await cacheService.getCacheStats();

      expect(stats).toEqual({
        connected: true,
        keyCount: 100,
        memoryUsage: '1.5M',
      });
    });

    test('should handle missing memory info', async () => {
      await cacheService.initCache();
      mockRedisClient.info.mockResolvedValue('other:data');
      mockRedisClient.dbSize.mockResolvedValue(50);

      const stats = await cacheService.getCacheStats();

      expect(stats.memoryUsage).toBeNull();
      expect(stats.keyCount).toBe(50);
    });

    test('should handle stats error', async () => {
      await cacheService.initCache();
      mockRedisClient.info.mockRejectedValue(new Error('Stats failed'));

      const stats = await cacheService.getCacheStats();

      expect(stats).toEqual({
        connected: false,
        keyCount: 0,
        memoryUsage: null,
      });
    });
  });

  describe('flushCache', () => {
    test('should flush cache', async () => {
      await cacheService.initCache();
      await cacheService.flushCache();
      expect(mockRedisClient.flushDb).toHaveBeenCalled();
    });

    test('should handle flush error', async () => {
      await cacheService.initCache();
      mockRedisClient.flushDb.mockRejectedValue(new Error('Flush failed'));

      await expect(cacheService.flushCache()).resolves.not.toThrow();
    });
  });

  describe('closeCache', () => {
    test('should close Redis connection', async () => {
      await cacheService.initCache();
      await cacheService.closeCache();
      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });

  describe('set with and without TTL', () => {
    test('should set value without TTL', async () => {
      await cacheService.initCache();
      await cacheService.set('test-key', { data: 'test' });
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ data: 'test' })
      );
    });

    test('should set value with TTL', async () => {
      await cacheService.initCache();
      await cacheService.set('test-key', { data: 'test' }, 60);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        60,
        JSON.stringify({ data: 'test' })
      );
    });
  });

  describe('get with parsing', () => {
    test('should get and parse JSON value', async () => {
      await cacheService.initCache();
      mockRedisClient.get.mockResolvedValue('{"data":"test","number":123}');

      const result = await cacheService.get<{ data: string; number: number }>('test-key');
      expect(result).toEqual({ data: 'test', number: 123 });
    });

    test('should return null for non-existent key', async () => {
      await cacheService.initCache();
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    test('should handle invalid JSON', async () => {
      await cacheService.initCache();
      mockRedisClient.get.mockResolvedValue('not-json');

      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    test('should delete key', async () => {
      await cacheService.initCache();
      await cacheService.del('test-key');
      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('exists', () => {
    test('should return true for existing key', async () => {
      await cacheService.initCache();
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await cacheService.exists('test-key');
      expect(result).toBe(true);
    });

    test('should return false for non-existing key', async () => {
      await cacheService.initCache();
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await cacheService.exists('test-key');
      expect(result).toBe(false);
    });
  });

  describe('incr', () => {
    test('should increment and return value', async () => {
      await cacheService.initCache();
      mockRedisClient.incr.mockResolvedValue(5);

      const result = await cacheService.incr('counter');
      expect(result).toBe(5);
      expect(mockRedisClient.incr).toHaveBeenCalledWith('counter');
    });

    test('should return 0 when incr fails', async () => {
      await cacheService.initCache();
      mockRedisClient.incr.mockRejectedValue(new Error('Incr failed'));

      const result = await cacheService.incr('counter');
      expect(result).toBe(0);
    });
  });

  describe('Redis connection failures', () => {
    test('should handle get when Redis is not connected', async () => {
      // Close cache to simulate disconnected state
      await cacheService.closeCache();
      mockRedisClient.connect.mockResolvedValue(undefined);

      const result = await cacheService.get('test-key');
      // After close and failed init, should return null
      expect(result).toBeNull();
    });

    test('should handle set when Redis connection fails', async () => {
      await cacheService.closeCache();
      // Make init fail
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(cacheService.set('test-key', { data: 'test' })).resolves.not.toThrow();
    });

    test('should handle del when Redis is not connected', async () => {
      await cacheService.closeCache();
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(cacheService.del('test-key')).resolves.not.toThrow();
    });

    test('should handle exists when Redis is not connected', async () => {
      await cacheService.closeCache();
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await cacheService.exists('test-key');
      expect(result).toBe(false);
    });

    test('should handle getCacheStats when Redis is not connected', async () => {
      await cacheService.closeCache();
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const stats = await cacheService.getCacheStats();
      expect(stats).toEqual({
        connected: false,
        keyCount: 0,
        memoryUsage: null,
      });
    });

    test('should handle flushCache when Redis is not connected', async () => {
      await cacheService.closeCache();
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(cacheService.flushCache()).resolves.not.toThrow();
    });
  });

  describe('Cache error handling', () => {
    test('should handle get parse error', async () => {
      await cacheService.initCache();
      mockRedisClient.get.mockResolvedValue('invalid-json{');

      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    test('should handle set JSON stringify error', async () => {
      await cacheService.initCache();
      // Create a circular reference that can't be stringified
      const circularObj: any = { a: 1 };
      circularObj.self = circularObj;

      await expect(cacheService.set('test-key', circularObj)).resolves.not.toThrow();
    });

    test('should handle get when Redis throws error', async () => {
      await cacheService.initCache();
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    test('should handle exists when Redis throws error', async () => {
      await cacheService.initCache();
      mockRedisClient.exists.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.exists('test-key');
      expect(result).toBe(false);
    });
  });

  describe('initCache behavior', () => {
    test('should return same client on multiple initCache calls', async () => {
      const client1 = await cacheService.initCache();
      const client2 = await cacheService.initCache();

      expect(client1).toBe(client2);
      expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
    });

    test('should log connect event', async () => {
      await cacheService.initCache();

      // Trigger connect event
      const connectCallback = mockRedisClient.on.mock.calls.find(
        (call: any[]): boolean => call[0] === 'connect'
      );
      if (connectCallback && connectCallback[1]) {
        connectCallback[1]();
      }
    });
  });

  describe('expire error handling', () => {
    test('should handle expire when Redis throws error', async () => {
      await cacheService.initCache();
      mockRedisClient.expire.mockRejectedValue(new Error('Expire failed'));

      await expect(cacheService.expire('test-key', 60)).resolves.not.toThrow();
    });
  });

  describe('delPattern error handling', () => {
    test('should handle delPattern error gracefully', async () => {
      await cacheService.initCache();
      mockRedisClient.keys.mockRejectedValue(new Error('Keys failed'));

      await expect(cacheService.delPattern('test:*')).resolves.not.toThrow();
    });
  });
});
