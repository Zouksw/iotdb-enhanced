import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardStats } from '../useDashboardStats';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock auth utility
jest.mock('@/utils/auth', () => ({
  getAuthToken: jest.fn(() => 'mock-token'),
}));

describe('useDashboardStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should start with loading state and null stats', () => {
    const { result } = renderHook(() => useDashboardStats());

    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch and parse stats successfully', async () => {
    // Mock all the API responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('datasets')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ total: 10, data: [] }),
        });
      }
      if (url.includes('timeseries')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ total: 25, data: [] }),
        });
      }
      if (url.includes('forecasts') && url.includes('limit=1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ total: 5, data: [] }),
        });
      }
      if (url.includes('alerts') && url.includes('page=1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            total: 15,
            data: [
              { severity: 'critical' },
              { severity: 'high' },
              { severity: 'medium' },
              { severity: 'low' },
            ],
          }),
        });
      }
      if (url.includes('alerts') && url.includes('limit=5')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: [{ id: 1 }] }),
        });
      }
      if (url.includes('forecasts') && url.includes('limit=5')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: [{ id: 1 }] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeDefined();
    expect(result.current.stats?.datasets.total).toBe(10);
    expect(result.current.stats?.timeseries.total).toBe(25);
    expect(result.current.stats?.forecasts.total).toBe(5);
    expect(result.current.stats?.alerts.total).toBe(15);
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });

  it('should handle missing auth token', async () => {
    const { getAuthToken } = require('@/utils/auth');
    getAuthToken.mockReturnValueOnce(null);

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Not authenticated');
  });

  it('should count alerts by severity correctly', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('alerts') && url.includes('page=1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            total: 8,
            data: [
              { severity: 'critical' },
              { severity: 'critical' },
              { severity: 'high' },
              { severity: 'high' },
              { severity: 'high' },
              { severity: 'medium' },
              { severity: 'low' },
              { severity: 'LOW' }, // Test case insensitivity
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ total: 0, data: [] }),
      });
    });

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats?.alerts.bySeverity.critical).toBe(2);
    expect(result.current.stats?.alerts.bySeverity.high).toBe(3);
    expect(result.current.stats?.alerts.bySeverity.medium).toBe(1);
    // The code converts severity to lowercase, so both 'low' and 'LOW' are counted
    expect(result.current.stats?.alerts.bySeverity.low).toBe(2);
  });

  it('should handle responses with items instead of data', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('forecasts') && url.includes('limit=5')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 1, name: 'Forecast 1' }] }),
        });
      }
      if (url.includes('alerts') && url.includes('limit=5')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ id: 1, name: 'Alert 1' }] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ total: 0, data: [] }),
      });
    });

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats?.recentForecasts).toEqual([{ id: 1, name: 'Forecast 1' }]);
    expect(result.current.stats?.recentAlerts).toEqual([{ id: 1, name: 'Alert 1' }]);
  });

  it('should use default values when totals are missing', async () => {
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [] }), // No total field
      });
    });

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats?.datasets.total).toBe(0);
    expect(result.current.stats?.timeseries.total).toBe(0);
  });

  it('should make API requests with correct headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, data: [] }),
    });

    renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Check that Authorization header is set
    const calls = mockFetch.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][1]).toHaveProperty('headers');
    expect(calls[0][1].headers).toHaveProperty('Authorization', 'Bearer mock-token');
  });

  it('should use correct API base URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, data: [] }),
    });

    renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const firstCallUrl = mockFetch.mock.calls[0][0];
    expect(firstCallUrl).toContain('http://localhost:8000');
  });

  it('should include mock AI models data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, data: [] }),
    });

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats?.aiModels.active).toBe(5);
    expect(result.current.stats?.aiModels.total).toBe(7);
  });

  it('should include trend data (random values)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, data: [] }),
    });

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Trends should be numbers
    expect(typeof result.current.stats?.datasets.trend).toBe('number');
    expect(typeof result.current.stats?.timeseries.trend).toBe('number');
    expect(typeof result.current.stats?.forecasts.trend).toBe('number');
    expect(typeof result.current.stats?.alerts.trend).toBe('number');
  });
});
