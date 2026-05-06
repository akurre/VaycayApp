import type { FC } from 'react';
import { Text } from '@mantine/core';
import useGlassTokens from '@/hooks/useGlassTokens';

interface SliderMarksProps {
  marks: Array<{ value: number; label: string }>;
  min: number;
  max: number;
}

const SliderMarks: FC<SliderMarksProps> = ({ marks, min, max }) => {
  const glass = useGlassTokens();

  return (
    <div className="relative mt-3 h-4">
      {marks.map((mark) => {
        const markPosition = ((mark.value - min) / (max - min)) * 100;
        return (
          <div
            key={mark.value}
            className="absolute -translate-x-1/2"
            style={{ left: `${markPosition}%` }}
          >
            <Text size="xs" style={{ color: glass.text, opacity: 0.7 }}>
              {mark.label}
            </Text>
          </div>
        );
      })}
    </div>
  );
};

export default SliderMarks;
