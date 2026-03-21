import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Sentry modules
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  withScope: jest.fn((callback) => {
    const mockScope = {
      setExtras: jest.fn(),
      setLevel: jest.fn(),
      setTag: jest.fn(),
    };
    callback(mockScope);
  }),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  startSpan: jest.fn((spanConfig, callback) => {
    const mockSpan = {
      end: jest.fn(),
    };
    if (callback) {
      const result = callback(mockSpan);
      return result || mockSpan;
    }
    return mockSpan;
  }),
  SeverityLevel: {
    Error: 'error' as const,
    Warning: 'warning' as const,
    Info: 'info' as const,
  },
}));

jest.mock('@sentry/profiling-node', () => ({
  nodeProfilingIntegration: jest.fn(() => ({} as any)),
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { logger } from '@/utils/logger';
import {
  initSentry,
  captureError,
  captureException,
  captureMessage,
  captureTransaction,
  captureApiRequest,
} from '@/lib/sentry';

describe('Sentry Error Tracking', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initSentry', () => {
    test('should initialize Sentry when DSN is configured', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';

      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test@sentry.io/123',
          environment: 'production',
          tracesSampleRate: 0.1,
        })
      );
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          integrations: expect.any(Array),
        })
      );
      expect(logger.info).toHaveBeenCalledWith(
        'SENTRY_INITIALIZED',
        'Sentry initialized',
        { environment: 'production' }
      );
    });

    test('should use full tracesSampleRate in development', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'development';

      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 1.0,
        })
      );
    });

    test('should use release from environment', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.GIT_COMMIT_SHA = 'abc123';

      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          release: 'abc123',
        })
      );
    });

    test('should use npm package version as fallback release', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.npm_package_version = '1.0.0';

      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          release: '1.0.0',
        })
      );
    });

    test('should warn and return early when DSN is not configured', () => {
      delete process.env.SENTRY_DSN;

      initSentry();

      expect(Sentry.init).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        'SENTRY_NOT_CONFIGURED',
        'Sentry DSN not configured. Error tracking is disabled.'
      );
    });

    test('should default to development environment', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      delete process.env.NODE_ENV;

      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'development',
        })
      );
    });
  });

  describe('captureError', () => {
    test('should capture error with context', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };

      captureError(error, context);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    test('should capture error without context', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const error = new Error('Test error');

      captureError(error);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    test('should do nothing when DSN is not configured', () => {
      delete process.env.SENTRY_DSN;
      const error = new Error('Test error');

      expect(() => captureError(error)).not.toThrow();
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    test('should call setExtras with context', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };

      captureError(error, context);

      const withScopeCallback = (Sentry.withScope as jest.Mock).mock.calls[0][0];
      const mockScope = {
        setExtras: jest.fn(),
      };

      withScopeCallback(mockScope);

      expect(mockScope.setExtras).toHaveBeenCalledWith(context);
    });
  });

  describe('captureException', () => {
    test('should be alias for captureError', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const error = new Error('Test error');
      const context = { test: 'data' };

      captureException(error, context);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('captureMessage', () => {
    test('should capture info message', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      captureMessage('Test message', 'info');

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', {
        level: 'info',
      });
    });

    test('should capture warning message', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      captureMessage('Test message', 'warning');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', {
        level: 'warning',
      });
    });

    test('should capture error message', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      captureMessage('Test message', 'error');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', {
        level: 'error',
      });
    });

    test('should include context in message', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const context = { userId: '123' };

      captureMessage('Test message', 'info', context);

      const withScopeCallback = (Sentry.withScope as jest.Mock).mock.calls[0][0];
      const mockScope = {
        setExtras: jest.fn(),
      };

      withScopeCallback(mockScope);

      expect(mockScope.setExtras).toHaveBeenCalledWith(context);
    });

    test('should do nothing when DSN is not configured', () => {
      delete process.env.SENTRY_DSN;

      expect(() => captureMessage('Test')).not.toThrow();
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });
  });

  describe('captureTransaction', () => {
    test('should capture transaction with context', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      captureTransaction('test-transaction', 'http.request', { userId: '123' });

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.startSpan).toHaveBeenCalled();
    });

    test('should capture transaction without context', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      captureTransaction('test-transaction', 'db.query');

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.startSpan).toHaveBeenCalled();
    });

    test('should do nothing when DSN is not configured', () => {
      delete process.env.SENTRY_DSN;

      expect(() => captureTransaction('test', 'op')).not.toThrow();
      expect(Sentry.startSpan).not.toHaveBeenCalled();
    });
  });

  describe('captureApiRequest', () => {
    test('should capture slow request', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      captureApiRequest('/api/test', 'GET', 200, 1500);

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'GET /api/test - 200 (1500ms)',
        { level: 'warning' }
      );
    });

    test('should capture error request', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      captureApiRequest('/api/test', 'POST', 500, 200);

      expect(Sentry.captureMessage).toHaveBeenCalled();
      const callArgs = (Sentry.captureMessage as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toContain('POST /api/test - 500');
      expect(callArgs[1]).toEqual({ level: 'error' });
    });

    test('should ignore fast successful requests', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      captureApiRequest('/api/test', 'GET', 200, 100);

      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    test('should ignore slow but successful requests under threshold', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      captureApiRequest('/api/test', 'GET', 200, 999);

      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    test('should capture slow error request', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      captureApiRequest('/api/test', 'GET', 500, 2000);

      expect(Sentry.captureMessage).toHaveBeenCalled();
      const callArgs = (Sentry.captureMessage as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toContain('2000ms');
      expect(callArgs[1]).toEqual({ level: 'error' });
    });

    test('should do nothing when DSN is not configured', () => {
      delete process.env.SENTRY_DSN;

      expect(() => captureApiRequest('/api/test', 'GET', 200, 100)).not.toThrow();
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });
  });
});
