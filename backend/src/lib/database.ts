/**
 * Database client singleton
 * Prevents connection exhaustion by reusing PrismaClient instance
 */

import { PrismaClient } from '@prisma/client';
import { metrics } from '@/middleware/prometheus';

// Declare global type for Prisma singleton
declare global {
  var prisma: PrismaClient | undefined;
}

// Create or reuse Prisma client instance
export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Add Prisma middleware for metrics recording
prisma.$use(async (params, next) => {
  const startTime = Date.now();

  try {
    const result = await next(params);

    // Record query metrics (10% sampling for performance)
    if (Math.random() < 0.1) {
      const duration = (Date.now() - startTime) / 1000;
      const operation = params.action;
      const model = params.model;

      if (model) {
        metrics.recordDbQuery(operation, model, duration, true);
      }
    }

    return result;
  } catch (error) {
    // Record error metrics (always record errors)
    const duration = (Date.now() - startTime) / 1000;
    const operation = params.action;
    const model = params.model;

    if (model) {
      metrics.recordDbQuery(operation, model, duration, false);
    }

    throw error;
  }
});

// In development, attach to global to prevent hot-reload creating multiple instances
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
