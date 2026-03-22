/**
 * Compression Middleware Tests
 */

import request from 'supertest';
import express from 'express';
import compression from 'compression';
import { describe, beforeAll, afterEach, afterAll, it, expect, beforeEach } from '@jest/globals';

describe('Compression Middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();

    // Add compression middleware
    app.use(compression({
      threshold: 1024, // Only compress responses > 1KB
      level: 6,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    }));

    // Test routes
    app.get('/small', (req, res) => {
      res.json({ message: 'Small response' });
    });

    app.get('/large', (req, res) => {
      // Generate a response larger than 1KB
      const largeData = {
        data: 'x'.repeat(2000),
        items: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: 'A'.repeat(50),
        })),
      };
      res.json(largeData);
    });

    app.get('/text', (req, res) => {
      res.send('x'.repeat(2000));
    });
  });

  describe('compression behavior', () => {
    it('should not compress small responses', async () => {
      const response = await request(app)
        .get('/small')
        .set('Accept-Encoding', 'gzip');

      // Small responses should not be compressed
      expect(response.headers['content-encoding']).toBeUndefined();
    });

    it('should compress large JSON responses', async () => {
      const response = await request(app)
        .get('/large')
        .set('Accept-Encoding', 'gzip');

      // Large responses should be compressed
      expect(response.headers['content-encoding']).toBe('gzip');
    });

    it('should compress large text responses', async () => {
      const response = await request(app)
        .get('/text')
        .set('Accept-Encoding', 'gzip');

      expect(response.headers['content-encoding']).toBe('gzip');
    });

    it('should respect x-no-compression header', async () => {
      const response = await request(app)
        .get('/large')
        .set('Accept-Encoding', 'gzip')
        .set('x-no-compression', 'true');

      // Should not compress when explicitly disabled
      expect(response.headers['content-encoding']).toBeUndefined();
    });
  });

  describe('compression efficiency', () => {
    it('should significantly reduce response size for repetitive data', async () => {
      const uncompressed = await request(app)
        .get('/large')
        .set('Accept-Encoding', 'identity');

      const compressed = await request(app)
        .get('/large')
        .set('Accept-Encoding', 'gzip');

      // Compressed response should be significantly smaller
      const uncompressedSize = parseInt(uncompressed.headers['content-length'] || '0');
      const compressedSize = parseInt(compressed.headers['content-length'] || '0');

      if (uncompressedSize > 0 && compressedSize > 0) {
        const compressionRatio = compressedSize / uncompressedSize;
        // Should be at least 50% smaller for repetitive data
        expect(compressionRatio).toBeLessThan(0.5);
      }
    });

    it('should handle JSON data efficiently', async () => {
      const response = await request(app)
        .get('/large')
        .set('Accept-Encoding', 'gzip, deflate');

      // Should successfully parse compressed JSON
      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(response.body.items).toBeDefined();
      expect(response.body.items.length).toBe(50);
    });
  });

  describe('client compatibility', () => {
    it('should work with deflate encoding', async () => {
      const response = await request(app)
        .get('/large')
        .set('Accept-Encoding', 'deflate');

      expect(response.headers['content-encoding']).toBeDefined();
    });

    it('should work with multiple encoding preferences', async () => {
      const response = await request(app)
        .get('/large')
        .set('Accept-Encoding', 'gzip, deflate, br');

      expect(response.headers['content-encoding']).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it('should handle clients that do not request compression', async () => {
      const response = await request(app)
        .get('/large')
        // No Accept-Encoding header
        .set('Accept-Encoding', 'identity');

      // When explicitly set to identity (no compression), should not compress
      expect(response.headers['content-encoding']).toBeUndefined();
      expect(response.body).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should not compress responses below threshold', async () => {
      // Add a route that returns just under 1KB
      app.get('/below-threshold', (_req, res) => {
        const data = 'x'.repeat(1023);
        res.send(data);
      });

      const response = await request(app)
        .get('/below-threshold')
        .set('Accept-Encoding', 'gzip');

      // Responses below threshold should not be compressed
      expect(response.headers['content-encoding']).toBeUndefined();
    });

    it('should compress responses just above threshold', async () => {
      // Add a route that returns just over 1KB
      app.get('/above-threshold', (req, res) => {
        const data = 'x'.repeat(1025);
        res.send(data);
      });

      const response = await request(app)
        .get('/above-threshold')
        .set('Accept-Encoding', 'gzip');

      expect(response.headers['content-encoding']).toBe('gzip');
    });

    it('should handle empty responses', async () => {
      app.get('/empty', (req, res) => {
        res.json({});
      });

      const response = await request(app)
        .get('/empty')
        .set('Accept-Encoding', 'gzip');

      expect(response.headers['content-encoding']).toBeUndefined();
      expect(response.body).toEqual({});
    });
  });
});
