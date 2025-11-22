import { DAYS_IN_MONTH } from '@/const';
import { calculateDayLength } from './calculateDayLength';
import { getMiddleDayOfMonth } from './getMiddleDayOfMonth';

/**
 * Calculate theoretical maximum sunshine hours for a given latitude and month
 * Based on astronomical day length calculations
 *
 * @param latitude - Latitude in degrees (-90 to 90)
 * @param month - Month number (1-12)
 * @returns Theoretical maximum sunshine hours for that month
 */
export function calculateTheoreticalMaxSunshine(latitude: number, month: number): number {
  const middleDayOfYear = getMiddleDayOfMonth(month);
  const dayLength = calculateDayLength(latitude, middleDayOfYear);
  const daysInMonth = DAYS_IN_MONTH[month - 1];

  return dayLength * daysInMonth;
}
