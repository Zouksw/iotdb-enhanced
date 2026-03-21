// Jest setup file
// Test environment configuration

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/iotdb_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-testing-purposes-only-32chars';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-key-for-testing-purposes-only-32-chars-min';
process.env.IOTDB_HOST = process.env.IOTDB_HOST || 'localhost';
process.env.IOTDB_PORT = process.env.IOTDB_PORT || '6667';
process.env.IOTDB_USERNAME = process.env.IOTDB_USERNAME || 'root';
process.env.IOTDB_PASSWORD = process.env.IOTDB_PASSWORD || 'root';
process.env.IOTDB_REST_URL = process.env.IOTDB_REST_URL || 'http://localhost:18080';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.AI_NODE_HOST = process.env.AI_NODE_HOST || 'localhost';
process.env.AI_NODE_PORT = process.env.AI_NODE_PORT || '10810';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock AI Node Python scripts
// Note: rpc-client is mocked individually in test files

// Mock Winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    splat: jest.fn(),
    printf: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

// Mock crypto for tests - generate unique values each time
let cryptoCounter = 0;
jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomBytes: jest.fn(function(size) {
      const counter = ++cryptoCounter;
      return {
        toString: function(encoding) {
          if (encoding === 'hex') {
            // Generate unique hex string based on counter
            return counter.toString(16).padStart(size * 2, '0').slice(0, size * 2);
          }
          if (encoding === 'base64url') {
            // Generate unique base64url string based on counter
            const base = Buffer.alloc(size);
            base.writeUInt32BE(counter, 0);
            return base.toString('base64url').padEnd(size, 'X').slice(0, size);
          }
          return 'mock-random-bytes';
        },
      };
    }),
  };
});

// Setup global test teardown
afterAll(async () => {
  // Cleanup can be added here if needed
});
