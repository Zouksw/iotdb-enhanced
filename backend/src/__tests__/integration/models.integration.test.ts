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
  getIoTDBClient: jest.fn().mockResolvedValue({
    trainModel: jest.fn().mockResolvedValue({ modelId: 'model-123' }),
    predictModel: jest.fn().mockResolvedValue({ forecasts: [] }),
  }),
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user', role: 'admin' };
    next();
  },
  checkAIAccess: (req: any, _res: any, next: any) => next(),
}));

import { modelsRouter } from '../../routes/models';
import { prisma } from '../../lib';
import { errorHandler } from '../../middleware/errorHandler';

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
        .get('/api/models?algorithm=arima')
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
    test('should validate request body', async () => {
      const response = await request(app)
        .post('/api/models/train')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should validate algorithm enum', async () => {
      const response = await request(app)
        .post('/api/models/train')
        .send({
          timeseriesId: 'ts-1',
          algorithm: 'invalid_algorithm',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle training errors', async () => {
      const { trainModel } = require('../../services/iotdb/ai-isolated');
      (trainModel as jest.Mock).mockRejectedValue(
        new Error('Training failed')
      );

      const response = await request(app)
        .post('/api/models/train')
        .send({
          timeseriesId: 'ts-1',
          algorithm: 'arima',
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

    test('should handle prediction errors', async () => {
      const { predictModel } = require('../../services/iotdb/ai-isolated');
      (predictModel as jest.Mock).mockRejectedValue(
        new Error('Prediction failed')
      );

      const response = await request(app)
        .post('/api/models/model-1/predict')
        .send({ horizon: 10 })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ==========================================================================
  // GET /api/models/:modelId/forecasts - Get Model Forecasts
  // ==========================================================================

  describe('GET /api/models/:modelId/forecasts', () => {
    test('should return 404 for non-existent model', async () => {
      mockPrisma.forecastingModel.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/models/non-existent/forecasts')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

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
    test('should return 404 for non-existent model', async () => {
      mockPrisma.forecastingModel.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/models/non-existent/forecasts')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle delete errors', async () => {
      mockPrisma.forecastingModel.findUnique.mockResolvedValue({ id: 'model-1' });
      mockPrisma.forecast.delete.mockRejectedValue(
        new Error('Delete failed')
      );

      const response = await request(app)
        .delete('/api/models/model-1/forecasts')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ==========================================================================
  // DELETE /api/models/:id - Delete Model
  // ==========================================================================

  describe('DELETE /api/models/:id', () => {
    test('should return 404 for non-existent model', async () => {
      mockPrisma.forecastingModel.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/models/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle delete errors', async () => {
      mockPrisma.forecastingModel.findUnique.mockResolvedValue({ id: 'model-1' });
      mockPrisma.forecastingModel.delete.mockRejectedValue(
        new Error('Delete failed')
      );

      const response = await request(app)
        .delete('/api/models/model-1')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
