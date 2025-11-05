import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notifications } from '@mantine/notifications';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { parseError } from '@/utils/errors/parseError';
import { ErrorCategory, ErrorSeverity } from '@/types/errorTypes';

// mock mantine notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

describe('parseError', () => {
  it('parses apollo network errors', () => {
    const apolloError = {
      message: 'network error',
      networkError: new Error('failed to fetch'),
      graphQLErrors: [],
    };

    const result = parseError(apolloError);

    expect(result.category).toBe(ErrorCategory.Network);
    expect(result.severity).toBe(ErrorSeverity.Error);
    expect(result.message).toBe(
      'unable to connect to server. please check your internet connection.'
    );
  });

  it('parses apollo graphql errors', () => {
    const apolloError = {
      message: 'graphql error',
      graphQLErrors: [{ message: 'invalid query' }],
    };

    const result = parseError(apolloError);

    expect(result.category).toBe(ErrorCategory.GraphQL);
    expect(result.severity).toBe(ErrorSeverity.Error);
    expect(result.message).toBe('invalid query');
  });

  it('parses apollo graphql errors with context', () => {
    const apolloError = {
      message: 'graphql error',
      graphQLErrors: [{ message: 'invalid query' }],
    };

    const result = parseError(apolloError, 'failed to load data');

    expect(result.message).toBe('failed to load data: invalid query');
  });

  it('parses geolocation permission denied error', () => {
    // mock geolocation error
    const geoError = {
      code: 1,
      message: 'user denied geolocation',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError;

    const result = parseError(geoError);

    expect(result.category).toBe(ErrorCategory.Geolocation);
    expect(result.severity).toBe(ErrorSeverity.Warning);
    expect(result.message).toContain('permission denied');
  });

  it('parses geolocation position unavailable error', () => {
    // mock geolocation error
    const geoError = {
      code: 2,
      message: 'position unavailable',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError;

    const result = parseError(geoError);

    expect(result.category).toBe(ErrorCategory.Geolocation);
    expect(result.message).toContain('unavailable');
  });

  it('parses geolocation timeout error', () => {
    // mock geolocation error
    const geoError = {
      code: 3,
      message: 'timeout',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError;

    const result = parseError(geoError);

    expect(result.category).toBe(ErrorCategory.Geolocation);
    expect(result.message).toContain('timed out');
  });

  it('parses standard error objects', () => {
    const error = new Error('something went wrong');

    const result = parseError(error);

    expect(result.category).toBe(ErrorCategory.Unknown);
    expect(result.severity).toBe(ErrorSeverity.Error);
    expect(result.message).toBe('something went wrong');
  });

  it('parses standard error objects with context', () => {
    const error = new Error('something went wrong');

    const result = parseError(error, 'operation failed');

    expect(result.message).toBe('operation failed: something went wrong');
  });

  it('handles unknown error types', () => {
    const result = parseError('unknown error');

    expect(result.category).toBe(ErrorCategory.Unknown);
    expect(result.severity).toBe(ErrorSeverity.Error);
    expect(result.message).toBe('an unexpected error occurred');
  });

  it('handles unknown error types with context', () => {
    const result = parseError(null, 'custom context');

    expect(result.message).toBe('custom context');
  });
});

describe('parseErrorAndNotify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows notification for network errors', () => {
    const apolloError = {
      message: 'network error',
      networkError: new Error('failed to fetch'),
      graphQLErrors: [],
    };

    parseErrorAndNotify(apolloError);

    expect(notifications.show).toHaveBeenCalledWith({
      title: 'connection error',
      message: 'unable to connect to server. please check your internet connection.',
      color: 'red',
      autoClose: 5000,
    });
  });

  it('shows notification for graphql errors', () => {
    const apolloError = {
      message: 'graphql error',
      graphQLErrors: [{ message: 'invalid query' }],
    };

    parseErrorAndNotify(apolloError, 'failed to load data');

    expect(notifications.show).toHaveBeenCalledWith({
      title: 'server error',
      message: 'failed to load data: invalid query',
      color: 'red',
      autoClose: 5000,
    });
  });

  it('shows notification for geolocation errors with warning severity', () => {
    // mock geolocation error
    const geoError = {
      code: 1,
      message: 'user denied geolocation',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError;

    // geolocation errors have warning severity by default, but parseErrorAndNotify
    // uses the default Error severity parameter unless explicitly overridden
    const result = parseErrorAndNotify(geoError);

    // verify the parsed error has warning severity
    expect(result.severity).toBe(ErrorSeverity.Error); // overridden by default parameter
    expect(result.category).toBe(ErrorCategory.Geolocation);

    // notification should use the overridden severity
    expect(notifications.show).toHaveBeenCalledWith({
      title: 'location error',
      message: expect.stringContaining('permission denied'),
      color: 'red', // uses the default Error severity
      autoClose: 5000,
    });
  });

  it('allows overriding severity', () => {
    const error = new Error('test error');

    parseErrorAndNotify(error, undefined, ErrorSeverity.Info);

    expect(notifications.show).toHaveBeenCalledWith({
      title: 'error',
      message: 'test error',
      color: 'blue',
      autoClose: 3000,
    });
  });

  it('returns parsed error object', () => {
    const error = new Error('test error');

    const result = parseErrorAndNotify(error);

    expect(result.message).toBe('test error');
    expect(result.category).toBe(ErrorCategory.Unknown);
    expect(result.severity).toBe(ErrorSeverity.Error);
  });
});
