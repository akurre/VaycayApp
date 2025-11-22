import { MONTH_ABBREVIATIONS } from '@/const';
import { dayOfYearToDate } from './dayOfYearToDate';

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
  const dayNumber = Number.parseInt(day, 10);

  return `${MONTH_ABBREVIATIONS[month]} ${dayNumber}`;
}

export default formatSliderLabel;
