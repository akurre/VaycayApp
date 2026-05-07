import { EM_DASH_PLACEHOLDER } from '@/const';
import type { TemperatureUnit } from '@/types/mapTypes';
import { calculateDistance } from './calculateDistance';
import { formatDistance } from './formatDistance';

// Compose great-circle distance + unit-aware formatter so callers don't need
// to handle the four-coord null check at every site. Returns the em-dash
// placeholder if either the home or destination coordinate pair is missing.
export function formatDistanceFromHome(
  homeLat: number | null,
  homeLong: number | null,
  cityLat: number | null,
  cityLong: number | null,
  temperatureUnit: TemperatureUnit
): string {
  if (
    homeLat === null ||
    homeLong === null ||
    cityLat === null ||
    cityLong === null
  ) {
    return EM_DASH_PLACEHOLDER;
  }
  return formatDistance(
    calculateDistance(homeLat, homeLong, cityLat, cityLong),
    temperatureUnit
  );
}
