/**
 * Test helpers - unified export
 *
 * Centralizes all test helper functions for easy importing
 *
 * @example
 * ```typescript
 * import { createTestUser, generateTestTimeseries } from '@/test/helpers';
 * ```
 */

// Auth helpers
export {
  createTestUser,
  createTestUserWithToken,
  createTestUsers,
  getAuthHeaders,
  createExpiredToken,
  type TestUser,
} from './auth';

// IoTDB helpers
export {
  generateTestTimeseries,
  createTestTimeseriesData,
  createTestTimeseriesBatch,
  generateTestDataPoints,
  generateTestDataPointsWithTrend,
  generateAnomalyTestData,
  formatTimeseriesList,
  extractDeviceName,
  type TimeSeriesTestData,
} from './iotdb';

// Cleanup helpers
export {
  cleanupTestData,
  cleanupRedisTestData,
  cleanupTestTimeseries,
  cleanupByTestId,
  cleanupAllTestData,
  verifyCleanup,
  type CleanupOptions,
} from './cleanup';
