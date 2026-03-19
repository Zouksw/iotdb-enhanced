/**
 * CSRF Protection Unit Tests
 *
 * Tests for Cross-Site Request Forgery protection functionality
 */

import { csrfProtection } from '../csrf';

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch for CSRF token endpoint
global.fetch = jest.fn();

describe('csrfProtection', () => {
  beforeEach(() => {
    // Reset CSRF state before each test
    csrfProtection.clear();
    const csrfAny: any = csrfProtection;
    csrfAny.token = null;
    csrfAny.initialized = false;

    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }

    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  describe('initialize', () => {
    it('should fetch CSRF token from backend', async () => {
      const mockToken = 'test-csrf-token-123';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ csrfToken: mockToken, token: mockToken }),
      });

      await csrfProtection.initialize();

      expect(csrfProtection.getToken()).toBe(mockToken);
      expect(csrfProtection.isReady()).toBe(true);
    });

    it('should handle failed fetch gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await csrfProtection.initialize();

      expect(csrfProtection.getToken()).toBeNull();
      expect(csrfProtection.isReady()).toBe(false);
    });

    it('should handle non-OK response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await csrfProtection.initialize();

      expect(csrfProtection.getToken()).toBeNull();
    });

    it('should not re-initialize if already initialized', async () => {
      const mockToken = 'test-csrf-token-789';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ csrfToken: mockToken }),
      });

      await csrfProtection.initialize();
      await csrfProtection.initialize(); // Second call

      // Fetch should only be called once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getToken', () => {
    it('should return null when not initialized', () => {
      expect(csrfProtection.getToken()).toBeNull();
    });

    it('should return token from memory', () => {
      const mockToken = 'test-csrf-token';
      const csrfAny: any = csrfProtection;
      csrfAny.token = mockToken;
      csrfAny.initialized = true;

      expect(csrfProtection.getToken()).toBe(mockToken);
    });

    it('should fallback to sessionStorage', () => {
      const mockToken = 'fallback-token';
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('csrf_token', mockToken);
      }

      expect(csrfProtection.getToken()).toBe(mockToken);
    });
  });

  describe('getHeaders', () => {
    it('should return empty object when no token', () => {
      const headers = csrfProtection.getHeaders();
      expect(headers).toEqual({});
    });

    it('should return headers with CSRF token', () => {
      const mockToken = 'test-csrf-token';
      const csrfAny: any = csrfProtection;
      csrfAny.token = mockToken;

      const headers = csrfProtection.getHeaders();

      expect(headers).toEqual({
        'x-csrf-token': mockToken,
      });
    });
  });

  describe('isReady', () => {
    it('should return false when not initialized', () => {
      expect(csrfProtection.isReady()).toBe(false);
    });

    it('should return true when initialized with token', () => {
      const csrfAny: any = csrfProtection;
      csrfAny.token = 'test-token';
      csrfAny.initialized = true;

      expect(csrfProtection.isReady()).toBe(true);
    });

    it('should return false when initialized but no token', () => {
      const csrfAny: any = csrfProtection;
      csrfAny.token = null;
      csrfAny.initialized = true;

      expect(csrfProtection.isReady()).toBe(false);
    });
  });

  describe('setToken', () => {
    it('should set token and mark as ready', () => {
      const mockToken = 'manual-token';

      csrfProtection.setToken(mockToken);

      expect(csrfProtection.getToken()).toBe(mockToken);
      expect(csrfProtection.isReady()).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear token and state', () => {
      csrfProtection.setToken('test-token');
      expect(csrfProtection.isReady()).toBe(true);

      csrfProtection.clear();

      expect(csrfProtection.getToken()).toBeNull();
      expect(csrfProtection.isReady()).toBe(false);

      if (typeof window !== 'undefined') {
        expect(sessionStorage.getItem('csrf_token')).toBeNull();
      }
    });
  });

  describe('getFormToken', () => {
    it('should return token for form use', () => {
      const mockToken = 'form-token';
      csrfProtection.setToken(mockToken);

      expect(csrfProtection.getFormToken()).toBe(mockToken);
    });

    it('should return empty string when no token', () => {
      expect(csrfProtection.getFormToken()).toBe('');
    });
  });

  describe('getHeaderName and getCookieName', () => {
    it('should return correct header name', () => {
      expect(csrfProtection.getHeaderName()).toBe('x-csrf-token');
    });

    it('should return correct cookie name', () => {
      expect(csrfProtection.getCookieName()).toBe('csrf_token');
    });
  });
});
