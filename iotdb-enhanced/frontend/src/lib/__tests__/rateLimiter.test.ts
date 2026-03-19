/**
 * Rate Limiter Unit Tests
 *
 * Tests for client-side rate limiting functionality
 */

import {
  rateLimiter,
  rateLimits,
  RateLimitError,
  withRateLimit,
  FormRateLimiter,
  ApiRateLimiter,
} from '../rateLimiter';

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock audit logger
jest.mock('../auditLogger', () => ({
  auditLogger: {
    log: jest.fn(),
  },
  logSecurityEvents: {
    rateLimitExceeded: jest.fn(),
  },
}));

describe('rateLimiter', () => {
  beforeEach(() => {
    rateLimiter.resetAll();
    jest.clearAllMocks();
  });

  describe('canMakeRequest', () => {
    it('should allow requests within limit', () => {
      const config = { maxRequests: 5, windowMs: 60000 };

      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.canMakeRequest('test-key', config)).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const config = { maxRequests: 3, windowMs: 1000 };

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        rateLimiter.canMakeRequest('test-key', config);
      }

      // Next request should be blocked
      expect(rateLimiter.canMakeRequest('test-key', config)).toBe(false);
    });

    it('should reset after window expires', async () => {
      const config = { maxRequests: 2, windowMs: 100 };

      // Use up the limit
      rateLimiter.canMakeRequest('test-key', config);
      rateLimiter.canMakeRequest('test-key', config);
      expect(rateLimiter.canMakeRequest('test-key', config)).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should allow requests again
      expect(rateLimiter.canMakeRequest('test-key', config)).toBe(true);
    });

    it('should track separate limits for different keys', () => {
      const config = { maxRequests: 2, windowMs: 60000 };

      expect(rateLimiter.canMakeRequest('key1', config)).toBe(true);
      expect(rateLimiter.canMakeRequest('key1', config)).toBe(true);
      expect(rateLimiter.canMakeRequest('key1', config)).toBe(false);

      // Different key should have separate limit
      expect(rateLimiter.canMakeRequest('key2', config)).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset limit for specific key', () => {
      const config = { maxRequests: 2, windowMs: 60000 };

      rateLimiter.canMakeRequest('test-key', config);
      rateLimiter.canMakeRequest('test-key', config);
      expect(rateLimiter.canMakeRequest('test-key', config)).toBe(false);

      rateLimiter.reset('test-key');

      expect(rateLimiter.canMakeRequest('test-key', config)).toBe(true);
    });

    it('should reset all limits', () => {
      const config = { maxRequests: 1, windowMs: 60000 };

      rateLimiter.canMakeRequest('key1', config);
      rateLimiter.canMakeRequest('key2', config);

      rateLimiter.resetAll();

      expect(rateLimiter.canMakeRequest('key1', config)).toBe(true);
      expect(rateLimiter.canMakeRequest('key2', config)).toBe(true);
    });
  });

  describe('getRemaining', () => {
    it('should return remaining requests', () => {
      const config = { maxRequests: 5, windowMs: 60000 };

      expect(rateLimiter.getRemaining('test-key', config)).toBe(5);

      rateLimiter.canMakeRequest('test-key', config);
      rateLimiter.canMakeRequest('test-key', config);

      expect(rateLimiter.getRemaining('test-key', config)).toBe(3);
    });

    it('should return max for expired window', async () => {
      const config = { maxRequests: 5, windowMs: 100 };

      rateLimiter.canMakeRequest('test-key', config);
      rateLimiter.canMakeRequest('test-key', config);

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(rateLimiter.getRemaining('test-key', config)).toBe(5);
    });
  });

  describe('getResetTime', () => {
    it('should return seconds until reset', () => {
      const config = { maxRequests: 5, windowMs: 10000 };

      rateLimiter.canMakeRequest('test-key', config);

      const resetTime = rateLimiter.getResetTime('test-key');
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(10);
    });

    it('should return 0 for non-existent key', () => {
      const resetTime = rateLimiter.getResetTime('non-existent');
      expect(resetTime).toBe(0);
    });
  });

  describe('getState', () => {
    it('should return state for existing key', () => {
      const config = { maxRequests: 5, windowMs: 60000 };

      rateLimiter.canMakeRequest('test-key', config);

      const state = rateLimiter.getState('test-key');
      expect(state).toBeDefined();
      expect(state?.count).toBe(1);
      expect(state?.blocked).toBe(false);
    });

    it('should return undefined for non-existent key', () => {
      const state = rateLimiter.getState('non-existent');
      expect(state).toBeUndefined();
    });
  });

  describe('getAllStates', () => {
    it('should return all active limits', () => {
      const config = { maxRequests: 5, windowMs: 60000 };

      rateLimiter.canMakeRequest('key1', config);
      rateLimiter.canMakeRequest('key2', config);

      const states = rateLimiter.getAllStates();
      expect(states.size).toBe(2);
    });
  });
});

describe('withRateLimit', () => {
  beforeEach(() => {
    // Clear rate limiter state before each test
    rateLimiter.resetAll();
  });

  it('should allow function execution within limit', async () => {
    const config = { maxRequests: 3, windowMs: 60000 };
    const mockFn = jest.fn().mockResolvedValue('result');
    const rateLimitedFn = withRateLimit('withRateLimit-test1', config, mockFn);

    const result = await rateLimitedFn();

    expect(result).toBe('result');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should throw RateLimitError when exceeded', async () => {
    const config = { maxRequests: 2, windowMs: 60000 };
    const mockFn = jest.fn().mockResolvedValue('result');
    const rateLimitedFn = withRateLimit('withRateLimit-test2', config, mockFn);

    // Use up limit
    await rateLimitedFn();
    await rateLimitedFn();

    // Next call should throw
    await expect(rateLimitedFn()).rejects.toThrow(RateLimitError);
  });
});

describe('RateLimitError', () => {
  it('should create error with details', () => {
    const error = new RateLimitError('test-key', 60);

    expect(error.key).toBe('test-key');
    expect(error.resetTime).toBe(60);
    expect(error.message).toContain('test-key');
    expect(error.message).toContain('60');
  });
});

describe('FormRateLimiter', () => {
  it('should check form submission limit', () => {
    const formLimiter = new FormRateLimiter('contact-form');

    expect(formLimiter.canSubmit().allowed).toBe(true);
  });

  it('should use default config', () => {
    const formLimiter = new FormRateLimiter('test-form');

    // Submit multiple times
    for (let i = 0; i < 10; i++) {
      formLimiter.canSubmit();
    }

    const result = formLimiter.canSubmit();
    expect(result.allowed).toBe(false);
  });

  it('should accept custom config', () => {
    const formLimiter = new FormRateLimiter('test-form', {
      maxRequests: 2,
      windowMs: 60000,
    });

    formLimiter.canSubmit();
    formLimiter.canSubmit();

    const result = formLimiter.canSubmit();
    expect(result.allowed).toBe(false);
  });

  it('should reset form limit', () => {
    const formLimiter = new FormRateLimiter('test-form', {
      maxRequests: 2,
      windowMs: 60000,
    });

    formLimiter.canSubmit();
    formLimiter.canSubmit();
    expect(formLimiter.canSubmit().allowed).toBe(false);

    formLimiter.reset();
    expect(formLimiter.canSubmit().allowed).toBe(true);
  });
});

describe('ApiRateLimiter', () => {
  it('should check API request limit', () => {
    const apiLimiter = new ApiRateLimiter('/api/data');

    expect(apiLimiter.canRequest().allowed).toBe(true);
  });

  it('should use default config', () => {
    const apiLimiter = new ApiRateLimiter('/api/test');

    for (let i = 0; i < 100; i++) {
      apiLimiter.canRequest();
    }

    const result = apiLimiter.canRequest();
    expect(result.allowed).toBe(false);
  });

  it('should accept custom config', () => {
    const apiLimiter = new ApiRateLimiter('/api/test', {
      maxRequests: 5,
      windowMs: 60000,
    });

    for (let i = 0; i < 5; i++) {
      apiLimiter.canRequest();
    }

    const result = apiLimiter.canRequest();
    expect(result.allowed).toBe(false);
  });
});

describe('rateLimits', () => {
  it('should have login config', () => {
    expect(rateLimits.login.maxRequests).toBe(5);
    expect(rateLimits.login.windowMs).toBe(60000);
  });

  it('should have apiRequest config', () => {
    expect(rateLimits.apiRequest.maxRequests).toBe(100);
    expect(rateLimits.apiRequest.windowMs).toBe(60000);
  });

  it('should have formSubmit config', () => {
    expect(rateLimits.formSubmit.maxRequests).toBe(10);
    expect(rateLimits.formSubmit.windowMs).toBe(60000);
  });
});
