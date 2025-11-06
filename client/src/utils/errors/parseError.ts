import { ErrorCategory, ErrorSeverity, ParsedError } from '@/types/errorTypes';
import { isApolloError } from './isApolloError';
import { isGeolocationError } from './isGeolocationError';
import { parseApolloError } from './parseApolloError';
import { parseGeolocationError } from './parseGeolocationError';

/**
 * parses error without showing notification (useful for testing or custom handling)
 */
export function parseError(error: unknown, context?: string): ParsedError {
  // apollo graphql errors
  if (isApolloError(error)) {
    return parseApolloError(error, context);
  }

  // geolocation errors
  if (isGeolocationError(error)) {
    return parseGeolocationError(error);
  }

  // standard errors
  if (error instanceof Error) {
    return {
      message: context ? `${context}: ${error.message}` : error.message,
      category: ErrorCategory.Unknown,
      severity: ErrorSeverity.Error,
      originalError: error,
    };
  }

  // unknown error types
  return {
    message: context || 'an unexpected error occurred',
    category: ErrorCategory.Unknown,
    severity: ErrorSeverity.Error,
    originalError: error,
  };
}
