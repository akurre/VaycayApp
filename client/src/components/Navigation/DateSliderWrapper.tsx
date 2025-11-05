import { FC } from 'react';
import { dateToDayOfYear } from '@/utils/dateFormatting/dateToDayOfYear';
import { dayOfYearToDate } from '@/utils/dateFormatting/dayOfYearToDate';
import { useWeatherStore } from '@/stores/useWeatherStore';
import CustomDateSlider from './CustomDateSlider';
import { monthMarks } from '@/constants';

interface DateSliderWrapperProps {
  currentDate: string;
  onDateChange: (date: string) => void;
}

const DateSliderWrapper: FC<DateSliderWrapperProps> = ({ currentDate, onDateChange }) => {
  const { isLoadingWeather } = useWeatherStore();
  const dayOfYear = dateToDayOfYear(currentDate);

  const handleSliderChange = (value: number) => {
    const newDate = dayOfYearToDate(value);
    onDateChange(newDate);
  };

  return (
    <div className="w-full">
      <CustomDateSlider
        value={dayOfYear}
        isLoading={isLoadingWeather}
        onChange={handleSliderChange}
        min={1}
        max={365}
        marks={monthMarks}
      />
    </div>
  );
};

export default DateSliderWrapper;
