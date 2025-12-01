import type { FC } from 'react';
import { dateToDayOfYear } from '@/utils/dateFormatting/dateToDayOfYear';
import { dayOfYearToDate } from '@/utils/dateFormatting/dayOfYearToDate';
import CustomDateSlider from './CustomDateSlider';
import { monthMarks, monthlyMarks } from '@/const';

interface DateSliderWrapperProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  isMonthly?: boolean;
}

const DateSliderWrapper: FC<DateSliderWrapperProps> = ({
  currentDate,
  onDateChange,
  isMonthly = false,
}) => {
  // For monthly mode: use month number (1-12), for daily: use day of year (1-365)
  const sliderValue = isMonthly
    ? Number.parseInt(currentDate.substring(0, 2), 10)
    : dateToDayOfYear(currentDate);

  // Convert slider value back to date string format
  const handleSliderChange = (value: number) => {
    const newDate = isMonthly
      ? `${value.toString().padStart(2, '0')}-15` // Convert month number to MM-15 format
      : dayOfYearToDate(value); // Convert day of year to MM-DD format
    onDateChange(newDate);
  };

  // Spread to convert readonly arrays to mutable for component compatibility
  const marks = isMonthly ? [...monthlyMarks] : [...monthMarks];
  const maxValue = isMonthly ? 12 : 365;

  return (
    <div className="w-full">
      <CustomDateSlider
        value={sliderValue}
        onChange={handleSliderChange}
        min={1}
        max={maxValue}
        marks={marks}
        isMonthly={isMonthly}
      />
    </div>
  );
};

export default DateSliderWrapper;
