import { DAYS_IN_MONTH } from '@/const';

/**
 * Get the middle day of year for a given month (1-12)
 */
export function getMiddleDayOfMonth(month: number): number {
  let dayOfYear = 0;
  for (let i = 0; i < month - 1; i++) {
    dayOfYear += Math.floor(DAYS_IN_MONTH[i]);
  }
  dayOfYear += Math.floor(DAYS_IN_MONTH[month - 1] / 2);
  return dayOfYear;
}
