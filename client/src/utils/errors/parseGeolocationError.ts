import { GeolocationErrorLike, ErrorCategory, ErrorSeverity, ParsedError } from '@/types/errorTypes';

/**
 * parses geolocation errors into a standardized format
 */
export function parseGeolocationError(error: GeolocationErrorLike): ParsedError {
  let message: string;

  switch (error.code) {
    case error.PERMISSION_DENIED:
      message = 'location permission denied. please enable location access in your browser.';
      break;
    case error.POSITION_UNAVAILABLE:
      message = 'location information unavailable. please try again.';
      break;
    case error.TIMEOUT:
      message = 'location request timed out. please try again.';
      break;
    default:
      message = 'failed to get location. please try again.';
  }

  return {
    message,
    category: ErrorCategory.Geolocation,
    severity: ErrorSeverity.Warning,
    originalError: error,
  };
}
