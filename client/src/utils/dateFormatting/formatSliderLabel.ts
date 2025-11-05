import { dayOfYearToDate } from './dayOfYearToDate';

const MONTH_ABBREVIATIONS: Record<string, string> = {
  '01': 'Jan.',
  '02': 'Feb.',
  '03': 'Mar.',
  '04': 'Apr.',
  '05': 'May',
  '06': 'Jun.',
  '07': 'Jul.',
  '08': 'Aug.',
  '09': 'Sep.',
  '10': 'Oct.',
  '11': 'Nov.',
  '12': 'Dec.',
};

/**
 * formats a day of year value into a readable date label
 * @param dayOfYear - the day of year (1-365)
 * @returns formatted date string like "Mar. 20" or "Nov. 3"
 */
function formatSliderLabel(dayOfYear: number): string {
  const date = dayOfYearToDate(dayOfYear);
  const month = date.substring(0, 2);
  const day = date.substring(2, 4);

  // remove leading zero from day
  const dayNumber = parseInt(day, 10);

  return `${MONTH_ABBREVIATIONS[month]} ${dayNumber}`;
}

export default formatSliderLabel;
