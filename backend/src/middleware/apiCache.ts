/**
 * API Response Caching Middleware
 *
 * Provides intelligent HTTP response caching with:
 * - Redis-backed cache storage
 * - Cache key generation based on request
 * - TTL (Time To Live) configuration
 * - Cache invalidation strategies
 * - Selective caching by route
 */

import { Request, Response, NextFunction } from 'express';
import { RedisClientType } from 'redis';
import { logger } from '../lib/logger';
import { getRedisClient } from '../lib/redisPool';

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Cache TTL in seconds (default: 60) */
  ttl?: number;
  /** Cache key prefix (default: 'api_cache') */
  prefix?: string;
  /** Whether to cache successful responses only (default: true) */
  successOnly?: boolean;
  /** Routes to include in caching (default: all) */
  includeRoutes?: string[];
  /** Routes to exclude from caching (default: none) */
  excludeRoutes?: string[];
  /** HTTP methods to cache (default: ['GET']) */
  methods?: string[];
  /** Whether to include query parameters in cache key (default: true) */
  includeQuery?: boolean;
  /** Whether to include headers in cache key (default: false) */
  includeHeaders?: string[];
  /** Custom cache key generator */
  keyGenerator?: (req: Request) => string | undefined;
}

/**
 * Cached response data
 */
interface CachedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  timestamp: number;
}

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 60,
  prefix: 'api_cache',
  successOnly: true,
  includeRoutes: ['*'],
  excludeRoutes: [],
  methods: ['GET'],
  includeQuery: true,
  includeHeaders: [],
};

/**
 * Cache statistics
 */
const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
};

/**
 * API Cache Middleware Class
 */
export class ApiCacheMiddleware {
  private config: Required<CacheConfig>;
  private redis: RedisClientType | null = null;

  constructor(config: CacheConfig = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config } as Required<CacheConfig>;
  }

  /**
   * Initialize Redis connection
   */
  private async getRedis(): Promise<RedisClientType | null> {
    if (this.redis) {
      return this.redis;
    }

    try {
      this.redis = await getRedisClient();
      return this.redis;
    } catch (error) {
      logger.error('Failed to get Redis client for cache:', error);
      return null;
    }
  }

  /**
   * Check if request should be cached
   */
  private shouldCache(req: Request): boolean {
    // Check method
    if (!this.config.methods.includes(req.method)) {
      return false;
    }

    // Check excluded routes
    for (const route of this.config.excludeRoutes) {
      if (req.path.startsWith(route) || req.path.match(new RegExp(route))) {
        return false;
      }
    }

    // Check included routes (if specified and not wildcard)
    if (this.config.includeRoutes[0] !== '*') {
      let matches = false;
      for (const route of this.config.includeRoutes) {
        if (req.path.startsWith(route) || req.path.match(new RegExp(route))) {
          matches = true;
          break;
        }
      }
      if (!matches) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(req: Request): string {
    // Use custom key generator if provided
    if (this.config.keyGenerator) {
      const key = this.config.keyGenerator(req);
      if (key) return key;
    }

    // Default key generation
    const parts = [this.config.prefix, req.method, req.path];

    // Add query parameters
    if (this.config.includeQuery && Object.keys(req.query).length > 0) {
      const query = new URLSearchParams(req.query as any).toString();
      parts.push(query);
    }

    // Add specific headers
    if (this.config.includeHeaders.length > 0) {
      const headers = this.config.includeHeaders
        .map(header => req.headers?.[header])
        .filter(Boolean)
        .join(':');
      if (headers) {
        parts.push(headers);
      }
    }

    // Add user context (for personalized responses)
    const user = (req as any).user;
    if (user?.id) {
      parts.push(`user:${user.id}`);
    }

    return parts.join(':');
  }

  /**
   * Get cached response
   */
  private async getCached(key: string): Promise<CachedResponse | null> {
    try {
      const redis = await this.getRedis();
      if (!redis) {
        return null;
      }

      const cached = await redis.get(key);
      if (!cached) {
        cacheStats.misses++;
        return null;
      }

      cacheStats.hits++;
      return JSON.parse(cached) as CachedResponse;
    } catch (error) {
      cacheStats.errors++;
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached response
   */
  private async setCached(key: string, response: CachedResponse): Promise<void> {
    try {
      const redis = await this.getRedis();
      if (!redis) {
        return;
      }

      const value = JSON.stringify(response);
      await redis.setEx(key, this.config.ttl, value);
      cacheStats.sets++;
    } catch (error) {
      cacheStats.errors++;
      logger.error('Cache set error:', error);
    }
  }

  /**
   * Delete cached response
   */
  private async deleteCached(key: string): Promise<void> {
    try {
      const redis = await this.getRedis();
      if (!redis) {
        return;
      }

      await redis.del(key);
      cacheStats.deletes++;
    } catch (error) {
      cacheStats.errors++;
      logger.error('Cache delete error:', error);
    }
  }

  /**
   * Delete all cached responses matching pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    try {
      const redis = await this.getRedis();
      if (!redis) {
        return 0;
      }

      const keys = await redis.keys(`${this.config.prefix}:${pattern}`);
      if (keys.length === 0) {
        return 0;
      }

      if (keys.length > 0) {
        await redis.del(keys);
      }
      cacheStats.deletes += keys.length;
      return keys.length;
    } catch (error) {
      logger.error('Cache clear pattern error:', error);
      return 0;
    }
  }

  /**
   * Middleware function
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Check if request should be cached
      if (!this.shouldCache(req)) {
        return next();
      }

      const cacheKey = this.generateCacheKey(req);

      // Try to get cached response
      const cached = await this.getCached(cacheKey);
      if (cached) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        res.status(cached.statusCode);
        res.set(cached.headers);
        res.setHeader('X-Cache', 'HIT');
        res.json(cached.body);
        return;
      }

      logger.debug(`Cache MISS: ${cacheKey}`);

      // Cache miss - intercept response
      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);
      const originalSet = res.set.bind(res);

      const headers: Record<string, string> = {};
      const setCached = this.setCached.bind(this);
      const config = this.config;

      // Intercept res.set()
      res.set = function (header: any) {
        if (typeof header === 'string') {
          headers[header] = arguments[1];
        } else {
          Object.assign(headers, header);
        }
        return originalSet.apply(res, arguments as any);
      };

      // Intercept res.status()
      let statusCode = 200;
      res.status = function (code: number) {
        statusCode = code;
        return originalStatus(code);
      };

      // Intercept res.json()
      res.json = function (body: any) {
        // Cache successful responses only (if configured)
        if (!config.successOnly || (statusCode >= 200 && statusCode < 300)) {
          const cachedResponse: CachedResponse = {
            statusCode,
            headers,
            body,
            timestamp: Date.now(),
          };

          // Set cache asynchronously (don't block response)
          setCached(cacheKey, cachedResponse).catch((err: any) => {
            logger.error('Failed to cache response:', err);
          });
        }

        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return { ...cacheStats };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.sets = 0;
    cacheStats.deletes = 0;
    cacheStats.errors = 0;
  }

  /**
   * Calculate cache hit rate
   */
  getHitRate(): number {
    const total = cacheStats.hits + cacheStats.misses;
    return total > 0 ? cacheStats.hits / total : 0;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create API cache middleware with default configuration
 */
export function createApiCache(config?: CacheConfig): ApiCacheMiddleware {
  return new ApiCacheMiddleware(config);
}

/**
 * API cache middleware for GET requests (60s TTL)
 */
export const apiCache = createApiCache({
  ttl: 60,
  methods: ['GET'],
});

/**
 * Long-term cache for rarely-changing data (300s TTL)
 */
export const apiCacheLong = createApiCache({
  ttl: 300,
  methods: ['GET'],
});

/**
 * Short-term cache for frequently-changing data (10s TTL)
 */
export const apiCacheShort = createApiCache({
  ttl: 10,
  methods: ['GET'],
});

/**
 * Cache invalidation helper - clear cache by route pattern
 */
export async function clearRouteCache(pattern: string): Promise<number> {
  const cache = new ApiCacheMiddleware();
  return cache.clearPattern(pattern);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return apiCache.getStats();
}

/**
 * Reset cache statistics
 */
export function resetCacheStats() {
  apiCache.resetStats();
}
