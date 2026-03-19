import { IoTDBFrontendClient, iotdbClient, iotdbConfig, useIoTDB } from '../iotdb';

// Helper to create a proper mock Response object
function createMockResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: {
      get: (name: string) => {
        if (name === 'content-type' && typeof data === 'object') {
          return 'application/json';
        }
        return null;
      },
    },
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  };
}

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('iotdb', () => {
  let client: IoTDBFrontendClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new IoTDBFrontendClient();
    process.env.NEXT_PUBLIC_IOTDB_REST_URL = 'http://localhost:18080';
    process.env.NEXT_PUBLIC_IOTDB_USERNAME = 'root';
    process.env.NEXT_PUBLIC_IOTDB_PASSWORD = 'root';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('IoTDBFrontendClient', () => {
    it('should create client with default config', () => {
      expect(client).toBeDefined();
      expect(iotdbConfig.restUrl).toBe('http://localhost:18080');
      expect(iotdbConfig.username).toBe('root');
      expect(iotdbConfig.password).toBe('root');
    });

    describe('healthCheck', () => {
      it('should return true when health check succeeds', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ status: 'ok' }));

        const result = await client.healthCheck();

        expect(result).toBe(true);
      });

      it('should return true when pong is returned', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse('pong'));

        const result = await client.healthCheck();

        expect(result).toBe(true);
      });

      it('should return false when health check fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await client.healthCheck();

        expect(result).toBe(false);
      });
    });

    describe('query', () => {
      it('should execute SQL query', async () => {
        const mockData = { result: [{ value: 100 }] };
        mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

        const result = await client.query('SELECT * FROM root.sg1');

        expect(result).toEqual(mockData);
      });

      it('should throw error when query fails', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse('Bad Request', false, 400));

        await expect(client.query('INVALID SQL')).rejects.toThrow('IoTDB error: 400');
      });
    });

    describe('getTimeseriesData', () => {
      it('should fetch timeseries data with path', async () => {
        const mockData = { result: [{ time: 1000, value: 50 }] };
        mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

        const result = await client.getTimeseriesData({ path: 'root.sg1.temp' });

        expect(result).toEqual(mockData);
      });
    });

    describe('listTimeseries', () => {
      it('should list all timeseries when no path specified', async () => {
        const mockData = { timeseries: ['root.sg1.temp', 'root.sg1.humidity'] };
        mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

        const result = await client.listTimeseries();

        expect(result).toEqual(mockData);
      });
    });

    describe('predict', () => {
      it('should send prediction request', async () => {
        const mockPrediction = {
          predictions: [100, 101, 102],
        };
        mockFetch.mockResolvedValueOnce(createMockResponse(mockPrediction));

        const result = await client.predict({
          timeseries: 'root.sg1.temp',
          horizon: 10,
        });

        expect(result).toEqual(mockPrediction);
      });
    });

    describe('detectAnomalies', () => {
      it('should send anomaly detection request with statistical method', async () => {
        const mockAnomalies = {
          anomalies: [
            { time: 1000, value: 150, score: 0.95 },
          ],
        };
        mockFetch.mockResolvedValueOnce(createMockResponse(mockAnomalies));

        const result = await client.detectAnomalies({
          timeseries: 'root.sg1.temp',
          method: 'statistical',
          threshold: 0.9,
        });

        expect(result).toEqual(mockAnomalies);
      });
    });

    describe('listModels', () => {
      it('should return models array on success', async () => {
        const mockModels = {
          models: [
            { id: 'model1', name: 'ARIMA', type: 'forecasting' },
            { id: 'model2', name: 'LSTM', type: 'forecasting' },
          ],
        };
        mockFetch.mockResolvedValueOnce(createMockResponse(mockModels));

        const result = await client.listModels();

        expect(result).toEqual(mockModels.models);
        expect(result).toHaveLength(2);
      });

      it('should return empty array on error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await client.listModels();

        expect(result).toEqual([]);
      });

      it('should return empty array when models field is missing', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({}));

        const result = await client.listModels();

        expect(result).toEqual([]);
      });
    });

    describe('getModelInfo', () => {
      it('should get model info by ID', async () => {
        const mockModelInfo = {
          id: 'model1',
          name: 'ARIMA',
          type: 'forecasting',
        };
        mockFetch.mockResolvedValueOnce(createMockResponse(mockModelInfo));

        const result = await client.getModelInfo('model1');

        expect(result).toEqual(mockModelInfo);
      });
    });

    describe('aggregate', () => {
      it('should execute avg aggregation', async () => {
        const mockData = { result: [{ avg: 50.5 }] };
        mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

        const result = await client.aggregate({
          path: 'root.sg1.temp',
          func: 'avg',
        });

        expect(result).toEqual(mockData);
      });

      it('should execute sum aggregation', async () => {
        const mockData = { result: [{ sum: 500 }] };
        mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

        await client.aggregate({
          path: 'root.sg1.temp',
          func: 'sum',
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.sql).toContain('SUM');
      });

      it('should execute max aggregation', async () => {
        const mockData = { result: [{ max: 100 }] };
        mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

        await client.aggregate({
          path: 'root.sg1.temp',
          func: 'max',
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.sql).toContain('MAX');
      });

      it('should execute min aggregation', async () => {
        const mockData = { result: [{ min: 10 }] };
        mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

        await client.aggregate({
          path: 'root.sg1.temp',
          func: 'min',
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.sql).toContain('MIN');
      });

      it('should execute count aggregation', async () => {
        const mockData = { result: [{ count: 100 }] };
        mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

        await client.aggregate({
          path: 'root.sg1.temp',
          func: 'count',
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.sql).toContain('COUNT');
      });
    });
  });

  describe('iotdbClient singleton', () => {
    it('should export singleton instance', () => {
      expect(iotdbClient).toBeInstanceOf(IoTDBFrontendClient);
    });
  });

  describe('useIoTDB hook', () => {
    it('should return iotdb client and config', () => {
      const result = useIoTDB();

      expect(result).toHaveProperty('iotdb');
      expect(result).toHaveProperty('config');
      expect(result.iotdb).toBe(iotdbClient);
      expect(result.config).toBe(iotdbConfig);
    });
  });
});
