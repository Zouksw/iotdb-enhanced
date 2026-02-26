/**
 * Alert Service
 * Handles alert rules, evaluation, and notifications
 */

import { prisma, config } from '../lib';
import nodemailer from 'nodemailer';
import { z } from 'zod';

// Alert types and severity from schema
type AlertType = 'ANOMALY' | 'FORECAST_READY' | 'SYSTEM';
type AlertSeverity = 'INFO' | 'WARNING' | 'ERROR';
type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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
 * Create a new alert rule
 */
export async function createAlertRule(params: {
  userId: string;
  timeseriesId: string;
  name: string;
  type: AlertType;
  condition: AlertCondition;
  severity: AlertSeverity;
  notificationChannels: NotificationChannel[];
  cooldownMinutes?: number;
}) {
  const { userId, timeseriesId, name, type, condition, severity, notificationChannels, cooldownMinutes } = params;

  // Verify user owns the timeseries
  const timeseries = await prisma.timeseries.findFirst({
    where: {
      id: timeseriesId,
      dataset: {
        ownerId: userId,
      },
    },
  });

  if (!timeseries) {
    throw new Error('Timeseries not found or access denied');
  }

  // Create alert rule (stored as metadata in a separate model or in user preferences)
  // For now, we'll store alert rules in the user's preferences as a simple implementation
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const preferences = (user?.preferences as any) || {};
  const alertRules = preferences.alertRules || [];

  const newRule: AlertRule = {
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

  alertRules.push(newRule);

  await prisma.user.update({
    where: { id: userId },
    data: {
      preferences: {
        ...preferences,
        alertRules,
      },
    },
  });

  return newRule;
}

/**
 * Evaluate an alert rule
 */
export async function evaluateAlertRule(rule: AlertRule, data: {
  value?: number;
  anomaly?: {
    severity: AnomalySeverity;
    score?: number;
  };
}): Promise<{ shouldAlert: boolean; reason?: string }> {
  // Check cooldown
  if (rule.lastTriggeredAt && rule.cooldownMinutes) {
    const cooldownEnd = new Date(rule.lastTriggeredAt.getTime() + rule.cooldownMinutes * 60 * 1000);
    if (new Date() < cooldownEnd) {
      return { shouldAlert: false };
    }
  }

  const { condition } = rule;

  switch (condition.type) {
    case 'threshold':
      if (data.value === undefined) {
        return { shouldAlert: false };
      }

      if (!condition.operator || condition.value === undefined) {
        return { shouldAlert: false, reason: 'Invalid threshold condition' };
      }

      const shouldAlert = evaluateThreshold(data.value, condition.operator, condition.value);
      return {
        shouldAlert,
        reason: shouldAlert ? `Value ${data.value} ${condition.operator} ${condition.value}` : undefined,
      };

    case 'anomaly':
      if (!data.anomaly) {
        return { shouldAlert: false };
      }

      if (!condition.anomalySeverity || condition.anomalySeverity.length === 0) {
        return { shouldAlert: true, reason: 'Anomaly detected' };
      }

      const severityMatch = condition.anomalySeverity.includes(data.anomaly.severity);
      return {
        shouldAlert: severityMatch,
        reason: severityMatch ? `Anomaly severity: ${data.anomaly.severity}` : undefined,
      };

    case 'forecast':
      // Forecast alerts are triggered when a forecast is ready
      return {
        shouldAlert: true,
        reason: 'Forecast ready',
      };

    default:
      return { shouldAlert: false };
  }
}

/**
 * Evaluate threshold condition
 */
function evaluateThreshold(value: number, operator: string, threshold: number): boolean {
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
export async function triggerAlert(params: {
  userId: string;
  timeseriesId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  metadata?: any;
  notificationChannels?: NotificationChannel[];
}) {
  const { userId, timeseriesId, type, severity, message, metadata, notificationChannels = [] } = params;

  // Create alert in database
  const alert = await prisma.alert.create({
    data: {
      userId,
      timeseriesId,
      type,
      severity,
      message,
      metadata,
    },
  });

  // Send notifications
  const notificationPromises = notificationChannels.map(channel => sendNotification(channel, alert));
  await Promise.allSettled(notificationPromises);

  return alert;
}

/**
 * Send notification through specified channel
 */
async function sendNotification(channel: NotificationChannel, alert: any) {
  try {
    switch (channel.type) {
      case 'email':
        await sendEmailNotification(channel.config.email!, alert);
        break;
      case 'webhook':
        await sendWebhookNotification(channel.config.webhookUrl!, alert);
        break;
      case 'slack':
        await sendSlackNotification(channel.config.slackWebhookUrl!, alert);
        break;
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(email: string, alert: any) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });

  const severityColors = {
    INFO: '#2196F3',
    WARNING: '#FF9800',
    ERROR: '#F44336',
  };

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@iotdb-enhanced.com',
    to: email,
    subject: `[${alert.severity}] ${alert.type}: ${alert.message}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${severityColors[alert.severity as keyof typeof severityColors] || '#666'}">Alert: ${alert.type}</h2>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${new Date(alert.createdAt).toLocaleString()}</p>
        ${alert.metadata ? `<pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${JSON.stringify(alert.metadata, null, 2)}</pre>` : ''}
        <p style="color: #666; font-size: 12px;">This is an automated alert from IoTDB Enhanced Platform.</p>
      </div>
    `,
  });
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(webhookUrl: string, alert: any) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      alert,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}`);
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(webhookUrl: string, alert: any) {
  const severityColors = {
    INFO: '#2196F3',
    WARNING: '#FF9800',
    ERROR: '#F44336',
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      attachments: [
        {
          color: severityColors[alert.severity as keyof typeof severityColors] || '#666',
          title: `Alert: ${alert.type}`,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity,
              short: true,
            },
            {
              title: 'Time',
              value: new Date(alert.createdAt).toLocaleString(),
              short: true,
            },
          ],
          footer: 'IoTDB Enhanced Platform',
        },
      ],
    }),
  });
}

/**
 * List alerts for a user
 */
export async function listAlerts(userId: string, filters: {
  unreadOnly?: boolean;
  type?: AlertType;
  severity?: AlertSeverity;
  limit?: number;
  offset?: number;
} = {}) {
  const { unreadOnly, type, severity, limit = 50, offset = 0 } = filters;

  const where: any = { userId };

  if (unreadOnly) {
    where.isRead = false;
  }

  if (type) {
    where.type = type;
  }

  if (severity) {
    where.severity = severity;
  }

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        timeseries: {
          select: {
            id: true,
            name: true,
            dataset: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.alert.count({ where }),
  ]);

  return { alerts, total };
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(userId: string, alertId: string) {
  const alert = await prisma.alert.findFirst({
    where: {
      id: alertId,
      userId,
    },
  });

  if (!alert) {
    throw new Error('Alert not found');
  }

  await prisma.alert.update({
    where: { id: alertId },
    data: { isRead: true },
  });

  return { success: true };
}

/**
 * Mark all alerts as read
 */
export async function markAllAlertsAsRead(userId: string) {
  await prisma.alert.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  });

  return { success: true };
}

/**
 * Delete an alert
 */
export async function deleteAlert(userId: string, alertId: string) {
  const alert = await prisma.alert.findFirst({
    where: {
      id: alertId,
      userId,
    },
  });

  if (!alert) {
    throw new Error('Alert not found');
  }

  await prisma.alert.delete({
    where: { id: alertId },
  });

  return { success: true };
}

/**
 * Get alert statistics
 */
export async function getAlertStats(userId: string) {
  const [total, unread, bySeverity, byType] = await Promise.all([
    prisma.alert.count({ where: { userId } }),
    prisma.alert.count({ where: { userId, isRead: false } }),
    prisma.alert.groupBy({
      by: ['severity'],
      where: { userId },
      _count: true,
    }),
    prisma.alert.groupBy({
      by: ['type'],
      where: { userId },
      _count: true,
    }),
  ]);

  return {
    total,
    unread,
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item.severity] = item._count;
      return acc;
    }, {} as Record<string, number>),
    byType: byType.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<string, number>),
  };
}

/**
 * Validation schemas
 */
export const alertSchemas = {
  createRule: z.object({
    timeseriesId: z.string().uuid(),
    name: z.string().min(1).max(255),
    type: z.enum(['ANOMALY', 'FORECAST_READY', 'SYSTEM']),
    condition: z.object({
      type: z.enum(['threshold', 'anomaly', 'pattern', 'forecast']),
      operator: z.enum(['>', '<', '=', '!=', '>=', '<=']).optional(),
      value: z.number().optional(),
      anomalySeverity: z.array(z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])).optional(),
      windowMinutes: z.number().positive().optional(),
    }),
    severity: z.enum(['INFO', 'WARNING', 'ERROR']),
    notificationChannels: z.array(z.object({
      type: z.enum(['email', 'webhook', 'slack']),
      config: z.object({
        email: z.string().email().optional(),
        webhookUrl: z.string().url().optional(),
        slackWebhookUrl: z.string().url().optional(),
      }),
    })),
    cooldownMinutes: z.number().int().min(0).optional(),
  }),
};
