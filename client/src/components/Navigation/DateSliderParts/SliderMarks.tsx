import type { FC } from 'react';
import { Text } from '@mantine/core';
import useGlassTokens from '@/hooks/useGlassTokens';
import { SLIDER_MARK_TICK_WIDTH_PX, SLIDER_MARK_TICK_HEIGHT_PX } from '@/const';

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
            className="absolute -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${markPosition}%` }}
          >
            <div
              aria-hidden="true"
              style={{
                width: SLIDER_MARK_TICK_WIDTH_PX,
                height: SLIDER_MARK_TICK_HEIGHT_PX,
                background: glass.text,
                opacity: 0.35,
              }}
            />
            {mark.label && (
              <Text size="xs" style={{ color: glass.text, opacity: 0.7 }}>
                {mark.label}
              </Text>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SliderMarks;
