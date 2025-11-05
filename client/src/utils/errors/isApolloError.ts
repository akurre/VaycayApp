import { ApolloErrorLike } from '@/types/errorTypes';

/**
 * type guard for apollo errors
 */
export function isApolloError(error: unknown): error is ApolloErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    ('networkError' in error || 'graphQLErrors' in error)
  );
}
