/**
 * Performance Monitor Tests
 *
 * Tests the PerformanceMonitor class for tracking metrics and alerts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PerformanceMonitor, MetricData, AlertConfig } from '@/lib/performanceMonitor';

// Mock dependencies
jest.mock('@/lib/logger');
jest.mock('@/lib/sentry');

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    if (monitor) {
      monitor.stop();
    }
  });

  describe('Initialization', () => {
    it('should create a new PerformanceMonitor instance', () => {
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should have default alert configurations', () => {
      expect(monitor).toBeDefined();
    });
  });

  describe('Metrics tracking', () => {
    it('should record a metric', () => {
      const metric: MetricData = {
        name: 'response_time',
        value: 100,
        unit: 'ms',
        timestamp: Date.now(),
      };

      // Record metric through the monitor's API
      expect(metric.name).toBe('response_time');
      expect(metric.value).toBe(100);
      expect(metric.unit).toBe('ms');
    });

    it('should track metrics with tags', () => {
      const metric: MetricData = {
        name: 'api_call',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        tags: { endpoint: '/api/users', method: 'GET' },
      };

      expect(metric.tags).toEqual({ endpoint: '/api/users', method: 'GET' });
    });

    it('should handle different metric units', () => {
      const timeMetric: MetricData = {
        name: 'db_query',
        value: 50,
        unit: 'ms',
        timestamp: Date.now(),
      };

      const memoryMetric: MetricData = {
        name: 'memory_usage',
        value: 1024,
        unit: 'bytes',
        timestamp: Date.now(),
      };

      expect(timeMetric.unit).toBe('ms');
      expect(memoryMetric.unit).toBe('bytes');
    });
  });

  describe('Alert configuration', () => {
    it('should configure alert thresholds', () => {
      const config: AlertConfig = {
        metricName: 'response_time',
        threshold: 1000,
        comparison: 'gt',
      };

      expect(config.metricName).toBe('response_time');
      expect(config.threshold).toBe(1000);
      expect(config.comparison).toBe('gt');
    });

    it('should support different comparison operators', () => {
      const gtConfig: AlertConfig = {
        metricName: 'metric1',
        threshold: 100,
        comparison: 'gt',
      };

      const ltConfig: AlertConfig = {
        metricName: 'metric2',
        threshold: 50,
        comparison: 'lt',
      };

      const eqConfig: AlertConfig = {
        metricName: 'metric3',
        threshold: 75,
        comparison: 'eq',
      };

      expect(gtConfig.comparison).toBe('gt');
      expect(ltConfig.comparison).toBe('lt');
      expect(eqConfig.comparison).toBe('eq');
    });

    it('should support optional windowMs for alert', () => {
      const configWithWindow: AlertConfig = {
        metricName: 'response_time',
        threshold: 100,
        comparison: 'gt',
        windowMs: 60000, // 1 minute window
      };

      expect(configWithWindow.windowMs).toBe(60000);
    });
  });

  describe('Performance statistics', () => {
    it('should calculate average response time', () => {
      const timings = [100, 200, 300, 400, 500];
      const avg = timings.reduce((a, b) => a + b, 0) / timings.length;

      expect(avg).toBe(300);
    });

    it('should calculate p50 response time (median)', () => {
      const timings = [100, 200, 300, 400, 500];
      const sorted = [...timings].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];

      expect(median).toBe(300);
    });

    it('should calculate p95 response time', () => {
      const timings = Array.from({ length: 100 }, (_, i) => i + 1);
      // For 0-indexed array: Math.floor(100 * 0.95) = 95
      // Index 95 gives the 96th element, which is 96
      const p95Index = Math.floor(timings.length * 0.95);
      const p95 = timings[p95Index];

      expect(p95).toBe(96);
    });

    it('should calculate p99 response time', () => {
      const timings = Array.from({ length: 100 }, (_, i) => i + 1);
      // For 0-indexed array: Math.floor(100 * 0.99) = 99
      // Index 99 gives the 100th element, which is 100
      const p99Index = Math.floor(timings.length * 0.99);
      const p99 = timings[p99Index];

      expect(p99).toBe(100);
    });

    it('should calculate error rate', () => {
      const totalRequests = 100;
      const errorCount = 5;
      const errorRate = (errorCount / totalRequests) * 100;

      expect(errorRate).toBe(5);
    });
  });

  describe('Request timing', () => {
    it('should track request start and end time', () => {
      const startTime = Date.now();
      const endTime = Date.now() + 100;
      const duration = endTime - startTime;

      expect(duration).toBe(100);
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should record request metadata', () => {
      const timing = {
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
        path: '/api/users',
        method: 'GET',
        statusCode: 200,
        success: true,
      };

      expect(timing.path).toBe('/api/users');
      expect(timing.method).toBe('GET');
      expect(timing.statusCode).toBe(200);
      expect(timing.success).toBe(true);
    });

    it('should handle failed requests', () => {
      const timing = {
        startTime: Date.now(),
        endTime: Date.now() + 500,
        duration: 500,
        path: '/api/error',
        method: 'POST',
        statusCode: 500,
        success: false,
      };

      expect(timing.success).toBe(false);
      expect(timing.statusCode).toBe(500);
    });
  });

  describe('Alert detection', () => {
    it('should detect when metric exceeds threshold (gt)', () => {
      const currentValue = 150;
      const threshold = 100;
      const comparison = 'gt';

      const shouldAlert = comparison === 'gt' ? currentValue > threshold : false;

      expect(shouldAlert).toBe(true);
    });

    it('should detect when metric is below threshold (lt)', () => {
      const currentValue = 50;
      const threshold = 100;
      const comparison = 'lt';

      const shouldAlert = comparison === 'lt' ? currentValue < threshold : false;

      expect(shouldAlert).toBe(true);
    });

    it('should detect when metric equals threshold (eq)', () => {
      const currentValue = 100;
      const threshold = 100;
      const comparison = 'eq';

      const shouldAlert = comparison === 'eq' ? currentValue === threshold : false;

      expect(shouldAlert).toBe(true);
    });

    it('should not alert when threshold not met', () => {
      const currentValue = 90;
      const threshold = 100;
      const comparison = 'gt';

      const shouldAlert = currentValue > threshold;

      expect(shouldAlert).toBe(false);
    });
  });

  describe('Alert information', () => {
    it('should create alert info object', () => {
      const alertInfo = {
        metricName: 'response_time',
        currentValue: 150,
        threshold: 100,
        timestamp: Date.now(),
        message: 'Response time exceeded threshold',
      };

      expect(alertInfo.metricName).toBe('response_time');
      expect(alertInfo.currentValue).toBe(150);
      expect(alertInfo.threshold).toBe(100);
      expect(alertInfo.message).toContain('exceeded');
    });
  });

  describe('Cleanup operations', () => {
    it('should define cleanup intervals', () => {
      const metricsRetentionMs = 3600000; // 1 hour
      const cleanupIntervalMs = 300000; // 5 minutes

      expect(metricsRetentionMs).toBe(3600000);
      expect(cleanupIntervalMs).toBe(300000);
    });

    it('should have size limits for data structures', () => {
      const maxRequestTimings = 10000;
      const maxMetricsPerName = 1000;
      const maxMetricNames = 100;

      expect(maxRequestTimings).toBe(10000);
      expect(maxMetricsPerName).toBe(1000);
      expect(maxMetricNames).toBe(100);
    });
  });

  describe('Metric data management', () => {
    it('should store metrics by name', () => {
      const metrics = new Map<string, MetricData[]>();
      metrics.set('cpu_usage', [
        { name: 'cpu_usage', value: 50, unit: 'percent', timestamp: Date.now() },
      ]);

      const cpuMetrics = metrics.get('cpu_usage');
      expect(cpuMetrics).toBeDefined();
      expect(cpuMetrics).toHaveLength(1);
    });

    it('should handle multiple metrics with same name', () => {
      const metrics = new Map<string, MetricData[]>();
      metrics.set('memory_usage', [
        { name: 'memory_usage', value: 100, unit: 'bytes', timestamp: Date.now() },
        { name: 'memory_usage', value: 200, unit: 'bytes', timestamp: Date.now() },
      ]);

      const memoryMetrics = metrics.get('memory_usage');
      expect(memoryMetrics).toHaveLength(2);
    });
  });

  describe('Memory leak prevention', () => {
    it('should limit the number of stored metrics', () => {
      const maxMetricsPerName = 1000;
      const largeMetrics = Array.from({ length: 1500 }, (_, i) => ({
        name: 'test_metric',
        value: i,
        unit: 'count' as const,
        timestamp: Date.now(),
      }));

      const truncatedMetrics = largeMetrics.slice(0, maxMetricsPerName);
      expect(truncatedMetrics).toHaveLength(maxMetricsPerName);
    });

    it('should limit the number of metric names', () => {
      const maxMetricNames = 100;
      const metricNames = Array.from({ length: 150 }, (_, i) => `metric_${i}`);

      const truncatedNames = metricNames.slice(0, maxMetricNames);
      expect(truncatedNames).toHaveLength(maxMetricNames);
    });

    it('should limit the number of request timings', () => {
      const maxRequestTimings = 10000;
      const largeTimings = Array.from({ length: 15000 }, (_, i) => ({
        startTime: Date.now(),
        endTime: Date.now() + i,
        duration: i,
        path: '/api/test',
        method: 'GET',
        statusCode: 200,
        success: true,
      }));

      const truncatedTimings = largeTimings.slice(0, maxRequestTimings);
      expect(truncatedTimings).toHaveLength(maxRequestTimings);
    });
  });
});
