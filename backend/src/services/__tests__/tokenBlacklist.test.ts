/**
 * Tests for tokenBlacklist service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  blacklistToken,
  isTokenBlacklisted,
  blacklistUserTokens,
  removeFromBlacklist,
  getBlacklistStats,
  clearBlacklist,
  checkTokenBlacklist,
} from '@/services/tokenBlacklist';

// Mock Redis with factory function
const mockRedisSetEx = jest.fn().mockResolvedValue(undefined) as jest.MockedFunction<any>;
const mockRedisSAdd = jest.fn().mockResolvedValue(undefined) as jest.MockedFunction<any>;
const mockRedisExpireAt = jest.fn().mockResolvedValue(undefined) as jest.MockedFunction<any>;
const mockRedisSIsMember = jest.fn() as jest.MockedFunction<any>;
const mockRedisSDel = jest.fn().mockResolvedValue(undefined) as jest.MockedFunction<any>;
const mockRedisSRem = jest.fn().mockResolvedValue(undefined) as jest.MockedFunction<any>;
const mockRedisSMembers = jest.fn() as jest.MockedFunction<any>;
const mockRedisSCard = jest.fn() as jest.MockedFunction<any>;
const mockRedisMulti = jest.fn() as jest.MockedFunction<any>;

// Mock Redis client
const mockRedisClient = {
  setEx: mockRedisSetEx,
  sAdd: mockRedisSAdd,
  expireAt: mockRedisExpireAt,
  sIsMember: mockRedisSIsMember,
  del: mockRedisSDel,
  sRem: mockRedisSRem,
  sMembers: mockRedisSMembers,
  sCard: mockRedisSCard,
  multi: mockRedisMulti,
};

jest.mock('../../lib/redis', () => ({
  redis: jest.fn(() => Promise.resolve(mockRedisClient)),
}));

// Mock JWT utils
const mockDecodeToken = jest.fn();
jest.mock('../../lib/jwt', () => ({
  jwtUtils: {
    decodeToken: (...args: any[]) => mockDecodeToken(...args),
  },
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

describe('tokenBlacklist service', () => {
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
  const testTokenId = 'test-token-id-123';

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup multi mock
    const multiMock = {
      del: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };
    (multiMock.exec as jest.MockedFunction<any>).mockResolvedValue(undefined);
    mockRedisMulti.mockReturnValue(multiMock as any);
  });

  describe('blacklistToken', () => {
    it('should blacklist a valid token', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      mockDecodeToken.mockReturnValue({ exp: futureExp, jti: testTokenId });

      const result = await blacklistToken(testToken, 'logout');

      expect(result).toBe(true);
      expect(mockRedisSetEx).toHaveBeenCalledWith(
        `token:blacklist:${testTokenId}`,
        expect.any(Number),
        expect.stringContaining('logout')
      );
      expect(mockRedisSAdd).toHaveBeenCalledWith('token:blacklist:all', testTokenId);
      expect(mockRedisExpireAt).toHaveBeenCalled();
    });

    it('should not blacklist an already expired token', async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      mockDecodeToken.mockReturnValue({ exp: pastExp, jti: testTokenId });

      const result = await blacklistToken(testToken, 'logout');

      expect(result).toBe(false);
      expect(mockRedisSetEx).not.toHaveBeenCalled();
    });

    it('should use default TTL when token has no expiration', async () => {
      mockDecodeToken.mockReturnValue({ jti: testTokenId });

      const result = await blacklistToken(testToken, 'logout');

      expect(result).toBe(true);
      expect(mockRedisSetEx).toHaveBeenCalledWith(
        `token:blacklist:${testTokenId}`,
        86400, // 24 hours default
        expect.any(String)
      );
    });

    it('should use hash as token ID when jti is not present', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      mockDecodeToken.mockReturnValue({ exp: futureExp }); // No jti

      const result = await blacklistToken(testToken, 'password_change');

      expect(result).toBe(true);
      expect(mockRedisSetEx).toHaveBeenCalled();
      expect(mockRedisSAdd).toHaveBeenCalledWith('token:blacklist:all', expect.any(String));
    });

    it('should handle errors gracefully', async () => {
      mockDecodeToken.mockImplementation(() => {
        throw new Error('Decode error');
      });

      const result = await blacklistToken(testToken, 'logout');

      expect(result).toBe(false);
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      mockRedisSIsMember.mockResolvedValue(true);

      const result = await isTokenBlacklisted(testToken);

      expect(result).toBe(true);
    });

    it('should return false for non-blacklisted token', async () => {
      mockRedisSIsMember.mockResolvedValue(false);

      const result = await isTokenBlacklisted(testToken);

      expect(result).toBe(false);
    });

    it('should fail open on Redis error', async () => {
      mockRedisSIsMember.mockRejectedValue(new Error('Redis error'));

      const result = await isTokenBlacklisted(testToken);

      expect(result).toBe(false); // Fail open
    });

    it('should fail closed on Redis error in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockRedisSIsMember.mockRejectedValue(new Error('Redis error'));

      const result = await isTokenBlacklisted(testToken);

      expect(result).toBe(true); // Fail closed in production

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('blacklistUserTokens', () => {
    it('should return 0 (placeholder implementation)', async () => {
      const result = await blacklistUserTokens('user-123', 'security');

      expect(result).toBe(0);
    });

    it('should accept optional excludeToken parameter', async () => {
      const result = await blacklistUserTokens('user-123', 'security', testToken);

      expect(result).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockDecodeToken.mockImplementation(() => {
        throw new Error('Decode error');
      });

      const result = await blacklistUserTokens('user-123', 'security');

      expect(result).toBe(0);
    });
  });

  describe('removeFromBlacklist', () => {
    it('should remove token from blacklist', async () => {
      mockDecodeToken.mockReturnValue({ jti: testTokenId });

      const result = await removeFromBlacklist(testToken);

      expect(result).toBe(true);
      expect(mockRedisSDel).toHaveBeenCalledWith(`token:blacklist:${testTokenId}`);
      expect(mockRedisSRem).toHaveBeenCalledWith('token:blacklist:all', testTokenId);
    });

    it('should handle errors gracefully', async () => {
      // Mock redis.del to throw an error (actual error scenario)
      mockRedisSDel.mockRejectedValue(new Error('Redis error'));

      const result = await removeFromBlacklist(testToken);

      expect(result).toBe(false);
    });
  });

  describe('getBlacklistStats', () => {
    it('should return stats when blacklist has tokens', async () => {
      mockRedisSCard.mockResolvedValue(42);

      const result = await getBlacklistStats();

      expect(result).toEqual({
        totalBlacklisted: 42,
        oldestToken: null,
        newestToken: null,
      });
    });

    it('should return empty stats when blacklist is empty', async () => {
      mockRedisSCard.mockResolvedValue(0);

      const result = await getBlacklistStats();

      expect(result).toEqual({
        totalBlacklisted: 0,
        oldestToken: null,
        newestToken: null,
      });
    });

    it('should handle errors gracefully', async () => {
      mockRedisSCard.mockRejectedValue(new Error('Redis error'));

      const result = await getBlacklistStats();

      expect(result).toEqual({
        totalBlacklisted: 0,
        oldestToken: null,
        newestToken: null,
      });
    });
  });

  describe('clearBlacklist', () => {
    it('should clear all tokens from blacklist', async () => {
      mockRedisSMembers.mockResolvedValue(['token1', 'token2', 'token3'] as any);
      const multiMock = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      };
      (multiMock.exec as jest.MockedFunction<any>).mockResolvedValue(undefined);
      mockRedisMulti.mockReturnValue(multiMock as any);

      const result = await clearBlacklist();

      expect(result).toBe(true);
      expect(mockRedisSMembers).toHaveBeenCalledWith('token:blacklist:all');
      expect(multiMock.del).toHaveBeenCalledTimes(4); // 3 tokens + 1 for the set
      expect(multiMock.exec).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockRedisSMembers.mockRejectedValue(new Error('Redis error'));

      const result = await clearBlacklist();

      expect(result).toBe(false);
    });

    it('should handle empty blacklist', async () => {
      mockRedisSMembers.mockResolvedValue([] as any);
      const multiMock = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      };
      (multiMock.exec as jest.MockedFunction<any>).mockResolvedValue(undefined);
      mockRedisMulti.mockReturnValue(multiMock as any);

      const result = await clearBlacklist();

      expect(result).toBe(true);
      expect(multiMock.del).toHaveBeenCalledTimes(1); // Only the set itself
    });
  });

  describe('checkTokenBlacklist', () => {
    it('should throw error for blacklisted token', async () => {
      mockRedisSIsMember.mockResolvedValue(true);

      await expect(checkTokenBlacklist(testToken)).rejects.toThrow('Token has been revoked');
    });

    it('should not throw for valid token', async () => {
      mockRedisSIsMember.mockResolvedValue(false);

      await expect(checkTokenBlacklist(testToken)).resolves.toBeUndefined();
    });
  });
});
