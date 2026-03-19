/**
 * Session Monitor Unit Tests
 *
 * Tests for session monitoring and timeout functionality
 */

import { sessionMonitor, useSessionMonitor } from '../sessionMonitor';

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock tokenManager
jest.mock('../tokenManager', () => ({
  tokenManager: {
    removeToken: jest.fn(),
  },
}));

// Mock auditLogger
jest.mock('../auditLogger', () => ({
  auditLogger: {
    log: jest.fn(),
  },
  logAuthEvents: {
    tokenExpired: jest.fn(),
  },
}));

import { tokenManager } from '../tokenManager';
import { auditLogger, logAuthEvents } from '../auditLogger';

describe('sessionMonitor', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    sessionMonitor.reset();
    sessionMonitor.stop();
  });

  afterEach(() => {
    jest.useRealTimers();
    sessionMonitor.stop();
  });

  describe('start', () => {
    it('should start monitoring session', () => {
      sessionMonitor.start();

      const state = sessionMonitor.getState();
      // Verify session is running
      expect(state.lastActivity).toBeGreaterThan(0);
    });

    it('should not start if already running', () => {
      sessionMonitor.start();
      const firstState = sessionMonitor.getState();

      sessionMonitor.start();
      const secondState = sessionMonitor.getState();

      expect(firstState.lastActivity).toBe(secondState.lastActivity);
    });

    it('should log session start', () => {
      sessionMonitor.start();

      expect(auditLogger.log).toHaveBeenCalledWith(
        'LOGIN_SUCCESS',
        expect.objectContaining({
          timeout: expect.any(Number),
        }),
        'low'
      );
    });
  });

  describe('stop', () => {
    it('should stop monitoring session', () => {
      sessionMonitor.start();
      sessionMonitor.stop();

      // Verify no errors thrown
      expect(sessionMonitor.getState()).toBeDefined();
    });
  });

  describe('updateActivity', () => {
    it('should update last activity timestamp', () => {
      sessionMonitor.start();

      const beforeTime = Date.now();
      sessionMonitor.updateActivity();
      const afterTime = Date.now();

      expect(sessionMonitor.getState().lastActivity).toBeGreaterThanOrEqual(beforeTime);
      expect(sessionMonitor.getState().lastActivity).toBeLessThanOrEqual(afterTime);
    });

    it('should reset warning flag', () => {
      sessionMonitor.start();

      // Manually set warning flag
      const state = sessionMonitor.getState() as any;
      state.isWarningShown = true;

      sessionMonitor.updateActivity();

      expect(sessionMonitor.getState().isWarningShown).toBe(false);
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return positive time when session is active', () => {
      sessionMonitor.updateConfig({ inactivityTimeout: 60000 });
      sessionMonitor.start();

      const timeUntil = sessionMonitor.getTimeUntilExpiry();

      expect(timeUntil).toBeGreaterThan(0);
      expect(timeUntil).toBeLessThanOrEqual(60000);
    });

    it('should return 0 when session is expired', () => {
      sessionMonitor.updateConfig({ inactivityTimeout: 1000 });
      sessionMonitor.start();

      // Advance time past timeout
      jest.advanceTimersByTime(2000);

      expect(sessionMonitor.getTimeUntilExpiry()).toBe(0);
    });
  });

  describe('getRemainingMinutes', () => {
    it('should return remaining time in minutes', () => {
      sessionMonitor.updateConfig({ inactivityTimeout: 60000 });
      sessionMonitor.start();

      const minutes = sessionMonitor.getRemainingMinutes();

      expect(minutes).toBeGreaterThan(0);
      expect(minutes).toBeLessThanOrEqual(1);
    });
  });

  describe('isExpired', () => {
    it('should return false for active session', () => {
      sessionMonitor.updateConfig({ inactivityTimeout: 60000 });
      sessionMonitor.start();

      expect(sessionMonitor.isExpired()).toBe(false);
    });

    it('should return true after timeout', () => {
      sessionMonitor.updateConfig({ inactivityTimeout: 1000 });
      sessionMonitor.start();

      jest.advanceTimersByTime(1500);

      expect(sessionMonitor.isExpired()).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      sessionMonitor.updateConfig({
        inactivityTimeout: 120000,
        warningTime: 300000,
      });

      // Just verify no errors thrown
      expect(sessionMonitor.getState()).toBeDefined();
    });

    it('should restart if checkInterval changes', () => {
      sessionMonitor.start();
      sessionMonitor.updateConfig({ checkInterval: 5000 });

      // Verify no errors thrown
      expect(sessionMonitor.getState()).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset session state', () => {
      sessionMonitor.start();

      // Modify state
      sessionMonitor.updateActivity();
      const stateBefore = sessionMonitor.getState();

      // Advance time to ensure different timestamp
      jest.advanceTimersByTime(100);

      sessionMonitor.reset();

      expect(sessionMonitor.getState().lastActivity).toBeGreaterThan(stateBefore.lastActivity);
      expect(sessionMonitor.getState().isExpired).toBe(false);
    });
  });

  describe('session timeout handling', () => {
    it('should trigger timeout after inactivity', () => {
      sessionMonitor.updateConfig({
        inactivityTimeout: 2000,
        checkInterval: 1000,
      });
      sessionMonitor.start();

      // Advance time past timeout
      jest.advanceTimersByTime(3000);

      // Should log security event
      expect(logAuthEvents.tokenExpired).toHaveBeenCalledWith('inactivity_timeout');
    });

    it('should clear token on timeout', () => {
      sessionMonitor.updateConfig({
        inactivityTimeout: 1000,
        checkInterval: 500,
      });
      sessionMonitor.start();

      jest.advanceTimersByTime(2000);

      expect(tokenManager.removeToken).toHaveBeenCalled();
    });

    it('should log security event', () => {
      sessionMonitor.updateConfig({
        inactivityTimeout: 1000,
        checkInterval: 500,
      });
      sessionMonitor.start();

      jest.advanceTimersByTime(2000);

      expect(logAuthEvents.tokenExpired).toHaveBeenCalledWith('inactivity_timeout');
    });

    it('should dispatch session-expired event', () => {
      const eventSpy = jest.fn();
      window.addEventListener('session-expired', eventSpy);

      sessionMonitor.updateConfig({
        inactivityTimeout: 1000,
        checkInterval: 500,
      });
      sessionMonitor.start();

      jest.advanceTimersByTime(2000);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { reason: 'inactivity' },
        })
      );

      window.removeEventListener('session-expired', eventSpy);
    });

    it('should only timeout once', () => {
      sessionMonitor.updateConfig({
        inactivityTimeout: 1000,
        checkInterval: 500,
      });
      sessionMonitor.start();

      jest.advanceTimersByTime(3000);

      expect(tokenManager.removeToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('session warning', () => {
    it('should dispatch session-warning event', () => {
      const eventSpy = jest.fn();
      window.addEventListener('session-warning', eventSpy);

      sessionMonitor.updateConfig({
        inactivityTimeout: 2000,
        warningTime: 1000,
        checkInterval: 500,
      });
      sessionMonitor.start();

      // Advance time to warning threshold
      jest.advanceTimersByTime(1200);

      expect(eventSpy).toHaveBeenCalled();

      window.removeEventListener('session-warning', eventSpy);
    });

    it('should not show warning twice', () => {
      const eventSpy = jest.fn();
      window.addEventListener('session-warning', eventSpy);

      sessionMonitor.updateConfig({
        inactivityTimeout: 3000,
        warningTime: 1000,
        checkInterval: 500,
      });
      sessionMonitor.start();

      // Advance time past warning and trigger multiple checks
      jest.advanceTimersByTime(2500);

      // Should only trigger once
      expect(eventSpy).toHaveBeenCalledTimes(1);

      window.removeEventListener('session-warning', eventSpy);
    });

    it('should reset warning on activity', () => {
      const eventSpy = jest.fn();
      window.addEventListener('session-warning', eventSpy);

      sessionMonitor.updateConfig({
        inactivityTimeout: 10000, // Very long timeout to avoid expiration
        warningTime: 1000,
        checkInterval: 500,
      });
      sessionMonitor.start();

      // Advance to warning threshold (10000 - 1000 = 9000ms)
      jest.advanceTimersByTime(9100);
      expect(eventSpy).toHaveBeenCalledTimes(1);

      // Reset activity - this should allow warning to be shown again later
      sessionMonitor.updateActivity();

      // Advance past the warning threshold again - need to wait for next check interval
      // and then reach (10000 - 1000) = 9000ms again
      jest.advanceTimersByTime(9500); // 9100 + 400ms buffer
      expect(eventSpy).toHaveBeenCalledTimes(2);

      window.removeEventListener('session-warning', eventSpy);
    });
  });
});

describe('useSessionMonitor', () => {
  it('should return session monitor functions', () => {
    const hooks = useSessionMonitor();

    expect(hooks.start).toBeDefined();
    expect(hooks.stop).toBeDefined();
    expect(hooks.reset).toBeDefined();
    expect(hooks.isExpired).toBeDefined();
    expect(hooks.getTimeUntilExpiry).toBeDefined();
    expect(hooks.getRemainingMinutes).toBeDefined();
  });
});
