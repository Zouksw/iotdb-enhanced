/**
 * Models API Integration Tests
 *
 * Tests the AI models HTTP endpoints with real Express app setup
 */

import { describe, test, expect, beforeAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';

// Mock all dependencies
jest.mock('../../lib', () => {
  const mockPrisma = {
    forecastingModel: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    forecast: {
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    timeseries: {
      findUnique: jest.fn(),
    },
  };

  return {
    prisma: mockPrisma,
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
    getPagination: jest.fn(() => ({ skip: 0, take: 20 })),
    success: jest.fn((data) => ({ success: true, data })),
    paginated: jest.fn((data, total) => ({ success: true, data, total })),
    successWithMessage: jest.fn((res, data, message) => ({ success: true, data, message })),
  };
});

jest.mock('../../../config/iotdb', () => ({
  getIoTDBClient: jest.fn(() => Promise.resolve({
    trainModel: jest.fn().mockResolvedValue({ modelId: 'model-123' }),
    predictModel: jest.fn().mockResolvedValue({ forecasts: [] }),
  } as any)),
}));

jest.mock('@/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user', role: 'admin' };
    next();
  },
  AuthRequest: class AuthRequest {},
}));

jest.mock('@/middleware/aiAccess', () => ({
  checkAIAccess: (req: any, _res: any, next: any) => next(),
}));

import { modelsRouter } from '@/routes/models';
import { prisma } from '@/lib';
import { errorHandler } from '@/middleware/errorHandler';

const mockPrisma = prisma as any;

describe('Models HTTP Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/models', modelsRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.forecastingModel.findMany.mockResolvedValue([]);
    mockPrisma.forecastingModel.count.mockResolvedValue(0);
    mockPrisma.forecastingModel.findUnique.mockResolvedValue(null);
    mockPrisma.forecastingModel.create.mockResolvedValue({
      id: 'model-1',
      algorithm: 'ARIMA',
    });
    mockPrisma.forecastingModel.delete.mockResolvedValue({});
    mockPrisma.forecast.findMany.mockResolvedValue([]);
    mockPrisma.forecast.delete.mockResolvedValue({ count: 0 });
    mockPrisma.forecast.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.timeseries.findUnique.mockResolvedValue({
      id: 'ts-1',
      name: 'root.test.temp',
      dataset: { id: 'ds-1' },
    });
  });

  // ==========================================================================
  // GET /api/models - List Models
  // ==========================================================================

  describe('GET /api/models', () => {
    test('should return 200 with empty list', async () => {
      const response = await request(app)
        .get('/api/models')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('should support filtering', async () => {
      const response = await request(app)
        .get('/api/models?algorithm=ARIMA')
        .expect(200);

      expect(mockPrisma.forecastingModel.findMany).toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      mockPrisma.forecastingModel.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/models')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ==========================================================================
  // GET /api/models/:id - Get Single Model
  // ==========================================================================

  describe('GET /api/models/:id', () => {
    test('should return 404 for non-existent model', async () => {
      mockPrisma.forecastingModel.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/models/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should include forecasts', async () => {
      mockPrisma.forecastingModel.findUnique.mockResolvedValue({
        id: 'model-1',
        name: 'Test Model',
      });

      const response = await request(app)
        .get('/api/models/model-1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  // ==========================================================================
  // POST /api/models/train - Train Model
  // ==========================================================================

  describe('POST /api/models/train', () => {
    test('should handle training errors', async () => {
      mockPrisma.timeseries.findUnique.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'root.test.temp',
        dataset: { id: 'ds-1' },
      });
      mockPrisma.forecastingModel.create.mockRejectedValue(
        new Error('Training failed')
      );

      const response = await request(app)
        .post('/api/models/train')
        .send({
          timeseriesId: '123e4567-e89b-12d3-a456-426614174000',
          algorithm: 'ARIMA',
        })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ==========================================================================
  // POST /api/models/:modelId/predict - Generate Predictions
  // ==========================================================================

  describe('POST /api/models/:modelId/predict', () => {
    test('should validate horizon parameter', async () => {
      const response = await request(app)
        .post('/api/models/model-1/predict')
        .send({ horizon: -1 })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ==========================================================================
  // GET /api/models/:modelId/forecasts - Get Model Forecasts
  // ==========================================================================

  describe('GET /api/models/:modelId/forecasts', () => {
    test('should support pagination', async () => {
      mockPrisma.forecastingModel.findUnique.mockResolvedValue({
        id: 'model-1',
        name: 'Test Model',
      });
      mockPrisma.forecast.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/models/model-1/forecasts?page=1&limit=20')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  // ==========================================================================
  // DELETE /api/models/:modelId/forecasts - Delete Forecasts
  // ==========================================================================

  describe('DELETE /api/models/:modelId/forecasts', () => {
    test('should handle delete errors', async () => {
      mockPrisma.forecast.deleteMany.mockRejectedValue(
        new Error('Delete failed')
      );

      const response = await request(app)
        .delete('/api/models/model-1/forecasts')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should delete forecasts successfully', async () => {
      const response = await request(app)
        .delete('/api/models/model-1/forecasts')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  // ==========================================================================
  // DELETE /api/models/:id - Delete Model
  // ==========================================================================

  describe('DELETE /api/models/:id', () => {
    test('should handle delete errors', async () => {
      mockPrisma.forecastingModel.delete.mockRejectedValue(
        new Error('Delete failed')
      );

      const response = await request(app)
        .delete('/api/models/model-1')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should delete model successfully', async () => {
      const response = await request(app)
        .delete('/api/models/model-1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });
});
