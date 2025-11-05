import { FC } from 'react';
import formatSliderLabel from '@/utils/dateFormatting/formatSliderLabel';
import { Text } from '@mantine/core';
import CustomPopover from '@/components/shared/CustomPopover';

interface SliderLabelProps {
  value: number;
  position: number;
}

const SliderLabel: FC<SliderLabelProps> = ({ value, position }) => {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${position}%`,
        top: '-35px',
      }}
    >
      <div className="relative" style={{ transform: 'translateX(calc(-50% - 4px))' }}>
        <CustomPopover size="xs">
          <Text size="xs" fw={500}>
            {formatSliderLabel(value)}
          </Text>
        </CustomPopover>
      </div>
    </div>
  );
};

export default SliderLabel;
