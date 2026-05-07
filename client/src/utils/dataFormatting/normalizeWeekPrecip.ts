import type { WeekDataPoint } from '@/types/weeklyWeatherDataType';

// Convert a row's totalPrecip into a 7-day equivalent. Some rows aggregate
// fewer than 7 days (gaps, start/end of year); scaling the partial total up
// keeps the chart bars and the hover/today readouts on the same scale.
export function normalizeWeekPrecip(
  week: WeekDataPoint | null | undefined
): number | null {
  if (!week) return null;
  if (week.totalPrecip === null || week.daysWithData <= 0) return null;
  return (week.totalPrecip / week.daysWithData) * 7;
}
