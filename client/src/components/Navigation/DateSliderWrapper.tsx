import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import { dateToDayOfYear } from '@/utils/dateFormatting/dateToDayOfYear';
import { dayOfYearToDate } from '@/utils/dateFormatting/dayOfYearToDate';
import formatSliderValueForLabel from '@/utils/dateFormatting/formatSliderValueForLabel';
import CustomDateSlider from '@/components/Navigation/CustomDateSlider';
import { monthMarks, monthlyMarks } from '@/const';
import useGlassTokens from '@/hooks/useGlassTokens';

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
  const glass = useGlassTokens();

  const sliderValue = isMonthly
    ? Number.parseInt(currentDate.substring(0, 2), 10)
    : dateToDayOfYear(currentDate);

  // Tracks the value while the user is dragging so the trailing label updates
  // live, before the debounced onChange commits a new currentDate prop.
  const [previewValue, setPreviewValue] = useState<number | null>(null);

  // Once the parent commits a new value, drop the preview so the label tracks
  // the prop again (and external date changes — URL, etc. — take over).
  useEffect(() => {
    setPreviewValue(null);
  }, [sliderValue]);

  const handleSliderChange = (value: number) => {
    const newDate = isMonthly
      ? `${value.toString().padStart(2, '0')}-15`
      : dayOfYearToDate(value);
    onDateChange(newDate);
  };

  const marks = isMonthly ? [...monthlyMarks] : [...monthMarks];
  const maxValue = isMonthly ? 12 : 365;

  const labelValue = previewValue ?? sliderValue;
  const currentLabel = formatSliderValueForLabel(labelValue, isMonthly);

  return (
    <div
      className="flex items-center gap-6 rounded-xl px-6 py-4"
      style={{
        background: glass.bgStrong,
        backdropFilter: glass.blurStrong,
        WebkitBackdropFilter: glass.blurStrong,
        border: `1px solid ${glass.borderLight}`,
        boxShadow: glass.shadow,
      }}
    >
      <Text
        size="xs"
        c="dimmed"
        fw={500}
        ff="monospace"
        tt="uppercase"
        className="min-w-16 text-left shrink-0"
      >
        Date
      </Text>

      <div className="flex-1">
        <CustomDateSlider
          value={sliderValue}
          onChange={handleSliderChange}
          onValuePreview={setPreviewValue}
          min={1}
          max={maxValue}
          marks={marks}
          isMonthly={isMonthly}
        />
      </div>

      <Text
        size="xs"
        c="dimmed"
        fw={500}
        ff="monospace"
        className="shrink-0 min-w-16 text-right"
      >
        {currentLabel}
      </Text>
    </div>
  );
};

export default DateSliderWrapper;
