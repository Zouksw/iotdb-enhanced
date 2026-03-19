/**
 * API Keys Routes
 * Endpoints for managing API keys
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { apiKeyCreationLimiter } from '../middleware/rateLimiter';
import { asyncHandler, UnauthorizedError } from '../middleware/errorHandler';
import {
  createApiKey,
  validateApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
  updateApiKeyExpiration,
  apiKeysSchemas,
} from '../services/apiKeys';
import { validate } from '../middleware/security';
import { success } from '../lib/response';

const router = Router();

/**
 * POST /api/api-keys
 * Create a new API key
 */
router.post(
  '/',
  authenticate,
  apiKeyCreationLimiter,
  validate(apiKeysSchemas.create),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.userId) {
      throw new UnauthorizedError();
    }

    const { name, expiresIn } = req.body;

    const result = await createApiKey({
      userId: req.userId,
      name,
      expiresIn,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || '',
    });

    return success(res, result, 201);
  })
);

/**
 * GET /api/api-keys
 * List all API keys for the authenticated user
 */
router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new UnauthorizedError();
  }

  const apiKeys = await listApiKeys(req.userId);

  return success(res, {
    apiKeys,
    total: apiKeys.length,
  });
}));

/**
 * DELETE /api/api-keys/:id/revoke
 * Revoke (deactivate) an API key
 */
router.delete('/:id/revoke', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new UnauthorizedError();
  }

  const { id } = req.params;

  const result = await revokeApiKey(req.userId, id);

  return success(res, result);
}));

/**
 * DELETE /api/api-keys/:id
 * Permanently delete an API key
 */
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new UnauthorizedError();
  }

  const { id } = req.params;

  const result = await deleteApiKey(req.userId, id);

  return success(res, result);
}));

/**
 * PATCH /api/api-keys/:id/expiration
 * Update API key expiration
 */
router.patch(
  '/:id/expiration',
  authenticate,
  validate(apiKeysSchemas.updateExpiration),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.userId) {
      throw new UnauthorizedError();
    }

    const { id } = req.params;
    const { expiresIn } = req.body;

    const result = await updateApiKeyExpiration(req.userId, id, expiresIn);

    return success(res, result);
  })
);

export default router;
