import { renderHook, act } from '@testing-library/react';
import { message, notification } from 'antd';
import { useErrorHandler, isNetworkError, isAuthError, ApiError } from '../useErrorHandler';

// Mock Ant Design message and notification
jest.mock('antd', () => ({
  message: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
  notification: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('parseErrorMessage', () => {
    it('should return string error as is', () => {
      const { result } = renderHook(() => useErrorHandler());

      const message = result.current.parseErrorMessage('String error');

      expect(message).toBe('String error');
    });

    it('should extract error property from object', () => {
      const { result } = renderHook(() => useErrorHandler());

      const error = { error: 'API error occurred' };
      const message = result.current.parseErrorMessage(error);

      expect(message).toBe('API error occurred');
    });

    it('should extract message property from object', () => {
      const { result } = renderHook(() => useErrorHandler());

      const error = { message: 'Message error occurred' };
      const message = result.current.parseErrorMessage(error);

      expect(message).toBe('Message error occurred');
    });

    it('should extract error from response.data', () => {
      const { result } = renderHook(() => useErrorHandler());

      const error = {
        response: {
          data: { error: 'Response error' },
        },
      };
      const message = result.current.parseErrorMessage(error);

      expect(message).toBe('Response error');
    });

    it('should extract message from response.data', () => {
      const { result } = renderHook(() => useErrorHandler());

      const error = {
        response: {
          data: { message: 'Response message' },
        },
      };
      const message = result.current.parseErrorMessage(error);

      expect(message).toBe('Response message');
    });

    it('should extract message from Error object', () => {
      const { result } = renderHook(() => useErrorHandler());

      const error = new Error('Error object message');
      const message = result.current.parseErrorMessage(error);

      expect(message).toBe('Error object message');
    });

    it('should return default message for unknown error', () => {
      const { result } = renderHook(() => useErrorHandler());

      const message = result.current.parseErrorMessage({ unknown: 'value' });

      expect(message).toBe('An unexpected error occurred');
    });

    it('should return default message for null', () => {
      const { result } = renderHook(() => useErrorHandler());

      const message = result.current.parseErrorMessage(null);

      expect(message).toBe('An unexpected error occurred');
    });
  });

  describe('handleError', () => {
    it('should show error message by default', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError('Test error');
      });

      expect(message.error).toHaveBeenCalledWith('Test error', 5);
    });

    it('should show notification when useNotification is true', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError('Test error', { useNotification: true });
      });

      expect(notification.error).toHaveBeenCalledWith({
        message: 'Test error',
        description: undefined,
        duration: 5,
        placement: 'topRight',
      });
      expect(message.error).not.toHaveBeenCalled();
    });

    it('should use custom duration', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError('Test error', { duration: 10 });
      });

      expect(message.error).toHaveBeenCalledWith('Test error', 10);
    });

    it('should include description in notification', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError('Test error', {
          useNotification: true,
          description: 'Detailed description',
        });
      });

      expect(notification.error).toHaveBeenCalledWith({
        message: 'Test error',
        description: 'Detailed description',
        duration: 5,
        placement: 'topRight',
      });
    });

    it('should log error to console by default', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError('Test error');
      });

      expect(console.error).toHaveBeenCalledWith('Error handled:', 'Test error');
    });

    it('should not log error when logError is false', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError('Test error', { logError: false });
      });

      expect(console.error).not.toHaveBeenCalled();
    });

    it('should return parsed error message', () => {
      const { result } = renderHook(() => useErrorHandler());

      let returnedMessage;
      act(() => {
        returnedMessage = result.current.handleError('Test error');
      });

      expect(returnedMessage).toBe('Test error');
    });
  });

  describe('withErrorHandling', () => {
    it('should return operation result on success', async () => {
      const { result } = renderHook(() => useErrorHandler());

      const operation = jest.fn().mockResolvedValue('success');

      const value = await act(async () => {
        return await result.current.withErrorHandling(operation);
      });

      expect(value).toBe('success');
      expect(message.error).not.toHaveBeenCalled();
    });

    it('should handle error and return null on failure', async () => {
      const { result } = renderHook(() => useErrorHandler());

      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      const value = await act(async () => {
        return await result.current.withErrorHandling(operation);
      });

      expect(value).toBeNull();
      expect(message.error).toHaveBeenCalledWith('Operation failed', 5);
    });

    it('should use custom options when handling error', async () => {
      const { result } = renderHook(() => useErrorHandler());

      const operation = jest.fn().mockRejectedValue(new Error('Custom error'));

      await act(async () => {
        return await result.current.withErrorHandling(operation, {
          useNotification: true,
          duration: 10,
        });
      });

      expect(notification.error).toHaveBeenCalledWith({
        message: 'Custom error',
        description: undefined,
        duration: 10,
        placement: 'topRight',
      });
    });
  });

  describe('showSuccess', () => {
    it('should show success message', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showSuccess('Success!');
      });

      expect(message.success).toHaveBeenCalledWith('Success!', 3);
    });

    it('should show notification when useNotification is true', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showSuccess('Success!', { useNotification: true });
      });

      expect(notification.success).toHaveBeenCalledWith({
        message: 'Success!',
        description: undefined,
        duration: 3,
        placement: 'topRight',
      });
    });

    it('should use custom duration', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showSuccess('Success!', { duration: 5 });
      });

      expect(message.success).toHaveBeenCalledWith('Success!', 5);
    });
  });

  describe('showInfo', () => {
    it('should show info message', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showInfo('Info message');
      });

      expect(message.info).toHaveBeenCalledWith('Info message', 3);
    });

    it('should show notification when useNotification is true', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showInfo('Info message', { useNotification: true });
      });

      expect(notification.info).toHaveBeenCalledWith({
        message: 'Info message',
        description: undefined,
        duration: 3,
        placement: 'topRight',
      });
    });
  });

  describe('showWarning', () => {
    it('should show warning message', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showWarning('Warning!');
      });

      expect(message.warning).toHaveBeenCalledWith('Warning!', 4);
    });

    it('should show notification when useNotification is true', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showWarning('Warning!', { useNotification: true });
      });

      expect(notification.warning).toHaveBeenCalledWith({
        message: 'Warning!',
        description: undefined,
        duration: 4,
        placement: 'topRight',
      });
    });

    it('should use custom duration', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showWarning('Warning!', { duration: 8 });
      });

      expect(message.warning).toHaveBeenCalledWith('Warning!', 8);
    });
  });
});

describe('isNetworkError', () => {
  it('should return true for network error message', () => {
    expect(isNetworkError(new Error('Network error'))).toBe(true);
  });

  it('should return true for fetch error message', () => {
    expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
  });

  it('should return true for connection error message', () => {
    expect(isNetworkError(new Error('Connection refused'))).toBe(true);
  });

  it('should return true for timeout error message', () => {
    expect(isNetworkError(new Error('Request timeout'))).toBe(true);
  });

  it('should return false for other errors', () => {
    expect(isNetworkError(new Error('Validation failed'))).toBe(false);
  });

  it('should return false for non-object errors', () => {
    expect(isNetworkError('string error')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isNetworkError(null)).toBe(false);
  });
});

describe('isAuthError', () => {
  it('should return true for 401 status code', () => {
    expect(isAuthError({ statusCode: 401 })).toBe(true);
  });

  it('should return true for 403 status code', () => {
    expect(isAuthError({ statusCode: 403 })).toBe(true);
  });

  it('should return false for other status codes', () => {
    expect(isAuthError({ statusCode: 404 })).toBe(false);
  });

  it('should return true for response with 401 status', () => {
    expect(isAuthError({ response: { status: 401 } })).toBe(true);
  });

  it('should return true for response with 403 status', () => {
    expect(isAuthError({ response: { status: 403 } })).toBe(true);
  });

  it('should return false for response with other status', () => {
    expect(isAuthError({ response: { status: 500 } })).toBe(false);
  });

  it('should return false for non-object errors', () => {
    expect(isAuthError('string error')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isAuthError(null)).toBe(false);
  });
});
