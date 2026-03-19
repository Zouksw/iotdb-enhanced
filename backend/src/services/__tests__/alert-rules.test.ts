import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock prisma
jest.mock('../../lib', () => ({
  prisma: {
    alert: {
      create: jest.fn(),
    },
  },
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock alert-notifications
jest.mock('../alert-notifications', () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-123'),
}));

import * as alertRules from '../alert-rules';
import { prisma } from '../../lib';
import type { AlertRule, AlertCondition } from '../alert-types';

describe('Alert Rules Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAlertRule', () => {
    test('should create alert rule with all parameters', async () => {
      const params = {
        userId: 'user-123',
        timeseriesId: 'ts-123',
        name: 'Test Rule',
        type: 'ANOMALY' as const,
        condition: {
          type: 'threshold' as const,
          operator: '>',
          value: 100,
        } as AlertCondition,
        severity: 'WARNING' as const,
        notificationChannels: [
          {
            type: 'email' as const,
            config: { email: 'test@example.com' },
          },
        ],
        cooldownMinutes: 15,
      };

      const rule = await alertRules.createAlertRule(params);

      expect(rule).toMatchObject({
        id: 'test-uuid-123',
        userId: 'user-123',
        timeseriesId: 'ts-123',
        name: 'Test Rule',
        type: 'ANOMALY',
        severity: 'WARNING',
        enabled: true,
        cooldownMinutes: 15,
      });
      expect(rule.notificationChannels).toHaveLength(1);
      expect(rule.createdAt).toBeInstanceOf(Date);
      expect(rule.updatedAt).toBeInstanceOf(Date);
    });

    test('should create rule without optional cooldown', async () => {
      const params = {
        userId: 'user-123',
        timeseriesId: 'ts-123',
        name: 'Test Rule',
        type: 'SYSTEM' as const,
        condition: {
          type: 'pattern' as const,
          pattern: 'test',
        } as AlertCondition,
        severity: 'INFO' as const,
        notificationChannels: [],
      };

      const rule = await alertRules.createAlertRule(params);

      expect(rule.cooldownMinutes).toBeUndefined();
      expect(rule.enabled).toBe(true);
    });
  });

  describe('evaluateAlertRule', () => {
    let baseRule: AlertRule;

    beforeEach(() => {
      baseRule = {
        id: 'rule-123',
        userId: 'user-123',
        timeseriesId: 'ts-123',
        name: 'Test Rule',
        type: 'ANOMALY',
        severity: 'WARNING',
        enabled: true,
        condition: {
          type: 'threshold',
          operator: '>',
          value: 100,
        },
        notificationChannels: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    test('should return false when rule is disabled', async () => {
      baseRule.enabled = false;

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result).toBe(false);
    });

    test('should evaluate threshold condition with > operator', async () => {
      baseRule.condition = {
        type: 'threshold',
        operator: '>',
        value: 100,
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result).toBe(true);
      expect(baseRule.lastTriggeredAt).toBeInstanceOf(Date);
    });

    test('should evaluate threshold condition with < operator', async () => {
      baseRule.condition = {
        type: 'threshold',
        operator: '<',
        value: 100,
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 50,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result).toBe(true);
    });

    test('should evaluate threshold condition with = operator', async () => {
      baseRule.condition = {
        type: 'threshold',
        operator: '=',
        value: 100,
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 100,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result).toBe(true);
    });

    test('should evaluate threshold condition with != operator', async () => {
      baseRule.condition = {
        type: 'threshold',
        operator: '!=',
        value: 100,
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result).toBe(true);
    });

    test('should evaluate threshold condition with >= operator', async () => {
      baseRule.condition = {
        type: 'threshold',
        operator: '>=',
        value: 100,
      };

      const result1 = await alertRules.evaluateAlertRule(baseRule, {
        value: 100,
        timestamp: Date.now(),
        metadata: {},
      });

      const result2 = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    test('should evaluate threshold condition with <= operator', async () => {
      baseRule.condition = {
        type: 'threshold',
        operator: '<=',
        value: 100,
      };

      const result1 = await alertRules.evaluateAlertRule(baseRule, {
        value: 100,
        timestamp: Date.now(),
        metadata: {},
      });

      const result2 = await alertRules.evaluateAlertRule(baseRule, {
        value: 50,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    test('should return false for threshold condition when not met', async () => {
      baseRule.condition = {
        type: 'threshold',
        operator: '>',
        value: 100,
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 50,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result).toBe(false);
    });

    test('should return false for invalid threshold operator', async () => {
      baseRule.condition = {
        type: 'threshold',
        operator: 'INVALID' as any, // Invalid operator
        value: 100,
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result).toBe(false);
    });

    test('should evaluate anomaly condition with severity filter', async () => {
      baseRule.condition = {
        type: 'anomaly',
        anomalySeverity: ['HIGH', 'CRITICAL'],
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {
          hasAnomaly: true,
          severity: 'HIGH',
        },
      });

      expect(result).toBe(true);
    });

    test('should trigger anomaly when no severity filter', async () => {
      baseRule.condition = {
        type: 'anomaly',
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {
          hasAnomaly: true,
          severity: 'LOW',
        },
      });

      expect(result).toBe(true);
    });

    test('should not trigger anomaly when severity not in filter', async () => {
      baseRule.condition = {
        type: 'anomaly',
        anomalySeverity: ['HIGH', 'CRITICAL'],
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {
          hasAnomaly: true,
          severity: 'LOW',
        },
      });

      expect(result).toBe(false);
    });

    test('should not trigger anomaly when no anomaly in metadata', async () => {
      baseRule.condition = {
        type: 'anomaly',
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result).toBe(false);
    });

    test('should evaluate pattern condition (placeholder)', async () => {
      baseRule.condition = {
        type: 'pattern',
        pattern: 'test',
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result).toBe(false);
    });

    test('should evaluate forecast condition when ready', async () => {
      baseRule.condition = {
        type: 'forecast',
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {
          forecastReady: true,
        },
      });

      expect(result).toBe(true);
    });

    test('should not evaluate forecast condition when not ready', async () => {
      baseRule.condition = {
        type: 'forecast',
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result).toBe(false);
    });

    test('should respect cooldown period', async () => {
      baseRule.condition = {
        type: 'threshold',
        operator: '>',
        value: 100,
      };
      baseRule.cooldownMinutes = 15;
      baseRule.lastTriggeredAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result).toBe(false);
    });

    test('should allow trigger after cooldown expires', async () => {
      baseRule.condition = {
        type: 'threshold',
        operator: '>',
        value: 100,
      };
      baseRule.cooldownMinutes = 15;
      baseRule.lastTriggeredAt = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        metadata: {},
      });

      expect(result).toBe(true);
    });
  });

  describe('triggerAlert', () => {
    test('should create alert and send notifications', async () => {
      const mockAlert = {
        id: 'alert-123',
        userId: 'user-123',
        timeseriesId: 'ts-123',
        type: 'ANOMALY',
        severity: 'WARNING',
        message: 'Test alert',
        isRead: false,
        createdAt: new Date(),
        timeseries: {
          id: 'ts-123',
          name: 'Temperature',
          dataType: 'DOUBLE',
          datasetId: 'dataset-123',
        },
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      (prisma.alert.create as jest.Mock).mockResolvedValue(mockAlert);

      const params = {
        userId: 'user-123',
        timeseriesId: 'ts-123',
        type: 'ANOMALY' as const,
        severity: 'WARNING' as const,
        message: 'Test alert',
        metadata: { test: 'data' },
        notificationChannels: [
          {
            type: 'email' as const,
            config: { email: 'test@example.com' },
          },
        ],
      };

      await alertRules.triggerAlert(params);

      expect(prisma.alert.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          timeseriesId: 'ts-123',
          type: 'ANOMALY',
          severity: 'WARNING',
          message: 'Test alert',
          metadata: { test: 'data' },
        },
        include: {
          timeseries: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });
    });

    test('should handle empty notification channels', async () => {
      const mockAlert = {
        id: 'alert-123',
        userId: 'user-123',
        timeseriesId: 'ts-123',
        type: 'ANOMALY',
        severity: 'WARNING',
        message: 'Test alert',
        isRead: false,
        createdAt: new Date(),
        timeseries: {
          id: 'ts-123',
          name: 'Temperature',
          dataType: 'DOUBLE',
          datasetId: 'dataset-123',
        },
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      (prisma.alert.create as jest.Mock).mockResolvedValue(mockAlert);

      const params = {
        userId: 'user-123',
        timeseriesId: 'ts-123',
        type: 'ANOMALY' as const,
        severity: 'WARNING' as const,
        message: 'Test alert',
        metadata: {},
      };

      await expect(alertRules.triggerAlert(params)).resolves.not.toThrow();
    });
  });
});
