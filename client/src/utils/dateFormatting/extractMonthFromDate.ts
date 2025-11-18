/**
 * safely extracts the month (1-12) from an iso date string (yyyy-mm-dd)
 * returns null if the date is invalid or the month is out of range
 */
export function extractMonthFromDate(date: string | null | undefined): number | null {
  if (!date || date.length < 7) return null;

  const month = Number.parseInt(date.substring(5, 7), 10);
  return month >= 1 && month <= 12 ? month : null;
}
