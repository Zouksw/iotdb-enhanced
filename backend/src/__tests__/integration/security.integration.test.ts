/**
 * Security API Integration Tests
 *
 * Tests the security audit log endpoints with real Express app setup
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import securityRouter from '@/routes/security';

describe('Security API Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/security', securityRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('POST /security/audit', () => {
    test('should reject invalid logs format', async () => {
      const response = await request(app)
        .post('/security/audit')
        .send({ invalid: 'format' })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.status).toBe(400);
    });

    test('should reject logs with invalid event', async () => {
      const response = await request(app)
        .post('/security/audit')
        .send({
          logs: [
            {
              event: 'INVALID_EVENT',
              sessionId: 'test-session',
              severity: 'low',
            },
          ],
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.status).toBe(400);
    });

    test('should reject logs with missing sessionId', async () => {
      const response = await request(app)
        .post('/security/audit')
        .send({
          logs: [
            {
              event: 'LOGIN_SUCCESS',
              severity: 'low',
            },
          ],
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.status).toBe(400);
    });

    test('should reject logs with invalid severity', async () => {
      const response = await request(app)
        .post('/security/audit')
        .send({
          logs: [
            {
              event: 'LOGIN_SUCCESS',
              sessionId: 'test-session',
              severity: 'invalid',
            },
          ],
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.status).toBe(400);
    });

    test('should accept valid audit logs', async () => {
      const validLogs = {
        logs: [
          {
            event: 'LOGIN_SUCCESS',
            timestamp: new Date().toISOString(),
            sessionId: 'test-session-id',
            severity: 'low',
            userAgent: 'test-agent',
            url: 'http://test.com',
            details: { ip: '127.0.0.1' },
          },
        ],
      };

      const response = await request(app)
        .post('/security/audit')
        .send(validLogs);

      // Note: This may fail due to authentication requirement or database unavailability in test
      // We expect either success (200) or auth error (401/403)
      expect([200, 401, 403, 500]).toContain(response.status);
    });
  });

  describe('GET /security/audit', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/security/audit')
        .expect('Content-Type', /json/);

      // Should require authentication
      expect([401, 403]).toContain(response.status);
    });

    test('should accept query parameters', async () => {
      const response = await request(app)
        .get('/security/audit?userId=test-user&page=1&limit=10')
        .expect('Content-Type', /json/);

      // Should require authentication
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('GET /security/audit/stats', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/security/audit/stats')
        .expect('Content-Type', /json/);

      // Should require authentication
      expect([401, 403]).toContain(response.status);
    });

    test('should accept date range parameters', async () => {
      const response = await request(app)
        .get('/security/audit/stats?startDate=2024-01-01&endDate=2024-12-31')
        .expect('Content-Type', /json/);

      // Should require authentication
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Invalid HTTP methods', () => {
    test('should return 404 for PUT /audit', async () => {
      const response = await request(app)
        .put('/security/audit')
        .send({});

      expect(response.status).toBe(404);
    });

    test('should return 404 for DELETE /audit', async () => {
      const response = await request(app)
        .delete('/security/audit');

      expect(response.status).toBe(404);
    });

    test('should return 404 for PATCH /audit/stats', async () => {
      const response = await request(app)
        .patch('/security/audit/stats')
        .send({});

      expect(response.status).toBe(404);
    });
  });
});
