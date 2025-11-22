import type { SunshineChartDataPoint } from './transformSunshineDataForChart';

/**
 * Calculates the average sunshine hours from chart data points
 */
export function calculateAverageSunshine(chartData: SunshineChartDataPoint[]): number | null {
  const availableValues = chartData
    .map((point) => point.hours)
    .filter((value): value is number => value !== null);

  if (availableValues.length === 0) return null;

  const sum = availableValues.reduce((acc, val) => acc + val, 0);
  return sum / availableValues.length;
}
