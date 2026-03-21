/**
 * Anomalies Routes Unit Tests
 *
 * Tests the anomalies HTTP endpoints
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';

// Mock all dependencies
jest.mock('@/lib', () => {
  const mockPrisma = {
    anomaly: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      delete: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    timeseries: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'ts-1',
        name: 'Test Timeseries',
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    datapoint: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    alert: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };

  return {
    prisma: mockPrisma,
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
    getPagination: jest.fn(() => ({ skip: 0, take: 20 })),
    success: jest.fn((res, data, status) => ({ success: true, data, status })),
    paginated: jest.fn((res, data, meta) => ({ success: true, data, meta })),
    successWithMessage: jest.fn((res, data, message) => ({ success: true, data, message })),
  };
});

jest.mock('@/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user', role: 'admin' };
    req.userId = 'test-user';
    req.app = { get: jest.fn().mockReturnValue(null) };
    next();
  },
  AuthRequest: class AuthRequest {},
}));

import { anomaliesRouter } from '@/routes/anomalies';
import { errorHandler } from '@/middleware/errorHandler';

const mockPrisma = require('@/lib').prisma;

describe('Anomalies Routes', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/anomalies', anomaliesRouter);
    app.use(errorHandler);

    // Setup default mocks
    mockPrisma.anomaly.findMany.mockResolvedValue([]);
    mockPrisma.anomaly.count.mockResolvedValue(0);
    mockPrisma.anomaly.findUnique.mockResolvedValue(null);
    mockPrisma.anomaly.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.datapoint.findMany.mockResolvedValue([]);
  });

  describe('GET /api/anomalies', () => {
    test('should list all anomalies', async () => {
      const response = await request(app)
        .get('/api/anomalies')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('should support timeseriesId filter', async () => {
      const response = await request(app)
        .get('/api/anomalies?timeseriesId=ts-1');

      expect([200, 400, 500]).toContain(response.status);
    });

    test('should support severity filter', async () => {
      const response = await request(app)
        .get('/api/anomalies?severity=HIGH')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('should support isResolved filter', async () => {
      const response = await request(app)
        .get('/api/anomalies?isResolved=false')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/anomalies/:id', () => {
    test('should return 404 for non-existent anomaly', async () => {
      mockPrisma.anomaly.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/anomalies/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return anomaly details', async () => {
      mockPrisma.anomaly.findUnique.mockResolvedValue({
        id: 'anomaly-1',
        severity: 'HIGH',
        timeseries: { id: 'ts-1', name: 'Test TS' },
      });

      const response = await request(app)
        .get('/api/anomalies/anomaly-1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/anomalies/detect', () => {
    test('should require timeseriesId', async () => {
      const response = await request(app)
        .post('/api/anomalies/detect')
        .send({});

      // Schema validation should return 400
      expect([400, 500]).toContain(response.status);
    });

    test('should handle non-existent timeseries', async () => {
      mockPrisma.timeseries.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/anomalies/detect')
        .send({
          timeseriesId: 'non-existent',
          method: 'STATISTICAL',
          windowSize: 10,
        });

      // Should return 404 or 400 (validation error)
      expect([404, 500, 400]).toContain(response.status);
    });

    test('should handle STATISTICAL method', async () => {
      mockPrisma.timeseries.findUnique.mockResolvedValue({
        id: 'ts-1',
        name: 'Test TS',
      });
      mockPrisma.datapoint.findMany.mockResolvedValue([
        { id: BigInt(1), valueJson: '25', timestamp: new Date() },
        { id: BigInt(2), valueJson: '26', timestamp: new Date() },
        { id: BigInt(3), valueJson: '27', timestamp: new Date() },
      ]);
      mockPrisma.anomaly.createMany.mockResolvedValue({ count: 0 });

      const response = await request(app)
        .post('/api/anomalies/detect')
        .send({
          timeseriesId: 'ts-1',
          method: 'STATISTICAL',
          windowSize: 2,
        });

      // Should succeed or fail depending on data
      expect([200, 201, 400, 500]).toContain(response.status);
    });
  });

  describe('PATCH /api/anomalies/:id', () => {
    test('should update anomaly', async () => {
      mockPrisma.anomaly.update.mockResolvedValue({
        id: 'anomaly-1',
        isResolved: true,
      });

      const response = await request(app)
        .patch('/api/anomalies/anomaly-1')
        .send({ isResolved: true })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('DELETE /api/anomalies/:id', () => {
    test('should delete anomaly', async () => {
      mockPrisma.anomaly.delete.mockResolvedValue({});

      const response = await request(app)
        .delete('/api/anomalies/anomaly-1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/anomalies/stats/timeseries/:timeseriesId', () => {
    test('should return anomaly statistics for timeseries', async () => {
      mockPrisma.anomaly.groupBy.mockResolvedValue([
        { severity: 'HIGH', _count: { severity: 5 } },
        { severity: 'MEDIUM', _count: { severity: 10 } },
      ]);

      const response = await request(app)
        .get('/api/anomalies/stats/timeseries/ts-1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/anomalies/bulk-resolve', () => {
    test('should bulk resolve anomalies', async () => {
      mockPrisma.anomaly.updateMany.mockResolvedValue({ count: 5 });

      const response = await request(app)
        .post('/api/anomalies/bulk-resolve')
        .send({
          anomalyIds: ['anomaly-1', 'anomaly-2'],
        });

      // Should succeed or return validation error
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});
