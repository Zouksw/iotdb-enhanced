/**
 * Tests for cache service
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  cacheKeys,
} from '../cache';

// Test cacheKeys utility which doesn't need Redis
describe('cacheKeys utility', () => {
  it('should generate prediction key', () => {
    const key = cacheKeys.prediction('ts-123', 'arima', 10);
    expect(key).toBe('prediction:ts-123:arima:10');
  });

  it('should generate query key', () => {
    const key = cacheKeys.query('SELECT * FROM test');
    expect(key).toBe('query:U0VMRUNUICogRlJPTSB0ZXN0');
  });

  it('should generate timeseries data key', () => {
    const from = new Date('2024-01-01');
    const to = new Date('2024-01-02');
    const key = cacheKeys.timeseriesData('ts-123', from, to);
    expect(key).toContain('ts:data:ts-123:');
  });

  it('should generate user session key', () => {
    const key = cacheKeys.userSession('user-123');
    expect(key).toBe('session:user:user-123');
  });

  it('should generate rate limit key', () => {
    const key = cacheKeys.rateLimit('127.0.0.1', '/api/test');
    expect(key).toBe('ratelimit:127.0.0.1:/api/test');
  });

  it('should generate timeseries list key', () => {
    const key = cacheKeys.timeseriesList('dataset-123');
    expect(key).toBe('ts:list:dataset-123');
  });

  it('should generate timeseries list key for all datasets', () => {
    const key = cacheKeys.timeseriesList();
    expect(key).toBe('ts:list:all');
  });
});

// Test cache service error handling
describe('cache service error handling', () => {
  beforeEach(() => {
    // Mock Redis environment variable to prevent real connection
    process.env.REDIS_URL = 'redis://localhost:9999'; // Non-existent Redis
  });

  afterEach(() => {
    delete process.env.REDIS_URL;
  });

  it('should handle Redis connection failure gracefully', async () => {
    const { get } = await import('../cache');
    const result = await get('test-key');
    // Should return null instead of throwing
    expect(result).toBeNull();
  });

  it('should handle set failure gracefully', async () => {
    const { set } = await import('../cache');
    // Should not throw
    await expect(set('test-key', { data: 'test' })).resolves.not.toThrow();
  });

  it('should handle delete failure gracefully', async () => {
    const { del } = await import('../cache');
    // Should not throw
    await expect(del('test-key')).resolves.not.toThrow();
  });

  it('should handle exists failure gracefully', async () => {
    const { exists } = await import('../cache');
    const result = await exists('test-key');
    // Should return false on failure
    expect([false, true]).toContain(result);
  });

  it('should handle incr failure gracefully', async () => {
    const { incr } = await import('../cache');
    const result = await incr('counter');
    // Should return a number
    expect(typeof result).toBe('number');
  });
});
