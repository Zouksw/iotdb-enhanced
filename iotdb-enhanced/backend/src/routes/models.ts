import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { getPagination, paginationSchema, limitSchema } from '../schemas/common';
import { modelsQuerySchema, trainModelSchema, predictSchema, forecastsQuerySchema } from '../schemas/models';
import { getIoTDBClient } from '../../config/iotdb';

const router = Router();

// GET /api/models - Get all forecasting models
router.get('/', asyncHandler(async (req, res) => {
  const { timeseriesId, isActive, algorithm } = req.query;
  const { skip, take } = getPagination(req.query);
  const params = modelsQuerySchema.parse(req.query);

  const where: any = {};
  if (timeseriesId) where.timeseriesId = timeseriesId as string;
  if (params.isActive !== undefined) where.isActive = params.isActive;
  if (algorithm) where.algorithm = algorithm as string;

  const [models, total] = await Promise.all([
    prisma.forecastingModel.findMany({
      where,
      skip,
      take,
      include: {
        timeseries: {
          select: { id: true, name: true, slug: true, unit: true },
        },
        trainedBy: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { forecasts: true } },
      },
      orderBy: { trainedAt: 'desc' },
    }),
    prisma.forecastingModel.count({ where }),
  ]);

  res.json({
    models,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  });
}));

// GET /api/models/:id - Get single model
router.get('/:id', asyncHandler(async (req, res) => {
  const model = await prisma.forecastingModel.findUnique({
    where: { id: req.params.id },
    include: {
      timeseries: {
        select: {
          id: true,
          name: true,
          slug: true,
          unit: true,
          dataset: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      trainedBy: {
        select: { id: true, name: true, email: true },
      },
      forecasts: {
        take: 10,
        orderBy: { timestamp: 'desc' },
      },
      _count: { select: { forecasts: true } },
    },
  });

  if (!model) {
    throw new NotFoundError('Model');
  }

  res.json({ model });
}));

// POST /api/models/train - Train a new forecasting model using IoTDB AINode
router.post('/train', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const validatedData = trainModelSchema.parse(req.body);

  // Check if timeseries exists
  const timeseries = await prisma.timeseries.findUnique({
    where: { id: validatedData.timeseriesId },
    include: {
      dataset: true,
    },
  });

  if (!timeseries) {
    throw new NotFoundError('Timeseries');
  }

  // Deactivate existing models for this timeseries
  await prisma.forecastingModel.updateMany({
    where: {
      timeseriesId: validatedData.timeseriesId,
      isActive: true,
    },
    data: { isActive: false },
  });

  // Build IoTDB path for the timeseries
  const iotdbPath = `root.${timeseries.datasetId}.${timeseries.slug}`;

  // Call IoTDB AINode to train the model
  const iotdbClient = await getIoTDBClient();
  const startTime = Date.now();

  const trainResult = await iotdbClient.trainModel(
    iotdbPath,
    validatedData.algorithm as any,
    validatedData.hyperparameters || {}
  );

  const trainingDuration = Date.now() - startTime;

  if (!trainResult.success) {
    throw new BadRequestError(`AINode training failed: ${trainResult.message}`);
  }

  // Get training data count for metrics
  const dataPointsCount = await prisma.datapoint.count({
    where: {
      timeseriesId: validatedData.timeseriesId,
      ...(validatedData.trainingStart && { timestamp: { gte: new Date(validatedData.trainingStart) } }),
      ...(validatedData.trainingEnd && { timestamp: { lte: new Date(validatedData.trainingEnd) } }),
    },
  });

  // Create model record in database
  const model = await prisma.forecastingModel.create({
    data: {
      timeseriesId: validatedData.timeseriesId,
      trainedById: userId,
      algorithm: validatedData.algorithm,
      hyperparameters: {
        ...validatedData.hyperparameters,
        iotdbPath,
        iotdbModelId: trainResult.modelId,
      },
      trainingMetrics: {
        trainingSamples: dataPointsCount,
        trainingDuration,
        ainodeResponse: trainResult.message,
      },
      version: 1,
      isActive: true,
      trainedAt: new Date(),
      deployedAt: new Date(),
    },
    include: {
      timeseries: {
        select: { id: true, name: true, slug: true, unit: true },
      },
      trainedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Emit WebSocket event
  const io = req.app.get('io');
  if (io) {
    io.to(`timeseries:${validatedData.timeseriesId}`).emit('model:trained', model);
  }

  res.status(201).json({ model });
}));

// POST /api/models/:modelId/predict - Generate forecast using IoTDB AINode
router.post('/:modelId/predict', asyncHandler(async (req, res) => {
  const { modelId } = req.params;
  const validatedData = predictSchema.parse(req.body);

  const model = await prisma.forecastingModel.findUnique({
    where: { id: modelId },
    include: {
      timeseries: true,
    },
  });

  if (!model) {
    throw new NotFoundError('Model');
  }

  if (!model.isActive) {
    throw new BadRequestError('Model is not active');
  }

  // Get IoTDB model ID from hyperparameters
  const params = model.hyperparameters as {
    iotdbPath?: string;
    iotdbModelId?: string;
  };

  if (!params?.iotdbPath || !params?.iotdbModelId) {
    throw new BadRequestError('Model not trained with AINode. Please retrain the model.');
  }

  // Call IoTDB AINode for prediction
  const iotdbClient = await getIoTDBClient();
  const predictResult = await iotdbClient.predict(
    params.iotdbPath,
    params.iotdbModelId,
    validatedData.horizon,
    validatedData.confidenceLevel
  );

  if (!predictResult.success || !predictResult.forecasts) {
    throw new BadRequestError(`AINode prediction failed: ${predictResult.message}`);
  }

  // Convert AINode forecasts to database format
  const forecasts = predictResult.forecasts.map((f: any) => ({
    modelId,
    timeseriesId: model.timeseriesId,
    timestamp: f.timestamp,
    predictedValue: new Prisma.Decimal(String(f.predictedValue ?? 0)),
    lowerBound: new Prisma.Decimal(String(f.lowerBound ?? f.predictedValue ?? 0)),
    upperBound: new Prisma.Decimal(String(f.upperBound ?? f.predictedValue ?? 0)),
    confidence: new Prisma.Decimal(validatedData.confidenceLevel.toFixed(2)),
    anomalyProbability: new Prisma.Decimal('0'),
    isAnomaly: false,
  }));

  // Batch insert forecasts
  await prisma.forecast.createMany({
    data: forecasts,
    skipDuplicates: true,
  });

  // Emit WebSocket event
  const io = req.app.get('io');
  if (io) {
    io.to(`timeseries:${model.timeseriesId}`).emit('forecast:generated', {
      modelId,
      count: forecasts.length,
    });
  }

  res.status(201).json({
    forecasts,
    meta: {
      modelId,
      horizon: forecasts.length,
      generatedAt: new Date(),
    },
  });
}));

// GET /api/models/:modelId/forecasts - Get forecasts from a model
router.get('/:modelId/forecasts', asyncHandler(async (req, res) => {
  const { modelId } = req.params;
  const { start, end } = req.query;
  const params = limitSchema.parse(req.query);

  const where: any = { modelId };

  if (start || end) {
    where.timestamp = {};
    if (start) where.timestamp.gte = new Date(start as string);
    if (end) where.timestamp.lte = new Date(end as string);
  }

  const forecasts = await prisma.forecast.findMany({
    where,
    take: params.limit,
    orderBy: { timestamp: 'asc' },
  });

  res.json({ forecasts });
}));

// PATCH /api/models/:id - Update model
router.patch('/:id', asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== 'undefined') {
    // If activating, deactivate other models for the same timeseries
    if (isActive) {
      const model = await prisma.forecastingModel.findUnique({
        where: { id: req.params.id },
      });

      if (model) {
        await prisma.forecastingModel.updateMany({
          where: {
            timeseriesId: model.timeseriesId,
            id: { not: req.params.id },
          },
          data: { isActive: false },
        });
      }
    }

    const model = await prisma.forecastingModel.update({
      where: { id: req.params.id },
      data: { isActive },
    });

    return res.json({ model });
  }

  throw new BadRequestError('No valid fields to update');
}));

// DELETE /api/models/:id - Delete model
router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.forecastingModel.delete({
    where: { id: req.params.id },
  });

  res.json({ success: true, message: 'Model deleted successfully' });
}));

// DELETE /api/models/:modelId/forecasts - Clear forecasts
router.delete('/:modelId/forecasts', asyncHandler(async (req, res) => {
  const { start, end } = req.query;

  const where: any = { modelId: req.params.modelId };

  if (start || end) {
    where.timestamp = {};
    if (start) where.timestamp.gte = new Date(start as string);
    if (end) where.timestamp.lte = new Date(end as string);
  }

  const result = await prisma.forecast.deleteMany({ where });

  res.json({
    success: true,
    count: result.count,
    message: `Deleted ${result.count} forecasts`,
  });
}));

export { router as modelsRouter };
