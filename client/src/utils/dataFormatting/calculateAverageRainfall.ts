import type { WeekDataPoint } from '@/types/weeklyWeatherDataType';

/**
 * Calculates the average annual rainfall from weekly weather data
 * by summing up the average weekly precipitation for all 52 weeks
 */
export function calculateAverageRainfall(weeklyData: WeekDataPoint[]): number | null {
  const availableValues = weeklyData
    .map((point) => point.avgPrecip)
    .filter((value): value is number => value !== null);

  if (availableValues.length === 0) return null;

  // Sum all weekly average precipitation values to get annual total
  const annualTotal = availableValues.reduce((acc, val) => acc + val, 0);
  
  return annualTotal;
}
