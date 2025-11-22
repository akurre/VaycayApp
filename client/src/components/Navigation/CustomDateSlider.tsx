import type { FC } from 'react';
import { clamp, useMove } from '@mantine/hooks';
import SliderTrack from './DateSliderParts/SliderTrack';
import SliderThumb from './DateSliderParts/SliderThumb';
import SliderLabel from './DateSliderParts/SliderLabel';
import SliderMarks from './DateSliderParts/SliderMarks';

interface CustomDateSliderProps {
  value: number;
  isLoading?: boolean;
  onChange: (value: number) => void;
  min: number;
  max: number;
  marks: Array<{ value: number; label: string }>;
  isMonthly?: boolean;
}

const CustomDateSlider: FC<CustomDateSliderProps> = ({
  value,
  isLoading,
  onChange,
  min,
  max,
  marks,
  isMonthly,
}) => {
  const effectiveMin = isMonthly ? 1 : min;
  const effectiveMax = isMonthly ? 12 : max;

  const { ref } = useMove(({ x }) => {
    const rawValue = x * (effectiveMax - effectiveMin) + effectiveMin;
    const nextValue = Math.round(rawValue);
    onChange(clamp(nextValue, effectiveMin, effectiveMax));
  });

  // calculate position as percentage
  const position = isMonthly ? ((value - 1) / 11) * 100 : ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {/* track container with draggable elements */}
      <SliderTrack trackRef={ref}>
        <SliderThumb position={position} isLoading={isLoading} />
        <SliderLabel value={value} position={position} isMonthly={isMonthly} />
      </SliderTrack>

      {/* month marks below track */}
      <SliderMarks marks={marks} min={effectiveMin} max={effectiveMax} />
    </div>
  );
};

export default CustomDateSlider;
