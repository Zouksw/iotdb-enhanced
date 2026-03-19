/**
 * Alert Types & Interfaces
 *
 * Type definitions for alert system.
 */

import type { Prisma } from '@prisma/client';

/**
 * Alert type enumeration
 */
export type AlertType = 'ANOMALY' | 'FORECAST_READY' | 'SYSTEM';

/**
 * Alert severity enumeration
 */
export type AlertSeverity = 'INFO' | 'WARNING' | 'ERROR';

/**
 * Anomaly severity enumeration
 */
export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Alert condition interface
 */
export interface AlertCondition {
  type: 'threshold' | 'anomaly' | 'pattern' | 'forecast';
  operator?: '>' | '<' | '=' | '!=' | '>=' | '<=';
  value?: number;
  anomalySeverity?: AnomalySeverity[];
  windowMinutes?: number;
}

/**
 * Notification channel interface
 */
export interface NotificationChannel {
  type: 'email' | 'webhook' | 'slack';
  config: {
    email?: string;
    webhookUrl?: string;
    slackWebhookUrl?: string;
  };
}

/**
 * Alert rule interface
 */
export interface AlertRule {
  id: string;
  userId: string;
  timeseriesId: string;
  name: string;
  type: AlertType;
  condition: AlertCondition;
  severity: AlertSeverity;
  enabled: boolean;
  notificationChannels: NotificationChannel[];
  cooldownMinutes?: number;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Trigger alert parameters
 */
export interface TriggerAlertParams {
  userId: string;
  timeseriesId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  metadata?: Prisma.InputJsonValue;
  notificationChannels?: NotificationChannel[];
}

/**
 * Alert list filter options
 */
export interface AlertListFilters {
  unreadOnly?: boolean;
  type?: AlertType;
  severity?: AlertSeverity;
  limit?: number;
  offset?: number;
}

/**
 * Alert with metadata for notifications
 */
export type AlertWithMetadata = Prisma.AlertGetPayload<{
  include: {
    timeseries: { select: { id: true; name: true } };
    user: { select: { id: true; name: true; email: true } };
  };
}>;

/**
 * Alert evaluation data
 */
export interface AlertEvaluationData {
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
