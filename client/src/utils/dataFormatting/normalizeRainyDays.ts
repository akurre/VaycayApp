import type { WeekDataPoint } from '@/types/weeklyWeatherDataType';

// Convert a row's daysWithRain into a 7-day equivalent. Same rationale as
// normalizeWeekPrecip: rows often aggregate across multiple years (or have
// gaps), so the raw daysWithRain count exceeds 7. Scaling by 7/daysWithData
// gives the typical-week count, which is what the readout/hover show.
export function normalizeRainyDays(
  week: WeekDataPoint | null | undefined
): number | null {
  if (!week) return null;
  if (week.daysWithRain === null || week.daysWithData <= 0) return null;
  return (week.daysWithRain / week.daysWithData) * 7;
}
