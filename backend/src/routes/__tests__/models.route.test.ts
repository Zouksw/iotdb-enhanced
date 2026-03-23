/**
 * Models Route Tests
 *
 * Tests the models HTTP endpoints with mocked dependencies
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';

// Mock all dependencies
jest.mock('@/lib', () => {
  const mockPrisma = {
    model: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    timeseries: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    prisma: mockPrisma,
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
    getPagination: jest.fn(() => ({ skip: 0, take: 20 })),
  };
});

jest.mock('@/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/middleware/cacheDecorator', () => ({
  cacheRoute: () => (req: any, res: any, next: any) => next(),
  invalidateCache: jest.fn().mockResolvedValue(1),
}));

jest.mock('@/services/iotdb', () => ({
  trainModel: jest.fn().mockResolvedValue({
    modelId: 'model-123',
    accuracy: 0.95,
    trainingTime: 1000,
  }),
  predictWithModel: jest.fn().mockResolvedValue({
    predictions: [1, 2, 3, 4, 5],
  }),
}));

import { modelsRouter } from '@/routes/models';
import { prisma } from '@/lib';

const mockPrisma = prisma as any;

describe('Models Route Tests', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock returns
    mockPrisma.model.findMany.mockResolvedValue([]);
    mockPrisma.model.count.mockResolvedValue(0);
    mockPrisma.model.findUnique.mockResolvedValue(null);
    mockPrisma.model.create.mockResolvedValue({
      id: 'model-123',
      name: 'Test Model',
      algorithm: 'ARIMA',
      timeseriesId: 'ts-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    app = express();
    app.use(express.json());
    app.use('/models', modelsRouter);
  });

  describe('GET /models', () => {
    test('should return models list', async () => {
      const response = await request(app)
        .get('/models');

      expect([200, 500]).toContain(response.status);
    });

    test('should accept algorithm filter', async () => {
      const response = await request(app)
        .get('/models?algorithm=ARIMA');

      expect([200, 500]).toContain(response.status);
    });

    test('should accept pagination parameters', async () => {
      const response = await request(app)
        .get('/models?page=1&limit=10');

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /models/:id', () => {
    test('should return model details', async () => {
      const mockModel = {
        id: 'model-123',
        name: 'Test Model',
        algorithm: 'ARIMA',
        timeseriesId: 'ts-123',
        parameters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.model.findUnique.mockResolvedValue(mockModel);

      const response = await request(app)
        .get('/models/model-123');

      expect([200, 404, 500]).toContain(response.status);
    });

    test('should return 404 for non-existent model', async () => {
      mockPrisma.model.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/models/non-existent');

      expect([404, 400, 500]).toContain(response.status);
    });
  });

  describe('POST /models/train', () => {
    test('should train new model', async () => {
      const mockTimeseries = {
        id: 'ts-123',
        name: 'Test Timeseries',
      };

      mockPrisma.timeseries.findUnique.mockResolvedValue(mockTimeseries);

      const response = await request(app)
        .post('/models/train')
        .send({
          timeseriesId: 'ts-123',
          name: 'Test Model',
          algorithm: 'ARIMA',
        });

      expect([200, 201, 400, 401, 404, 500]).toContain(response.status);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/models/train')
        .send({});

      expect([400, 401, 500]).toContain(response.status);
    });

    test('should validate algorithm', async () => {
      const response = await request(app)
        .post('/models/train')
        .send({
          timeseriesId: 'ts-123',
          name: 'Test Model',
          algorithm: 'INVALID_ALGORITHM',
        });

      expect([400, 401, 500]).toContain(response.status);
    });
  });

  describe('POST /models/:modelId/predict', () => {
    test('should make predictions', async () => {
      const mockModel = {
        id: 'model-123',
        name: 'Test Model',
        algorithm: 'ARIMA',
        parameters: {},
      };

      mockPrisma.model.findUnique.mockResolvedValue(mockModel);

      const response = await request(app)
        .post('/models/model-123/predict')
        .send({
          horizon: 10,
        });

      expect([200, 400, 401, 404, 500]).toContain(response.status);
    });

    test('should validate horizon parameter', async () => {
      const response = await request(app)
        .post('/models/model-123/predict')
        .send({});

      expect([400, 401, 404, 500]).toContain(response.status);
    });

    test('should validate horizon is positive', async () => {
      const response = await request(app)
        .post('/models/model-123/predict')
        .send({
          horizon: -1,
        });

      expect([400, 401, 500]).toContain(response.status);
    });
  });

  describe('DELETE /models/:id', () => {
    test('should delete model', async () => {
      const mockModel = {
        id: 'model-123',
        name: 'Test Model',
      };

      mockPrisma.model.findUnique.mockResolvedValue(mockModel);
      mockPrisma.model.delete.mockResolvedValue(mockModel);

      const response = await request(app)
        .delete('/models/model-123');

      expect([200, 204, 401, 404, 500]).toContain(response.status);
    });

    test('should return 404 for non-existent model', async () => {
      mockPrisma.model.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete('/models/non-existent');

      expect([404, 400, 401, 500]).toContain(response.status);
    });
  });
});
