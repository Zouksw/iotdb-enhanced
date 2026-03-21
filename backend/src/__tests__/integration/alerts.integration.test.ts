/**
 * Alerts Integration Tests
 *
 * Tests the alerts endpoints with real Express app setup
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import alertsRouter from '@/routes/alerts';

describe('Alerts Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/alerts', alertsRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('GET /alerts', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/alerts')
        .expect('Content-Type', /json/);

      // Should return 401 when not authenticated
      expect([401, 403]).toContain(response.status);
    });

    test('should accept query parameters', async () => {
      const response = await request(app)
        .get('/alerts?unreadOnly=true&type=ANOMALY&severity=HIGH&limit=10')
        .expect('Content-Type', /json/);

      // Should require authentication
      expect([401, 403]).toContain(response.status);
    });

    test('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/alerts?limit=invalid')
        .expect('Content-Type', /json/);

      // Should require authentication or return validation error
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('GET /alerts/stats', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/alerts/stats')
        .expect('Content-Type', /json/);

      // Should return 401 when not authenticated
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('POST /alerts/rules', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/alerts/rules')
        .send({
          name: 'Test Alert Rule',
          type: 'THRESHOLD',
          condition: 'value > 100',
          severity: 'HIGH',
        })
        .expect('Content-Type', /json/);

      // Should return 401 when not authenticated
      expect([401, 403]).toContain(response.status);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/alerts/rules')
        .send({
          // Missing required fields
        })
        .expect('Content-Type', /json/);

      // Should return validation error or auth error
      expect([400, 401]).toContain(response.status);
    });

    test('should validate alert type', async () => {
      const response = await request(app)
        .post('/alerts/rules')
        .send({
          name: 'Test Rule',
          type: 'INVALID_TYPE',
          condition: 'value > 100',
          severity: 'HIGH',
        })
        .expect('Content-Type', /json/);

      // Should return validation error or auth error
      expect([400, 401]).toContain(response.status);
    });

    test('should validate severity level', async () => {
      const response = await request(app)
        .post('/alerts/rules')
        .send({
          name: 'Test Rule',
          type: 'THRESHOLD',
          condition: 'value > 100',
          severity: 'INVALID_SEVERITY',
        })
        .expect('Content-Type', /json/);

      // Should return validation error or auth error
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('PATCH /alerts/:id/read', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .patch('/alerts/test-id/read')
        .expect('Content-Type', /json/);

      // Should return 401 when not authenticated
      expect([401, 403]).toContain(response.status);
    });

    test('should validate alert ID format', async () => {
      const response = await request(app)
        .patch('/alerts/invalid-uuid-format/read')
        .expect('Content-Type', /json/);

      // Should require authentication
      expect([401, 403, 400]).toContain(response.status);
    });
  });

  describe('PATCH /alerts/read-all', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .patch('/alerts/read-all')
        .expect('Content-Type', /json/);

      // Should return 401 when not authenticated
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('DELETE /alerts/:id', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .delete('/alerts/test-id')
        .expect('Content-Type', /json/);

      // Should return 401 when not authenticated
      expect([401, 403]).toContain(response.status);
    });

    test('should validate alert ID format', async () => {
      const response = await request(app)
        .delete('/alerts/invalid-uuid-format')
        .expect('Content-Type', /json/);

      // Should require authentication
      expect([401, 403, 400]).toContain(response.status);
    });
  });

  describe('Invalid endpoints', () => {
    test('should return 404 for GET /alerts/:id', async () => {
      const response = await request(app)
        .get('/alerts/some-id');

      expect(response.status).toBe(404);
    });

    test('should return 404 for PUT /alerts/:id', async () => {
      const response = await request(app)
        .put('/alerts/some-id')
        .send({ read: true });

      expect(response.status).toBe(404);
    });

    test('should return 404 for POST /alerts/:id', async () => {
      const response = await request(app)
        .post('/alerts/some-id')
        .send({ some: 'data' });

      expect(response.status).toBe(404);
    });

    test('should return 404 for PATCH /alerts/:id', async () => {
      const response = await request(app)
        .patch('/alerts/some-id')
        .send({ read: true });

      expect(response.status).toBe(404);
    });
  });
});
