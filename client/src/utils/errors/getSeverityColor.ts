import { ErrorSeverity } from '@/types/errorTypes';

/**
 * maps error severity to notification color
 */
export function getSeverityColor(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.Error:
      return 'red';
    case ErrorSeverity.Warning:
      return 'yellow';
    case ErrorSeverity.Info:
      return 'blue';
    default:
      return 'red';
  }
}
