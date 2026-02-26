// IoTDB REST API Client
// Uses Apache IoTDB REST API V2
// Documentation: https://iotdb.apache.org/UserGuide/latest/API/RestServiceV2.html

import fetch from 'node-fetch';

// IoTDB 连接配置
interface IoTDBConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

// IoTDB 查询结果接口
interface IoTDBQueryResult {
  expressions?: string[] | null;
  column_names?: string[] | null;
  timestamps?: number[] | null;
  values: any[][];
}

// IoTDB REST API 响应接口
interface IoTDBResponse {
  code: number;
  message: string;
  expressions?: string[] | null;
  column_names?: string[] | null;
  timestamps?: number[] | null;
  values?: any[][] | null;
}

const iotdbConfig: IoTDBConfig = {
  host: process.env.IOTDB_HOST || 'localhost',
  port: parseInt(process.env.IOTDB_PORT || '18080'),
  username: process.env.IOTDB_USERNAME || 'root',
  password: process.env.IOTDB_PASSWORD || 'root',
  database: process.env.IOTDB_DATABASE || 'root',
};

// 连接状态
let connectionStatus: 'not_connected' | 'connected' | 'error' = 'not_connected';

// 生成 Basic Auth 头
function getAuthHeader(): string {
  const credentials = `${iotdbConfig.username}:${iotdbConfig.password}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

// IoTDB REST API 客户端类
class IoTDBRESTClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: IoTDBConfig) {
    this.baseUrl = `http://${config.host}:${config.port}`;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    };
  }

  // 测试连接
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ping`);
      const data = await response.json() as IoTDBResponse;
      return data.code === 200;
    } catch (error) {
      console.error('IoTDB ping failed:', error);
      return false;
    }
  }

  // 执行查询
  async queryData(sql: string, rowLimit?: number): Promise<IoTDBQueryResult[]> {
    try {
      const body: any = { sql };
      if (rowLimit !== undefined) {
        body.row_limit = rowLimit;
      }

      const response = await fetch(`${this.baseUrl}/rest/v2/query`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as IoTDBResponse;

      if (data.code !== 200) {
        throw new Error(`IoTDB error ${data.code}: ${data.message}`);
      }

      // 将 IoTDB 的结果转换为统一格式
      return this.parseQueryResult(data);
    } catch (error) {
      console.error('IoTDB query failed:', error);
      return [];
    }
  }

  // 解析查询结果
  private parseQueryResult(data: IoTDBResponse): IoTDBQueryResult[] {
    const results: IoTDBQueryResult[] = [];

    if (!data.timestamps || data.timestamps.length === 0) {
      return results;
    }

    // metadata query (show timeseries, show devices, etc.)
    if (data.column_names && data.values) {
      const numColumns = data.values.length > 0 ? data.values[0].length : 0;
      for (let i = 0; i < numColumns; i++) {
        const row: IoTDBQueryResult = {
          expressions: null,
          column_names: data.column_names,
          timestamps: null,
          values: data.values.map(col => col[i]),
        };
        results.push(row);
      }
      return results;
    }

    // data query (select * from ...)
    if (data.expressions && data.timestamps && data.values) {
      for (let i = 0; i < data.timestamps.length; i++) {
        const row: any = {
          timestamp: data.timestamps[i],
        };

        for (let j = 0; j < data.expressions.length; j++) {
          const path = data.expressions[j];
          const value = data.values[j]?.[i];
          row[path] = value;
        }

        results.push(row);
      }
    }

    return results;
  }

  // 执行非查询操作 (INSERT, DELETE, CREATE, etc.)
  async executeNonQueries(sql: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v2/nonQuery`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ sql }),
      });

      const data = await response.json() as IoTDBResponse;

      return {
        success: data.code === 200,
        message: data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Unknown error',
      };
    }
  }

  // 插入表格数据 (aligned timeseries)
  async insertTablet(
    device: string,
    timestamps: number[],
    measurements: string[],
    dataTypes: string[],
    values: any[][],
    isAligned: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v2/insertTablet`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          device,
          timestamps,
          measurements,
          data_types: dataTypes,
          values,
          is_aligned: isAligned,
        }),
      });

      const data = await response.json() as IoTDBResponse;

      return {
        success: data.code === 200,
        message: data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Unknown error',
      };
    }
  }

  // 插入记录 (non-aligned timeseries)
  async insertRecords(
    devices: string[],
    timestamps: number[],
    measurementsList: string[][],
    dataTypesList: string[][],
    valuesList: any[][],
    isAligned: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v2/insertRecords`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          devices,
          timestamps,
          measurements_list: measurementsList,
          data_types_list: dataTypesList,
          values_list: valuesList,
          is_aligned: isAligned,
        }),
      });

      const data = await response.json() as IoTDBResponse;

      return {
        success: data.code === 200,
        message: data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Unknown error',
      };
    }
  }

  // 创建时间序列数据库
  async createDatabase(databasePath: string): Promise<boolean> {
    const result = await this.executeNonQueries(`CREATE DATABASE ${databasePath}`);
    return result.success;
  }

  // 创建时间序列
  async createTimeseries(path: string, dataType: string, encoding: string = 'RLE', compression: string = 'SNAPPY'): Promise<boolean> {
    const result = await this.executeNonQueries(
      `CREATE TIMESERIES ${path} WITH DATATYPE=${dataType} ENCODING=${encoding} COMPRESSOR=${compression}`
    );
    return result.success;
  }

  // 显示所有时间序列
  async showTimeseries(): Promise<string[]> {
    const results = await this.queryData('SHOW TIMESERIES');
    return results.map((r: any) => r['timeseries'] || r.values?.[0]).filter(Boolean);
  }

  // 查询时间序列数据
  async queryTimeseriesData(
    path: string,
    limit: number = 1000,
    startTime?: string,
    endTime?: string
  ): Promise<any[]> {
    let sql = `SELECT * FROM ${path}`;
    if (startTime || endTime) {
      sql += ' WHERE';
      if (startTime) sql += ` time >= ${startTime}`;
      if (startTime && endTime) sql += ' AND';
      if (endTime) sql += ` time <= ${endTime}`;
    }
    sql += ` ORDER BY TIME DESC LIMIT ${limit}`;

    return await this.queryData(sql);
  }

  // 删除时间序列数据
  async deleteTimeseriesData(path: string, startTime?: string, endTime?: string): Promise<boolean> {
    let sql = `DELETE FROM ${path}`;
    if (startTime || endTime) {
      sql += ' WHERE';
      if (startTime) sql += ` time >= ${startTime}`;
      if (startTime && endTime) sql += ' AND';
      if (endTime) sql += ` time <= ${endTime}`;
    }

    const result = await this.executeNonQueries(sql);
    return result.success;
  }

  // 统计时间序列数量
  async countTimeseries(path: string): Promise<number> {
    const results = await this.queryData(`COUNT TIMESERIES ${path}`);
    if (results.length > 0 && results[0].values) {
      return parseInt(results[0].values[0][0]) || 0;
    }
    return 0;
  }

  // ============ AINode Machine Learning APIs ============

  // Train a forecasting model using AINode
  async trainModel(
    path: string,
    algorithm: 'ARIMA' | 'PROPHET' | 'LSTM' | 'TRANSFORMER',
    hyperparameters: Record<string, any> = {}
  ): Promise<{ success: boolean; message: string; modelId?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v2/ainode/train`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          path,
          algorithm,
          hyperparameters,
        }),
      });

      const data = await response.json() as IoTDBResponse;

      if (data.code === 200) {
        return {
          success: true,
          message: data.message || 'Training completed successfully',
          modelId: data.values?.[0]?.[0], // Model ID from response
        };
      }

      return {
        success: false,
        message: data.message || 'Training failed',
      };
    } catch (error: any) {
      console.error('AINode training error:', error);
      return {
        success: false,
        message: error.message || 'Training request failed',
      };
    }
  }

  // Make predictions using a trained model
  async predict(
    path: string,
    modelId: string,
    horizon: number,
    confidenceLevel: number = 0.95
  ): Promise<{ success: boolean; message: string; forecasts?: any[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v2/ainode/predict`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          path,
          model_id: modelId,
          horizon,
          confidence_level: confidenceLevel,
        }),
      });

      const data = await response.json() as IoTDBResponse;

      if (data.code === 200 && data.timestamps && data.values) {
        // Parse forecast results
        const forecasts = data.timestamps.map((timestamp: number, i: number) => ({
          timestamp: new Date(timestamp),
          predictedValue: data.values![0]?.[i] || null,
          lowerBound: data.values![1]?.[i] || null,
          upperBound: data.values![2]?.[i] || null,
        }));

        return {
          success: true,
          message: 'Prediction completed successfully',
          forecasts,
        };
      }

      return {
        success: false,
        message: data.message || 'Prediction failed',
      };
    } catch (error: any) {
      console.error('AINode prediction error:', error);
      return {
        success: false,
        message: error.message || 'Prediction request failed',
      };
    }
  }

  // Get list of trained models
  async listModels(): Promise<{ success: boolean; models?: any[]; message: string }> {
    try {
      const results = await this.queryData('SHOW MODELS');

      return {
        success: true,
        models: results.map((r: any) => ({
          modelId: r.values?.[0]?.[0],
          algorithm: r.values?.[0]?.[1],
          path: r.values?.[0]?.[2],
          trainedAt: r.values?.[0]?.[3],
        })),
        message: 'Models retrieved successfully',
      };
    } catch (error: any) {
      console.error('AINode list models error:', error);
      return {
        success: false,
        message: error.message || 'Failed to list models',
      };
    }
  }

  // Delete a trained model
  async deleteModel(modelId: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.executeNonQueries(`DROP MODEL ${modelId}`);
      return result;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete model',
      };
    }
  }
}

// 全局客户端实例
let iotdbClientInstance: IoTDBRESTClient | null = null;

// 获取 IoTDB 客户端实例
export async function getIoTDBClient(): Promise<IoTDBRESTClient> {
  if (!iotdbClientInstance) {
    iotdbClientInstance = new IoTDBRESTClient(iotdbConfig);

    // 测试连接
    const isConnected = await iotdbClientInstance.ping();
    if (isConnected) {
      connectionStatus = 'connected';
      console.log('✅ IoTDB REST API client initialized successfully');
    } else {
      connectionStatus = 'error';
      console.warn('⚠️  IoTDB REST API client initialized but connection test failed');
    }
  }

  return iotdbClientInstance;
}

// 测试 IoTDB 连接
export async function checkIoTDBConnection(): Promise<boolean> {
  try {
    const client = await getIoTDBClient();
    const isConnected = await client.ping();

    if (isConnected) {
      connectionStatus = 'connected';
      console.log('✅ IoTDB connection successful');
    } else {
      connectionStatus = 'error';
      console.log('❌ IoTDB connection failed');
    }

    return isConnected;
  } catch (error) {
    console.error('❌ IoTDB connection error:', error);
    connectionStatus = 'error';
    return false;
  }
}

// 获取连接状态
export function getConnectionStatus(): 'not_connected' | 'connected' | 'error' {
  return connectionStatus;
}

// 导出配置
export { iotdbConfig };
export type { IoTDBConfig, IoTDBQueryResult, IoTDBResponse };
