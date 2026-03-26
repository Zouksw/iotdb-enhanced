// IoTDB REST API Client
// Uses Apache IoTDB REST API V2
// Documentation: https://iotdb.apache.org/UserGuide/latest/API/RestServiceV2.html

import type {
  IoTDBConfig,
  IoTDBResponse,
  IoTDBValue,
  IoTDBQueryRequest,
  IoTDBTrainModelResponse,
  IoTDBPredictResponse,
  IoTDBListModelsResponse,
  IoTDBOperationResult,
  IoTDBForecast,
  IoTDBModel,
  IoTDBTrainingHyperparameters,
  IoTDBQueryRow,
} from '../src/types/iotdb';
import type { IoTDBQueryResult } from '../src/types/api';

const iotdbConfig: IoTDBConfig = {
  host: process.env.IOTDB_HOST || 'localhost',
  port: parseInt(process.env.IOTDB_PORT || '18080'),
  username: process.env.IOTDB_USERNAME || 'root',
  password: process.env.IOTDB_PASSWORD || 'root',
  database: process.env.IOTDB_DATABASE || 'root',
};

/**
 * Validate IoTDB credentials for security
 * Throws an error if default credentials are detected in production
 */
export function validateIoTDBCredentials(): void {
  if (process.env.NODE_ENV === 'production') {
    const defaultUsernames = ['root', 'admin', 'change_this_username'];
    const defaultPasswords = ['root', 'admin', 'password', 'change_this_secure_password', '123456'];

    const isDefaultUsername = defaultUsernames.includes(iotdbConfig.username.toLowerCase());
    const isDefaultPassword = defaultPasswords.some(pwd =>
      iotdbConfig.password.toLowerCase().includes(pwd.toLowerCase())
    );

    if (isDefaultUsername || isDefaultPassword) {
      throw new Error(
        'SECURITY: Default IoTDB credentials detected in production environment. ' +
        'Please update IOTDB_USERNAME and IOTDB_PASSWORD environment variables with secure credentials.'
      );
    }
  }
}

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
  async queryData(sql: string, rowLimit?: number): Promise<IoTDBQueryRow[]> {
    try {
      const body: IoTDBQueryRequest = { sql };
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
  private parseQueryResult(data: IoTDBResponse): IoTDBQueryRow[] {
    const results: IoTDBQueryRow[] = [];

    if (!data.timestamps || data.timestamps.length === 0) {
      return results;
    }

    // metadata query (show timeseries, show devices, etc.)
    if (data.column_names && data.values) {
      const numColumns = data.values.length > 0 ? data.values[0].length : 0;
      for (let i = 0; i < numColumns; i++) {
        const row: IoTDBQueryRow = {
          column_names: data.column_names,
          values: data.values.map((col) => col[i] as IoTDBValue),
        };
        results.push(row);
      }
      return results;
    }

    // data query (select * from ...)
    if (data.expressions && data.timestamps && data.values) {
      for (let i = 0; i < data.timestamps.length; i++) {
        const row: IoTDBQueryRow = {
          timestamp: data.timestamps[i],
        };

        for (let j = 0; j < data.expressions.length; j++) {
          const path = data.expressions[j];
          const value = data.values[j]?.[i];
          row[path] = value as IoTDBValue;
        }

        results.push(row);
      }
    }

    return results;
  }

  // 执行非查询操作 (INSERT, DELETE, CREATE, etc.)
  async executeNonQueries(sql: string): Promise<IoTDBOperationResult> {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message,
      };
    }
  }

  // 插入表格数据 (aligned timeseries)
  async insertTablet(
    device: string,
    timestamps: number[],
    measurements: string[],
    dataTypes: string[],
    values: IoTDBValue[][],
    isAligned: boolean = false
  ): Promise<IoTDBOperationResult> {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message,
      };
    }
  }

  // 插入记录 (non-aligned timeseries)
  async insertRecords(
    devices: string[],
    timestamps: number[],
    measurementsList: string[][],
    dataTypesList: string[][],
    valuesList: IoTDBValue[][],
    isAligned: boolean = false
  ): Promise<IoTDBOperationResult> {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message,
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
    return results
      .map((r) => {
        // Handle metadata query format - values is a 2D array
        const values = r.values as IoTDBValue[][] | undefined;
        if (values && values[0] && values[0][0] !== undefined) {
          return String(values[0][0]);
        }
        // Handle data query format - dynamic property access
        const timeseries = r.timeseries as IoTDBValue | undefined;
        if (timeseries !== undefined) {
          return String(timeseries);
        }
        return null;
      })
      .filter((val): val is string => val !== null);
  }

  // 查询时间序列数据
  async queryTimeseriesData(
    path: string,
    limit: number = 1000,
    startTime?: string,
    endTime?: string
  ): Promise<IoTDBQueryRow[]> {
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
    if (results.length > 0) {
      const values = results[0].values as IoTDBValue[][] | undefined;
      if (values && values[0] && values[0][0]) {
        return parseInt(String(values[0][0]), 10) || 0;
      }
    }
    return 0;
  }

  // ============ AINode Machine Learning APIs ============

  // Train a forecasting model using AINode
  async trainModel(
    path: string,
    algorithm: 'ARIMA' | 'PROPHET' | 'LSTM' | 'TRANSFORMER',
    hyperparameters: IoTDBTrainingHyperparameters = {}
  ): Promise<IoTDBTrainModelResponse> {
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
          modelId: data.values?.[0]?.[0] as string | undefined, // Model ID from response
        };
      }

      return {
        success: false,
        message: data.message || 'Training failed',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Training request failed';
      console.error('AINode training error:', error);
      return {
        success: false,
        message,
      };
    }
  }

  // Make predictions using a trained model
  async predict(
    path: string,
    modelId: string,
    horizon: number,
    confidenceLevel: number = 0.95
  ): Promise<IoTDBPredictResponse> {
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
        const forecasts: IoTDBForecast[] = data.timestamps.map((timestamp: number, i: number) => ({
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Prediction request failed';
      console.error('AINode prediction error:', error);
      return {
        success: false,
        message,
      };
    }
  }

  // Get list of trained models
  async listModels(): Promise<IoTDBListModelsResponse> {
    try {
      const results = await this.queryData('SHOW MODELS');

      const models: IoTDBModel[] = results.map((r) => {
        const values = r.values as IoTDBValue[][] | undefined;
        return {
          modelId: values?.[0]?.[0] || null,
          algorithm: values?.[0]?.[1] || null,
          path: values?.[0]?.[2] || null,
          trainedAt: values?.[0]?.[3] || null,
        };
      });

      return {
        success: true,
        models,
        message: 'Models retrieved successfully',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list models';
      console.error('AINode list models error:', error);
      return {
        success: false,
        message,
      };
    }
  }

  // Delete a trained model
  async deleteModel(modelId: string): Promise<IoTDBOperationResult> {
    try {
      const result = await this.executeNonQueries(`DROP MODEL ${modelId}`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete model';
      return {
        success: false,
        message,
      };
    }
  }
}

// 全局客户端实例
let iotdbClientInstance: IoTDBRESTClient | null = null;

// 获取 IoTDB 客户端实例
export async function getIoTDBClient(): Promise<IoTDBRESTClient> {
  if (!iotdbClientInstance) {
    // Validate credentials before initializing client in production
    validateIoTDBCredentials();

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
