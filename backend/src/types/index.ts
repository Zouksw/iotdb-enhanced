/**
 * Backend Type Definitions
 *
 * Central export point for all backend types.
 * Following Linus's philosophy: "Good programmers worry about data structures."
 *
 * @module types
 */

// Re-export API response types
export * from './api';

// Re-export model types
export * from './models';

// Re-export IoTDB types
export * from './iotdb';

// ============================================================================
// Legacy Domain Types (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use IoTDBDataPoint from './api' instead
 * Time series data point from IoTDB
 */
export interface IoTDBDataPoint {
  timestamp: number;
  value: unknown;
}

/**
 * @deprecated Use BatchResult from './api' instead
 * Batch insert result
 */
export interface BatchResult {
  success: boolean;
  count: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

/**
 * Query parameters with time range
 */
export interface TimeRangeQuery {
  startTime?: string;
  endTime?: string;
  limit?: number;
  aggregation?: string;
}

/**
 * @deprecated Use DatasetResponse from './api' instead
 * Dataset serialization format
 */
export interface SerializedDataset {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  storageFormat: string;
  isPublic: boolean;
  isImported: boolean;
  organizationId?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    timeseries: number;
  };
  sizeBytes?: string;
  rowsCount?: number;
  owner?: {
    id: string;
    email: string;
    name?: string | null;
  };
}

/**
 * Parsed import data
 * Replaces `any` with proper generic type
 */
export interface ParsedImportData<T = Record<string, unknown>> {
  headers: string[];
  data: Array<T>;
  rowCount: number;
}

/**
 * @deprecated Use IoTDBQueryResult from './api' instead
 * IoTDB query result
 */
export interface IoTDBQueryResult {
  timeseries: string;
  dataPoints: IoTDBDataPoint[];
  count: number;
}

/**
 * AI Model training result
 */
export interface ModelTrainingResult {
  success: boolean;
  modelId?: string;
  message: string;
  accuracy?: number;
  trainingTime?: number;
}

/**
 * @deprecated Use AnomalyDetectionResult from './api' instead
 * Anomaly detection result
 */
export interface AnomalyDetectionResult {
  timestamp: number;
  value: number;
  isAnomaly: boolean;
  score: number;
  threshold: number;
}

/**
 * @deprecated Use PredictionResult from './api' instead
 * Forecast prediction result
 */
export interface ForecastResult {
  timestamps: number[];
  predictedValues: number[];
  confidenceIntervals?: {
    lower: number[];
    upper: number[];
  };
  model: string;
}

/**
 * Security audit log entry
 * Replaces `any` with proper Record type
 */
export interface SecurityAuditLog {
  event: string;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  userAgent?: string;
  url?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Authenticated request with user
 */
export interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  };
}

/**
 * @deprecated Use PaginationParams from './api' instead
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

/**
 * Filter parameters
 */
export interface FilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Query builder conditions
 * Replaces `any` with proper Record type
 */
export interface QueryConditions {
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
  skip?: number;
}
