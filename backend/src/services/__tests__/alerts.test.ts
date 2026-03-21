/**
 * Tests for Alerts service
 * Tests for CRUD operations (list, mark read, delete, stats)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma
jest.mock('../../lib', () => ({
  prisma: {
    alert: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-123'),
}));

import {
  listAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
  getAlertStats,
} from '@/services/alerts';
import { prisma } from '@/lib';

// Mock crypto
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-123'),
}));

const mockPrisma = prisma as any;

describe('Alerts Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listAlerts', () => {
    it('should list all alerts for a user', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          userId: 'user-1',
          type: 'ANOMALY',
          severity: 'WARNING',
          message: 'Test alert',
          isRead: false,
          createdAt: new Date(),
          timeseries: {
            id: 'ts-1',
            name: 'Temperature',
            dataset: { name: 'Dataset 1' },
          },
        },
      ];

      mockPrisma.alert.findMany.mockResolvedValue(mockAlerts);
      mockPrisma.alert.count.mockResolvedValue(1);

      const result = await listAlerts('user-1');

      expect(result.alerts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.alert.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
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
      });
    });

    it('should filter unread alerts', async () => {
      mockPrisma.alert.findMany.mockResolvedValue([]);
      mockPrisma.alert.count.mockResolvedValue(0);

      await listAlerts('user-1', { unreadOnly: true });

      expect(mockPrisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', isRead: false },
        })
      );
    });

    it('should filter by type', async () => {
      mockPrisma.alert.findMany.mockResolvedValue([]);
      mockPrisma.alert.count.mockResolvedValue(0);

      await listAlerts('user-1', { type: 'ANOMALY' });

      expect(mockPrisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', type: 'ANOMALY' },
        })
      );
    });

    it('should filter by severity', async () => {
      mockPrisma.alert.findMany.mockResolvedValue([]);
      mockPrisma.alert.count.mockResolvedValue(0);

      await listAlerts('user-1', { severity: 'WARNING' });

      expect(mockPrisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', severity: 'WARNING' },
        })
      );
    });

    it('should support pagination', async () => {
      mockPrisma.alert.findMany.mockResolvedValue([]);
      mockPrisma.alert.count.mockResolvedValue(0);

      await listAlerts('user-1', { limit: 10, offset: 20 });

      expect(mockPrisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe('markAlertAsRead', () => {
    it('should mark an alert as read', async () => {
      const mockAlert = {
        id: 'alert-1',
        userId: 'user-1',
        isRead: false,
      };

      mockPrisma.alert.findFirst.mockResolvedValue(mockAlert);
      mockPrisma.alert.update.mockResolvedValue({ ...mockAlert, isRead: true });

      const result = await markAlertAsRead('user-1', 'alert-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.alert.update).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
        data: { isRead: true },
      });
    });

    it('should throw error if alert not found', async () => {
      mockPrisma.alert.findFirst.mockResolvedValue(null);

      await expect(markAlertAsRead('user-1', 'nonexistent')).rejects.toThrow('Alert not found');
    });

    it('should not allow marking alerts belonging to other users', async () => {
      mockPrisma.alert.findFirst.mockResolvedValue(null);

      await expect(markAlertAsRead('user-1', 'alert-2')).rejects.toThrow('Alert not found');
    });
  });

  describe('markAllAlertsAsRead', () => {
    it('should mark all alerts as read for a user', async () => {
      mockPrisma.alert.updateMany.mockResolvedValue({ count: 5 });

      const result = await markAllAlertsAsRead('user-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.alert.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRead: false,
        },
        data: { isRead: true },
      });
    });
  });

  describe('deleteAlert', () => {
    it('should delete an alert', async () => {
      const mockAlert = {
        id: 'alert-1',
        userId: 'user-1',
      };

      mockPrisma.alert.findFirst.mockResolvedValue(mockAlert);
      mockPrisma.alert.delete.mockResolvedValue(mockAlert);

      const result = await deleteAlert('user-1', 'alert-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.alert.delete).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
      });
    });

    it('should throw error if alert not found', async () => {
      mockPrisma.alert.findFirst.mockResolvedValue(null);

      await expect(deleteAlert('user-1', 'nonexistent')).rejects.toThrow('Alert not found');
    });

    it('should not allow deleting alerts belonging to other users', async () => {
      mockPrisma.alert.findFirst.mockResolvedValue(null);

      await expect(deleteAlert('user-1', 'alert-2')).rejects.toThrow('Alert not found');
    });
  });

  describe('getAlertStats', () => {
    it('should return alert statistics', async () => {
      mockPrisma.alert.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3); // unread

      mockPrisma.alert.groupBy
        .mockResolvedValueOnce([
          { severity: 'WARNING', _count: 5 },
          { severity: 'ERROR', _count: 2 },
        ])
        .mockResolvedValueOnce([
          { type: 'ANOMALY', _count: 7 },
          { type: 'SYSTEM', _count: 3 },
        ]);

      const result = await getAlertStats('user-1');

      expect(result).toEqual({
        total: 10,
        unread: 3,
        bySeverity: {
          WARNING: 5,
          ERROR: 2,
        },
        byType: {
          ANOMALY: 7,
          SYSTEM: 3,
        },
      });
    });

    it('should handle empty stats', async () => {
      mockPrisma.alert.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      mockPrisma.alert.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await getAlertStats('user-1');

      expect(result).toEqual({
        total: 0,
        unread: 0,
        bySeverity: {},
        byType: {},
      });
    });
  });
});
