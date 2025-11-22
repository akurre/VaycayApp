import type { SunshineData } from '@/types/sunshineDataType';
import { MONTH_FIELDS, MONTH_NAMES } from '@/const';

export interface SunshineChartDataPoint {
  month: string;
  monthIndex: number; // 1-12 for identifying selected month
  hours: number | null;
}

/**
 * Transforms SunshineData object into an array suitable for charting
 * Converts {jan: 245, feb: 220, ...} to [{month: 'Jan', monthIndex: 1, hours: 245}, ...]
 */
export function transformSunshineDataForChart(
  sunshineData: SunshineData
): SunshineChartDataPoint[] {
  return Object.entries(MONTH_FIELDS).map(([monthIndexStr, field]) => {
    const monthIndex = parseInt(monthIndexStr, 10);
    return {
      month: MONTH_NAMES[monthIndex - 1],
      monthIndex,
      hours: sunshineData[field] as number | null,
    };
  });
}
