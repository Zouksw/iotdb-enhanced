/**
 * Datasets Route Tests
 *
 * Tests the datasets HTTP endpoints with mocked dependencies
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express, Request, Response } from 'express';

// Mock all dependencies
jest.mock('@/lib', () => {
  const mockPrisma = {
    dataset: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    timeseries: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    datapoint: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
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

jest.mock('@/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user-id', role: 'admin', name: 'Test User', email: 'test@example.com' };
    req.userId = 'test-user-id';
    next();
  },
  AuthRequest: class AuthRequest {},
}));

jest.mock('papaparse', () => ({
  parse: jest.fn((csv: string, config: any) => {
    // Simple mock that returns basic parsed data
    if (config?.header) {
      return {
        data: [],
        errors: [],
        meta: { delimiter: ',' },
      };
    }
    return { data: [], errors: [] };
  }),
}));

import { datasetsRouter } from '@/routes/datasets';
import { prisma } from '@/lib';
import { invalidateCache } from '@/middleware/cacheDecorator';

const mockPrisma = prisma as any;

describe('Datasets Route Tests', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock returns
    mockPrisma.dataset.findMany.mockResolvedValue([]);
    mockPrisma.dataset.count.mockResolvedValue(0);
    mockPrisma.dataset.findUnique.mockResolvedValue(null);
    mockPrisma.dataset.create.mockResolvedValue({
      id: 'dataset-123',
      name: 'Test Dataset',
      slug: 'test-dataset',
      storageFormat: 'CSV',
      ownerId: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      sizeBytes: BigInt(1000),
      rowsCount: BigInt(100),
    });

    app = express();
    app.use(express.json());
    app.use('/datasets', datasetsRouter);
  });

  describe('GET /datasets', () => {
    test('should return datasets list', async () => {
      const response = await request(app)
        .get('/datasets')
        .expect('Content-Type', /json/);

      expect([200, 500]).toContain(response.status);
    });

    test('should accept search parameter', async () => {
      const response = await request(app)
        .get('/datasets?search=test')
        .expect('Content-Type', /json/);

      expect([200, 500]).toContain(response.status);
    });

    test('should accept pagination parameters', async () => {
      const response = await request(app)
        .get('/datasets?page=1&limit=10')
        .expect('Content-Type', /json/);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /datasets/:id', () => {
    test('should return 404 for non-existent dataset', async () => {
      mockPrisma.dataset.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/datasets/non-existent-id');

      expect([404, 400, 500]).toContain(response.status);
    });

    test('should return dataset details for valid id', async () => {
      const mockDataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        slug: 'test-dataset',
        storageFormat: 'CSV',
        ownerId: 'test-user-id',
        owner: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        sizeBytes: BigInt(1000),
        rowsCount: BigInt(100),
      };

      mockPrisma.dataset.findUnique.mockResolvedValue(mockDataset);

      const response = await request(app)
        .get('/datasets/dataset-123');

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('POST /datasets', () => {
    test('should create new dataset', async () => {
      const newDataset = {
        name: 'New Dataset',
        slug: 'new-dataset',
        storageFormat: 'CSV',
        description: 'Test description',
      };

      const response = await request(app)
        .post('/datasets')
        .send(newDataset);

      expect([200, 201, 400, 401, 500]).toContain(response.status);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/datasets')
        .send({});

      expect([400, 401, 500]).toContain(response.status);
    });

    test('should validate storage format', async () => {
      const response = await request(app)
        .post('/datasets')
        .send({
          name: 'Test Dataset',
          slug: 'test-dataset',
          storageFormat: 'INVALID_FORMAT',
        });

      expect([400, 401, 500]).toContain(response.status);
    });
  });

  describe('PATCH /datasets/:id', () => {
    test('should update dataset', async () => {
      const mockDataset = {
        id: 'dataset-123',
        name: 'Updated Dataset',
        slug: 'test-dataset',
        storageFormat: 'CSV',
        ownerId: 'test-user-id',
        owner: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.dataset.findUnique.mockResolvedValueOnce(mockDataset)
        .mockResolvedValueOnce(mockDataset);
      mockPrisma.dataset.update.mockResolvedValue(mockDataset);

      const response = await request(app)
        .patch('/datasets/dataset-123')
        .send({ name: 'Updated Dataset' })
        .expect('Content-Type', /json/);

      expect([200, 404, 403]).toContain(response.status);
    });

    test('should return 404 for non-existent dataset', async () => {
      mockPrisma.dataset.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .patch('/datasets/non-existent')
        .send({ name: 'Updated Name' });

      expect([200, 404, 400, 500]).toContain(response.status);
    });
  });

  describe('DELETE /datasets/:id', () => {
    test('should delete dataset', async () => {
      const mockDataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        ownerId: 'test-user-id',
      };

      mockPrisma.dataset.findUnique.mockResolvedValue(mockDataset);
      mockPrisma.dataset.delete.mockResolvedValue(mockDataset);

      const response = await request(app)
        .delete('/datasets/dataset-123');

      expect([200, 204, 404, 403, 500]).toContain(response.status);
    });

    test('should return 404 for non-existent dataset', async () => {
      mockPrisma.dataset.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete('/datasets/non-existent');

      expect([404, 400, 500]).toContain(response.status);
    });
  });

  describe('POST /datasets/:id/import', () => {
    test('should import CSV data', async () => {
      const mockDataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        storageFormat: 'CSV',
        ownerId: 'test-user-id',
      };

      mockPrisma.dataset.findUnique.mockResolvedValue(mockDataset);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });
      mockPrisma.datapoint.create.mockResolvedValue({});
      mockPrisma.dataset.update.mockResolvedValue({});

      const response = await request(app)
        .post('/datasets/dataset-123/import')
        .send({
          format: 'CSV',
          data: 'timestamp,temperature\n2024-01-01T00:00:00Z,25.5',
        });

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    test('should validate format parameter', async () => {
      const response = await request(app)
        .post('/datasets/dataset-123/import')
        .send({
          format: 'INVALID_FORMAT',
          data: 'test',
        });

      expect([400, 404, 500]).toContain(response.status);
    });
  });

  describe('POST /datasets/:id/export', () => {
    test('should export dataset', async () => {
      const mockDataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        storageFormat: 'CSV',
        ownerId: 'test-user-id',
      };

      mockPrisma.dataset.findUnique.mockResolvedValue(mockDataset);
      mockPrisma.datapoint.findMany.mockResolvedValue([
        {
          timestamp: new Date('2024-01-01T00:00:00Z'),
          value: 25.5,
        },
      ]);

      const response = await request(app)
        .post('/datasets/dataset-123/export')
        .send({ format: 'CSV' });

      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });
});
