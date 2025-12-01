import { TemperatureUnit } from '@/types/mapTypes';
import {
  convertTemperature,
  getTemperatureUnitSymbol,
} from './convertTemperature';

export function formatTemperature(
  temp: number | null,
  unit: TemperatureUnit = TemperatureUnit.Celsius
): string | null {
  if (temp === null) return null;
  const convertedTemp = convertTemperature(temp, unit);
  const symbol = getTemperatureUnitSymbol(unit);
  return `${convertedTemp.toFixed(1)}${symbol}`;
}
