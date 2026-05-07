import { extractMonthDay } from './extractMonthDay';
import { dateToDayOfYear } from './dateToDayOfYear';

// Inverse of weekStartLabel — given a date string (YYYY-MM-DD or MM-DD),
// return the 1-based week-of-year used by the weekly weather chart x-axis.
// Weeks are non-ISO: week N spans days (N-1)*7 + 1 .. N*7.
export function dateToWeekOfYear(
  dateString: string | null | undefined
): number | null {
  if (!dateString) return null;
  const monthDay = extractMonthDay(dateString);
  if (!monthDay) return null;

  const compact = monthDay.replace('-', '');
  if (compact.length !== 4) return null;

  const dayOfYear = dateToDayOfYear(compact);
  if (dayOfYear < 1) return null;

  return Math.min(52, Math.max(1, Math.ceil(dayOfYear / 7)));
}
