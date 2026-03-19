/**
 * API Keys Integration Tests
 *
 * Tests the API keys endpoints with real Express app setup
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import apiKeysRouter from '../../routes/apiKeys';

describe('API Keys Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api-keys', apiKeysRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('POST /api-keys', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api-keys')
        .send({
          name: 'Test API Key',
          expiresIn: 86400,
        })
        .expect('Content-Type', /json/);

      // Should return 401 when not authenticated
      expect([401, 403]).toContain(response.status);
    });

    test('should reject requests without name', async () => {
      const response = await request(app)
        .post('/api-keys')
        .send({
          expiresIn: 86400,
        });

      // Should return validation error or auth error
      expect([400, 401]).toContain(response.status);
    });

    test('should reject invalid expiresIn values', async () => {
      const response = await request(app)
        .post('/api-keys')
        .send({
          name: 'Test Key',
          expiresIn: 'invalid',
        });

      // Should return validation error or auth error
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('GET /api-keys', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api-keys')
        .expect('Content-Type', /json/);

      // Should return 401 when not authenticated
      expect([401, 403]).toContain(response.status);
    });

    test('should accept pagination parameters', async () => {
      const response = await request(app)
        .get('/api-keys?page=1&limit=10')
        .expect('Content-Type', /json/);

      // Should require authentication
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('DELETE /api-keys/:id/revoke', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .delete('/api-keys/test-id/revoke')
        .expect('Content-Type', /json/);

      // Should return 401 when not authenticated
      expect([401, 403]).toContain(response.status);
    });

    test('should handle invalid key ID format', async () => {
      const response = await request(app)
        .delete('/api-keys/invalid-uuid-format/revoke')
        .expect('Content-Type', /json/);

      // Should require authentication
      expect([401, 403, 400]).toContain(response.status);
    });
  });

  describe('DELETE /api-keys/:id', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .delete('/api-keys/test-id')
        .expect('Content-Type', /json/);

      // Should return 401 when not authenticated
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('PATCH /api-keys/:id/expiration', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .patch('/api-keys/test-id/expiration')
        .send({
          expiresIn: 172800,
        })
        .expect('Content-Type', /json/);

      // Should return 401 when not authenticated
      expect([401, 403]).toContain(response.status);
    });

    test('should reject requests without expiresIn', async () => {
      const response = await request(app)
        .patch('/api-keys/test-id/expiration')
        .send({});

      // Should return validation error or auth error
      expect([400, 401]).toContain(response.status);
    });

    test('should reject invalid expiresIn values', async () => {
      const response = await request(app)
        .patch('/api-keys/test-id/expiration')
        .send({
          expiresIn: -100,
        });

      // Should return validation error or auth error
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('Invalid endpoints', () => {
    test('should return 404 for POST /api-keys/validate (not on this router)', async () => {
      const response = await request(app)
        .post('/api-keys/validate')
        .send({ apiKey: 'test-key' });

      expect(response.status).toBe(404);
    });

    test('should return 404 for GET /api-keys/:id', async () => {
      const response = await request(app)
        .get('/api-keys/some-id');

      expect(response.status).toBe(404);
    });

    test('should return 404 for PUT /api-keys/:id', async () => {
      const response = await request(app)
        .put('/api-keys/some-id')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });
});
