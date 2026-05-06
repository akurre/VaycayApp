import { dateToDayOfYear } from './dateToDayOfYear';
import formatSliderValueForLabel from './formatSliderValueForLabel';

function formatDateForLabel(date: string, isMonthly: boolean): string {
  const value = isMonthly
    ? Number.parseInt(date.substring(0, 2), 10)
    : dateToDayOfYear(date);
  return formatSliderValueForLabel(value, isMonthly);
}

export default formatDateForLabel;
