/**
 * Database client singleton
 * Prevents connection exhaustion by reusing PrismaClient instance
 */

import { PrismaClient } from '@prisma/client';

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

// In development, attach to global to prevent hot-reload creating multiple instances
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
