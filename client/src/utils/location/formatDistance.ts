// Formats a distance in km for display. Unit follows the user's temperature
// preference: Fahrenheit → miles, Celsius → kilometers.

import { KM_TO_MILES } from '@/const';
import { TemperatureUnit } from '@/types/mapTypes';

const DECIMAL_THRESHOLD = 10;

export function formatDistance(
  distanceKm: number,
  temperatureUnit: TemperatureUnit
): string {
  const useMiles = temperatureUnit === TemperatureUnit.Fahrenheit;
  const distance = useMiles ? distanceKm * KM_TO_MILES : distanceKm;
  const unit = useMiles ? 'mi' : 'km';

  if (distance < DECIMAL_THRESHOLD) {
    return `${distance.toFixed(1)} ${unit}`;
  }

  return `${Math.round(distance).toLocaleString()} ${unit}`;
}
