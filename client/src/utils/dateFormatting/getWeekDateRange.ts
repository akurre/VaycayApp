/**
 * Converts an ISO week number to a locale-specific date range string.
 * For example: "July 1-7" or "July 29 - August 4" depending on locale.
 *
 * @param weekNumber - ISO week number (1-52/53)
 * @param locale - Optional locale string (defaults to user's locale)
 * @returns Formatted date range string without year
 */
export function getWeekDateRange(weekNumber: number, locale?: string): string {
  // Calculate the date of the first day of the week
  // ISO week 1 is the week containing the first Thursday of the year
  const year = new Date().getFullYear(); // Using current year as reference
  const jan4 = new Date(year, 0, 4); // January 4th is always in week 1
  const jan4Day = jan4.getDay() || 7; // Sunday = 7
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - jan4Day + 1 + (weekNumber - 1) * 7);

  // Calculate the last day of the week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  // Format based on locale
  const startMonth = weekStart.toLocaleDateString(locale, { month: 'long' });
  const endMonth = weekEnd.toLocaleDateString(locale, { month: 'long' });
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();

  // If same month, format as "July 1-7"
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  }

  // If different months, format as "July 29 - August 4"
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}
