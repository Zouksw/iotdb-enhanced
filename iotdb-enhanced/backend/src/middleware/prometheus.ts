import express from "express";
import promClient from "prom-client";
import { Request, Response, NextFunction } from "express";

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Enable default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: "iotdb_enhanced_",
});

// HTTP Request metrics
const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code", "user_agent"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const httpRequestCounter = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"] as const,
});

const httpErrorsTotal = new promClient.Counter({
  name: "http_errors_total",
  help: "Total number of HTTP errors",
  labelNames: ["method", "route", "status_code", "error_type"] as const,
});

// Database metrics
const dbQueryDuration = new promClient.Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "table"] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
});

const dbConnectionsActive = new promClient.Gauge({
  name: "db_connections_active",
  help: "Number of active database connections",
});

const dbQueryCounter = new promClient.Counter({
  name: "db_queries_total",
  help: "Total number of database queries",
  labelNames: ["operation", "table", "status"] as const,
});

// Cache metrics
const cacheHitRate = new promClient.Counter({
  name: "cache_hits_total",
  help: "Total number of cache hits",
  labelNames: ["cache_type"] as const,
});

const cacheMissRate = new promClient.Counter({
  name: "cache_misses_total",
  help: "Total number of cache misses",
  labelNames: ["cache_type"] as const,
});

// IoTDB connection metrics
const iotdbConnectionsActive = new promClient.Gauge({
  name: "iotdb_connections_active",
  help: "Number of active IoTDB connections",
});

const iotdbDataPointsIngested = new promClient.Counter({
  name: "iotdb_datapoints_ingested_total",
  help: "Total number of data points ingested into IoTDB",
  labelNames: ["device", "measurement"] as const,
});

const iotdbQueryDuration = new promClient.Histogram({
  name: "iotdb_query_duration_seconds",
  help: "Duration of IoTDB queries in seconds",
  labelNames: ["query_type"] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// AI Model metrics
const aiModelPredictions = new promClient.Counter({
  name: "ai_model_predictions_total",
  help: "Total number of AI model predictions",
  labelNames: ["model_name", "model_type", "status"] as const,
});

const aiModelDuration = new promClient.Histogram({
  name: "ai_model_prediction_duration_seconds",
  help: "Duration of AI model predictions in seconds",
  labelNames: ["model_name", "model_type"] as const,
  buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60],
});

const aiModelAccuracy = new promClient.Gauge({
  name: "ai_model_accuracy",
  help: "AI model accuracy score",
  labelNames: ["model_name", "model_type"] as const,
});

// Alert metrics
const alertsTriggered = new promClient.Counter({
  name: "alerts_triggered_total",
  help: "Total number of alerts triggered",
  labelNames: ["severity", "type"] as const,
});

const alertsResolved = new promClient.Counter({
  name: "alerts_resolved_total",
  help: "Total number of alerts resolved",
  labelNames: ["severity", "type"] as const,
});

// Active user sessions
const activeUserSessions = new promClient.Gauge({
  name: "active_user_sessions",
  help: "Number of active user sessions",
});

// Forecast metrics
const forecastsGenerated = new promClient.Counter({
  name: "forecasts_generated_total",
  help: "Total number of forecasts generated",
  labelNames: ["model_name", "status"] as const,
});

const forecastDuration = new promClient.Histogram({
  name: "forecast_generation_duration_seconds",
  help: "Duration of forecast generation in seconds",
  labelNames: ["model_name", "horizon"] as const,
  buckets: [0.5, 1, 2.5, 5, 10, 30, 60, 300],
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestCounter);
register.registerMetric(httpErrorsTotal);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionsActive);
register.registerMetric(dbQueryCounter);
register.registerMetric(cacheHitRate);
register.registerMetric(cacheMissRate);
register.registerMetric(iotdbConnectionsActive);
register.registerMetric(iotdbDataPointsIngested);
register.registerMetric(iotdbQueryDuration);
register.registerMetric(aiModelPredictions);
register.registerMetric(aiModelDuration);
register.registerMetric(aiModelAccuracy);
register.registerMetric(alertsTriggered);
register.registerMetric(alertsResolved);
register.registerMetric(activeUserSessions);
register.registerMetric(forecastsGenerated);
register.registerMetric(forecastDuration);

// Middleware to track HTTP requests
export const prometheusMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Record response
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode.toString();
    const userAgent = req.get("user-agent") || "unknown";

    httpRequestDuration
      .labels(req.method, route, statusCode, userAgent)
      .observe(duration);

    httpRequestCounter.labels(req.method, route, statusCode).inc();

    if (statusCode.startsWith("4") || statusCode.startsWith("5")) {
      httpErrorsTotal.labels(req.method, route, statusCode, "http_error").inc();
    }
  });

  next();
};

// Metrics endpoint
export const metricsEndpoint = async (_req: Request, res: Response) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
};

// Helper functions to record custom metrics
export const metrics = {
  // Database metrics
  recordDbQuery: (operation: string, table: string, duration: number, success: boolean) => {
    dbQueryDuration.labels(operation, table).observe(duration);
    dbQueryCounter.labels(operation, table, success ? "success" : "error").inc();
  },

  setDbConnections: (count: number) => {
    dbConnectionsActive.set(count);
  },

  // Cache metrics
  recordCacheHit: (cacheType: string) => {
    cacheHitRate.labels(cacheType).inc();
  },

  recordCacheMiss: (cacheType: string) => {
    cacheMissRate.labels(cacheType).inc();
  },

  // IoTDB metrics
  setIotdbConnections: (count: number) => {
    iotdbConnectionsActive.set(count);
  },

  recordDataPointIngested: (device: string, measurement: string) => {
    iotdbDataPointsIngested.labels(device, measurement).inc();
  },

  recordIotdbQuery: (queryType: string, duration: number) => {
    iotdbQueryDuration.labels(queryType).observe(duration);
  },

  // AI Model metrics
  recordPrediction: (modelName: string, modelType: string, duration: number, success: boolean) => {
    aiModelPredictions.labels(modelName, modelType, success ? "success" : "error").inc();
    aiModelDuration.labels(modelName, modelType).observe(duration);
  },

  setModelAccuracy: (modelName: string, modelType: string, accuracy: number) => {
    aiModelAccuracy.labels(modelName, modelType).set(accuracy);
  },

  // Alert metrics
  recordAlertTriggered: (severity: string, type: string) => {
    alertsTriggered.labels(severity, type).inc();
  },

  recordAlertResolved: (severity: string, type: string) => {
    alertsResolved.labels(severity, type).inc();
  },

  // Session metrics
  setActiveUserSessions: (count: number) => {
    activeUserSessions.set(count);
  },

  // Forecast metrics
  recordForecastGenerated: (modelName: string, success: boolean) => {
    forecastsGenerated.labels(modelName, success ? "success" : "error").inc();
  },

  recordForecastDuration: (modelName: string, horizon: string, duration: number) => {
    forecastDuration.labels(modelName, horizon).observe(duration);
  },
};

// Health check with metrics
export const healthWithMetrics = async (req: Request, res: Response) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics: {
      httpRequests: await httpRequestCounter.get(),
      dbConnections: await dbConnectionsActive.get(),
      activeSessions: await activeUserSessions.get(),
    },
  };

  res.json(health);
};

export { register };
