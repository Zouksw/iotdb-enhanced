import { Router, Request, Response } from 'express';
import { iotdbClient, iotdbRPCClient, iotdbAIService } from '@/services/iotdb';
import { aiRateLimiter } from '@/middleware/rateLimiter';
import { asyncHandler, BadRequestError } from '@/middleware/errorHandler';
import { metrics } from '@/middleware/prometheus';
import { logger } from '@/utils/logger';
import {
  sqlQuerySchema,
  createTimeseriesSchema,
  insertRecordsSchema,
  insertOneRecordSchema,
  queryDataSchema,
  aggregateSchema,
  predictSchema,
  batchPredictSchema,
  detectAnomaliesSchema,
  visualizePredictSchema,
} from '@/schemas/iotdb';
import { get as cacheGet, set as cacheSet, mget, cacheKeys } from '@/services/cache';

const router = Router();

// === 系统状态 ===

/**
 * GET /api/iotdb/status
 * Check IoTDB service health
 */
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const isHealthy = await iotdbClient.healthCheck();
  res.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    config: {
      host: process.env.IOTDB_HOST || 'localhost',
      port: process.env.IOTDB_PORT || '6667',
      restUrl: process.env.IOTDB_REST_URL || 'http://localhost:18080',
    },
  });
}));

// === SQL 查询接口 ===

/**
 * POST /api/iotdb/sql
 * Execute SQL query - Primary interface for all IoTDB operations
 */
router.post('/sql', asyncHandler(async (req: Request, res: Response) => {
  const { sql } = sqlQuerySchema.parse(req.body);
  const result = await iotdbClient.query(sql);
  res.json(result);
}));

/**
 * GET /api/iotdb/sql
 * Execute SQL query via GET (for simple queries)
 */
router.get('/sql', asyncHandler(async (req: Request, res: Response) => {
  const { sql } = req.query;
  if (!sql || typeof sql !== 'string') {
    throw new BadRequestError('SQL query required');
  }
  const result = await iotdbClient.query(sql);
  res.json(result);
}));

// === 便捷接口 (基于SQL) ===

/**
 * POST /api/iotdb/timeseries
 * Create a new time series using SQL
 */
router.post('/timeseries', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createTimeseriesSchema.parse(req.body);

  // Use RPC client for CREATE operations
  const result = await iotdbRPCClient.createTimeseries(validatedData);
  res.json({ success: true, result });
}));

/**
 * GET /api/iotdb/timeseries
 * List time series
 */
router.get('/timeseries', asyncHandler(async (req: Request, res: Response) => {
  const { path } = req.query;
  const result = await iotdbClient.listTimeseries(path as string | undefined);
  res.json(result);
}));

/**
 * DELETE /api/iotdb/timeseries/:path
 * Delete a time series
 */
router.delete('/timeseries/:path(*)', asyncHandler(async (req: Request, res: Response) => {
  const { path } = req.params;
  // Use RPC client for DROP operations
  const result = await iotdbRPCClient.deleteTimeseries(path);
  res.json({ success: true, result });
}));

/**
 * POST /api/iotdb/insert
 * Insert records into time series
 */
router.post('/insert', asyncHandler(async (req: Request, res: Response) => {
  const { records } = insertRecordsSchema.parse(req.body);

  // Transform records to match RPC client format
  const transformedRecords = records.map(r => ({
    device: r.device,
    timestamp: r.timestamp,
    measurements: r.measurements.map(m => m.name),
    values: [r.measurements.map(m => m.value)]
  }));

  // Use RPC client for INSERT operations
  const result = await iotdbRPCClient.insertRecords(transformedRecords as any);
  res.json({ success: true, result });
}));

/**
 * POST /api/iotdb/insert/one
 * Insert a single record
 */
router.post('/insert/one', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = insertOneRecordSchema.parse(req.body);

  // Convert measurements array to Record format for RPC client
  // Schema: [{ name: 'temp', value: 25.5 }, ...] -> Record: { temp: 25.5, ... }
  const measurementsRecord: Record<string, unknown> = {};
  for (const m of validatedData.measurements) {
    measurementsRecord[m.name] = m.value;
  }

  // Use RPC client for INSERT operations
  const result = await iotdbRPCClient.insertOneRecord({
    device: validatedData.device,
    timestamp: validatedData.timestamp,
    measurements: measurementsRecord,
  });
  res.json({ success: true, result });
}));

/**
 * POST /api/iotdb/query/data
 * Query time series data
 */
router.post('/query/data', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = queryDataSchema.parse(req.body);
  const result = await iotdbClient.queryData(validatedData);
  res.json(result);
}));

/**
 * POST /api/iotdb/aggregate
 * Execute aggregate query
 */
router.post('/aggregate', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = aggregateSchema.parse(req.body);
  const result = await iotdbClient.aggregate({
    ...validatedData,
    interval: validatedData.interval?.toString(),
  } as any);
  res.json(result);
}));

// === AI 功能 ===

/**
 * POST /api/iotdb/ai/predict
 * Predict future values using AI
 */
router.post('/ai/predict', aiRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { timeseries, horizon, algorithm, confidenceLevel } = predictSchema.parse(req.body);

  // Normalize algorithm (prophet -> timer_xl for IoTDB compatibility)
  const normalizedAlgorithm = algorithm === 'prophet' ? 'arima' : algorithm || 'arima';

  // Try to get from cache first
  const cacheKey = cacheKeys.prediction(timeseries, normalizedAlgorithm, horizon);

  const cachedResult = await cacheGet(cacheKey);
  if (cachedResult) {
    return res.json({
      ...cachedResult,
      cached: true,
    });
  }

  try {
    // Generate prediction
    const result = await iotdbAIService.predict({
      timeseries,
      horizon,
      algorithm: normalizedAlgorithm as any,
      confidenceLevel,
    });

    const duration = (Date.now() - startTime) / 1000;

    // Record prediction metrics (10% sampling for performance)
    if (Math.random() < 0.1) {
      metrics.recordPrediction(normalizedAlgorithm, 'forecast', duration, true);
    }

    // Cache the result for 15 minutes
    await cacheSet(cacheKey, result, 900);

    res.json({ ...result, cached: false });
  } catch (error) {
    // Record error metrics (always record errors)
    const duration = (Date.now() - startTime) / 1000;
    metrics.recordPrediction(normalizedAlgorithm, 'forecast', duration, false);
    logger.error(`AI prediction failed for ${timeseries}: ${error}`);
    throw error;
  }
}));

/**
 * POST /api/iotdb/ai/predict/batch
 * Batch predict for multiple time series
 */
router.post('/ai/predict/batch', aiRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { requests } = batchPredictSchema.parse(req.body);

  // Normalize algorithms and build cache keys
  const normalizedRequests = requests.map((r: any) => ({
    ...r,
    algorithm: (r.algorithm === 'prophet' ? 'arima' : r.algorithm || 'arima') as any,
  }));

  // Try to get all results from cache
  const cacheKeysList = normalizedRequests.map((r: any) =>
    cacheKeys.prediction(r.timeseries, r.algorithm, r.horizon)
  );

  const cachedResults = await mget<any>(cacheKeysList);
  const batchResults: any[] = [];
  const uncachedIndices: number[] = [];

  // Separate cached and uncached requests
  requests.forEach((req: any, index: number) => {
    if (cachedResults[index]) {
      batchResults[index] = {
        ...cachedResults[index],
        cached: true,
        timeseries: req.timeseries,
      };
    } else {
      uncachedIndices.push(index);
    }
  });

  // Process uncached requests in parallel
  if (uncachedIndices.length > 0) {
    const uncachedRequests = uncachedIndices.map(i => normalizedRequests[i]);
    const freshResults = await iotdbAIService.batchPredict(uncachedRequests as any);

    // Store in cache and update results
    for (let i = 0; i < freshResults.length; i++) {
      const result = freshResults[i];
      const originalIndex = uncachedIndices[i];

      batchResults[originalIndex] = {
        ...result,
        cached: false,
        timeseries: requests[originalIndex].timeseries,
      };

      // Cache the result
      await cacheSet(cacheKeysList[originalIndex], result, 900);
    }
  }

  res.json({
    results: batchResults,
    summary: {
      total: requests.length,
      cached: cachedResults.filter(r => r).length,
      computed: uncachedIndices.length,
    },
  });
}));

/**
 * POST /api/iotdb/ai/predict/visualize
 * Get historical data + predictions for chart visualization
 */
router.post('/ai/predict/visualize', aiRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { timeseries, horizon, algorithm, confidenceLevel, historyPoints } = visualizePredictSchema.parse(req.body);

  // Normalize algorithm
  const normalizedAlgorithm = algorithm === 'prophet' ? 'arima' : algorithm || 'arima';

  // Get historical data for context
  const historicalResult = await iotdbClient.queryData({
    path: timeseries,
    limit: historyPoints || 50,
  });

  // Get predictions
  const predictionResult = await iotdbAIService.predict({
    timeseries,
    horizon: horizon || 10,
    algorithm: normalizedAlgorithm as any,
    confidenceLevel: confidenceLevel || 0.95,
  });

  res.json({
    timeseries,
    historical: historicalResult.data || [],
    prediction: predictionResult,
    algorithm: normalizedAlgorithm,
  });
}));

/**
 * POST /api/iotdb/ai/anomalies
 * Detect anomalies using AI
 */
router.post('/ai/anomalies', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  const validatedData = detectAnomaliesSchema.parse(req.body);

  try {
    const result = await iotdbAIService.detectAnomalies({
      timeseries: validatedData.timeseries,
      method: validatedData.method || 'ml',
      threshold: validatedData.threshold,
      windowSize: validatedData.windowSize,
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
    });

    const duration = (Date.now() - startTime) / 1000;

    // Record anomaly detection metrics (10% sampling for performance)
    if (Math.random() < 0.1) {
      metrics.recordPrediction(validatedData.method || 'ml', 'anomaly_detection', duration, true);
    }

    res.json(result);
  } catch (error) {
    // Record error metrics (always record errors)
    const duration = (Date.now() - startTime) / 1000;
    metrics.recordPrediction(validatedData.method || 'ml', 'anomaly_detection', duration, false);
    logger.error(`AI anomaly detection failed for ${validatedData.timeseries}: ${error}`);
    throw error;
  }
}));

/**
 * POST /api/iotdb/ai/anomalies/visualize
 * Get historical data + anomalies for chart visualization
 */
router.post('/ai/anomalies/visualize', aiRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { timeseries, method, threshold, startTime, endTime, historyPoints } = req.body;

  // Get historical data for context
  const limit = historyPoints || 100;
  const historicalResult = await iotdbClient.queryData({
    path: timeseries,
    limit,
    startTime,
    endTime,
  });

  // Detect anomalies
  const anomalyResult = await iotdbAIService.detectAnomalies({
    timeseries,
    method: method || 'statistical',
    threshold: threshold || 2.5,
    startTime,
    endTime,
  });

  res.json({
    timeseries,
    historical: historicalResult.data || [],
    anomalies: anomalyResult.anomalies || [],
    statistics: anomalyResult.statistics || { total: 0, bySeverity: {} },
    method: method || 'statistical',
  });
}));

/**
 * GET /api/iotdb/ai/models
 * List available AI models
 */
router.get('/ai/models', asyncHandler(async (req: Request, res: Response) => {
  const models = await iotdbAIService.listModels();
  res.json({ models });
}));

/**
 * GET /api/iotdb/ai/models/:id
 * Get model information
 */
router.get('/ai/models/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const model = await iotdbAIService.getModelInfo(id);
  res.json(model);
}));

/**
 * POST /api/iotdb/ai/models/train
 * Train a new AI model
 */
router.post('/ai/models/train', asyncHandler(async (req: Request, res: Response) => {
  const { timeseries, algorithm, parameters } = req.body;

  if (!timeseries || !algorithm) {
    throw new BadRequestError('Missing required parameters: timeseries, algorithm');
  }

  const result = await iotdbAIService.trainModel({
    timeseries,
    algorithm,
    parameters,
  });

  res.json(result);
}));

export { router as iotdbRouter };
