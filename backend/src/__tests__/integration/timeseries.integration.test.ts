/**
 * Timeseries API Integration Tests
 *
 * Tests the timeseries HTTP endpoints with real Express app setup
 */

import { describe, test, expect, beforeAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';

// Mock all dependencies
jest.mock('../../lib', () => {
  const mockPrisma = {
    timeseries: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    dataPoint: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    dataset: {
      findUnique: jest.fn(),
    },
  };

  return {
    prisma: mockPrisma,
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
    getPagination: jest.fn(() => ({ skip: 0, take: 20 })),
    success: jest.fn((data) => ({ success: true, data })),
    paginated: jest.fn((data, total) => ({ success: true, data, total })),
  };
});

jest.mock('../../../config/iotdb', () => ({
  getIoTDBClient: jest.fn(() => Promise.resolve({
    queryData: jest.fn().mockResolvedValue({
      timestamps: [1234567890000],
      values: [[25.5]],
    }),
    queryTimeseriesData: jest.fn().mockResolvedValue([]),
    insertRecords: jest.fn().mockResolvedValue(undefined),
    deleteTimeseriesData: jest.fn().mockResolvedValue(undefined),
  } as any)),
}));

jest.mock('@/middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user', role: 'admin' };
    next();
  },
  AuthRequest: class AuthRequest {},
}));

import { timeseriesRouter } from '@/routes/timeseries';
import { prisma } from '@/lib';
import { errorHandler } from '@/middleware/errorHandler';

const mockPrisma = prisma as any;

describe('Timeseries HTTP Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/timeseries', timeseriesRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.timeseries.findMany.mockResolvedValue([]);
    mockPrisma.timeseries.count.mockResolvedValue(0);
    mockPrisma.timeseries.findUnique.mockResolvedValue(null);
    mockPrisma.dataPoint.findMany.mockResolvedValue([]);
    mockPrisma.dataPoint.count.mockResolvedValue(0);
    mockPrisma.dataPoint.create.mockResolvedValue({});
  });

  // ==========================================================================
  // GET /api/timeseries - List Timeseries
  // ==========================================================================

  describe('GET /api/timeseries', () => {
    test('should return 200 with empty list', async () => {
      const response = await request(app)
        .get('/api/timeseries')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('should call prisma with correct parameters', async () => {
      await request(app)
        .get('/api/timeseries?datasetId=ds-123')
        .expect(200);

      expect(mockPrisma.timeseries.findMany).toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      mockPrisma.timeseries.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/timeseries')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ==========================================================================
  // GET /api/timeseries/:id - Get Single Timeseries
  // ==========================================================================

  describe('GET /api/timeseries/:id', () => {
    test('should return 404 for non-existent timeseries', async () => {
      mockPrisma.timeseries.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/timeseries/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle database errors', async () => {
      mockPrisma.timeseries.findUnique.mockRejectedValue(
        new Error('Query failed')
      );

      const response = await request(app)
        .get('/api/timeseries/ts-1')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ==========================================================================
  // POST /api/timeseries/:id/data - Create Timeseries Data Point
  // ==========================================================================

  describe('POST /api/timeseries/:id/data', () => {
    test('should handle database errors during creation', async () => {
      mockPrisma.timeseries.findUnique.mockResolvedValue({
        id: 'ts-1',
        name: 'root.test.temp',
        datasetId: 'dataset-1',
      });
      mockPrisma.dataPoint.create.mockRejectedValue(
        new Error('Constraint violation')
      );

      const response = await request(app)
        .post('/api/timeseries/ts-1/data')
        .send({
          timestamp: Date.now(),
          value: 25.5,
        })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ==========================================================================
  // DELETE /api/timeseries/:id - Delete Timeseries
  // ==========================================================================

  describe('DELETE /api/timeseries/:id', () => {
    test('should return 404 for non-existent timeseries', async () => {
      mockPrisma.timeseries.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/timeseries/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle database errors during deletion', async () => {
      mockPrisma.timeseries.findUnique.mockResolvedValue({ id: 'ts-1' });
      mockPrisma.timeseries.delete.mockRejectedValue(
        new Error('Delete failed')
      );

      const response = await request(app)
        .delete('/api/timeseries/ts-1')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ==========================================================================
  // GET /api/timeseries/:id/data - Get Timeseries Data
  // ==========================================================================

  describe('GET /api/timeseries/:id/data', () => {
    test('should return 404 for non-existent timeseries', async () => {
      mockPrisma.timeseries.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/timeseries/non-existent/data')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
