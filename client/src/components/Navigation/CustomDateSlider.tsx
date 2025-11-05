import { FC } from 'react';
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
}

const CustomDateSlider: FC<CustomDateSliderProps> = ({
  value,
  isLoading,
  onChange,
  min,
  max,
  marks,
}) => {
  const { ref } = useMove(({ x }) => onChange(clamp(Math.round(x * (max - min) + min), min, max)));

  // calculate position as percentage
  const position = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {/* track container with draggable elements */}
      <SliderTrack trackRef={ref}>
        <SliderThumb position={position} isLoading={isLoading} />
        <SliderLabel value={value} position={position} />
      </SliderTrack>

      {/* month marks below track */}
      <SliderMarks marks={marks} min={min} max={max} />
    </div>
  );
};

export default CustomDateSlider;
