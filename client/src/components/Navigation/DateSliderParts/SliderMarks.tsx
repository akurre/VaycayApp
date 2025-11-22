import type { FC } from 'react';
import { Text } from '@mantine/core';
import CustomPopover from '@/components/Shared/CustomPopover';

interface SliderMarksProps {
  marks: Array<{ value: number; label: string }>;
  min: number;
  max: number;
}

const SliderMarks: FC<SliderMarksProps> = ({ marks, min, max }) => {
  return (
    <div className="relative mt-1">
      {marks.map((mark) => {
        const markPosition = ((mark.value - min) / (max - min)) * 100;
        return (
          <div
            key={mark.value}
            className="absolute -translate-x-1/2"
            style={{ left: `${markPosition}%` }}
          >
            <CustomPopover showBackground={false} size="xxs" direction="up">
              <Text size="xs" fw={500}>
                {mark.label}
              </Text>
            </CustomPopover>
          </div>
        );
      })}
    </div>
  );
};

export default SliderMarks;
