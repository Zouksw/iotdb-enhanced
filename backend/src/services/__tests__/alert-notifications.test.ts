import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  default: {
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-123' }),
    })),
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import nodemailer from 'nodemailer';
import { sendNotification } from '../alert-notifications';
import type { AlertWithMetadata } from '../alert-types';

const createTransportMock = (nodemailer as any).default?.createTransport as jest.Mock || nodemailer.createTransport as jest.Mock;

// Mock fetch globally
global.fetch = jest.fn() as any;

describe('Alert Notifications Service', () => {
  const mockAlert: AlertWithMetadata = {
    id: 'alert-123',
    type: 'ANOMALY',
    severity: 'WARNING',
    message: 'Anomaly detected in temperature',
    timeseriesId: 'ts-123',
    userId: 'user-123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    isResolved: false,
    timeseries: {
      id: 'ts-123',
      name: 'Temperature',
      dataType: 'DOUBLE',
      datasetId: 'dataset-123',
    },
    metadata: {
      threshold: 100,
      actualValue: 105,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_FROM = 'alerts@iotdb-enhanced.com';

    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_FROM;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_SECURE;
  });

  describe('sendNotification', () => {
    describe('email channel', () => {
      test('should send email notification', async () => {
        const channel = {
          type: 'email' as const,
          config: {
            email: 'test@example.com',
          },
        };

        await expect(sendNotification(channel, mockAlert)).resolves.not.toThrow();
      });

      test('should handle email send error gracefully', async () => {
        createTransportMock.mockReturnValue({
          sendMail: jest.fn().mockRejectedValue(new Error('SMTP error')),
        });

        const channel = {
          type: 'email' as const,
          config: {
            email: 'test@example.com',
          },
        };

        await expect(sendNotification(channel, mockAlert)).resolves.not.toThrow();
      });
    });

    describe('webhook channel', () => {
      test('should send webhook notification', async () => {
        const channel = {
          type: 'webhook' as const,
          config: {
            webhookUrl: 'https://example.com/webhook',
          },
        };

        await sendNotification(channel, mockAlert);

        expect(global.fetch).toHaveBeenCalledWith('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"alert":'),
        });
      });

      test('should include timestamp in webhook', async () => {
        const channel = {
          type: 'webhook' as const,
          config: {
            webhookUrl: 'https://example.com/webhook',
          },
        };

        await sendNotification(channel, mockAlert);

        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.timestamp).toBeDefined();
      });

      test('should handle webhook error response gracefully', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 500,
        });

        const channel = {
          type: 'webhook' as const,
          config: {
            webhookUrl: 'https://example.com/webhook',
          },
        };

        await expect(sendNotification(channel, mockAlert)).resolves.not.toThrow();
      });

      test('should handle webhook network error gracefully', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        const channel = {
          type: 'webhook' as const,
          config: {
            webhookUrl: 'https://example.com/webhook',
          },
        };

        await expect(sendNotification(channel, mockAlert)).resolves.not.toThrow();
      });
    });

    describe('slack channel', () => {
      test('should send Slack notification', async () => {
        const channel = {
          type: 'slack' as const,
          config: {
            slackWebhookUrl: 'https://hooks.slack.com/test',
          },
        };

        await sendNotification(channel, mockAlert);

        expect(global.fetch).toHaveBeenCalledWith('https://hooks.slack.com/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"attachments":'),
        });
      });

      test('should include alert details in Slack message', async () => {
        const channel = {
          type: 'slack' as const,
          config: {
            slackWebhookUrl: 'https://hooks.slack.com/test',
          },
        };

        await sendNotification(channel, mockAlert);

        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        const attachment = body.attachments[0];

        expect(attachment.title).toBe('Alert: ANOMALY');
        expect(attachment.text).toBe('Anomaly detected in temperature');
        expect(attachment.fields).toHaveLength(2);
        expect(attachment.fields[0].title).toBe('Severity');
        expect(attachment.fields[0].value).toBe('WARNING');
      });

      test('should use correct color for WARNING severity', async () => {
        const channel = {
          type: 'slack' as const,
          config: {
            slackWebhookUrl: 'https://hooks.slack.com/test',
          },
        };

        await sendNotification(channel, mockAlert);

        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        const attachment = body.attachments[0];

        expect(attachment.color).toBe('#FF9800'); // WARNING color
      });

      test('should use correct color for INFO severity', async () => {
        const infoAlert = { ...mockAlert, severity: 'INFO' as const };
        const channel = {
          type: 'slack' as const,
          config: {
            slackWebhookUrl: 'https://hooks.slack.com/test',
          },
        };

        await sendNotification(channel, infoAlert);

        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        const attachment = body.attachments[0];

        expect(attachment.color).toBe('#2196F3'); // INFO color
      });

      test('should use correct color for ERROR severity', async () => {
        const errorAlert = { ...mockAlert, severity: 'ERROR' as const };
        const channel = {
          type: 'slack' as const,
          config: {
            slackWebhookUrl: 'https://hooks.slack.com/test',
          },
        };

        await sendNotification(channel, errorAlert);

        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        const attachment = body.attachments[0];

        expect(attachment.color).toBe('#F44336'); // ERROR color
      });

      test('should handle Slack webhook error gracefully', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 500,
        });

        const channel = {
          type: 'slack' as const,
          config: {
            slackWebhookUrl: 'https://hooks.slack.com/test',
          },
        };

        await expect(sendNotification(channel, mockAlert)).resolves.not.toThrow();
      });

      test('should handle Slack network error gracefully', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        const channel = {
          type: 'slack' as const,
          config: {
            slackWebhookUrl: 'https://hooks.slack.com/test',
          },
        };

        await expect(sendNotification(channel, mockAlert)).resolves.not.toThrow();
      });
    });
  });
});
