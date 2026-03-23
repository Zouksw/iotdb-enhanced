import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock prisma
const mockPrisma: any = {
  alertRule: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  alert: {
    create: jest.fn(),
  },
};

jest.mock('../../lib', () => ({
  prisma: mockPrisma,
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

import * as alertRules from '@/services/alert-rules';
import type { AlertRule, AlertCondition } from '@/services/alert-types';

describe('Alert Rules Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAlertRule', () => {
    test('should create alert rule with all parameters', async () => {
      const mockDbRule = {
        id: 'test-uuid-123',
        userId: 'user-123',
        timeseriesId: 'ts-123',
        name: 'Test Rule',
        description: null,
        type: 'ANOMALY',
        enabled: true,
        conditions: { type: 'threshold', operator: '>', value: 100 },
        severity: 'WARNING',
        channels: [{ type: 'email', enabled: true, config: { email: 'test@example.com' } }],
        cooldownMinutes: 15,
        lastTriggeredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.alertRule.create.mockResolvedValue(mockDbRule);

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
            enabled: true,
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
      const mockDbRule = {
        id: 'test-uuid-123',
        userId: 'user-123',
        timeseriesId: 'ts-123',
        name: 'Test Rule',
        description: null,
        type: 'SYSTEM',
        enabled: true,
        conditions: { type: 'pattern', pattern: 'test' },
        severity: 'INFO',
        channels: [],
        cooldownMinutes: 5,
        lastTriggeredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.alertRule.create.mockResolvedValue(mockDbRule);

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

      expect(rule.cooldownMinutes).toBe(5); // Default value
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
        cooldownMinutes: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    test('should return false when rule is disabled', async () => {
      baseRule.enabled = false;

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        timeseriesId: 'ts-123',
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
        timeseriesId: 'ts-123',
      });

      expect(result).toBe(true);
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
        timeseriesId: 'ts-123',
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
        timeseriesId: 'ts-123',
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
        timeseriesId: 'ts-123',
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
        timeseriesId: 'ts-123',
      });

      const result2 = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        timeseriesId: 'ts-123',
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
        timeseriesId: 'ts-123',
      });

      const result2 = await alertRules.evaluateAlertRule(baseRule, {
        value: 50,
        timestamp: Date.now(),
        timeseriesId: 'ts-123',
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
        timeseriesId: 'ts-123',
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
        timeseriesId: 'ts-123',
      });

      expect(result).toBe(false);
    });

    test('should evaluate anomaly condition when isAnomaly is true', async () => {
      baseRule.condition = {
        type: 'anomaly',
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        timeseriesId: 'ts-123',
        isAnomaly: true,
      });

      expect(result).toBe(true);
    });

    test('should return false for anomaly when isAnomaly is missing', async () => {
      baseRule.condition = {
        type: 'anomaly',
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        timeseriesId: 'ts-123',
      });

      expect(result).toBe(false);
    });

    test('should not trigger anomaly when isAnomaly is false', async () => {
      baseRule.condition = {
        type: 'anomaly',
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        timeseriesId: 'ts-123',
        isAnomaly: false,
      });

      expect(result).toBe(false);
    });

    test('should evaluate pattern condition for flatline', async () => {
      baseRule.condition = {
        type: 'pattern',
        pattern: 'flatline',
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        timeseriesId: 'ts-123',
        isFlatline: true,
      });

      expect(result).toBe(true);
    });

    test('should not evaluate pattern condition when not matched', async () => {
      baseRule.condition = {
        type: 'pattern',
        pattern: 'flatline',
      };

      const result = await alertRules.evaluateAlertRule(baseRule, {
        value: 150,
        timestamp: Date.now(),
        timeseriesId: 'ts-123',
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
        timeseriesId: 'ts-123',
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
        timeseriesId: 'ts-123',
      });

      expect(result).toBe(true);
    });
  });

  describe('triggerAlert', () => {
    test('should create alert and send notifications', async () => {
      const mockAlertRecord = {
        id: 'alert-123',
        userId: 'user-123',
        timeseriesId: 'ts-123',
        alertRuleId: 'rule-123',
        type: 'ANOMALY',
        severity: 'WARNING',
        message: 'Alert triggered: Test Rule',
        metadata: { test: 'data' },
        isRead: false,
        sentAt: null,
        createdAt: new Date(),
      };

      const mockDbRule = {
        id: 'rule-123',
        userId: 'user-123',
        timeseriesId: 'ts-123',
        name: 'Test Rule',
        description: null,
        type: 'ANOMALY',
        enabled: true,
        conditions: { type: 'threshold' },
        severity: 'WARNING',
        channels: [
          {
            type: 'email',
            enabled: true,
            config: { email: 'test@example.com' },
          },
        ],
        cooldownMinutes: 5,
        lastTriggeredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.alertRule.update.mockResolvedValue({
        ...mockDbRule,
        lastTriggeredAt: new Date(),
      });

      mockPrisma.alertRule.findUnique.mockResolvedValue(mockDbRule);
      mockPrisma.alert.create.mockResolvedValue(mockAlertRecord);

      const params = {
        ruleId: 'rule-123',
        alertData: { test: 'data' },
      };

      await alertRules.triggerAlert(params);

      expect(mockPrisma.alertRule.update).toHaveBeenCalledWith({
        where: { id: 'rule-123' },
        data: { lastTriggeredAt: expect.any(Date) },
      });

      expect(mockPrisma.alert.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          timeseriesId: 'ts-123',
          alertRuleId: 'rule-123',
          type: 'ANOMALY',
          severity: 'WARNING',
          message: 'Alert triggered: Test Rule',
          metadata: { test: 'data' },
        },
      });
    });

    test('should handle empty notification channels', async () => {
      const mockAlertRecord = {
        id: 'alert-123',
        userId: 'user-123',
        timeseriesId: 'ts-123',
        alertRuleId: 'rule-123',
        type: 'ANOMALY',
        severity: 'WARNING',
        message: 'Alert triggered: Test Rule',
        metadata: {},
        isRead: false,
        sentAt: null,
        createdAt: new Date(),
      };

      const mockDbRule = {
        id: 'rule-123',
        userId: 'user-123',
        timeseriesId: 'ts-123',
        name: 'Test Rule',
        description: null,
        type: 'ANOMALY',
        enabled: true,
        conditions: { type: 'threshold' },
        severity: 'WARNING',
        channels: [],
        cooldownMinutes: 5,
        lastTriggeredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.alertRule.update.mockResolvedValue({
        ...mockDbRule,
        lastTriggeredAt: new Date(),
      });

      mockPrisma.alertRule.findUnique.mockResolvedValue(mockDbRule);
      mockPrisma.alert.create.mockResolvedValue(mockAlertRecord);

      const params = {
        ruleId: 'rule-123',
        alertData: {},
      };

      await expect(alertRules.triggerAlert(params)).resolves.not.toThrow();
    });

    test('should handle rule not found', async () => {
      mockPrisma.alertRule.update.mockResolvedValue(null);
      mockPrisma.alertRule.findUnique.mockResolvedValue(null);

      const params = {
        ruleId: 'nonexistent-rule',
        alertData: {},
      };

      await expect(alertRules.triggerAlert(params)).resolves.not.toThrow();
    });
  });

  describe('listAlertRules', () => {
    test('should list alert rules for a user', async () => {
      const mockDbRules = [
        {
          id: 'rule-1',
          userId: 'user-123',
          timeseriesId: 'ts-1',
          name: 'Rule 1',
          description: 'Description 1',
          type: 'ANOMALY',
          enabled: true,
          conditions: { type: 'threshold' },
          severity: 'WARNING',
          channels: [],
          cooldownMinutes: 5,
          lastTriggeredAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'rule-2',
          userId: 'user-123',
          timeseriesId: 'ts-2',
          name: 'Rule 2',
          description: null,
          type: 'FORECAST_READY',
          enabled: false,
          conditions: { type: 'pattern' },
          severity: 'INFO',
          channels: [],
          cooldownMinutes: 10,
          lastTriggeredAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.alertRule.findMany.mockResolvedValue(mockDbRules);

      const rules = await alertRules.listAlertRules('user-123');

      expect(rules).toHaveLength(2);
      expect(rules[0].name).toBe('Rule 1');
      expect(rules[1].name).toBe('Rule 2');
      expect(mockPrisma.alertRule.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      });
    });

    test('should list alert rules with enabled filter', async () => {
      const mockDbRules = [
        {
          id: 'rule-1',
          userId: 'user-123',
          timeseriesId: 'ts-1',
          name: 'Rule 1',
          description: null,
          type: 'ANOMALY',
          enabled: true,
          conditions: { type: 'threshold' },
          severity: 'WARNING',
          channels: [],
          cooldownMinutes: 5,
          lastTriggeredAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.alertRule.findMany.mockResolvedValue(mockDbRules);

      const rules = await alertRules.listAlertRules('user-123', { enabled: true });

      expect(rules).toHaveLength(1);
      expect(mockPrisma.alertRule.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', enabled: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    test('should list alert rules with timeseries filter', async () => {
      const mockDbRules = [
        {
          id: 'rule-1',
          userId: 'user-123',
          timeseriesId: 'ts-1',
          name: 'Rule 1',
          description: null,
          type: 'ANOMALY',
          enabled: true,
          conditions: { type: 'threshold' },
          severity: 'WARNING',
          channels: [],
          cooldownMinutes: 5,
          lastTriggeredAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.alertRule.findMany.mockResolvedValue(mockDbRules);

      const rules = await alertRules.listAlertRules('user-123', { timeseriesId: 'ts-1' });

      expect(rules).toHaveLength(1);
      expect(mockPrisma.alertRule.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', timeseriesId: 'ts-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    test('should return empty array when no rules found', async () => {
      mockPrisma.alertRule.findMany.mockResolvedValue([]);

      const rules = await alertRules.listAlertRules('user-123');

      expect(rules).toEqual([]);
    });
  });

  describe('updateAlertRule', () => {
    test('should update alert rule name', async () => {
      const mockDbRule = {
        id: 'rule-1',
        userId: 'user-123',
        timeseriesId: 'ts-1',
        name: 'Updated Name',
        description: null,
        type: 'ANOMALY',
        enabled: true,
        conditions: { type: 'threshold' },
        severity: 'WARNING',
        channels: [],
        cooldownMinutes: 5,
        lastTriggeredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.alertRule.update.mockResolvedValue(mockDbRule);

      const rule = await alertRules.updateAlertRule('rule-1', { name: 'Updated Name' });

      expect(rule.name).toBe('Updated Name');
      expect(mockPrisma.alertRule.update).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: expect.objectContaining({
          name: 'Updated Name',
          updatedAt: expect.any(Date),
        }),
      });
    });

    test('should update multiple fields', async () => {
      const mockDbRule = {
        id: 'rule-1',
        userId: 'user-123',
        timeseriesId: 'ts-1',
        name: 'Rule 1',
        description: 'New description',
        type: 'FORECAST_READY',
        enabled: false,
        conditions: { type: 'pattern' },
        severity: 'ERROR',
        channels: [],
        cooldownMinutes: 15,
        lastTriggeredAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.alertRule.update.mockResolvedValue(mockDbRule);

      const updates = {
        name: 'Rule 1',
        description: 'New description',
        type: 'FORECAST_READY' as const,
        enabled: false,
        severity: 'ERROR' as const,
        cooldownMinutes: 15,
      };

      const rule = await alertRules.updateAlertRule('rule-1', updates);

      expect(rule.description).toBe('New description');
      expect(rule.enabled).toBe(false);
      expect(rule.severity).toBe('ERROR');
    });

    test('should update condition and notification channels', async () => {
      const mockDbRule = {
        id: 'rule-1',
        userId: 'user-123',
        timeseriesId: 'ts-1',
        name: 'Rule 1',
        description: null,
        type: 'ANOMALY',
        enabled: true,
        conditions: { type: 'threshold', operator: '<', value: 50 },
        severity: 'WARNING',
        channels: [{ type: 'webhook', enabled: true, config: { url: 'http://example.com' } }],
        cooldownMinutes: 5,
        lastTriggeredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.alertRule.update.mockResolvedValue(mockDbRule);

      const condition = {
        type: 'threshold' as const,
        operator: '<' as const,
        value: 50,
      };

      const notificationChannels = [
        {
          type: 'webhook' as const,
          enabled: true,
          config: { url: 'http://example.com' },
        },
      ];

      const rule = await alertRules.updateAlertRule('rule-1', {
        condition,
        notificationChannels,
      });

      expect(rule.condition).toEqual(condition);
      expect(rule.notificationChannels).toEqual(notificationChannels);
    });
  });

  describe('deleteAlertRule', () => {
    test('should delete alert rule', async () => {
      mockPrisma.alertRule.delete.mockResolvedValue({ id: 'rule-1' });

      await expect(alertRules.deleteAlertRule('rule-1')).resolves.not.toThrow();

      expect(mockPrisma.alertRule.delete).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
      });
    });

    test('should log deletion', async () => {
      mockPrisma.alertRule.delete.mockResolvedValue({ id: 'rule-1' });
      const { logger } = require('../../lib');

      await alertRules.deleteAlertRule('rule-1');

      expect(logger.info).toHaveBeenCalledWith(
        '[ALERT_RULE] Deleted alert rule rule-1'
      );
    });
  });
});
