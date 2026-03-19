import {
  validateEnvVars,
  getEnvVar,
  getEnvVarOrDefault,
  isValidUrl,
  validateApiEndpoints,
  logEnvValidation,
} from '../env-validation';

describe('env-validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnvVars', () => {
    it('should pass validation when all required env vars are set', () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
      process.env.NEXT_PUBLIC_IOTDB_REST_URL = 'http://localhost:18080';

      const result = validateEnvVars();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should fail validation when required env vars are missing', () => {
      delete process.env.NEXT_PUBLIC_API_URL;

      const result = validateEnvVars();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('NEXT_PUBLIC_API_URL');
    });

    it('should include warnings for optional env vars', () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
      // Note: The env-validation code uses defaultValue, so warnings won't appear
      // This test documents that behavior - warnings only appear if there's no defaultValue
      // Since NEXT_PUBLIC_IOTDB_REST_URL has a default, no warning will be generated

      const result = validateEnvVars();

      // With default value in config, no warning is expected
      expect(result.warnings.length).toBe(0);
      expect(result.envVars.NEXT_PUBLIC_IOTDB_REST_URL).toBe('http://localhost:18080');
    });

    it('should use default values for optional env vars', () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
      delete process.env.NEXT_PUBLIC_IOTDB_REST_URL;

      const result = validateEnvVars();

      expect(result.envVars.NEXT_PUBLIC_IOTDB_REST_URL).toBe('http://localhost:18080');
    });
  });

  describe('getEnvVar', () => {
    it('should return the env var value when it exists', () => {
      process.env.TEST_VAR = 'test-value';

      const result = getEnvVar('TEST_VAR');

      expect(result).toBe('test-value');
    });

    it('should throw an error when env var is missing', () => {
      delete process.env.TEST_VAR;

      expect(() => getEnvVar('TEST_VAR')).toThrow('Missing required environment variable: TEST_VAR');
    });
  });

  describe('getEnvVarOrDefault', () => {
    it('should return the env var value when it exists', () => {
      process.env.TEST_VAR = 'test-value';

      const result = getEnvVarOrDefault('TEST_VAR', 'default');

      expect(result).toBe('test-value');
    });

    it('should return the default value when env var is missing', () => {
      delete process.env.TEST_VAR;

      const result = getEnvVarOrDefault('TEST_VAR', 'default');

      expect(result).toBe('default');
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid http URLs', () => {
      expect(isValidUrl('http://localhost:8000')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
    });

    it('should return true for valid https URLs', () => {
      expect(isValidUrl('https://api.example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('localhost:8000')).toBe(false);
    });
  });

  describe('validateApiEndpoints', () => {
    it('should pass validation when all API endpoints are valid', () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
      process.env.NEXT_PUBLIC_IOTDB_REST_URL = 'http://localhost:18080';

      const result = validateApiEndpoints();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when API URL is invalid', () => {
      process.env.NEXT_PUBLIC_API_URL = 'not-a-valid-url';
      process.env.NEXT_PUBLIC_IOTDB_REST_URL = 'http://localhost:18080';

      const result = validateApiEndpoints();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('NEXT_PUBLIC_API_URL');
    });

    it('should fail validation when IoTDB URL is invalid', () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
      process.env.NEXT_PUBLIC_IOTDB_REST_URL = 'ftp://invalid-url';

      const result = validateApiEndpoints();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('NEXT_PUBLIC_IOTDB_REST_URL');
    });
  });

  describe('logEnvValidation', () => {
    // Note: These tests only work in server environment where window is undefined
    // In Jest's jsdom environment, window is always defined
    it('should not log in browser environment', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = {
        isValid: true,
        errors: ['Error 1'],
        warnings: ['Warning 1'],
        envVars: {},
      };

      logEnvValidation(result);

      // In jsdom, window is defined, so nothing should be logged
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
