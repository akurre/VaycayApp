import { notifications } from '@mantine/notifications';
import { ErrorSeverity, ParsedError } from '@/types/errorTypes';
import { ERROR_NOTIFICATION_DURATION, WARNING_NOTIFICATION_DURATION } from '@/constants';
import { parseError } from './parseError';
import { getErrorTitle } from './getErrorTitle';
import { getSeverityColor } from './getSeverityColor';

/**
 * parses various error types and displays a user-friendly toast notification
 */
export function parseErrorAndNotify(
  error: unknown,
  context?: string,
  severity: ErrorSeverity = ErrorSeverity.Error
): ParsedError {
  const parsed = parseError(error, context);

  // override severity if provided
  const finalSeverity = severity || parsed.severity;

  // show toast notification
  notifications.show({
    title: getErrorTitle(parsed.category),
    message: parsed.message,
    color: getSeverityColor(finalSeverity),
    autoClose:
      finalSeverity === ErrorSeverity.Error
        ? ERROR_NOTIFICATION_DURATION
        : WARNING_NOTIFICATION_DURATION,
  });

  return { ...parsed, severity: finalSeverity };
}
