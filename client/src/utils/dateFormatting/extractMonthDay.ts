/**
 * Extracts month-day (MM-DD) from a date string
 * Handles both YYYY-MM-DD and MM-DD formats
 *
 * @param dateString - Date string in format "YYYY-MM-DD" or "MM-DD"
 * @returns Month-day string in format "MM-DD", or empty string if invalid
 *
 * @example
 * extractMonthDay("2020-11-26") // Returns "11-26"
 * extractMonthDay("11-26") // Returns "11-26"
 * extractMonthDay("") // Returns ""
 */
export function extractMonthDay(dateString: string): string {
  if (!dateString) return '';

  const parts = dateString.split('-');

  // If format is YYYY-MM-DD, take last two parts (MM-DD)
  if (parts.length === 3) {
    return `${parts[1]}-${parts[2]}`;
  }

  // Otherwise it's already MM-DD format
  return dateString;
}
