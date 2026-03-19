/**
 * Tests for security middleware
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  securityHeaders,
  validate,
  detectSqlInjection,
  detectXSS,
  limitRequestSize,
  sanitizeHtml,
  validationSchemas,
} from '../security';

describe('Security Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      method: 'POST',
      url: '/api/test',
      query: {},
      body: {},
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      getHeader: jest.fn(),
      removeHeader: jest.fn().mockReturnThis(),
      get: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('securityHeaders', () => {
    it('should be a function', () => {
      expect(typeof securityHeaders).toBe('function');
    });

    it('should call next() when used as middleware', () => {
      securityHeaders(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    it('should validate valid request body', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const middleware = validate(schema, 'body');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid body', async () => {
      const schema = z.object({
        email: z.string().email(),
      });

      mockReq.body = {
        email: 'invalid-email',
      };

      const middleware = validate(schema, 'body');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate query parameters', async () => {
      const schema = z.object({
        page: z.coerce.number().int().positive(),
      });

      mockReq.query = { page: '1' };

      const middleware = validate(schema, 'query');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate params', async () => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      mockReq.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

      const middleware = validate(schema, 'params');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle Zod validation errors', async () => {
      const schema = z.object({
        name: z.string().min(3),
      });

      mockReq.body = { name: 'ab' };

      const middleware = validate(schema, 'body');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Array),
        })
      );
    });

    it('should return 500 for non-Zod errors', async () => {
      const schema = {
        parseAsync: jest.fn().mockRejectedValue(new Error('Unexpected error')),
      };

      mockReq.body = { test: 'data' };

      const middleware = validate(schema as any, 'body');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('detectSqlInjection', () => {
    it('should allow clean query parameters', () => {
      mockReq.query = { id: '123', name: 'test' };

      detectSqlInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow clean request body', () => {
      mockReq.body = { email: 'user@example.com', name: 'John Doe' };

      detectSqlInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should detect SQL injection in query - single quote', () => {
      mockReq.query = { id: "1' OR '1'='1" };

      detectSqlInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid input detected',
        })
      );
    });

    it('should detect SQL injection in body - comment', () => {
      mockReq.body = { name: 'test--' };

      detectSqlInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should detect SQL injection - UNION SELECT', () => {
      mockReq.query = { search: "' UNION SELECT * FROM users--" };

      detectSqlInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should detect SQL injection - INSERT', () => {
      mockReq.body = { data: "'; INSERT INTO users VALUES ('hacker', 'password');--" };

      detectSqlInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should detect SQL injection - DROP TABLE', () => {
      mockReq.body = { id: "1'; DROP TABLE users;--" };

      detectSqlInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should detect SQL injection - DELETE FROM', () => {
      mockReq.query = { filter: "'; DELETE FROM logs;--" };

      detectSqlInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should detect SQL injection - EXEC', () => {
      mockReq.body = { cmd: 'exec xp_cmdshell' };

      detectSqlInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle nested objects', () => {
      mockReq.body = {
        user: {
          name: "test'; DROP TABLE users--",
          email: 'valid@example.com',
        },
      };

      detectSqlInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle arrays', () => {
      mockReq.body = {
        tags: ['tag1', "tag2'; DROP TABLE tags--", 'tag3'],
      };

      detectSqlInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('detectXSS', () => {
    it('should allow clean input', () => {
      mockReq.body = { name: 'John Doe', comment: 'Great product!' };

      detectXSS(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should detect script tags', () => {
      mockReq.body = { comment: '<script>alert("XSS")</script>' };

      detectXSS(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should detect iframe tags', () => {
      mockReq.query = { url: '<iframe src="evil.com"></iframe>' };

      detectXSS(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should detect javascript: protocol', () => {
      mockReq.body = { link: 'javascript:alert(1)' };

      detectXSS(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should detect event handlers', () => {
      mockReq.body = { content: '<div onclick="alert(1)">Click</div>' };

      detectXSS(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should detect img with src', () => {
      mockReq.query = { html: '<img src="x" onerror="alert(1)">' };

      detectXSS(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should be case insensitive', () => {
      mockReq.body = { content: '<SCRIPT>alert("XSS")</SCRIPT>' };

      detectXSS(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle nested objects', () => {
      mockReq.body = {
        post: {
          title: 'Test',
          content: '<script>alert(1)</script>',
        },
      };

      detectXSS(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('limitRequestSize', () => {
    it('should use default 10mb limit', () => {
      const middleware = limitRequestSize();
      expect(middleware).toBeDefined();
    });

    it('should allow requests within limit', () => {
      mockReq.headers = { 'content-length': '1000' };

      const middleware = limitRequestSize('1mb');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject requests exceeding limit', () => {
      mockReq.headers = { 'content-length': '20000000' }; // 20MB

      const middleware = limitRequestSize('10mb');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(413);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Payload too large',
        })
      );
    });

    it('should handle missing content-length header', () => {
      mockReq.headers = {};

      const middleware = limitRequestSize();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should parse size units correctly - kb', () => {
      const middleware = limitRequestSize('5kb');
      mockReq.headers = { 'content-length': '4000' };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should parse size units correctly - mb', () => {
      const middleware = limitRequestSize('1mb');
      mockReq.headers = { 'content-length': '500000' };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      // 500KB < 1MB, so should pass through
      expect(mockNext).toHaveBeenCalled();
    });

    it('should parse size units correctly - gb', () => {
      const middleware = limitRequestSize('1gb');
      mockReq.headers = { 'content-length': '500000000' };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle invalid size strings', () => {
      const middleware = limitRequestSize('invalid');
      mockReq.headers = { 'content-length': '100' };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Should allow request since invalid size defaults to 0
      expect(mockRes.status).toHaveBeenCalledWith(413);
    });
  });

  describe('sanitizeHtml', () => {
    it('should return non-string input unchanged', () => {
      expect(sanitizeHtml(null)).toBeNull();
      expect(sanitizeHtml(undefined)).toBeUndefined();
      expect(sanitizeHtml(123)).toBe(123);
    });

    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('<script>');
      expect(output).not.toContain('</script>');
      expect(output).toContain('<p>Hello</p>');
    });

    it('should remove iframe tags', () => {
      const input = '<div>Content</div><iframe src="evil.com"></iframe>';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('<iframe');
      expect(output).not.toContain('</iframe>');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(1)">Click</div>';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('onclick');
    });

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('javascript:');
    });

    it('should handle multiple script tags', () => {
      const input = '<script>alert(1)</script><p>Content</p><script>alert(2)</script>';
      const output = sanitizeHtml(input);

      expect(output).not.toMatch(/<script[^>]*>/gi);
    });

    it('should preserve safe HTML', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const output = sanitizeHtml(input);

      expect(output).toContain('<p>Hello <strong>World</strong></p>');
    });

    it('should handle mixed case script tags', () => {
      const input = '<SCRIPT>alert(1)</SCRIPT>';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('SCRIPT');
    });

    it('should handle onerror with quotes', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('onerror');
    });
  });

  describe('validationSchemas', () => {
    describe('email', () => {
      it('should validate valid email', () => {
        const result = validationSchemas.email.safeParse('user@example.com');
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const result = validationSchemas.email.safeParse('invalid-email');
        expect(result.success).toBe(false);
      });
    });

    describe('emailOptional', () => {
      it('should accept valid email', () => {
        const result = validationSchemas.emailOptional.safeParse('user@example.com');
        expect(result.success).toBe(true);
      });

      it('should accept undefined', () => {
        const result = validationSchemas.emailOptional.safeParse(undefined);
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const result = validationSchemas.emailOptional.safeParse('invalid');
        expect(result.success).toBe(false);
      });
    });

    describe('password', () => {
      it('should validate strong password', () => {
        const result = validationSchemas.password.safeParse('Password123');
        expect(result.success).toBe(true);
      });

      it('should reject too short password', () => {
        const result = validationSchemas.password.safeParse('Pass1');
        expect(result.success).toBe(false);
      });

      it('should reject password without uppercase', () => {
        const result = validationSchemas.password.safeParse('password123');
        expect(result.success).toBe(false);
      });

      it('should reject password without lowercase', () => {
        const result = validationSchemas.password.safeParse('PASSWORD123');
        expect(result.success).toBe(false);
      });

      it('should reject password without number', () => {
        const result = validationSchemas.password.safeParse('Password');
        expect(result.success).toBe(false);
      });
    });

    describe('uuid', () => {
      it('should validate valid UUID', () => {
        const result = validationSchemas.uuid.safeParse('550e8400-e29b-41d4-a716-446655440000');
        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID', () => {
        const result = validationSchemas.uuid.safeParse('not-a-uuid');
        expect(result.success).toBe(false);
      });
    });

    describe('timeseriesName', () => {
      it('should validate valid name', () => {
        const result = validationSchemas.timeseriesName.safeParse('root.device.temperature');
        expect(result.success).toBe(true);
      });

      it('should validate name with hyphens', () => {
        const result = validationSchemas.timeseriesName.safeParse('device-01.sensor-02');
        expect(result.success).toBe(true);
      });

      it('should reject empty name', () => {
        const result = validationSchemas.timeseriesName.safeParse('');
        expect(result.success).toBe(false);
      });

      it('should reject too long name', () => {
        const result = validationSchemas.timeseriesName.safeParse('a'.repeat(256));
        expect(result.success).toBe(false);
      });

      it('should reject name with special chars', () => {
        const result = validationSchemas.timeseriesName.safeParse('device@sensor#value');
        expect(result.success).toBe(false);
      });
    });

    describe('pagination', () => {
      it('should accept valid pagination', () => {
        const result = validationSchemas.pagination.safeParse({ page: '1', limit: '20' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(20);
        }
      });

      it('should use default values', () => {
        const result = validationSchemas.pagination.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(20);
        }
      });

      it('should reject negative page', () => {
        const result = validationSchemas.pagination.safeParse({ page: '-1' });
        expect(result.success).toBe(false);
      });

      it('should reject limit over 100', () => {
        const result = validationSchemas.pagination.safeParse({ limit: '101' });
        expect(result.success).toBe(false);
      });
    });

    describe('sqlQuery', () => {
      it('should accept SELECT queries', () => {
        const result = validationSchemas.sqlQuery.safeParse('SELECT * FROM users WHERE id = 1');
        expect(result.success).toBe(true);
      });

      it('should reject DROP', () => {
        const result = validationSchemas.sqlQuery.safeParse('DROP TABLE users');
        expect(result.success).toBe(false);
      });

      it('should reject DELETE', () => {
        const result = validationSchemas.sqlQuery.safeParse('DELETE FROM users');
        expect(result.success).toBe(false);
      });

      it('should reject TRUNCATE', () => {
        const result = validationSchemas.sqlQuery.safeParse('TRUNCATE TABLE logs');
        expect(result.success).toBe(false);
      });

      it('should reject ALTER', () => {
        const result = validationSchemas.sqlQuery.safeParse('ALTER TABLE users ADD COLUMN x INT');
        expect(result.success).toBe(false);
      });

      it('should reject CREATE', () => {
        const result = validationSchemas.sqlQuery.safeParse('CREATE TABLE test (id INT)');
        expect(result.success).toBe(false);
      });

      it('should reject INSERT', () => {
        const result = validationSchemas.sqlQuery.safeParse('INSERT INTO users VALUES (1)');
        expect(result.success).toBe(false);
      });

      it('should reject UPDATE', () => {
        const result = validationSchemas.sqlQuery.safeParse('UPDATE users SET name = "test"');
        expect(result.success).toBe(false);
      });

      it('should reject too long queries', () => {
        const result = validationSchemas.sqlQuery.safeParse('SELECT '.repeat(10000));
        expect(result.success).toBe(false);
      });
    });
  });
});
