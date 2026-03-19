/**
 * Alerts Routes
 * Endpoints for managing alerts and notifications
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, UnauthorizedError } from '../middleware/errorHandler';
import { limitSchema } from '../schemas/common';
import {
  createAlertRule,
  listAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
  getAlertStats,
  alertSchemas,
} from '../services/alerts';
import { validate } from '../middleware/security';
import { success } from '../lib/response';

const router = Router();

/**
 * GET /api/alerts
 * List all alerts for the authenticated user
 */
router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new UnauthorizedError();
  }

  const { unreadOnly, type, severity } = req.query;
  const params = limitSchema.parse(req.query);

  const result = await listAlerts(req.userId, {
    unreadOnly: unreadOnly === 'true',
    type: type as any,
    severity: severity as any,
    limit: params.limit,
    offset: 0,
  });

  return success(res, result);
}));

/**
 * GET /api/alerts/stats
 * Get alert statistics for the authenticated user
 */
router.get('/stats', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new UnauthorizedError();
  }

  const stats = await getAlertStats(req.userId);

  return success(res, stats);
}));

/**
 * POST /api/alerts/rules
 * Create a new alert rule
 */
router.post(
  '/rules',
  authenticate,
  validate(alertSchemas.createRule),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.userId) {
      throw new UnauthorizedError();
    }

    const { timeseriesId, name, type, condition, severity, notificationChannels, cooldownMinutes } = req.body;

    const rule = await createAlertRule({
      userId: req.userId,
      timeseriesId,
      name,
      type,
      condition,
      severity,
      notificationChannels,
      cooldownMinutes,
    });

    return success(res, rule, 201);
  })
);

/**
 * PATCH /api/alerts/:id/read
 * Mark an alert as read
 */
router.patch('/:id/read', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new UnauthorizedError();
  }

  const { id } = req.params;

  const result = await markAlertAsRead(req.userId, id);

  return success(res, result);
}));

/**
 * PATCH /api/alerts/read-all
 * Mark all alerts as read
 */
router.patch('/read-all', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new UnauthorizedError();
  }

  const result = await markAllAlertsAsRead(req.userId);

  return success(res, result);
}));

/**
 * DELETE /api/alerts/:id
 * Delete an alert
 */
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new UnauthorizedError();
  }

  const { id } = req.params;

  const result = await deleteAlert(req.userId, id);

  return success(res, result);
}));

export default router;
