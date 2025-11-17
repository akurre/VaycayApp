import { FC } from 'react';
import { dateToDayOfYear } from '@/utils/dateFormatting/dateToDayOfYear';
import { dayOfYearToDate } from '@/utils/dateFormatting/dayOfYearToDate';
import { useWeatherStore } from '@/stores/useWeatherStore';
import CustomDateSlider from './CustomDateSlider';
import { monthMarks, monthlyMarks } from '@/constants';

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
  const { isLoadingWeather } = useWeatherStore();

  // For monthly mode, use month number (1-12)
  // For daily mode, use day of year (1-365)
  const sliderValue = isMonthly
    ? Number.parseInt(currentDate.substring(0, 2), 10)
    : dateToDayOfYear(currentDate);

  const handleSliderChange = (value: number) => {
    if (isMonthly) {
      // Convert month number to MM-15 format (middle of month)
      const monthStr = value.toString().padStart(2, '0');
      const newDate = `${monthStr}-15`;
      onDateChange(newDate);
    } else {
      // Convert day of year to MM-DD format
      const newDate = dayOfYearToDate(value);
      onDateChange(newDate);
    }
  };

  // Convert readonly array to mutable array to fix TypeScript error
  const marks = isMonthly ? [...monthlyMarks] : monthMarks;

  return (
    <div className="w-full">
      <CustomDateSlider
        value={sliderValue}
        isLoading={isLoadingWeather}
        onChange={handleSliderChange}
        min={1}
        max={isMonthly ? 12 : 365}
        marks={marks}
        isMonthly={isMonthly}
      />
    </div>
  );
};

export default DateSliderWrapper;
