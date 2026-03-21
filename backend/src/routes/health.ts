/**
 * Health check routes
 * Provides system health status and readiness checks
 */

import { Router, Request, Response } from 'express';
import { prisma } from '@/lib';
import { asyncHandler } from '@/middleware/errorHandler';
import { success, error } from '@/lib/response';

const router = Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/', (req: Request, res: Response) => {
  return success(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * GET /health/ready
 * Readiness check - verifies all services are connected
 */
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  const checks = {
    database: false,
    redis: false,
    iotdb: false,
  };

  let allHealthy = true;

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    allHealthy = false;
  }

  // Check Redis connection (if configured)
  // Note: Redis check would go here when Redis is properly integrated

  // Check IoTDB connection (if configured)
  // Note: IoTDB check would go here

  if (allHealthy) {
    return success(res, {
      status: 'ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  } else {
    return error(res, 'Service not ready', 503, 'SERVICE_NOT_READY', { checks });
  }
}));

/**
 * GET /health/live
 * Liveness check - verifies the process is running
 */
router.get('/live', (req: Request, res: Response) => {
  return success(res, {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

export default router;
