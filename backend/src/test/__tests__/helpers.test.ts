import { createTestUser, generateTestTimeseries } from '../helpers';
import { standardUser, temperatureData } from '../fixtures';

describe('Test Helpers Import Verification', () => {
  it('should import auth helpers', async () => {
    const user = await createTestUser({ email: 'import-test@example.com' });
    expect(user.email).toBe('import-test@example.com');
    expect(user.password).toBeDefined();
  });

  it('should import IoTDB helpers', () => {
    const timeseries = generateTestTimeseries('root.test.verify');
    expect(timeseries).toContain('root.test.verify');
  });

  it('should import user fixtures', () => {
    expect(standardUser.email).toBeDefined();
    expect(standardUser.role).toBeDefined();
  });

  it('should import timeseries fixtures', () => {
    expect(temperatureData.length).toBeGreaterThan(0);
    expect(temperatureData[0].timestamp).toBeDefined();
    expect(temperatureData[0].value).toBeDefined();
  });
});
