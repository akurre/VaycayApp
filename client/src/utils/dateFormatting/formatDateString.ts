import { MONTH_NAMES } from "@/constants";

/**
 * formats a date string in format "YYYY-MM-DD" to a readable format like "January 1st"
 * @param dateString - the date string in format "YYYY-MM-DD"
 * @returns formatted date string like "January 1st" or empty string if input is invalid
 */
export function formatDateString(dateString: string | null | undefined): string {
  if (!dateString?.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return '';
  }

  // Extract month and day from the date string
  const month = Number.parseInt(dateString.substring(5, 7), 10);
  const day = Number.parseInt(dateString.substring(8, 10), 10);

  // Get ordinal suffix for the day
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Format the date
  return `${MONTH_NAMES[month - 1]} ${day}${getOrdinalSuffix(day)}`;
}

export default formatDateString;
