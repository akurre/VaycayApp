import type { FC } from 'react';
import { useMemo } from 'react';
import formatSliderLabel from '@/utils/dateFormatting/formatSliderLabel';
import { Text } from '@mantine/core';
import CustomPopover from '@/components/Shared/CustomPopover';
import { monthlyMarks } from '@/const';

interface SliderLabelProps {
  value: number;
  position: number;
  isMonthly?: boolean;
}

const SliderLabel: FC<SliderLabelProps> = ({ value, position, isMonthly }) => {
  const labelText = useMemo(() => {
    if (isMonthly) {
      return monthlyMarks.find((mark) => mark.value === value)?.label ?? '';
    }
    return formatSliderLabel(value);
  }, [value, isMonthly]);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${position}%`,
        top: '-35px',
      }}
    >
      <div
        className="relative"
        style={{ transform: 'translateX(calc(-50% - 4px))' }}
      >
        <CustomPopover size="xs">
          <Text size="xs" fw={500} className="whitespace-nowrap">
            {labelText}
          </Text>
        </CustomPopover>
      </div>
    </div>
  );
};

export default SliderLabel;
