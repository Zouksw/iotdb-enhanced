/**
 * Alerts Routes Unit Tests
 *
 * Tests the alerts HTTP endpoints
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';

// Mock all dependencies
jest.mock('@/lib', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
  success: jest.fn((res, data, status) => ({ success: true, data, status })),
}));

jest.mock('@/services/alerts', () => ({
  createAlertRule: jest.fn().mockResolvedValue({
    id: 'rule-1',
    name: 'Test Rule',
    type: 'ANOMALY',
    condition: { type: 'threshold', operator: '>', value: 100 },
  }),
  listAlerts: jest.fn().mockResolvedValue({
    alerts: [],
    total: 0,
  }),
  markAlertAsRead: jest.fn().mockResolvedValue({ id: 'alert-1', read: true }),
  markAllAlertsAsRead: jest.fn().mockResolvedValue({ count: 0 }),
  deleteAlert: jest.fn().mockResolvedValue({ id: 'alert-1', deleted: true }),
  getAlertStats: jest.fn().mockResolvedValue({
    total: 0,
    unread: 0,
    bySeverity: {},
  }),
  alertSchemas: {
    createRule: {
      timeseriesId: { type: 'string', required: true },
      name: { type: 'string', required: true },
      type: { type: 'string', required: true },
      condition: { type: 'object', required: true },
      severity: { type: 'string', required: true },
    },
  },
}));

jest.mock('@/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user', role: 'admin' };
    req.userId = 'test-user';
    next();
  },
  AuthRequest: class AuthRequest {},
}));

jest.mock('@/middleware/security', () => ({
  validate: (schema: any) => (req: any, _res: any, next: any) => next(),
}));

import alertsRouter from '@/routes/alerts';
import { errorHandler } from '@/middleware/errorHandler';

describe('Alerts Routes', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/alerts', alertsRouter);
    app.use(errorHandler);
  });

  describe('GET /api/alerts', () => {
    test('should list all alerts', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('should support unreadOnly filter', async () => {
      const response = await request(app)
        .get('/api/alerts?unreadOnly=true')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('should support type filter', async () => {
      const response = await request(app)
        .get('/api/alerts?type=ANOMALY')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/alerts/stats', () => {
    test('should return alert statistics', async () => {
      const response = await request(app)
        .get('/api/alerts/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('unread');
    });
  });

  describe('POST /api/alerts/rules', () => {
    test('should create a new alert rule', async () => {
      const response = await request(app)
        .post('/api/alerts/rules')
        .send({
          timeseriesId: 'ts-1',
          name: 'High Temperature Alert',
          type: 'ANOMALY',
          condition: {
            type: 'threshold',
            operator: '>',
            value: 100,
          },
          severity: 'WARNING',
          notificationChannels: [],
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('PATCH /api/alerts/:id/read', () => {
    test('should mark alert as read', async () => {
      const response = await request(app)
        .patch('/api/alerts/alert-1/read')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('PATCH /api/alerts/read-all', () => {
    test('should mark all alerts as read', async () => {
      const response = await request(app)
        .patch('/api/alerts/read-all')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('DELETE /api/alerts/:id', () => {
    test('should delete an alert', async () => {
      const response = await request(app)
        .delete('/api/alerts/alert-1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });
});
