import { ErrorCategory } from '@/types/errorTypes';

/**
 * maps error category to user-friendly title for notifications
 */
export function getErrorTitle(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.Network:
      return 'connection error';
    case ErrorCategory.GraphQL:
      return 'server error';
    case ErrorCategory.Validation:
      return 'validation error';
    case ErrorCategory.Geolocation:
      return 'location error';
    default:
      return 'error';
  }
}
