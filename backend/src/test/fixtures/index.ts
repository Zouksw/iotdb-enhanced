/**
 * Test fixtures - unified export
 *
 * Centralizes all test fixtures for easy importing
 *
 * @example
 * ```typescript
 * import { standardUser, adminUser } from '@/test/fixtures/users';
 * import { standardTimeSeries, temperatureData } from '@/test/fixtures/timeseries';
 * ```
 */

// User fixtures
export {
  standardUser,
  adminUser,
  premiumUser,
  fullUser,
  invalidUsers,
  edgeCaseUsers,
  generateUserFixtures,
  createUserWithPassword,
  passwordFixtures,
  loginScenarios,
  permissionScenarios,
} from './users';

// Time series fixtures
export {
  standardTimeSeries,
  integerTimeSeries,
  booleanTimeSeries,
  textTimeSeries,
  multipleTimeSeries,
  temperatureData,
  humidityData,
  pressureData,
  anomalyData,
  trendData,
  invalidTimeSeriesNames,
  validTimeSeriesPatterns,
  dataTypeFixtures,
  encodingFixtures,
  compressionFixtures,
  generateLargeDataset,
  gappedData,
  type TimeSeriesFixture,
  type DataPointFixture,
} from './timeseries';
