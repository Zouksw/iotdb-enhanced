/**
 * Alert Rules Complex Integration Tests
 *
 * Tests complex alert rule scenarios including:
 * - Cooldown period edge cases
 * - Multiple condition evaluation
 * - Concurrent alert triggering
 * - Complex threshold scenarios
 * - Anomaly severity filtering
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  createAlertRule,
  evaluateAlertRule,
} from '../../services/alert-rules';

describe('Alert Rules Complex Integration Tests', () => {
  const testUserId = 'test-user-complex';
  const testTimeseriesId = 'test-timeseries-complex';

  // Helper to create evaluation data with timestamp
  const createEvalData = (value: number, metadata: Record<string, unknown> = {}): {
    value: number;
    timestamp: number;
    metadata: Record<string, unknown>;
  } => ({
    value,
    timestamp: Date.now(),
    metadata,
  });

  describe('Threshold Condition Edge Cases', () => {
    test('should handle boundary values for > operator', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Greater than test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      // Test boundary values
      const testData = [
        createEvalData(100.0000001),
        createEvalData(100),
        createEvalData(99.9999999),
        createEvalData(Number.MAX_SAFE_INTEGER),
        createEvalData(Number.MIN_SAFE_INTEGER),
      ];

      const results = await Promise.all(
        testData.map(data => evaluateAlertRule(rule, data))
      );

      expect(results[0]).toBe(true); // Just above should trigger
      expect(results[1]).toBe(false); // Exactly at should NOT trigger
      expect(results[2]).toBe(false); // Just below should NOT trigger
      expect(results[3]).toBe(true); // Max value should trigger
      expect(results[4]).toBe(false); // Min value should NOT trigger
    });

    test('should handle boundary values for < operator', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Less than test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '<',
          value: 0,
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      const testData = [
        createEvalData(-0.0000001),
        createEvalData(0),
        createEvalData(0.0000001),
      ];

      const results = await Promise.all(
        testData.map(data => evaluateAlertRule(rule, data))
      );

      expect(results[0]).toBe(true); // Just below
      expect(results[1]).toBe(false); // Exactly at
      expect(results[2]).toBe(false); // Just above
    });

    test('should handle boundary values for >= operator', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Greater than or equal test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>=',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      const testData = [
        createEvalData(100.0000001),
        createEvalData(100),
        createEvalData(99.9999999),
      ];

      const results = await Promise.all(
        testData.map(data => evaluateAlertRule(rule, data))
      );

      expect(results[0]).toBe(true); // Just above
      expect(results[1]).toBe(true); // Exactly at
      expect(results[2]).toBe(false); // Just below
    });

    test('should handle boundary values for <= operator', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Less than or equal test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '<=',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      const testData = [
        createEvalData(100.0000001),
        createEvalData(100),
        createEvalData(99.9999999),
      ];

      const results = await Promise.all(
        testData.map(data => evaluateAlertRule(rule, data))
      );

      expect(results[0]).toBe(false); // Just above
      expect(results[1]).toBe(true); // Exactly at
      expect(results[2]).toBe(true); // Just below
    });

    test('should handle = operator with precision', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Equals test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '=',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      // Test precision handling
      expect(await evaluateAlertRule(rule, createEvalData(100))).toBe(true);
      expect(await evaluateAlertRule(rule, createEvalData(100.0))).toBe(true);
      expect(await evaluateAlertRule(rule, createEvalData(100.0000001))).toBe(false);
      expect(await evaluateAlertRule(rule, createEvalData(99.9999999))).toBe(false);
    });

    test('should handle != operator', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Not equals test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '!=',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      expect(await evaluateAlertRule(rule, createEvalData(100))).toBe(false);
      expect(await evaluateAlertRule(rule, createEvalData(101))).toBe(true);
      expect(await evaluateAlertRule(rule, createEvalData(99))).toBe(true);
    });

    test('should handle invalid operator gracefully', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Invalid operator test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          // @ts-expect-error - Testing invalid operator
          operator: 'INVALID_OPERATOR',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      // Invalid operator should return false (not trigger)
      expect(await evaluateAlertRule(rule, createEvalData(1000))).toBe(false);
    });

    test('should handle special numeric values', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Special values test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>',
          value: 0,
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      // Test special numeric values
      expect(await evaluateAlertRule(rule, createEvalData(Infinity))).toBe(true);
      expect(await evaluateAlertRule(rule, createEvalData(-Infinity))).toBe(false);
      expect(await evaluateAlertRule(rule, createEvalData(NaN))).toBe(false);
      expect(await evaluateAlertRule(rule, createEvalData(0))).toBe(false);
      expect(await evaluateAlertRule(rule, createEvalData(-0))).toBe(false);
    });

    test('should handle very large and very small numbers', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Extreme values test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>',
          value: 0,
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      // Very small positive number (should trigger)
      expect(await evaluateAlertRule(rule, createEvalData(Number.MIN_VALUE))).toBe(true);

      // Very large negative number (should not trigger)
      expect(await evaluateAlertRule(rule, createEvalData(-Number.MAX_VALUE))).toBe(false);
    });
  });

  describe('Cooldown Period Edge Cases', () => {
    test('should respect cooldown period after triggering', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Cooldown test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
        cooldownMinutes: 5,
      });

      const data = createEvalData(200);

      // First evaluation should trigger
      const firstResult = await evaluateAlertRule(rule, data);
      expect(firstResult).toBe(true);

      // Immediate second evaluation should NOT trigger (cooldown)
      const secondResult = await evaluateAlertRule(rule, data);
      expect(secondResult).toBe(false);

      // Verify lastTriggeredAt was set
      expect(rule.lastTriggeredAt).toBeDefined();
      expect(rule.lastTriggeredAt!.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('should allow triggering after cooldown expires', async () => {
      const cooldownMinutes = 1; // 1 minute cooldown for testing
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Cooldown expiry test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
        cooldownMinutes,
      });

      const data = createEvalData(200);

      // First evaluation
      await evaluateAlertRule(rule, data);
      expect(rule.lastTriggeredAt).toBeDefined();

      // Manually set lastTriggeredAt to past (simulating time passing)
      const pastTime = new Date(Date.now() - (cooldownMinutes + 1) * 60 * 1000);
      rule.lastTriggeredAt = pastTime;

      // Should trigger again after cooldown
      const result = await evaluateAlertRule(rule, data);
      expect(result).toBe(true);
    });

    test('should handle zero cooldown period', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Zero cooldown test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
        cooldownMinutes: 0,
      });

      const data = createEvalData(200);

      // With 0 cooldown, should trigger every time
      expect(await evaluateAlertRule(rule, data)).toBe(true);
      expect(await evaluateAlertRule(rule, data)).toBe(true);
      expect(await evaluateAlertRule(rule, data)).toBe(true);
    });

    test('should handle missing lastTriggeredAt', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Missing lastTriggeredAt test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
        cooldownMinutes: 5,
      });

      // Explicitly set lastTriggeredAt to undefined
      rule.lastTriggeredAt = undefined;

      const data = createEvalData(200);

      // Should trigger (no previous trigger time)
      expect(await evaluateAlertRule(rule, data)).toBe(true);
    });

    test('should handle cooldown at exact boundary', async () => {
      const cooldownMinutes = 5;
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Cooldown boundary test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
        cooldownMinutes,
      });

      const data = createEvalData(200);

      // First evaluation
      await evaluateAlertRule(rule, data);

      // Set lastTriggeredAt to exactly cooldown period ago
      const boundaryTime = new Date(Date.now() - cooldownMinutes * 60 * 1000);
      rule.lastTriggeredAt = boundaryTime;

      // At exact boundary, implementation checks: if (new Date() < cooldownEnd)
      // Since current time equals cooldownEnd, the condition is false
      // This means cooldown has passed and alert SHOULD trigger
      const result = await evaluateAlertRule(rule, data);
      expect(result).toBe(true);

      // 1ms BEFORE boundary (still in cooldown), should NOT trigger
      rule.lastTriggeredAt = new Date(boundaryTime.getTime() + 1);
      const resultBefore = await evaluateAlertRule(rule, data);
      expect(resultBefore).toBe(false);
    });
  });

  describe('Anomaly Condition Edge Cases', () => {
    test('should filter by anomaly severity levels', async () => {
      const severities: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

      for (const severity of severities) {
        const rule = await createAlertRule({
          userId: testUserId,
          timeseriesId: testTimeseriesId,
          name: `Anomaly severity ${severity} test`,
          type: 'ANOMALY',
          condition: {
            type: 'anomaly',
            anomalySeverity: [severity],
          },
          severity: 'WARNING',
          notificationChannels: [],
        });

        // Should trigger only for matching severity
        expect(
          await evaluateAlertRule(rule, createEvalData(100, { hasAnomaly: true, severity: 'LOW' }))
        ).toBe(severity === 'LOW');

        expect(
          await evaluateAlertRule(rule, createEvalData(100, { hasAnomaly: true, severity: 'MEDIUM' }))
        ).toBe(severity === 'MEDIUM');

        expect(
          await evaluateAlertRule(rule, createEvalData(100, { hasAnomaly: true, severity: 'HIGH' }))
        ).toBe(severity === 'HIGH');

        expect(
          await evaluateAlertRule(rule, createEvalData(100, { hasAnomaly: true, severity: 'CRITICAL' }))
        ).toBe(severity === 'CRITICAL');
      }
    });

    test('should trigger for any anomaly when no severity filter', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Any anomaly test',
        type: 'ANOMALY',
        condition: {
          type: 'anomaly',
          // No anomalySeverity specified
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      // Should trigger for all anomaly severities
      expect(
        await evaluateAlertRule(rule, createEvalData(100, { hasAnomaly: true, severity: 'LOW' }))
      ).toBe(true);

      expect(
        await evaluateAlertRule(rule, createEvalData(100, { hasAnomaly: true, severity: 'CRITICAL' }))
      ).toBe(true);

      // Should not trigger when no anomaly
      expect(
        await evaluateAlertRule(rule, createEvalData(100, { hasAnomaly: false }))
      ).toBe(false);

      // Should not trigger when metadata is missing
      expect(
        await evaluateAlertRule(rule, createEvalData(100, {}))
      ).toBe(false);
    });

    test('should handle multiple severity levels', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Multiple severity test',
        type: 'ANOMALY',
        condition: {
          type: 'anomaly',
          anomalySeverity: ['HIGH', 'CRITICAL'],
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      expect(
        await evaluateAlertRule(rule, createEvalData(100, { hasAnomaly: true, severity: 'LOW' }))
      ).toBe(false);

      expect(
        await evaluateAlertRule(rule, createEvalData(100, { hasAnomaly: true, severity: 'MEDIUM' }))
      ).toBe(false);

      expect(
        await evaluateAlertRule(rule, createEvalData(100, { hasAnomaly: true, severity: 'HIGH' }))
      ).toBe(true);

      expect(
        await evaluateAlertRule(rule, createEvalData(100, { hasAnomaly: true, severity: 'CRITICAL' }))
      ).toBe(true);
    });

    test('should handle empty severity array', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Empty severity array test',
        type: 'ANOMALY',
        condition: {
          type: 'anomaly',
          anomalySeverity: [],
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      // Empty array should behave like no filter (trigger for any anomaly)
      expect(
        await evaluateAlertRule(rule, createEvalData(100, { hasAnomaly: true, severity: 'HIGH' }))
      ).toBe(true);
    });
  });

  describe('Forecast Condition', () => {
    test('should trigger when forecast is ready', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Forecast ready test',
        type: 'FORECAST_READY',
        condition: {
          type: 'forecast',
        },
        severity: 'INFO',
        notificationChannels: [],
      });

      expect(
        await evaluateAlertRule(rule, createEvalData(100, { forecastReady: true }))
      ).toBe(true);

      expect(
        await evaluateAlertRule(rule, createEvalData(100, { forecastReady: false }))
      ).toBe(false);

      expect(
        await evaluateAlertRule(rule, createEvalData(100, {}))
      ).toBe(false);
    });
  });

  describe('Pattern Condition (Placeholder)', () => {
    test('should handle pattern condition (placeholder)', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Pattern test',
        type: 'ANOMALY',
        condition: {
          type: 'pattern',
          // @ts-expect-error - Testing pattern type which is a placeholder
          pattern: 'increasing',
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      // Pattern condition is a placeholder, should not trigger
      expect(
        await evaluateAlertRule(rule, createEvalData(100, {}))
      ).toBe(false);
    });
  });

  describe('Disabled Rules', () => {
    test('should not trigger disabled rules', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Disabled rule test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      // Disable the rule
      rule.enabled = false;

      const data = createEvalData(200);

      // Should not trigger even though condition is met
      expect(await evaluateAlertRule(rule, data)).toBe(false);
    });
  });

  describe('Concurrent Evaluations', () => {
    test('should handle concurrent evaluations of same rule', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Concurrent evaluation test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
        cooldownMinutes: 5,
      });

      const data = createEvalData(200);

      // Evaluate the same rule concurrently
      const results = await Promise.all(
        Array.from({ length: 10 }, () => evaluateAlertRule(rule, data))
      );

      // All should complete without error
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(typeof result).toBe('boolean');
      });

      // At least the first one should have triggered
      expect(results.some(r => r === true)).toBe(true);
    });

    test('should handle multiple rules concurrently', async () => {
      const rules = await Promise.all([
        createAlertRule({
          userId: testUserId,
          timeseriesId: testTimeseriesId,
          name: 'Rule 1',
          type: 'ANOMALY',
          condition: { type: 'threshold', operator: '>', value: 100 },
          severity: 'WARNING',
          notificationChannels: [],
        }),
        createAlertRule({
          userId: testUserId,
          timeseriesId: testTimeseriesId,
          name: 'Rule 2',
          type: 'ANOMALY',
          condition: { type: 'threshold', operator: '<', value: 0 },
          severity: 'WARNING',
          notificationChannels: [],
        }),
        createAlertRule({
          userId: testUserId,
          timeseriesId: testTimeseriesId,
          name: 'Rule 3',
          type: 'ANOMALY',
          condition: { type: 'threshold', operator: '=', value: 50 },
          severity: 'WARNING',
          notificationChannels: [],
        }),
      ]);

      const data = createEvalData(150);

      // Evaluate all rules concurrently
      const results = await Promise.all(rules.map(rule => evaluateAlertRule(rule, data)));

      expect(results[0]).toBe(true); // Rule 1: 150 > 100
      expect(results[1]).toBe(false); // Rule 2: 150 is not < 0
      expect(results[2]).toBe(false); // Rule 3: 150 != 50
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing value in evaluation data', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Missing value test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      // @ts-expect-error - Testing missing value
      const result = await evaluateAlertRule(rule, { timestamp: Date.now(), metadata: {} });
      expect(result).toBe(false);
    });

    test('should handle null value', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Null value test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      // @ts-expect-error - Testing null value
      const result = await evaluateAlertRule(rule, { value: null, timestamp: Date.now(), metadata: {} });
      expect(result).toBe(false);
    });

    test('should handle undefined value', async () => {
      const rule = await createAlertRule({
        userId: testUserId,
        timeseriesId: testTimeseriesId,
        name: 'Undefined value test',
        type: 'ANOMALY',
        condition: {
          type: 'threshold',
          operator: '>',
          value: 100,
        },
        severity: 'WARNING',
        notificationChannels: [],
      });

      // @ts-expect-error - Testing undefined value
      const result = await evaluateAlertRule(rule, { value: undefined, timestamp: Date.now(), metadata: {} });
      expect(result).toBe(false);
    });
  });
});
