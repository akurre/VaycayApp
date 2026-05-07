import { TemperatureUnit } from '@/types/mapTypes';
import { EM_DASH_PLACEHOLDER } from '@/const';

export function formatPrecipitation(
  n: number | null | undefined,
  unit: TemperatureUnit
): string {
  if (n === null || n === undefined) return EM_DASH_PLACEHOLDER;
  if (unit === TemperatureUnit.Fahrenheit) {
    return `${(n / 25.4).toFixed(1)}in`;
  }
  return `${Math.round(n)}mm`;
}
