import type { SunshineData } from '@/types/sunshineDataType';
import {
  MONTH_FIELDS,
  MONTH_NAMES,
  CALENDAR_DAYS,
  STANDARD_MONTH_LENGTH,
} from '@/const';

export interface SunshineChartDataPoint {
  month: string;
  monthIndex: number; // 1-12 for identifying selected month
  hours: number | null;
}

/**
 * Transforms SunshineData object into an array suitable for charting
 * Converts {jan: 245, feb: 220, ...} to [{month: 'Jan', monthIndex: 1, hours: 245}, ...]
 *
 * IMPORTANT: Normalizes sunshine hours to a standard month length (30.4375 days)
 * to create smooth curves unaffected by varying calendar month lengths (28, 30, 31 days).
 * This ensures visual consistency with the theoretical maximum line which is also normalized.
 *
 * Normalization: (actual_hours / calendar_days_in_month) * STANDARD_MONTH_LENGTH
 */
export function transformSunshineDataForChart(
  sunshineData: SunshineData
): SunshineChartDataPoint[] {
  return Object.entries(MONTH_FIELDS).map(([monthIndexStr, field]) => {
    const monthIndex = parseInt(monthIndexStr, 10);
    const rawHours = sunshineData[field] as number | null;

    // Normalize hours to standard month length for smooth visualization
    let normalizedHours: number | null = null;
    if (rawHours !== null) {
      const calendarDaysInMonth = CALENDAR_DAYS[monthIndex - 1];
      const avgDailyHours = rawHours / calendarDaysInMonth;
      normalizedHours = avgDailyHours * STANDARD_MONTH_LENGTH;
    }

    return {
      month: MONTH_NAMES[monthIndex - 1],
      monthIndex,
      hours: normalizedHours,
    };
  });
}
