import { monthlyMarks } from '@/const';
import formatSliderLabel from './formatSliderLabel';

function formatSliderValueForLabel(value: number, isMonthly: boolean): string {
  if (isMonthly) {
    return monthlyMarks.find((mark) => mark.value === value)?.label ?? '';
  }
  return formatSliderLabel(value);
}

export default formatSliderValueForLabel;
