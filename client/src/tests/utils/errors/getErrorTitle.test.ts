import { describe, it, expect } from 'vitest';
import { getErrorTitle } from '@/utils/errors/getErrorTitle';
import { ErrorCategory } from '@/types/errorTypes';

describe('getErrorTitle', () => {
  it('should return connection error for Network category', () => {
    expect(getErrorTitle(ErrorCategory.Network)).toBe('connection error');
  });

  it('should return server error for GraphQL category', () => {
    expect(getErrorTitle(ErrorCategory.GraphQL)).toBe('server error');
  });

  it('should return validation error for Validation category', () => {
    expect(getErrorTitle(ErrorCategory.Validation)).toBe('validation error');
  });

  it('should return location error for Geolocation category', () => {
    expect(getErrorTitle(ErrorCategory.Geolocation)).toBe('location error');
  });

  it('should return error for unknown category (default case)', () => {
    expect(getErrorTitle('unknown' as ErrorCategory)).toBe('error');
  });
});
