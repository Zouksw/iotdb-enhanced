/**
 * IoTDB Frontend Client
 *
 * Provides direct access to IoTDB REST API from the frontend
 * for time series data queries and AI operations.
 */

interface IoTDBConfig {
  restUrl: string;
  username: string;
  password: string;
  timeout?: number;
}

const config: IoTDBConfig = {
  restUrl: process.env.NEXT_PUBLIC_IOTDB_REST_URL || 'http://localhost:18080',
  username: process.env.NEXT_PUBLIC_IOTDB_USERNAME || 'root',
  password: process.env.NEXT_PUBLIC_IOTDB_PASSWORD || 'root',
  timeout: 30000,
};

export class IoTDBFrontendClient {
  private authHeader: string;
  private timeout: number;

  constructor() {
    this.authHeader = btoa(`${config.username}:${config.password}`);
    this.timeout = config.timeout || 30000;
  }

  private async request(
    endpoint: string,
    options?: RequestInit
  ): Promise<any> {
    const url = `${config.restUrl}/rest/v1${endpoint}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Authorization': `Basic ${this.authHeader}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`IoTDB error: ${response.status} ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`IoTDB request timeout: ${url}`);
      }
      throw error;
    }
  }

  // === Health Check ===

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.request('/ping');
      return result.status === 'ok' || result === 'pong';
    } catch {
      return false;
    }
  }

  // === Query ===

  /**
   * Execute SQL query
   */
  async query(sql: string): Promise<any> {
    return this.request('/query', {
      method: 'POST',
      body: JSON.stringify({ sql }),
    });
  }

  /**
   * Get time series data
   */
  async getTimeseriesData(params: {
    path?: string;
    limit?: number;
    offset?: number;
    startTime?: number;
    endTime?: number;
  }): Promise<any> {
    const path = params.path || '*';
    const whereClause: string[] = [];

    if (params.startTime) {
      whereClause.push(`time >= ${params.startTime}`);
    }
    if (params.endTime) {
      whereClause.push(`time <= ${params.endTime}`);
    }

    const where = whereClause.length > 0 ? ` WHERE ${whereClause.join(' AND ')}` : '';
    const limit = params.limit ? ` LIMIT ${params.limit}` : '';
    const offset = params.offset ? ` OFFSET ${params.offset}` : '';

    const sql = `SELECT * FROM ${path}${where}${limit}${offset}`;
    return this.query(sql);
  }

  /**
   * List time series
   */
  async listTimeseries(path?: string): Promise<any> {
    const sql = path ? `SHOW TIMESERIES ${path}` : 'SHOW TIMESERIES';
    return this.query(sql);
  }

  // === AI Operations ===

  /**
   * Predict future values using AI
   */
  async predict(params: {
    timeseries: string;
    horizon: number;
    algorithm?: string;
    confidenceLevel?: number;
  }): Promise<any> {
    return this.request('/ai/predict', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Detect anomalies using AI
   */
  async detectAnomalies(params: {
    timeseries: string;
    method: 'statistical' | 'ml' | 'rule_based';
    threshold?: number;
    windowSize?: number;
  }): Promise<any> {
    return this.request('/ai/anomalies', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * List available AI models
   */
  async listModels(): Promise<any[]> {
    try {
      const response = await this.request('/ai/models');
      return response.models || [];
    } catch {
      return [];
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(modelId: string): Promise<any> {
    return this.request(`/ai/models/${encodeURIComponent(modelId)}`);
  }

  // === Aggregation ===

  /**
   * Execute aggregate query
   */
  async aggregate(params: {
    path: string;
    func: 'avg' | 'sum' | 'max' | 'min' | 'count';
    startTime?: number;
    endTime?: number;
    interval?: string;
  }): Promise<any> {
    const funcUpper = params.func.toUpperCase();
    const whereClause: string[] = [];

    if (params.startTime) {
      whereClause.push(`time >= ${params.startTime}`);
    }
    if (params.endTime) {
      whereClause.push(`time <= ${params.endTime}`);
    }

    const where = whereClause.length > 0 ? ` WHERE ${whereClause.join(' AND ')}` : '';
    const sql = `SELECT ${funcUpper}(${params.path}) FROM ${params.path}${where}`;
    return this.query(sql);
  }
}

// Export singleton instance
export const iotdbClient = new IoTDBFrontendClient();

// Export config for reference
export const iotdbConfig = config;

// React hook for using IoTDB client
export function useIoTDB() {
  return {
    iotdb: iotdbClient,
    config: iotdbConfig,
  };
}
