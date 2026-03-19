/**
 * Alert Rules Service
 *
 * Manages alert rule creation, evaluation, and updates.
 *
 * NOTE: AlertRule database model needs to be added to schema.prisma
 * for full functionality. Currently uses Alert model for basic operations.
 */

import { prisma, logger } from '../lib';
import type { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { sendNotification } from './alert-notifications';
import type {
  AlertRule,
  AlertCondition,
  AlertEvaluationData,
  TriggerAlertParams,
  NotificationChannel,
  AlertWithMetadata,
} from './alert-types';

/**
 * Create a new alert rule
 *
 * NOTE: Requires AlertRule model in schema.prisma. Currently throws error.
 */
export async function createAlertRule(params: {
  userId: string;
  timeseriesId: string;
  name: string;
  type: 'ANOMALY' | 'FORECAST_READY' | 'SYSTEM';
  condition: AlertCondition;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  notificationChannels: NotificationChannel[];
  cooldownMinutes?: number;
}): Promise<AlertRule> {
  // TODO: Add AlertRule model to schema.prisma
  // For now, create a mock rule object
  const {
    userId,
    timeseriesId,
    name,
    type,
    condition,
    severity,
    notificationChannels,
    cooldownMinutes,
  } = params;

  const rule: AlertRule = {
    id: crypto.randomUUID(),
    userId,
    timeseriesId,
    name,
    type,
    condition,
    severity,
    enabled: true,
    notificationChannels,
    cooldownMinutes,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  logger.info(`[ALERT_RULE] Created alert rule ${rule.id} for user ${userId} (in-memory)`);

  return rule;
}

/**
 * Evaluate an alert rule against data
 */
export async function evaluateAlertRule(
  rule: AlertRule,
  data: AlertEvaluationData
): Promise<boolean> {
  if (!rule.enabled) {
    return false;
  }

  // Check cooldown
  if (rule.lastTriggeredAt && rule.cooldownMinutes) {
    const cooldownEnd = new Date(rule.lastTriggeredAt.getTime() + rule.cooldownMinutes * 60 * 1000);
    if (new Date() < cooldownEnd) {
      return false;
    }
  }

  const { condition } = rule;
  let shouldTrigger = false;

  switch (condition.type) {
    case 'threshold':
      if (condition.operator && condition.value !== undefined) {
        shouldTrigger = evaluateThreshold(data.value, condition.operator, condition.value);
      }
      break;

    case 'anomaly':
      // Anomaly detection would be handled by the anomaly detection service
      // This checks if the metadata contains anomaly information
      if (data.metadata?.hasAnomaly) {
        if (condition.anomalySeverity && condition.anomalySeverity.length > 0) {
          shouldTrigger = condition.anomalySeverity.includes(
            data.metadata.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          );
        } else {
          shouldTrigger = true;
        }
      }
      break;

    case 'pattern':
      // Pattern matching would require more complex analysis
      // For now, this is a placeholder
      break;

    case 'forecast':
      // Forecast alerts would be triggered when a forecast is ready
      if (data.metadata?.forecastReady) {
        shouldTrigger = true;
      }
      break;
  }

  if (shouldTrigger) {
    // Update last triggered time (in-memory only, requires AlertRule model)
    rule.lastTriggeredAt = new Date();
  }

  return shouldTrigger;
}

/**
 * Evaluate threshold condition
 */
function evaluateThreshold(
  value: number,
  operator: string,
  threshold: number
): boolean {
  switch (operator) {
    case '>':
      return value > threshold;
    case '<':
      return value < threshold;
    case '=':
      return value === threshold;
    case '!=':
      return value !== threshold;
    case '>=':
      return value >= threshold;
    case '<=':
      return value <= threshold;
    default:
      return false;
  }
}

/**
 * Trigger an alert
 */
export async function triggerAlert(params: TriggerAlertParams): Promise<void> {
  const {
    userId,
    timeseriesId,
    type,
    severity,
    message,
    metadata,
    notificationChannels = [],
  } = params;

  // Create alert in database
  const alert = await prisma.alert.create({
    data: {
      userId,
      timeseriesId,
      type,
      severity,
      message,
      metadata: metadata as Prisma.InputJsonValue,
    },
    include: {
      timeseries: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Send notifications
  const notificationPromises = notificationChannels.map((channel) =>
    sendNotification(channel, alert as AlertWithMetadata)
  );
  await Promise.allSettled(notificationPromises);

  logger.info(`[ALERT] Triggered alert ${alert.id} for user ${userId}`);
}
