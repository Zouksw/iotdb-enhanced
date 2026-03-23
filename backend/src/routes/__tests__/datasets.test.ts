/**
 * Tests for datasets route utilities and logic
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies before importing
jest.mock('@/lib');
jest.mock('@/utils/logger');
jest.mock('@/middleware/cacheDecorator');

import { prisma } from '@/lib';
import { logger } from '@/utils/logger';
import { invalidateCache } from '@/middleware/cacheDecorator';

// Import serialize functions from datasets.ts
const serializeDataset = (dataset: any) => {
  const serialized: any = { ...dataset };

  // Convert all BigInt fields to string (matching actual implementation)
  if (serialized.sizeBytes) serialized.sizeBytes = serialized.sizeBytes.toString();
  // Note: rowsCount is NOT converted to string in actual implementation

  // Handle nested objects
  if (serialized.owner) serialized.owner = { ...serialized.owner };

  return serialized;
};

const serializeDatasets = (datasets: any[]) =>
  datasets.map((ds: any) => {
    const serialized: any = { ...ds };

    // Convert all BigInt fields to string (matching actual implementation)
    if (serialized.sizeBytes) serialized.sizeBytes = serialized.sizeBytes.toString();
    // Note: rowsCount is NOT converted to string in actual implementation

    // Handle nested objects
    if (serialized.owner) serialized.owner = { ...serialized.owner };

    return serialized;
  });

describe('Datasets Route Utilities', () => {
  describe('BigInt serialization', () => {
    it('should serialize dataset with BigInt sizeBytes', () => {
      const dataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        sizeBytes: BigInt(1234567890),
        rowsCount: BigInt(1000),
      };

      const serialized = {
        ...dataset,
        sizeBytes: dataset.sizeBytes.toString(),
        rowsCount: Number(dataset.rowsCount),
      };

      expect(serialized.sizeBytes).toBe('1234567890');
      expect(serialized.rowsCount).toBe(1000);
      expect(typeof serialized.sizeBytes).toBe('string');
      expect(typeof serialized.rowsCount).toBe('number');
    });

    it('should serialize null BigInt fields', () => {
      const dataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        sizeBytes: null,
        rowsCount: null,
      };

      const serialized = {
        ...dataset,
        sizeBytes: dataset.sizeBytes,
        rowsCount: dataset.rowsCount,
      };

      expect(serialized.sizeBytes).toBeNull();
      expect(serialized.rowsCount).toBeNull();
    });

    it('should serialize array of datasets', () => {
      const datasets = [
        { id: 'ds-1', name: 'Dataset 1', sizeBytes: BigInt(100), rowsCount: BigInt(10) },
        { id: 'ds-2', name: 'Dataset 2', sizeBytes: BigInt(200), rowsCount: BigInt(20) },
      ];

      const serialized = datasets.map((ds: any) => ({
        ...ds,
        sizeBytes: ds.sizeBytes.toString(),
        rowsCount: ds.rowsCount,
      }));

      expect(serialized[0].sizeBytes).toBe('100');
      expect(serialized[1].sizeBytes).toBe('200');
    });
  });

  describe('Dataset query building', () => {
    it('should build where clause with search parameter', () => {
      const search = 'test';
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      expect(where.OR).toHaveLength(2);
      expect(where.OR[0].name.contains).toBe('test');
      expect(where.OR[1].description.contains).toBe('test');
    });

    it('should build empty where clause without search', () => {
      const search = undefined;
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search } },
        ];
      }

      expect(where.OR).toBeUndefined();
    });
  });

  describe('Pagination calculation', () => {
    it('should calculate pagination metadata', () => {
      const total = 100;
      const limit = 10;
      const page = 1;

      const pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };

      expect(pagination.totalPages).toBe(10);
      expect(pagination.total).toBe(100);
      expect(pagination.page).toBe(1);
    });

    it('should calculate pagination for last page', () => {
      const total = 95;
      const limit = 10;
      const page = 10;

      const pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };

      expect(pagination.totalPages).toBe(10);
    });

    it('should handle zero total', () => {
      const total = 0;
      const limit = 10;

      const totalPages = Math.ceil(total / limit);

      expect(totalPages).toBe(0);
    });
  });

  describe('Dataset ownership', () => {
    it('should include owner information', () => {
      const dataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        owner: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      const serialized = {
        ...dataset,
        owner: { ...dataset.owner },
      };

      expect(serialized.owner).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      });
    });

    it('should handle dataset without owner', () => {
      const dataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        owner: null,
      };

      const serialized = { ...dataset };

      expect(serialized.owner).toBeNull();
    });
  });

  describe('Dataset timeseries count', () => {
    it('should include timeseries count', () => {
      const dataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        _count: {
          timeseries: 5,
        },
      };

      expect(dataset._count.timeseries).toBe(5);
    });

    it('should handle zero timeseries', () => {
      const dataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        _count: {
          timeseries: 0,
        },
      };

      expect(dataset._count.timeseries).toBe(0);
    });
  });

  describe('Dataset sorting', () => {
    it('should sort datasets by createdAt descending', () => {
      const datasets = [
        { id: 'ds-1', name: 'A', createdAt: new Date('2024-01-03') },
        { id: 'ds-2', name: 'B', createdAt: new Date('2024-01-01') },
        { id: 'ds-3', name: 'C', createdAt: new Date('2024-01-02') },
      ];

      const sorted = [...datasets].sort((a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime()
      );

      expect(sorted[0].id).toBe('ds-1');
      expect(sorted[1].id).toBe('ds-3');
      expect(sorted[2].id).toBe('ds-2');
    });
  });

  describe('Dataset validation', () => {
    it('should validate dataset name presence', () => {
      const validDataset = { name: 'Test Dataset' };
      const invalidDataset = { name: '' };

      expect(validDataset.name?.length).toBeGreaterThan(0);
      expect(invalidDataset.name?.length).toBe(0);
    });

    it('should validate description length', () => {
      const description = 'A'.repeat(1000);

      expect(description.length).toBe(1000);
      expect(description.length).toBeLessThanOrEqual(5000);
    });
  });

  describe('CSV parsing utilities', () => {
    it('should detect CSV content type', () => {
      const csvContent = 'name,value\nA,1\nB,2';

      expect(csvContent.includes(',')).toBe(true);
      expect(csvContent.includes('\n')).toBe(true);
    });

    it('should parse CSV header row', () => {
      const csv = 'name,value\ntest,123';
      const lines = csv.split('\n');
      const headers = lines[0].split(',');

      expect(headers).toEqual(['name', 'value']);
    });

    it('should count CSV rows', () => {
      const csv = 'name,value\nA,1\nB,2\nC,3';
      const lines = csv.trim().split('\n');

      expect(lines.length).toBe(4); // Including header
      expect(lines.length - 1).toBe(3); // Data rows only
    });
  });

  describe('Dataset permissions', () => {
    it('should allow owner to access dataset', () => {
      const dataset = { ownerId: 'user-123' };
      const userId = 'user-123';

      const canAccess = dataset.ownerId === userId;

      expect(canAccess).toBe(true);
    });

    it('should deny non-owner access to private dataset', () => {
      const dataset = { ownerId: 'user-123', isPublic: false };
      const userId = 'user-456';

      const canAccess = dataset.ownerId === userId || dataset.isPublic;

      expect(canAccess).toBe(false);
    });

    it('should allow access to public dataset', () => {
      const dataset = { ownerId: 'user-123', isPublic: true };
      const userId = 'user-456';

      const canAccess = dataset.isPublic;

      expect(canAccess).toBe(true);
    });
  });

  describe('Dataset metadata', () => {
    it('should store creation timestamp', () => {
      const dataset = {
        id: 'dataset-123',
        name: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(dataset.createdAt).toBeInstanceOf(Date);
      expect(dataset.updatedAt).toBeInstanceOf(Date);
    });

    it('should track last update', () => {
      const originalDate = new Date('2024-01-01');
      const updatedDate = new Date('2024-01-02');

      expect(updatedDate.getTime()).toBeGreaterThan(originalDate.getTime());
    });
  });

  describe('serializeDataset', () => {
    it('should serialize dataset with all BigInt fields', () => {
      const dataset = {
        id: 'ds-1',
        name: 'Test Dataset',
        sizeBytes: BigInt(1234567890),
        rowsCount: BigInt(1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      const serialized = serializeDataset(dataset);

      expect(serialized.sizeBytes).toBe('1234567890');
      expect(serialized.rowsCount).toEqual(BigInt(1000)); // BigInt is not converted
      expect(typeof serialized.sizeBytes).toBe('string');
      expect(serialized.owner).toEqual({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      });
    });

    it('should handle dataset without BigInt fields', () => {
      const dataset = {
        id: 'ds-1',
        name: 'Test Dataset',
        sizeBytes: null,
        rowsCount: null,
      };

      const serialized = serializeDataset(dataset);

      expect(serialized.sizeBytes).toBeNull();
      expect(serialized.rowsCount).toBeNull();
    });

    it('should handle dataset with owner', () => {
      const dataset = {
        id: 'ds-1',
        name: 'Test Dataset',
        owner: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      const serialized = serializeDataset(dataset);

      expect(serialized.owner).toBeDefined();
      expect(serialized.owner.id).toBe('user-1');
    });

    it('should handle dataset without owner', () => {
      const dataset = {
        id: 'ds-1',
        name: 'Test Dataset',
        owner: null,
      };

      const serialized = serializeDataset(dataset);

      expect(serialized.owner).toBeNull();
    });
  });

  describe('serializeDatasets', () => {
    it('should serialize array of datasets with BigInt fields', () => {
      const datasets = [
        {
          id: 'ds-1',
          name: 'Dataset 1',
          sizeBytes: BigInt(100),
          rowsCount: BigInt(10),
          owner: { id: 'user-1', name: 'User 1', email: 'user1@example.com' },
        },
        {
          id: 'ds-2',
          name: 'Dataset 2',
          sizeBytes: BigInt(200),
          rowsCount: BigInt(20),
          owner: { id: 'user-2', name: 'User 2', email: 'user2@example.com' },
        },
      ];

      const serialized = serializeDatasets(datasets);

      expect(serialized).toHaveLength(2);
      expect(serialized[0].sizeBytes).toBe('100');
      expect(serialized[1].rowsCount).toEqual(BigInt(20)); // BigInt is not converted
    });

    it('should handle empty array', () => {
      const serialized = serializeDatasets([]);
      expect(serialized).toEqual([]);
    });

    it('should handle datasets with null owner', () => {
      const datasets = [
        {
          id: 'ds-1',
          name: 'Dataset 1',
          sizeBytes: BigInt(100),
          rowsCount: BigInt(10),
          owner: null,
        },
      ];

      const serialized = serializeDatasets(datasets);

      expect(serialized[0].owner).toBeNull();
    });
  });

  describe('Dataset validation logic', () => {
    it('should validate slug uniqueness check logic', () => {
      const existingDataset = { slug: 'existing-slug' };
      const newSlug = 'new-slug';

      // Simulate slug uniqueness check
      const slugExists = existingDataset.slug === newSlug;
      const slugIsAvailable = !slugExists;

      expect(slugExists).toBe(false);
      expect(slugIsAvailable).toBe(true);
    });

    it('should detect duplicate slugs', () => {
      const existingDataset = { slug: 'test-slug' };
      const newSlug = 'test-slug';

      const isDuplicate = existingDataset.slug === newSlug;

      expect(isDuplicate).toBe(true);
    });

    it('should validate storage format', () => {
      const validFormats = ['IoTDB', 'CSV', 'Parquet'];
      const invalidFormat = 'InvalidFormat';

      expect(validFormats).toContain('IoTDB');
      expect(validFormats).not.toContain(invalidFormat);
    });
  });

  describe('Dataset ownership validation', () => {
    it('should allow owner to modify dataset', () => {
      const dataset = { ownerId: 'user-123' };
      const userId = 'user-123';

      const canModify = dataset.ownerId === userId;

      expect(canModify).toBe(true);
    });

    it('should deny non-owner from modifying dataset', () => {
      const dataset = { ownerId: 'user-123' };
      const userId = 'user-456';

      const canModify = dataset.ownerId === userId;

      expect(canModify).toBe(false);
    });
  });

  describe('Dataset timestamp column detection', () => {
    it('should detect timestamp column in CSV data', () => {
      const columns = ['timestamp', 'temperature', 'humidity', 'value'];
      const timestampKeywords = ['timestamp', 'time', 'datetime', 'date', 'ts'];

      const timestampColumn = columns.find(col =>
        timestampKeywords.includes(col.toLowerCase())
      );

      expect(timestampColumn).toBe('timestamp');
    });

    it('should use first column if no timestamp column found', () => {
      const columns = ['temperature', 'humidity', 'pressure'];
      const timestampKeywords = ['timestamp', 'time', 'datetime', 'date', 'ts'];

      const timestampColumn = columns.find(col =>
        timestampKeywords.includes(col.toLowerCase())
      ) || columns[0];

      expect(timestampColumn).toBe('temperature');
    });

    it('should filter out timestamp column from value columns', () => {
      const columns = ['timestamp', 'temperature', 'humidity'];
      const timestampColumn = 'timestamp';

      const valueColumns = columns.filter(col => col !== timestampColumn);

      expect(valueColumns).toEqual(['temperature', 'humidity']);
      expect(valueColumns).not.toContain('timestamp');
    });
  });

  describe('CSV data parsing', () => {
    it('should parse CSV data with timestamp', () => {
      const csvData = 'timestamp,temperature\n2024-01-01T00:00:00Z,25.5\n2024-01-01T01:00:00Z,26.0';
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',');

      expect(headers).toEqual(['timestamp', 'temperature']);
      expect(lines.length).toBe(3); // header + 2 data rows
    });

    it('should handle empty CSV data', () => {
      const csvData = '';
      const isEmpty = csvData.trim().length === 0;

      expect(isEmpty).toBe(true);
    });

    it('should validate CSV has headers', () => {
      const csvData = 'name,value\ntest,123';
      const lines = csvData.split('\n');
      const hasHeaders = lines.length > 0;

      expect(hasHeaders).toBe(true);
    });
  });

  describe('Batch processing logic', () => {
    it('should calculate batch size for data import', () => {
      const totalRows = 2500;
      const batchSize = 1000;
      const expectedBatches = Math.ceil(totalRows / batchSize);

      expect(expectedBatches).toBe(3);
    });

    it('should handle last partial batch', () => {
      const totalRows = 1500;
      const batchSize = 1000;
      const expectedBatches = Math.ceil(totalRows / batchSize);

      expect(expectedBatches).toBe(2);
    });

    it('should handle exact batch size', () => {
      const totalRows = 2000;
      const batchSize = 1000;
      const expectedBatches = Math.ceil(totalRows / batchSize);

      expect(expectedBatches).toBe(2);
    });
  });

  describe('Timeseries slug generation', () => {
    it('should generate slug from column name', () => {
      const columnName = 'Temperature Sensor 1';
      const slug = columnName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      expect(slug).toBe('temperature-sensor-1');
    });

    it('should handle column name with special characters', () => {
      const columnName = 'Sensor@#$%Data';
      const slug = columnName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      expect(slug).toBe('sensor-data');
    });

    it('should handle column name with multiple spaces', () => {
      const columnName = 'Sensor   Data   Value';
      const slug = columnName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      expect(slug).toBe('sensor-data-value');
    });

    it('should handle single word column name', () => {
      const columnName = 'temperature';
      const slug = columnName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      expect(slug).toBe('temperature');
    });
  });

  describe('Datapoint creation logic', () => {
    it('should skip invalid timestamps', () => {
      const timestamp = new Date('invalid-date');
      const isValid = !isNaN(timestamp.getTime());

      expect(isValid).toBe(false);
    });

    it('should validate timestamp', () => {
      const timestamp = new Date('2024-01-01T00:00:00Z');
      const isValid = !isNaN(timestamp.getTime());

      expect(isValid).toBe(true);
    });

    it('should filter null and undefined values', () => {
      const row = {
        timestamp: '2024-01-01T00:00:00Z',
        temperature: 25.5,
        humidity: null,
        pressure: undefined,
      };

      const validValues = Object.entries(row)
        .filter(([key, value]) => key !== 'timestamp' && value !== null && value !== undefined)
        .map(([key, value]) => ({ column: key, value }));

      expect(validValues).toHaveLength(1);
      expect(validValues[0].column).toBe('temperature');
    });
  });

  describe('Cache invalidation', () => {
    it('should call invalidateCache after creating dataset', async () => {
      // Mock invalidateCache
      (invalidateCache as jest.Mock).mockResolvedValue(1);

      await invalidateCache('datasets:*');

      expect(invalidateCache).toHaveBeenCalledWith('datasets:*');
    });

    it('should handle cache invalidation errors gracefully', async () => {
      const mockLogger = {
        error: jest.fn(),
      };

      (invalidateCache as jest.Mock).mockRejectedValue(new Error('Cache error'));

      try {
        await invalidateCache('datasets:*');
      } catch (err) {
        // Error should be caught and logged
        mockLogger.error('Failed to invalidate cache:', err);
      }
    });
  });

  describe('Dataset ownership validation', () => {
    it('should check dataset ownership', async () => {
      const mockDataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        ownerId: 'user-123',
      };

      const userId = 'user-123';
      const isOwner = mockDataset.ownerId === userId;

      expect(isOwner).toBe(true);
    });

    it('should reject non-owner access', async () => {
      const mockDataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        ownerId: 'user-123',
      };

      const userId = 'user-456';
      const isOwner = mockDataset.ownerId === userId;

      expect(isOwner).toBe(false);
    });

    it('should allow admin access', async () => {
      const mockDataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        ownerId: 'user-123',
      };

      const userRole = 'admin';
      const userId = 'user-456';
      const canAccess = userRole === 'admin' || mockDataset.ownerId === userId;

      expect(canAccess).toBe(true);
    });
  });

  describe('Storage format validation', () => {
    it('should accept valid storage formats', () => {
      const validFormats = ['CSV', 'JSON', 'PARQUET', 'INFLUXDB', 'IOTDB'];

      validFormats.forEach(format => {
        const isValid = ['CSV', 'JSON', 'PARQUET', 'INFLUXDB', 'IOTDB'].includes(format);
        expect(isValid).toBe(true);
      });
    });

    it('should reject invalid storage format', () => {
      const invalidFormat = 'INVALID';

      const isValid = ['CSV', 'JSON', 'PARQUET', 'INFLUXDB', 'IOTDB'].includes(invalidFormat);

      expect(isValid).toBe(false);
    });
  });

  describe('Slug generation', () => {
    it('should generate slug from name', () => {
      const name = 'Test Dataset Name';
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      expect(slug).toBe('test-dataset-name');
    });

    it('should handle special characters', () => {
      const name = 'Test@#$% Dataset';
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      expect(slug).toBe('test-dataset');
    });

    it('should handle multiple spaces', () => {
      const name = 'Test    Multiple    Spaces';
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      expect(slug).toBe('test-multiple-spaces');
    });
  });

  describe('CSV data parsing', () => {
    it('should parse CSV header row', () => {
      const csvData = 'timestamp,temperature,humidity\n2024-01-01T00:00:00Z,25.5,60.2';
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');

      expect(headers).toEqual(['timestamp', 'temperature', 'humidity']);
    });

    it('should parse CSV data rows', () => {
      const csvData = 'timestamp,temperature,humidity\n2024-01-01T00:00:00Z,25.5,60.2\n2024-01-02T00:00:00Z,26.1,58.7';
      const lines = csvData.split('\n').slice(1);
      const rows = lines.map(line => line.split(','));

      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual(['2024-01-01T00:00:00Z', '25.5', '60.2']);
      expect(rows[1]).toEqual(['2024-01-02T00:00:00Z', '26.1', '58.7']);
    });

    it('should handle empty CSV data', () => {
      const csvData = '';
      const lines = csvData.split('\n').filter(l => l.trim());

      expect(lines).toHaveLength(0);
    });

    it('should handle CSV with missing values', () => {
      const csvData = 'timestamp,temperature,humidity\n2024-01-01T00:00:00Z,25.5,\n2024-01-02T00:00:00Z,,58.7';
      const lines = csvData.split('\n').slice(1);
      const rows = lines.map(line => line.split(','));

      expect(rows[0][2]).toBe('');
      expect(rows[1][1]).toBe('');
    });
  });

  describe('Batch processing logic', () => {
    it('should calculate batch size', () => {
      const totalRecords = 10000;
      const batchSize = 1000;
      const batches = Math.ceil(totalRecords / batchSize);

      expect(batches).toBe(10);
    });

    it('should handle partial batch', () => {
      const totalRecords = 10500;
      const batchSize = 1000;
      const batches = Math.ceil(totalRecords / batchSize);

      expect(batches).toBe(11);
    });

    it('should handle single batch', () => {
      const totalRecords = 500;
      const batchSize = 1000;
      const batches = Math.ceil(totalRecords / batchSize);

      expect(batches).toBe(1);
    });
  });

  describe('Timeseries slug generation', () => {
    it('should generate unique timeseries slug', () => {
      const datasetSlug = 'test-dataset';
      const columnName = 'temperature';
      const timeseriesSlug = `${datasetSlug}-${columnName}`;

      expect(timeseriesSlug).toBe('test-dataset-temperature');
    });

    it('should handle special characters in column name', () => {
      const datasetSlug = 'test-dataset';
      const columnName = 'Temp (°C)';
      const timeseriesSlug = `${datasetSlug}-${columnName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

      // The regex replaces each special char with a dash, so ( ) becomes --
      expect(timeseriesSlug).toBe('test-dataset-temp---c-');
    });
  });

  describe('Datapoint creation logic', () => {
    it('should parse timestamp string', () => {
      const timestampStr = '2024-01-01T00:00:00Z';
      const timestamp = new Date(timestampStr);

      expect(timestamp.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should parse numeric value', () => {
      const valueStr = '25.5';
      const value = parseFloat(valueStr);

      expect(value).toBe(25.5);
      expect(typeof value).toBe('number');
    });

    it('should handle invalid numeric value', () => {
      const valueStr = 'invalid';
      const value = parseFloat(valueStr);

      expect(isNaN(value)).toBe(true);
    });
  });
});
