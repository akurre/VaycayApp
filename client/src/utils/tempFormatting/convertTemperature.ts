import { TemperatureUnit } from '@/types/mapTypes';

/**
 * Converts a temperature from Celsius to the specified unit
 * @param celsius - Temperature in Celsius
 * @param unit - Target temperature unit
 * @returns Temperature in the specified unit
 */
export function convertTemperature(
  celsius: number,
  unit: TemperatureUnit
): number {
  if (unit === TemperatureUnit.Fahrenheit) {
    return (celsius * 9) / 5 + 32;
  }
  return celsius;
}

/**
 * Gets the symbol for the temperature unit
 * @param unit - Temperature unit
 * @returns Unit symbol (°C or °F)
 */
export function getTemperatureUnitSymbol(unit: TemperatureUnit): string {
  return unit === TemperatureUnit.Celsius ? '°C' : '°F';
}
