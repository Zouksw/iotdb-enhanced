/**
 * Health Endpoint Integration Tests
 *
 * Tests the health check endpoint with real Express app setup
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import healthRouter from '../../routes/health';

describe('Health API Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/health', healthRouter);
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      // Response is wrapped in success() format
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'ok');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    test('should include system information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.data).toHaveProperty('uptime');
      expect(typeof response.body.data.uptime).toBe('number');
      expect(response.body.data.uptime).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('environment');
    });
  });

  describe('GET /health/ready', () => {
    test('should return readiness status', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect('Content-Type', /json/)
        .expect(200);

      // Response is wrapped in success() format
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'ready');
      expect(response.body.data).toHaveProperty('checks');
    });

    test('should include database check', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body.data.checks).toHaveProperty('database');
      expect(typeof response.body.data.checks.database).toBe('boolean');
    });
  });

  describe('GET /health/live', () => {
    test('should return liveness status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect('Content-Type', /json/)
        .expect(200);

      // Response is wrapped in success() format
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'alive');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('memory');
    });

    test('should include memory usage', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.data.memory).toHaveProperty('heapUsed');
      expect(response.body.data.memory).toHaveProperty('heapTotal');
      expect(response.body.data.memory).toHaveProperty('rss');
    });
  });
});
