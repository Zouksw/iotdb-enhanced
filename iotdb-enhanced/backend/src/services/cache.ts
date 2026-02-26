/**
 * Cache Service
 * Handles caching for API responses, predictions, and queries using Redis
 */

import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis connection
 */
export async function initCache() {
  if (redisClient) {
    return redisClient;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return retries * 100; // Reconnect with increasing delay
        },
      },
    }) as RedisClientType;

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    return null;
  }
}

/**
 * Get a value from cache
 */
export async function get<T>(key: string): Promise<T | null> {
  if (!redisClient) {
    await initCache();
  }

  if (!redisClient) {
    return null;
  }

  try {
    const data = await redisClient.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set a value in cache
 */
export async function set(key: string, value: any, ttlSeconds?: number): Promise<void> {
  if (!redisClient) {
    await initCache();
  }

  if (!redisClient) {
    return;
  }

  try {
    const serialized = JSON.stringify(value);

    if (ttlSeconds) {
      await redisClient.setEx(key, ttlSeconds, serialized);
    } else {
      await redisClient.set(key, serialized);
    }
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete a value from cache
 */
export async function del(key: string): Promise<void> {
  if (!redisClient) {
    await initCache();
  }

  if (!redisClient) {
    return;
  }

  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function delPattern(pattern: string): Promise<void> {
  if (!redisClient) {
    await initCache();
  }

  if (!redisClient) {
    return;
  }

  try {
    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Cache delete pattern error:', error);
  }
}

/**
 * Check if a key exists in cache
 */
export async function exists(key: string): Promise<boolean> {
  if (!redisClient) {
    await initCache();
  }

  if (!redisClient) {
    return false;
  }

  try {
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    console.error('Cache exists error:', error);
    return false;
  }
}

/**
 * Increment a counter in cache
 */
export async function incr(key: string): Promise<number> {
  if (!redisClient) {
    await initCache();
  }

  if (!redisClient) {
    return 0;
  }

  try {
    return await redisClient.incr(key);
  } catch (error) {
    console.error('Cache increment error:', error);
    return 0;
  }
}

/**
 * Set expiration time for a key
 */
export async function expire(key: string, ttlSeconds: number): Promise<void> {
  if (!redisClient) {
    await initCache();
  }

  if (!redisClient) {
    return;
  }

  try {
    await redisClient.expire(key, ttlSeconds);
  } catch (error) {
    console.error('Cache expire error:', error);
  }
}

/**
 * Get multiple keys at once
 */
export async function mget<T>(keys: string[]): Promise<(T | null)[]> {
  if (!redisClient || keys.length === 0) {
    return [];
  }

  try {
    const values = await redisClient.mGet(keys);

    return values.map((value) => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    });
  } catch (error) {
    console.error('Cache mget error:', error);
    return keys.map(() => null);
  }
}

/**
 * Set multiple keys at once
 */
export async function mset(items: Array<{ key: string; value: any }>): Promise<void> {
  if (!redisClient || items.length === 0) {
    return;
  }

  try {
    const pipeline = redisClient.multi();

    for (const item of items) {
      const serialized = JSON.stringify(item.value);
      pipeline.set(item.key, serialized);
    }

    await pipeline.exec();
  } catch (error) {
    console.error('Cache mset error:', error);
  }
}

/**
 * Cache wrapper - memoizes function results
 */
export function cache<T extends (...args: any[]) => Promise<any>>(
  keyPrefix: string,
  fn: T,
  options: {
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    const { ttl, keyGenerator } = options;

    // Generate cache key
    const cacheKey = keyGenerator
      ? `${keyPrefix}:${keyGenerator(...args)}`
      : `${keyPrefix}:${JSON.stringify(args)}`;

    // Try to get from cache
    const cached = await get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute function
    const result = await fn(...args);

    // Store in cache
    await set(cacheKey, result, ttl);

    return result;
  }) as T;
}

/**
 * Invalidate cache by pattern
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  await delPattern(pattern);
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  keyCount: number;
  memoryUsage: string | null;
}> {
  if (!redisClient) {
    await initCache();
  }

  if (!redisClient) {
    return {
      connected: false,
      keyCount: 0,
      memoryUsage: null,
    };
  }

  try {
    const info = await redisClient.info('memory');
    const keyCount = await redisClient.dbSize();
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);

    return {
      connected: true,
      keyCount,
      memoryUsage: memoryMatch ? memoryMatch[1] : null,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return {
      connected: false,
      keyCount: 0,
      memoryUsage: null,
    };
  }
}

/**
 * Flush all cache
 */
export async function flushCache(): Promise<void> {
  if (!redisClient) {
    await initCache();
  }

  if (!redisClient) {
    return;
  }

  try {
    await redisClient.flushDb();
  } catch (error) {
    console.error('Cache flush error:', error);
  }
}

/**
 * Close Redis connection
 */
export async function closeCache(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Cache key generators for common use cases
 */
export const cacheKeys = {
  // AI Prediction cache keys
  prediction: (timeseries: string, algorithm: string, horizon: number) =>
    `prediction:${timeseries}:${algorithm}:${horizon}`,

  // Query result cache keys
  query: (sql: string) => `query:${Buffer.from(sql).toString('base64')}`,

  // Timeseries data cache keys
  timeseriesData: (timeseriesId: string, from: Date, to: Date) =>
    `ts:data:${timeseriesId}:${from.getTime()}:${to.getTime()}`,

  // User session cache keys
  userSession: (userId: string) => `session:user:${userId}`,

  // API rate limit cache keys
  rateLimit: (identifier: string, endpoint: string) =>
    `ratelimit:${identifier}:${endpoint}`,

  // Timeseries list cache keys
  timeseriesList: (datasetId?: string) =>
    `ts:list:${datasetId || 'all'}`,
};
