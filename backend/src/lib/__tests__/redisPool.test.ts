import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  RedisPool,
  initRedisPool,
  getRedisPool,
  closeRedisPool,
  withRedis,
  getRedisClient,
  type RedisPoolConfig,
} from '@/lib/redisPool';

// Mock the redis module
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

import { createClient } from 'redis';

describe('RedisPool', () => {
  let mockClient: any;
  let pool: RedisPool;
  let poolConfig: RedisPoolConfig;

  beforeEach(() => {
    // Create mock Redis client factory that returns new mocks each time
    (createClient as jest.Mock).mockImplementation(() => ({
      isOpen: true,
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
      on: jest.fn(),
      get: jest.fn().mockResolvedValue('value'),
      set: jest.fn().mockResolvedValue('OK'),
    }));

    poolConfig = {
      host: 'localhost',
      port: 6379,
      password: undefined,
      db: 0,
    };

    // Clear singleton
    (getRedisPool as any).redisPoolInstance = null;

    // Keep a reference to one mock for tests that need it
    mockClient = (createClient as jest.Mock)();

    // Reset mock call counts (but not implementation)
    (createClient as jest.Mock).mockClear();
  });

  afterEach(async () => {
    if (pool) {
      await pool.closeAll();
    }
  });

  afterEach(async () => {
    if (pool) {
      await pool.closeAll();
    }
  });

  describe('Constructor', () => {
    test('should create pool with default config', () => {
      pool = new RedisPool(poolConfig);
      expect(pool).toBeInstanceOf(RedisPool);
    });

    test('should merge config with defaults', () => {
      const customConfig: RedisPoolConfig = {
        host: 'custom-host',
        port: 6380,
        maxRetriesPerRequest: 5,
      };
      pool = new RedisPool(customConfig);
      expect(pool).toBeInstanceOf(RedisPool);
    });

    test('should create Redis client with correct config', async () => {
      pool = new RedisPool(poolConfig);
      await pool.getClient('test');

      expect(createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          socket: expect.objectContaining({
            host: 'localhost',
            port: 6379,
          }),
        })
      );
    });
  });

  describe('getClient', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      pool = new RedisPool(poolConfig);
    });

    test('should create new client on first call', async () => {
      const client = await pool.getClient('test');
      expect(client).toBeDefined();
      expect(createClient).toHaveBeenCalled();
    });

    test('should reuse existing client', async () => {
      const client1 = await pool.getClient('test');
      const client2 = await pool.getClient('test');
      expect(client1).toBe(client2);
      expect(createClient).toHaveBeenCalledTimes(1);
    });

    test('should create separate clients for different names', async () => {
      const client1 = await pool.getClient('client1');
      const client2 = await pool.getClient('client2');
      expect(client1).not.toBe(client2);
      expect(createClient).toHaveBeenCalledTimes(2);
    });

    test('should recreate client if existing one is closed', async () => {
      const client1 = await pool.getClient('test');
      client1.isOpen = false;

      const client2 = await pool.getClient('test');
      expect(client2).not.toBe(client1);
      expect(createClient).toHaveBeenCalledTimes(2);
    });

    test('should throw error when pool is shutting down', async () => {
      await pool.closeAll();
      await expect(pool.getClient('test')).rejects.toThrow('shutting down');
    });
  });

  describe('execute', () => {
    beforeEach(() => {
      pool = new RedisPool(poolConfig);
    });

    test('should execute command successfully', async () => {
      const command = jest.fn().mockResolvedValue('result');
      const result = await pool.execute('test', command);
      expect(result).toBe('result');
      expect(command).toHaveBeenCalledWith(await pool.getClient('test'));
    });

    test('should retry on connection error', async () => {
      const command = jest.fn()
        .mockRejectedValueOnce(new Error('Connection is closed'))
        .mockResolvedValueOnce('result');

      const result = await pool.execute('test', command);
      expect(result).toBe('result');
      expect(command).toHaveBeenCalledTimes(2);
    });

    test('should throw error for non-connection errors', async () => {
      const command = jest.fn().mockRejectedValue(new Error('Other error'));
      await expect(pool.execute('test', command)).rejects.toThrow('Other error');
    });

    test('should not retry for non-connection errors', async () => {
      const command = jest.fn().mockRejectedValue(new Error('Other error'));
      try {
        await pool.execute('test', command);
      } catch {
        // Expected
      }
      expect(command).toHaveBeenCalledTimes(1);
    });
  });

  describe('healthCheck', () => {
    beforeEach(() => {
      pool = new RedisPool(poolConfig);
    });

    test('should return true on successful ping', async () => {
      const result = await pool.healthCheck('test');
      expect(result).toBe(true);
      const client = await pool.getClient('test');
      expect(client.ping).toHaveBeenCalled();
    });

    test('should return false on ping failure', async () => {
      const client = await pool.getClient('test');
      client.ping.mockRejectedValue(new Error('Connection failed'));
      const result = await pool.healthCheck('test');
      expect(result).toBe(false);
    });

    test('should use default client name', async () => {
      const result = await pool.healthCheck();
      expect(result).toBe(true);
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      pool = new RedisPool(poolConfig);
    });

    test('should return correct stats for empty pool', () => {
      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.waitingClients).toBe(0);
    });

    test('should track connections correctly', async () => {
      await pool.getClient('client1');
      await pool.getClient('client2');

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(2);
      expect(stats.activeConnections).toBe(2);
    });

    test('should count only active connections', async () => {
      const client = await pool.getClient('test');
      client.isOpen = false;

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(1);
      expect(stats.activeConnections).toBe(0);
    });
  });

  describe('closeAll', () => {
    beforeEach(() => {
      pool = new RedisPool(poolConfig);
    });

    test('should close all clients', async () => {
      const client1 = await pool.getClient('client1');
      const client2 = await pool.getClient('client2');

      await pool.closeAll();

      expect(client1.quit).toHaveBeenCalled();
      expect(client2.quit).toHaveBeenCalled();
    });

    test('should clear clients map', async () => {
      await pool.getClient('test');
      await pool.closeAll();

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
    });

    test('should prevent new clients after shutdown', async () => {
      await pool.closeAll();
      await expect(pool.getClient('test')).rejects.toThrow('shutting down');
    });

    test('should handle errors when closing clients', async () => {
      const client = await pool.getClient('test');
      client.quit.mockRejectedValue(new Error('Close error'));

      // Should not throw
      await expect(pool.closeAll()).resolves.not.toThrow();
    });
  });

  describe('removeIdleClient', () => {
    beforeEach(() => {
      pool = new RedisPool(poolConfig);
    });

    test('should remove idle client', async () => {
      const client = await pool.getClient('test');
      client.isOpen = false;

      pool.removeIdleClient('test');

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
    });

    test('should not remove active client', async () => {
      await pool.getClient('test');
      const initialStats = pool.getStats();

      pool.removeIdleClient('test');

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(initialStats.totalConnections);
    });

    test('should handle non-existent client', () => {
      expect(() => pool.removeIdleClient('nonexistent')).not.toThrow();
    });
  });
});

describe('Singleton Functions', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Redis client factory
    (createClient as jest.Mock).mockImplementation(() => ({
      isOpen: true,
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
    }));

    // Clear singleton
    (getRedisPool as any).redisPoolInstance = null;

    // Set environment variables
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    process.env.REDIS_DB = '0';

    // Keep a reference to one mock for tests that need it
    mockClient = (createClient as jest.Mock)();
  });

  afterEach(async () => {
    await closeRedisPool();
  });

  describe('initRedisPool', () => {
    test('should create singleton instance', () => {
      const pool1 = initRedisPool();
      const pool2 = initRedisPool();
      expect(pool1).toBe(pool2);
    });

    test('should use environment variables', () => {
      process.env.REDIS_HOST = 'custom-host';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'secret';
      process.env.REDIS_DB = '2';

      const pool = initRedisPool();
      expect(pool).toBeInstanceOf(RedisPool);

      // Reset env
      process.env.REDIS_HOST = 'localhost';
      process.env.REDIS_PORT = '6379';
      process.env.REDIS_PASSWORD = undefined;
      process.env.REDIS_DB = '0';
    });
  });

  describe('getRedisPool', () => {
    test('should throw error if not initialized', () => {
      (getRedisPool as any).redisPoolInstance = null;
      expect(() => getRedisPool()).toThrow('not initialized');
    });

    test('should return existing instance', () => {
      const pool1 = initRedisPool();
      const pool2 = getRedisPool();
      expect(pool1).toBe(pool2);
    });
  });

  describe('closeRedisPool', () => {
    test('should close and nullify instance', async () => {
      initRedisPool();
      await closeRedisPool();

      expect(() => getRedisPool()).toThrow('not initialized');
    });

    test('should do nothing if instance does not exist', async () => {
      await expect(closeRedisPool()).resolves.not.toThrow();
    });
  });

  describe('withRedis', () => {
    test('should execute command with default client', async () => {
      initRedisPool();
      const command = jest.fn().mockResolvedValue('result');
      const result = await withRedis(command);
      expect(result).toBe('result');
      expect(command).toHaveBeenCalled();
    });

    test('should propagate errors', async () => {
      initRedisPool();
      const command = jest.fn().mockRejectedValue(new Error('Test error'));
      await expect(withRedis(command)).rejects.toThrow('Test error');
    });
  });

  describe('getRedisClient', () => {
    test('should return default client', async () => {
      initRedisPool();
      const client = await getRedisClient();
      expect(client).toBeDefined();
      expect(client.isOpen).toBe(true);
    });

    test('should throw error if pool not initialized', async () => {
      (getRedisPool as any).redisPoolInstance = null;
      await expect(getRedisClient()).rejects.toThrow('not initialized');
    });
  });
});
