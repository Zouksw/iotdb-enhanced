import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

// Mock prom-client before importing
jest.mock('prom-client', () => {
  const mockMetric = {
    inc: jest.fn(),
    observe: jest.fn(),
    set: jest.fn(),
    labels: jest.fn(function(this: any) { return this; }),
    reset: jest.fn(),
    get: jest.fn().mockResolvedValue({ name: 'test' }),
  };

  const mockRegister = {
    registerMetric: jest.fn(),
    contentType: 'text/plain; version=0.0.4',
    metrics: jest.fn().mockResolvedValue('# test\n'),
  };

  return {
    Registry: jest.fn(() => mockRegister),
    Histogram: jest.fn(() => mockMetric),
    Counter: jest.fn(() => mockMetric),
    Gauge: jest.fn(() => mockMetric),
    collectDefaultMetrics: jest.fn(),
  };
});

import * as promClient from 'prom-client';
import {
  prometheusMiddleware,
  metricsEndpoint,
  metrics,
  healthWithMetrics,
} from '../prometheus';

describe('Prometheus Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      method: 'GET',
      path: '/api/test',
      route: { path: '/api/test' },
      get: jest.fn((header: string) => {
        if (header === 'user-agent') return 'test-agent';
        return undefined;
      }),
    };

    mockRes = {
      statusCode: 200,
      on: jest.fn((event: string, callback: () => void) => {
        // Immediately call the callback for synchronous testing
        if (event === 'finish') {
          setImmediate(callback);
        }
      }),
      set: jest.fn(),
      end: jest.fn(),
      json: jest.fn(),
      status: jest.fn(function(this: any) { return this; }),
    };

    mockNext = jest.fn();
  });

  describe('prometheusMiddleware', () => {
    test('should call next() and setup finish handler', () => {
      prometheusMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    test('should record metrics on response finish', async () => {
      // Set up mock to track histogram/counter calls
      const HistogramSpy = jest.spyOn(promClient, 'Histogram');

      prometheusMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Wait for the finish callback to execute
      await new Promise(resolve => setImmediate(resolve));

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
      HistogramSpy.mockRestore();
    });

    test('should handle requests without route', () => {
      mockReq.route = undefined;
      mockReq.path = '/api/test';

      prometheusMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle different HTTP methods', () => {
      mockReq.method = 'POST';

      prometheusMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle error status codes', () => {
      mockRes.statusCode = 500;

      prometheusMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('metricsEndpoint', () => {
    test('should return metrics in prometheus format', async () => {
      await metricsEndpoint({} as Request, mockRes as Response);

      expect(mockRes.set).toHaveBeenCalledWith('Content-Type', expect.stringContaining('text/plain'));
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  describe('metrics helper functions', () => {
    describe('Database metrics', () => {
      test('should record DB query with success', () => {
        expect(() => metrics.recordDbQuery('SELECT', 'users', 0.05, true)).not.toThrow();
      });

      test('should record DB query with error', () => {
        expect(() => metrics.recordDbQuery('SELECT', 'users', 0.05, false)).not.toThrow();
      });

      test('should set DB connections count', () => {
        expect(() => metrics.setDbConnections(10)).not.toThrow();
      });
    });

    describe('Cache metrics', () => {
      test('should record cache hit', () => {
        expect(() => metrics.recordCacheHit('redis')).not.toThrow();
      });

      test('should record cache miss', () => {
        expect(() => metrics.recordCacheMiss('redis')).not.toThrow();
      });
    });

    describe('IoTDB metrics', () => {
      test('should set IoTDB connections count', () => {
        expect(() => metrics.setIotdbConnections(5)).not.toThrow();
      });

      test('should record ingested data point', () => {
        expect(() => metrics.recordDataPointIngested('device1', 'temperature')).not.toThrow();
      });

      test('should record IoTDB query duration', () => {
        expect(() => metrics.recordIotdbQuery('SELECT', 0.1)).not.toThrow();
      });
    });

    describe('AI Model metrics', () => {
      test('should record successful prediction', () => {
        expect(() => metrics.recordPrediction('arima', 'forecast', 1.5, true)).not.toThrow();
      });

      test('should record failed prediction', () => {
        expect(() => metrics.recordPrediction('arima', 'forecast', 1.5, false)).not.toThrow();
      });

      test('should set model accuracy', () => {
        expect(() => metrics.setModelAccuracy('arima', 'forecast', 0.95)).not.toThrow();
      });
    });

    describe('Alert metrics', () => {
      test('should record alert triggered', () => {
        expect(() => metrics.recordAlertTriggered('high', 'anomaly')).not.toThrow();
      });

      test('should record alert resolved', () => {
        expect(() => metrics.recordAlertResolved('high', 'anomaly')).not.toThrow();
      });
    });

    describe('Session metrics', () => {
      test('should set active user sessions', () => {
        expect(() => metrics.setActiveUserSessions(42)).not.toThrow();
      });
    });

    describe('Forecast metrics', () => {
      test('should record forecast generated', () => {
        expect(() => metrics.recordForecastGenerated('arima', true)).not.toThrow();
      });

      test('should record forecast duration', () => {
        expect(() => metrics.recordForecastDuration('arima', '24h', 2.5)).not.toThrow();
      });
    });
  });

  describe('healthWithMetrics', () => {
    test('should return health status with metrics', async () => {
      await healthWithMetrics({} as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          memory: expect.any(Object),
          metrics: expect.objectContaining({
            httpRequests: expect.any(Object),
            dbConnections: expect.any(Object),
            activeSessions: expect.any(Object),
          }),
        })
      );
    });
  });
});
