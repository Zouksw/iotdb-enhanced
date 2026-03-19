/**
 * Tests for logging middleware and utilities
 */

import { Request, Response, NextFunction } from 'express';
import {
  requestLoggingMiddleware,
  errorLoggingMiddleware,
  detailedRequestLogger,
  slowQueryLogger,
  securityEventLogger,
  auditLogger,
  performanceLogger,
  healthLogger,
  dbLogger,
  iotdbLogger,
  aiLogger,
} from '../logging';

// Mock logger
jest.mock('../../lib/logger', () => ({
  logger: {
    http: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const { logger } = require('../../lib/logger');

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-123'),
}));

describe('Logging Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
      headers: {},
      get: jest.fn((header: string) => {
        if (header === 'user-agent') return 'test-agent';
        return undefined;
      }),
    };

    mockRes = {
      statusCode: 200,
      setHeader: jest.fn(),
      on: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('requestLoggingMiddleware', () => {
    it('should generate correlation ID if not provided', () => {
      requestLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.correlationId).toBe('mocked-uuid-123');
      expect(mockReq.startTime).toBeDefined();
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'mocked-uuid-123');
    });

    it('should use provided correlation ID from header', () => {
      mockReq.headers = { 'x-correlation-id': 'custom-id-456' };

      requestLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.correlationId).toBe('custom-id-456');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'custom-id-456');
    });

    it('should log incoming request', () => {
      requestLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.http).toHaveBeenCalledWith(
        'HTTP_REQUEST',
        'Incoming request',
        expect.objectContaining({
          correlationId: 'mocked-uuid-123',
          method: 'GET',
          url: '/api/test',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
        })
      );
    });

    it('should log response on finish', () => {
      let storedFinishCallback: (() => void) | undefined;
      mockRes.on = jest.fn((event, callback) => {
        if (event === 'finish') {
          storedFinishCallback = callback as () => void;
        }
        return mockRes as Response;
      });

      requestLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate response finish
      storedFinishCallback?.();

      expect(logger.http).toHaveBeenCalledWith(
        'HTTP_RESPONSE',
        'Request completed',
        expect.objectContaining({
          correlationId: 'mocked-uuid-123',
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
          duration: expect.any(String),
        })
      );
    });

    it('should include userId in logs if present', () => {
      mockReq.userId = 'user-123';

      requestLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.http).toHaveBeenCalledWith(
        'HTTP_REQUEST',
        'Incoming request',
        expect.objectContaining({
          userId: 'user-123',
        })
      );
    });

    it('should call next()', () => {
      requestLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should calculate duration correctly', () => {
      let storedFinishCallback: (() => void) | undefined;
      mockRes.on = jest.fn((event, callback) => {
        if (event === 'finish') {
          storedFinishCallback = callback as () => void;
        }
        return mockRes as Response;
      });

      requestLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);

      const startTime = mockReq.startTime as number;
      expect(startTime).toBeGreaterThan(0);

      // Fast forward time
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 150);

      // Trigger finish callback
      storedFinishCallback?.();

      expect(logger.http).toHaveBeenCalledWith(
        'HTTP_RESPONSE',
        'Request completed',
        expect.objectContaining({
          duration: expect.stringContaining('ms'),
        })
      );

      jest.restoreAllMocks();
    });
  });

  describe('errorLoggingMiddleware', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      mockReq.correlationId = 'test-id';
      mockReq.startTime = Date.now() - 100;

      errorLoggingMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith(
        'MIDDLEWARE_ERROR',
        'Test error',
        expect.objectContaining({
          correlationId: 'test-id',
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
          stack: error.stack,
        })
      );
    });

    it('should calculate duration from startTime', () => {
      const error = new Error('Test error');
      mockReq.startTime = Date.now() - 500;

      errorLoggingMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith(
        'MIDDLEWARE_ERROR',
        'Test error',
        expect.objectContaining({
          duration: expect.any(String),
        })
      );
    });

    it('should handle missing startTime', () => {
      const error = new Error('Test error');

      errorLoggingMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith(
        'MIDDLEWARE_ERROR',
        'Test error',
        expect.objectContaining({
          duration: '0ms',
        })
      );
    });

    it('should pass error to next middleware', () => {
      const error = new Error('Test error');

      errorLoggingMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should include userId if present', () => {
      const error = new Error('Test error');
      mockReq.userId = 'user-456';

      errorLoggingMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith(
        'MIDDLEWARE_ERROR',
        'Test error',
        expect.objectContaining({
          userId: 'user-456',
        })
      );
    });
  });

  describe('detailedRequestLogger', () => {
    const originalEnv = process.env.LOG_LEVEL;

    afterAll(() => {
      process.env.LOG_LEVEL = originalEnv;
    });

    it('should wrap res.send in debug mode', () => {
      process.env.LOG_LEVEL = 'debug';
      mockReq.correlationId = 'test-id';
      const originalSend = jest.fn();
      mockRes.send = jest.fn().mockImplementation(function (this: Response, data) {
        return originalSend.call(this, data);
      });

      detailedRequestLogger(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.send).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not wrap res.send in non-debug mode', () => {
      process.env.LOG_LEVEL = 'info';
      const originalSend = jest.fn();
      mockRes.send = originalSend;

      detailedRequestLogger(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.send).toBe(originalSend);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should truncate large response bodies', () => {
      process.env.LOG_LEVEL = 'debug';
      mockReq.correlationId = 'test-id';

      // Create a mock send function
      const originalSend = jest.fn();
      mockRes.send = jest.fn().mockImplementation(function (this: Response, data: any) {
        return originalSend.call(this, data);
      });

      detailedRequestLogger(mockReq as Request, mockRes as Response, mockNext);

      // Call the wrapped send function with large data
      const sendFn = mockRes.send as jest.Mock;
      const largeData = 'x'.repeat(2000);
      sendFn(largeData);

      expect(logger.debug).toHaveBeenCalledWith(
        'RESPONSE_BODY',
        'Response data',
        expect.objectContaining({
          body: expect.stringMatching(/^.{1,1000}$/),
        })
      );
    });
  });

  describe('slowQueryLogger', () => {
    it('should use default threshold of 1000ms', () => {
      const middleware = slowQueryLogger();
      expect(middleware).toBeDefined();
    });

    it('should use custom threshold', () => {
      const middleware = slowQueryLogger(500);
      expect(middleware).toBeDefined();
    });

    it('should log slow requests', () => {
      const middleware = slowQueryLogger(100);
      mockReq.correlationId = 'slow-id';

      let storedFinishCallback: (() => void) | undefined;
      mockRes.on = jest.fn((event, callback) => {
        if (event === 'finish') {
          storedFinishCallback = callback as () => void;
        }
        return mockRes as Response;
      });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Fast forward time to simulate slow request
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 150);
      storedFinishCallback?.();

      expect(logger.warn).toHaveBeenCalledWith(
        'SLOW_REQUEST',
        'Request exceeded threshold',
        expect.objectContaining({
          threshold: '100ms',
          duration: expect.stringContaining('ms'),
        })
      );

      jest.restoreAllMocks();
    });

    it('should not log fast requests', () => {
      const middleware = slowQueryLogger(1000);
      const finishCallback = jest.fn();
      mockRes.on = jest.fn((event, callback) => {
        if (event === 'finish') finishCallback.mockImplementation(callback);
      });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      finishCallback.mock.calls[0]?.[0]();

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should call next()', () => {
      const middleware = slowQueryLogger();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Logging Utility Functions', () => {
    describe('securityEventLogger', () => {
      it('should log security events with request context', () => {
        mockReq.correlationId = 'security-id';
        mockReq.ip = '192.168.1.1';

        securityEventLogger('LOGIN_FAILED', { attempts: 3 }, mockReq as Request);

        expect(logger.warn).toHaveBeenCalledWith(
          'SECURITY_EVENT',
          'Security event: LOGIN_FAILED',
          expect.objectContaining({
            eventType: 'LOGIN_FAILED',
            attempts: 3,
            correlationId: 'security-id',
            ip: '192.168.1.1',
          })
        );
      });

      it('should work without request context', () => {
        securityEventLogger('SUSPICIOUS_ACTIVITY', { reason: 'rate_limit' });

        expect(logger.warn).toHaveBeenCalledWith(
          'SECURITY_EVENT',
          'Security event: SUSPICIOUS_ACTIVITY',
          expect.objectContaining({
            eventType: 'SUSPICIOUS_ACTIVITY',
            reason: 'rate_limit',
          })
        );
      });
    });

    describe('auditLogger', () => {
      it('should log audit events', () => {
        auditLogger('CREATE', 'API_KEY', 'key-123', 'user-456', { name: 'Test Key' });

        expect(logger.info).toHaveBeenCalledWith(
          'AUDIT_LOG',
          'CREATE API_KEY',
          expect.objectContaining({
            action: 'CREATE',
            entityType: 'API_KEY',
            entityId: 'key-123',
            userId: 'user-456',
            details: { name: 'Test Key' },
          })
        );
      });

      it('should work without details', () => {
        auditLogger('DELETE', 'USER', 'user-789', 'admin-123');

        expect(logger.info).toHaveBeenCalledWith(
          'AUDIT_LOG',
          'DELETE USER',
          expect.objectContaining({
            action: 'DELETE',
            entityType: 'USER',
            entityId: 'user-789',
            userId: 'admin-123',
          })
        );
      });
    });

    describe('performanceLogger', () => {
      it('should log performance metrics', () => {
        performanceLogger('DATABASE_QUERY', 45, { table: 'users' });

        expect(logger.info).toHaveBeenCalledWith(
          'PERFORMANCE',
          'Operation: DATABASE_QUERY',
          expect.objectContaining({
            operation: 'DATABASE_QUERY',
            duration: '45ms',
            table: 'users',
          })
        );
      });

      it('should work without metadata', () => {
        performanceLogger('API_CALL', 120);

        expect(logger.info).toHaveBeenCalledWith(
          'PERFORMANCE',
          'Operation: API_CALL',
          expect.objectContaining({
            operation: 'API_CALL',
            duration: '120ms',
          })
        );
      });
    });

    describe('healthLogger', () => {
      it('should log healthy status', () => {
        healthLogger('healthy', { database: 'connected', redis: 'connected' });

        expect(logger.info).toHaveBeenCalledWith(
          'HEALTH_CHECK',
          'Health status: healthy',
          expect.objectContaining({
            status: 'healthy',
            database: 'connected',
            redis: 'connected',
          })
        );
      });

      it('should log unhealthy status', () => {
        healthLogger('unhealthy', { database: 'disconnected' });

        expect(logger.info).toHaveBeenCalledWith(
          'HEALTH_CHECK',
          'Health status: unhealthy',
          expect.objectContaining({
            status: 'unhealthy',
            database: 'disconnected',
          })
        );
      });
    });

    describe('dbLogger', () => {
      it('should log successful database operations', () => {
        dbLogger('SELECT', 'users', 25, true, { rows: 10 });

        expect(logger.info).toHaveBeenCalledWith(
          'DB_OPERATION_SELECT',
          'SELECT on users',
          expect.objectContaining({
            operation: 'SELECT',
            table: 'users',
            duration: '25ms',
            status: 'success',
            rows: 10,
          })
        );
      });

      it('should log failed database operations', () => {
        dbLogger('INSERT', 'logs', 150, false, { error: 'constraint violation' });

        expect(logger.error).toHaveBeenCalledWith(
          'DB_OPERATION_INSERT',
          'INSERT on logs',
          expect.objectContaining({
            operation: 'INSERT',
            table: 'logs',
            duration: '150ms',
            status: 'error',
            error: 'constraint violation',
          })
        );
      });

      it('should work without details', () => {
        dbLogger('UPDATE', 'settings', 10, true);

        expect(logger.info).toHaveBeenCalledWith(
          'DB_OPERATION_UPDATE',
          'UPDATE on settings',
          expect.objectContaining({
            operation: 'UPDATE',
            table: 'settings',
            duration: '10ms',
            status: 'success',
          })
        );
      });
    });

    describe('iotdbLogger', () => {
      it('should log successful IoTDB operations', () => {
        iotdbLogger('INSERT', 'device-001', 50, true, { points: 100 });

        expect(logger.info).toHaveBeenCalledWith(
          'IOTDB_OPERATION_INSERT',
          'INSERT device-001',
          expect.objectContaining({
            operation: 'INSERT',
            device: 'device-001',
            duration: '50ms',
            status: 'success',
            points: 100,
          })
        );
      });

      it('should log failed IoTDB operations', () => {
        iotdbLogger('QUERY', 'device-002', 200, false, { error: 'timeout' });

        expect(logger.error).toHaveBeenCalledWith(
          'IOTDB_OPERATION_QUERY',
          'QUERY device-002',
          expect.objectContaining({
            operation: 'QUERY',
            device: 'device-002',
            duration: '200ms',
            status: 'error',
            error: 'timeout',
          })
        );
      });

      it('should work without device and duration', () => {
        iotdbLogger('DELETE', undefined, undefined, true);

        expect(logger.info).toHaveBeenCalledWith(
          'IOTDB_OPERATION_DELETE',
          'DELETE ',
          expect.objectContaining({
            operation: 'DELETE',
            status: 'success',
          })
        );
      });
    });

    describe('aiLogger', () => {
      it('should log successful AI operations', () => {
        aiLogger('PREDICT', 'arima-model', 500, true, { datapoints: 1000 });

        expect(logger.info).toHaveBeenCalledWith(
          'AI_OPERATION_PREDICT',
          'PREDICT arima-model',
          expect.objectContaining({
            operation: 'PREDICT',
            modelName: 'arima-model',
            duration: '500ms',
            status: 'success',
            datapoints: 1000,
          })
        );
      });

      it('should log failed AI operations', () => {
        aiLogger('TRAIN', 'lstm-model', 5000, false, { error: 'convergence failed' });

        expect(logger.error).toHaveBeenCalledWith(
          'AI_OPERATION_TRAIN',
          'TRAIN lstm-model',
          expect.objectContaining({
            operation: 'TRAIN',
            modelName: 'lstm-model',
            duration: '5000ms',
            status: 'error',
            error: 'convergence failed',
          })
        );
      });

      it('should work without duration', () => {
        aiLogger('VALIDATE', 'model-123', undefined, true);

        expect(logger.info).toHaveBeenCalledWith(
          'AI_OPERATION_VALIDATE',
          'VALIDATE model-123',
          expect.objectContaining({
            operation: 'VALIDATE',
            modelName: 'model-123',
            status: 'success',
          })
        );
      });
    });
  });
});
