import { describe, it, expect } from 'vitest';
import { parseApolloError } from '@/utils/errors/parseApolloError';
import { ErrorCategory, ErrorSeverity } from '@/types/errorTypes';

describe('parseApolloError', () => {
  it('should parse network errors', () => {
    const error = {
      message: 'network error',
      networkError: new Error('failed to fetch'),
      graphQLErrors: [],
    };

    const result = parseApolloError(error);

    expect(result.category).toBe(ErrorCategory.Network);
    expect(result.severity).toBe(ErrorSeverity.Error);
    expect(result.message).toContain('unable to connect');
  });

  it('should parse graphQL errors and prefix with context', () => {
    const error = {
      message: 'graphql error',
      graphQLErrors: [{ message: 'invalid query' }],
    };

    const result = parseApolloError(error, 'failed to load cities');

    expect(result.category).toBe(ErrorCategory.GraphQL);
    expect(result.message).toBe('failed to load cities: invalid query');
  });

  it('should parse graphQL errors without context', () => {
    const error = {
      message: 'graphql error',
      graphQLErrors: [{ message: 'unauthorized' }],
    };

    const result = parseApolloError(error);

    expect(result.message).toBe('unauthorized');
  });

  it('should fall back to error.message when no networkError or graphQLErrors', () => {
    const error = {
      message: 'something went wrong',
      graphQLErrors: [],
    };

    const result = parseApolloError(error);

    expect(result.category).toBe(ErrorCategory.GraphQL);
    expect(result.message).toBe('something went wrong');
    expect(result.originalError).toBe(error);
  });

  it('should prefix fallback message with context when provided', () => {
    const error = {
      message: 'something went wrong',
      graphQLErrors: [],
    };

    const result = parseApolloError(error, 'loading weather data failed');

    expect(result.message).toBe(
      'loading weather data failed: something went wrong'
    );
  });

  it('should use fallback message when graphQL error has no message', () => {
    const error = {
      message: 'operation failed',
      graphQLErrors: [{}],
    };

    const result = parseApolloError(error);

    expect(result.message).toBe('a server error occurred');
  });
});
