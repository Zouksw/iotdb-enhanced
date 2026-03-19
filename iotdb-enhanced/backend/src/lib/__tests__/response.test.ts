/**
 * Tests for response utilities
 */

import { Response } from 'express';
import {
  success,
  successWithMessage,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  paginated,
  responseUtils,
} from '../response';

// Mock Express Response
const createMockResponse = (): jest.Mocked<Response> => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<Response>;
  return res;
};

describe('Response Utilities', () => {
  let res: jest.Mocked<Response>;

  beforeEach(() => {
    res = createMockResponse();
    jest.clearAllMocks();
  });

  describe('success', () => {
    it('should send success response with data', () => {
      const data = { id: 1, name: 'Test' };
      success(res, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should use custom status code', () => {
      const data = { created: true };
      success(res, data, 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should handle different data types', () => {
      success(res, 'string data');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: 'string data',
      });

      jest.clearAllMocks();

      success(res, [1, 2, 3]);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [1, 2, 3],
      });

      jest.clearAllMocks();

      success(res, null);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null,
      });
    });
  });

  describe('successWithMessage', () => {
    it('should send success response with message', () => {
      const data = { id: 1 };
      successWithMessage(res, data, 'Operation successful');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Operation successful',
      });
    });

    it('should use custom status code', () => {
      const data = { id: 2 };
      successWithMessage(res, data, 'Created', 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Created',
      });
    });

    it('should handle empty message', () => {
      successWithMessage(res, {}, '');

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {},
        message: '',
      });
    });
  });

  describe('error', () => {
    it('should send error response with message', () => {
      error(res, 'Something went wrong');

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Something went wrong',
        },
      });
    });

    it('should include error code when provided', () => {
      error(res, 'Validation failed', 400, 'VALIDATION_ERROR');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should include error details when provided', () => {
      const details = { field: 'email', issue: 'Invalid format' };
      error(res, 'Validation error', 400, undefined, details);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation error',
          details,
        },
      });
    });

    it('should include both code and details', () => {
      const details = { fields: ['name', 'email'] };
      error(res, 'Missing fields', 400, 'MISSING_FIELDS', details);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Missing fields',
          code: 'MISSING_FIELDS',
          details,
        },
      });
    });

    it('should use default status 500', () => {
      error(res, 'Server error');

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validationError', () => {
    it('should send validation error with details', () => {
      const details = {
        fields: {
          email: 'Invalid email format',
          password: 'Password too short',
        },
      };

      validationError(res, details);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed',
          details,
        },
      });
    });

    it('should handle empty details', () => {
      validationError(res, {});

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed',
          details: {},
        },
      });
    });

    it('should handle array details', () => {
      const details = ['Email required', 'Password required'];

      validationError(res, details);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed',
          details,
        },
      });
    });
  });

  describe('notFound', () => {
    it('should send not found error with default resource name', () => {
      notFound(res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Resource not found',
          code: 'NOT_FOUND',
        },
      });
    });

    it('should send not found error with custom resource name', () => {
      notFound(res, 'User');

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      });
    });

    it('should handle resource name with spaces', () => {
      notFound(res, 'API Key');

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'API Key not found',
          code: 'NOT_FOUND',
        },
      });
    });
  });

  describe('unauthorized', () => {
    it('should send unauthorized error with default message', () => {
      unauthorized(res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    });

    it('should send unauthorized error with custom message', () => {
      unauthorized(res, 'Invalid token');

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'UNAUTHORIZED',
        },
      });
    });
  });

  describe('forbidden', () => {
    it('should send forbidden error with default message', () => {
      forbidden(res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN',
        },
      });
    });

    it('should send forbidden error with custom message', () => {
      forbidden(res, 'Insufficient permissions');

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'FORBIDDEN',
        },
      });
    });
  });

  describe('conflict', () => {
    it('should send conflict error', () => {
      conflict(res, 'Email already exists');

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Email already exists',
          code: 'CONFLICT',
        },
      });
    });

    it('should handle different conflict messages', () => {
      conflict(res, 'Duplicate entry');
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Duplicate entry',
          code: 'CONFLICT',
        },
      });
    });
  });

  describe('paginated', () => {
    it('should send paginated response', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const meta = {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      };

      paginated(res, items, meta);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: items,
        pagination: meta,
      });
    });

    it('should use custom status code', () => {
      const items = [{ id: 1 }];
      const meta = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      };

      paginated(res, items, meta, 206);

      expect(res.status).toHaveBeenCalledWith(206);
    });

    it('should handle empty items array', () => {
      const meta = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };

      paginated(res, [], meta);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        pagination: meta,
      });
    });

    it('should handle multiple pages', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      const meta = {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      };

      paginated(res, items, meta);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: items,
        pagination: meta,
      });
    });
  });

  describe('responseUtils export object', () => {
    it('should export all functions as a group', () => {
      expect(responseUtils.success).toBe(success);
      expect(responseUtils.successWithMessage).toBe(successWithMessage);
      expect(responseUtils.error).toBe(error);
      expect(responseUtils.validationError).toBe(validationError);
      expect(responseUtils.notFound).toBe(notFound);
      expect(responseUtils.unauthorized).toBe(unauthorized);
      expect(responseUtils.forbidden).toBe(forbidden);
      expect(responseUtils.conflict).toBe(conflict);
      expect(responseUtils.paginated).toBe(paginated);
    });

    it('should work when called through the export object', () => {
      responseUtils.success(res, { test: true });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { test: true },
      });
    });
  });

  describe('Type Safety', () => {
    it('should handle complex data structures', () => {
      const complexData = {
        user: {
          id: '123',
          profile: {
            name: 'Test',
            preferences: {
              theme: 'dark',
            },
          },
        },
        metadata: [1, 2, 3],
      };

      success(res, complexData);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: complexData,
      });
    });

    it('should handle null and undefined values in data', () => {
      success(res, { field: null });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { field: null },
      });

      jest.clearAllMocks();

      success(res, { field: undefined });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { field: undefined },
      });
    });
  });
});
