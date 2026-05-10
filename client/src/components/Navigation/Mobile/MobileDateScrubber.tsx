import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import { dateToDayOfYear } from '@/utils/dateFormatting/dateToDayOfYear';
import { dayOfYearToDate } from '@/utils/dateFormatting/dayOfYearToDate';
import formatSliderValueForLabel from '@/utils/dateFormatting/formatSliderValueForLabel';
import CustomDateSlider from '@/components/Navigation/CustomDateSlider';
import useGlassTokens from '@/hooks/useGlassTokens';
import {
  monthMarks,
  monthlyMarks,
  MOBILE_BAR_INSET_PX,
  MOBILE_BAR_RADIUS_PX,
  MOBILE_SCRUBBER_BOTTOM_PX,
} from '@/const';

interface MobileDateScrubberProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  isMonthly?: boolean;
  hidden?: boolean;
}

const MobileDateScrubber: FC<MobileDateScrubberProps> = ({
  selectedDate,
  onDateChange,
  isMonthly = false,
  hidden = false,
}) => {
  const glass = useGlassTokens();

  const sliderValue = isMonthly
    ? Number.parseInt(selectedDate.substring(0, 2), 10)
    : dateToDayOfYear(selectedDate);

  // Tracks the value while the user is dragging so the trailing label updates
  // live, before onDateChange commits on pointer-release.
  const [previewValue, setPreviewValue] = useState<number | null>(null);

  // Drop the preview once a new value arrives via prop (commit landed,
  // or external date change e.g. URL).
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
      data-testid="mobile-date-scrubber"
      className="z-20 flex items-center gap-4 px-4 py-3"
      style={{
        position: 'fixed',
        bottom: MOBILE_SCRUBBER_BOTTOM_PX,
        left: MOBILE_BAR_INSET_PX,
        right: MOBILE_BAR_INSET_PX,
        borderRadius: MOBILE_BAR_RADIUS_PX,
        background: glass.bgStrong,
        backdropFilter: glass.blurStrong,
        WebkitBackdropFilter: glass.blurStrong,
        border: `1px solid ${glass.borderLight}`,
        boxShadow: glass.shadow,
        transform: hidden ? 'translateY(120%)' : 'translateY(0)',
        transition: 'transform 250ms ease',
      }}
    >
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

export default MobileDateScrubber;
