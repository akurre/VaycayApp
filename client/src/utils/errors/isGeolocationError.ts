import type { GeolocationErrorLike } from '@/types/errorTypes';

/**
 * type guard for geolocation errors
 */
export function isGeolocationError(
  error: unknown
): error is GeolocationErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'PERMISSION_DENIED' in error &&
    'POSITION_UNAVAILABLE' in error &&
    'TIMEOUT' in error
  );
}
