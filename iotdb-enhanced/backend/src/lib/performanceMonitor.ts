/**
 * Performance Monitoring and Alerting Module
 *
 * Provides comprehensive performance monitoring with:
 * - Request/response time tracking
 * - Database query performance
 * - Memory and CPU usage monitoring
 * - Custom metric collection
 * - Alert thresholds and notifications
 */

import { logger } from './logger';
import { initSentry, captureMessage, captureException } from './sentry';

/**
 * Performance metric data point
 */
export interface MetricData {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  tags?: Record<string, string>;
  timestamp: number;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  metricName: string;
  threshold: number;
  comparison: 'gt' | 'lt' | 'eq';
  windowMs?: number;
  notificationFn?: (alert: AlertInfo) => void;
}

/**
 * Alert information
 */
export interface AlertInfo {
  metricName: string;
  currentValue: number;
  threshold: number;
  timestamp: number;
  message: string;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  requestCount: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

/**
 * Request timing data
 */
interface RequestTiming {
  startTime: number;
  endTime: number;
  duration: number;
  path: string;
  method: string;
  statusCode: number;
  success: boolean;
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private metrics: Map<string, MetricData[]> = new Map();
  private requestTimings: RequestTiming[] = [];
  private alertConfigs: Map<string, AlertConfig> = new Map();
  private isRunning = false;
  private metricsRetentionMs = 3600000; // 1 hour
  private maxRequestTimings = 10000;

  constructor() {
    this.setupDefaultAlerts();
  }

  /**
   * Setup default alert configurations
   */
  private setupDefaultAlerts(): void {
    // High response time alert
    this.addAlert({
      metricName: 'response_time',
      threshold: 5000, // 5 seconds
      comparison: 'gt',
      windowMs: 60000, // Check over 1 minute
      notificationFn: (alert) => this.sendAlert(alert),
    });

    // High error rate alert
    this.addAlert({
      metricName: 'error_rate',
      threshold: 5, // 5%
      comparison: 'gt',
      windowMs: 60000,
      notificationFn: (alert) => this.sendAlert(alert),
    });

    // High memory usage alert
    this.addAlert({
      metricName: 'memory_usage',
      threshold: 90, // 90%
      comparison: 'gt',
      notificationFn: (alert) => this.sendAlert(alert),
    });

    // High CPU usage alert
    this.addAlert({
      metricName: 'cpu_usage',
      threshold: 90, // 90%
      comparison: 'gt',
      notificationFn: (alert) => this.sendAlert(alert),
    });
  }

  /**
   * Add custom alert configuration
   */
  addAlert(config: AlertConfig): void {
    this.alertConfigs.set(config.metricName, config);
  }

  /**
   * Record a metric value
   */
  recordMetric(name: string, value: number, unit: MetricData['unit'] = 'ms', tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      unit,
      tags,
      timestamp: Date.now(),
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Cleanup old metrics
    this.cleanupMetrics(name);

    // Check alerts
    this.checkAlerts(name, value);
  }

  /**
   * Record HTTP request timing
   */
  recordRequest(req: any, res: any, duration: number): void {
    const timing: RequestTiming = {
      startTime: Date.now() - duration,
      endTime: Date.now(),
      duration,
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      success: res.statusCode >= 200 && res.statusCode < 400,
    };

    this.requestTimings.push(timing);

    // Cleanup old timings
    if (this.requestTimings.length > this.maxRequestTimings) {
      this.requestTimings = this.requestTimings.slice(-this.maxRequestTimings);
    }

    // Record response time metric
    this.recordMetric('response_time', duration, 'ms', {
      path: req.path,
      method: req.method,
      statusCode: res.statusCode.toString(),
    });

    // Record error count if not successful
    if (!timing.success) {
      this.recordMetric('error_count', 1, 'count', {
        path: req.path,
        method: req.method,
        statusCode: res.statusCode.toString(),
      });
    }
  }

  /**
   * Get percentile value from array of numbers
   */
  private getPercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Calculate performance statistics
   */
  getStats(): PerformanceStats {
    const durations = this.requestTimings.map(t => t.duration);
    const errorCount = this.requestTimings.filter(t => !t.success).length;
    const totalRequests = this.requestTimings.length;

    return {
      requestCount: totalRequests,
      averageResponseTime: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      p50ResponseTime: this.getPercentile(durations, 50),
      p95ResponseTime: this.getPercentile(durations, 95),
      p99ResponseTime: this.getPercentile(durations, 99),
      errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
      memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100,
      cpuUsage: this.getCpuUsage(),
    };
  }

  /**
   * Get CPU usage (approximation)
   */
  private getCpuUsage(): number {
    const usage = process.cpuUsage();
    // Simple approximation - in production use proper CPU monitoring
    return Math.min(usage.user / 1000000, 100);
  }

  /**
   * Cleanup old metrics
   */
  private cleanupMetrics(metricName: string): void {
    const metrics = this.metrics.get(metricName);
    if (!metrics) return;

    const cutoff = Date.now() - this.metricsRetentionMs;
    const filtered = metrics.filter(m => m.timestamp > cutoff);

    this.metrics.set(metricName, filtered);
  }

  /**
   * Check if any alerts should be triggered
   */
  private checkAlerts(metricName: string, value: number): void {
    const config = this.alertConfigs.get(metricName);
    if (!config) return;

    let shouldAlert = false;
    switch (config.comparison) {
      case 'gt':
        shouldAlert = value > config.threshold;
        break;
      case 'lt':
        shouldAlert = value < config.threshold;
        break;
      case 'eq':
        shouldAlert = value === config.threshold;
        break;
    }

    if (shouldAlert && config.notificationFn) {
      const alert: AlertInfo = {
        metricName,
        currentValue: value,
        threshold: config.threshold,
        timestamp: Date.now(),
        message: `Alert: ${metricName} is ${value} (threshold: ${config.threshold})`,
      };

      config.notificationFn(alert);
    }
  }

  /**
   * Send alert notification
   */
  private sendAlert(alert: AlertInfo): void {
    // Log alert
    logger.warn(alert.message);

    // Send to Sentry
    captureMessage(alert.message, 'warning');

    // TODO: Add other notification channels (Slack, email, PagerDuty, etc.)
  }

  /**
   * Get metrics for a specific name
   */
  getMetrics(name: string): MetricData[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.requestTimings = [];
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    // Start periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 60000); // Every minute

    logger.info('Performance monitoring started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('Performance monitoring stopped');
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    const memoryUsage = process.memoryUsage();

    // Memory metrics
    this.recordMetric('memory_usage', memoryUsage.heapUsed / memoryUsage.heapTotal * 100, 'percent');
    this.recordMetric('memory_heap_used', memoryUsage.heapUsed, 'bytes');
    this.recordMetric('memory_heap_total', memoryUsage.heapTotal, 'bytes');
    this.recordMetric('memory_rss', memoryUsage.rss, 'bytes');

    // CPU metrics
    this.recordMetric('cpu_usage', this.getCpuUsage(), 'percent');

    // Event loop lag
    const start = Date.now();
    setImmediate(() => {
      const lag = Date.now() - start;
      this.recordMetric('event_loop_lag', lag, 'ms');
    });

    // Error rate
    const stats = this.getStats();
    this.recordMetric('error_rate', stats.errorRate, 'percent');
  }

  private monitoringInterval: NodeJS.Timeout | null = null;
}

// ============================================================================
// Singleton Instance
// ============================================================================

let performanceMonitorInstance: PerformanceMonitor | null = null;

/**
 * Get performance monitor instance
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance;
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  const monitor = getPerformanceMonitor();
  monitor.start();
}

// ============================================================================
// Express Middleware
// ============================================================================

/**
 * Express middleware to track request performance
 */
export function performanceMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const monitor = getPerformanceMonitor();
    monitor.recordRequest(req, res, duration);
  });

  next();
}

// ============================================================================
// Convenience Functions
// ============================================================================>

/**
 * Record a custom metric
 */
export function recordMetric(name: string, value: number, unit?: MetricData['unit'], tags?: Record<string, string>): void {
  const monitor = getPerformanceMonitor();
  monitor.recordMetric(name, value, unit, tags);
}

/**
 * Get current performance stats
 */
export function getPerformanceStats(): PerformanceStats {
  const monitor = getPerformanceMonitor();
  return monitor.getStats();
}

/**
 * Add custom alert
 */
export function addPerformanceAlert(config: AlertConfig): void {
  const monitor = getPerformanceMonitor();
  monitor.addAlert(config);
}
