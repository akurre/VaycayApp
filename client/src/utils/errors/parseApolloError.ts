import type { ApolloErrorLike, ParsedError } from '@/types/errorTypes';
import { ErrorCategory, ErrorSeverity } from '@/types/errorTypes';

/**
 * parses apollo graphql errors into a standardized format
 */
export function parseApolloError(
  error: ApolloErrorLike,
  context?: string
): ParsedError {
  // network errors
  if (error.networkError) {
    return {
      message:
        'unable to connect to server. please check your internet connection.',
      category: ErrorCategory.Network,
      severity: ErrorSeverity.Error,
      originalError: error,
    };
  }

  // graphql errors
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    const firstError = error.graphQLErrors[0];
    const message = firstError.message || 'a server error occurred';

    return {
      message: context ? `${context}: ${message}` : message,
      category: ErrorCategory.GraphQL,
      severity: ErrorSeverity.Error,
      originalError: error,
    };
  }

  // fallback for other apollo errors
  return {
    message: context ? `${context}: ${error.message}` : error.message,
    category: ErrorCategory.GraphQL,
    severity: ErrorSeverity.Error,
    originalError: error,
  };
}
