import { CALENDAR_DAYS, STANDARD_MONTH_LENGTH } from '@/const';
import { calculateDayLength } from './calculateDayLength';

/**
 * Calculate theoretical maximum sunshine hours for a given latitude and month
 * Based on astronomical day length calculations
 *
 * This function calculates what you would get if every single day had 100% sunshine
 * for the given month at the given latitude. The result is normalized to a standard
 * month length (30.4375 days) to create a smooth curve that's unaffected by varying
 * calendar month lengths (28, 30, 31 days).
 *
 * Process:
 * 1. Calculate actual day length for each calendar day in the month
 * 2. Average those day lengths
 * 3. Multiply by standard month length for consistent comparison
 *
 * This ensures locations at the equator show a flat line (constant day length)
 * while higher latitudes show smooth seasonal curves.
 *
 * @param latitude - Latitude in degrees (-90 to 90)
 * @param month - Month number (1-12)
 * @returns Theoretical maximum sunshine hours for a standardized month
 */
export function calculateTheoreticalMaxSunshine(latitude: number, month: number): number {
  // Calculate the starting day of year for this month
  let startDayOfYear = 0;
  for (let i = 0; i < month - 1; i++) {
    startDayOfYear += CALENDAR_DAYS[i];
  }

  const calendarDaysInMonth = CALENDAR_DAYS[month - 1];

  // Sum the day length for each calendar day in the month
  let totalHours = 0;
  for (let day = 1; day <= calendarDaysInMonth; day++) {
    const dayOfYear = startDayOfYear + day;
    totalHours += calculateDayLength(latitude, dayOfYear);
  }

  // Calculate average daily sunshine hours for this month
  const avgDayLength = totalHours / calendarDaysInMonth;

  // Use a standard month length (365.25 / 12 = 30.4375 days) for normalization
  // This creates a smooth curve unaffected by varying month lengths
  const STANDARD_MONTH_LENGTH = 30.4375;

  return avgDayLength * STANDARD_MONTH_LENGTH;
}
