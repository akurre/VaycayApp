import { MONTH_NAMES } from '@/const';

/**
 * formats a date string to a readable format like "April 23"
 * (full month name + day, no ordinal suffix). Accepts "YYYY-MM-DD",
 * "MM-DD", and "MMDD" formats.
 * @param dateString - the date string in format "YYYY-MM-DD", "MM-DD", or "MMDD"
 * @returns formatted date string like "April 23" or empty string if input is invalid
 */
export function formatDateAsMonthDay(
  dateString: string | null | undefined
): string {
  if (!dateString) return '';

  const match =
    dateString.match(/^\d{4}-(\d{2})-(\d{2})$/) ??
    dateString.match(/^(\d{2})-(\d{2})$/) ??
    dateString.match(/^(\d{2})(\d{2})$/);
  if (!match) return '';

  const month = Number.parseInt(match[1], 10);
  const day = Number.parseInt(match[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';

  return `${MONTH_NAMES[month - 1]} ${day}`;
}

export default formatDateAsMonthDay;
