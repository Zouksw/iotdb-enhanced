import fetch from 'node-fetch';

export interface IoTDBConfig {
  // RPC connection config
  host: string;
  port: number;
  username: string;
  password: string;

  // REST API config
  restUrl: string;
  restTimeout: number;

  // AI config
  aiEnabled: boolean;
  modelPath: string;

  // Connection pool config
  maxConnections: number;
  requestTimeout: number;
}

export const iotdbConfig: IoTDBConfig = {
  host: process.env.IOTDB_HOST || 'localhost',
  port: parseInt(process.env.IOTDB_PORT || '6667'),
  username: process.env.IOTDB_USERNAME || 'root',
  password: process.env.IOTDB_PASSWORD || 'root',

  restUrl: process.env.IOTDB_REST_URL || 'http://localhost:18080',
  restTimeout: parseInt(process.env.IOTDB_REST_TIMEOUT || '30000'),

  aiEnabled: process.env.IOTDB_AI_ENABLED === 'true',
  modelPath: process.env.IOTDB_MODEL_PATH || '/var/lib/iotdb/models',

  maxConnections: parseInt(process.env.IOTDB_MAX_CONNECTIONS || '100'),
  requestTimeout: parseInt(process.env.IOTDB_REQUEST_TIMEOUT || '60000'),
};

export class IoTDBClient {
  private config = iotdbConfig;
  private authHeader: string;

  constructor() {
    this.authHeader = Buffer.from(
      `${this.config.username}:${this.config.password}`
    ).toString('base64');
  }

  // === REST API基础方法 ===

  private async request(
    endpoint: string,
    options?: RequestInit
  ): Promise<any> {
    const url = `${this.config.restUrl}/rest/v1${endpoint}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.restTimeout);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Authorization': `Basic ${this.authHeader}`,
          'Content-Type': 'application/json',
          ...(options?.headers as Record<string, string>),
        },
      } as any);

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`IoTDB API error: ${response.status} ${errorText}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`IoTDB request timeout: ${url}`);
      }
      console.error(`IoTDB request failed: ${url}`, error.message);
      throw error;
    }
  }

  // === 健康检查 ===

  async healthCheck(): Promise<boolean> {
    try {
      // Use a simple query to check if IoTDB is responsive
      const result = await this.query('SELECT * FROM root LIMIT 1');
      return !!(result && (result.code === 200 || result.timestamps));
    } catch {
      return false;
    }
  }

  // === 时间序列管理 ===

  async createTimeseries(params: {
    path: string;
    dataType: string;
    encoding: string;
    compressor?: string;
  }): Promise<any> {
    // Use SQL CREATE TIMESERIES for IoTDB 2.0
    const sql = `CREATE TIMESERIES ${params.path} WITH DATATYPE=${params.dataType}, ENCODING=${params.encoding}`;
    return this.query(sql);
  }

  async deleteTimeseries(path: string): Promise<any> {
    // Use SQL DROP TIMESERIES for IoTDB 2.0
    const sql = `DROP TIMESERIES ${path}`;
    return this.query(sql);
  }

  async listTimeseries(path?: string): Promise<any> {
    // Use SQL SHOW TIMESERIES for IoTDB 2.0
    const sql = path ? `SHOW TIMESERIES ${path}` : 'SHOW TIMESERIES';
    return this.query(sql);
  }

  // === 数据操作 ===

  async insertRecords(records: Array<{
    device: string;
    measurements: string[];
    values: any[];
    timestamp: number;
  }>): Promise<any> {
    // Use SQL INSERT for IoTDB 2.0
    const sqlStatements = records.map(r => {
      const measurements = r.measurements.join(', ');
      const values = r.values.join(', ');
      return `INSERT INTO ${r.device}(${measurements}, timestamp) VALUES (${values}, ${r.timestamp})`;
    });

    // Execute all statements in a batch
    const sql = sqlStatements.join('; ');
    return this.query(sql);
  }

  async insertOneRecord(record: {
    device: string;
    timestamp: number;
    measurements: Record<string, any>;
  }): Promise<any> {
    // Use SQL INSERT for IoTDB 2.0
    const measurements = Object.keys(record.measurements).join(', ');
    const values = Object.values(record.measurements).join(', ');
    const sql = `INSERT INTO ${record.device}(${measurements}, timestamp) VALUES (${values}, ${record.timestamp})`;
    return this.query(sql);
  }

  async query(sql: string): Promise<any> {
    // IoTDB 2.0 REST API uses /query endpoint with POST
    return this.request('/query', {
      method: 'POST',
      body: JSON.stringify({ sql }),
    });
  }

  async queryData(params: {
    path?: string;
    limit?: number;
    offset?: number;
    startTime?: number;
    endTime?: number;
  }): Promise<any> {
    // Use SQL SELECT for IoTDB 2.0
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

  // === 聚合查询 ===

  async aggregate(params: {
    path: string;
    func: 'avg' | 'sum' | 'max' | 'min' | 'count';
    startTime?: number;
    endTime?: number;
    interval?: string;
  }): Promise<any> {
    // Use SQL aggregation for IoTDB 2.0
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

  // === 删除数据 ===

  async deleteData(params: {
    path: string;
    startTime?: number;
    endTime?: number;
  }): Promise<any> {
    // Use SQL DELETE for IoTDB 2.0
    const whereClause: string[] = [];

    if (params.startTime) {
      whereClause.push(`time >= ${params.startTime}`);
    }
    if (params.endTime) {
      whereClause.push(`time <= ${params.endTime}`);
    }

    const where = whereClause.length > 0 ? ` WHERE ${whereClause.join(' AND ')}` : '';
    const sql = `DELETE FROM ${params.path}${where}`;

    return this.query(sql);
  }
}

// Export singleton instance
export const iotdbClient = new IoTDBClient();
