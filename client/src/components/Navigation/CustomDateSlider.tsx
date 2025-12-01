import type { FC } from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { clamp, useMove } from '@mantine/hooks';
import SliderTrack from './DateSliderParts/SliderTrack';
import SliderThumb from './DateSliderParts/SliderThumb';
import SliderLabel from './DateSliderParts/SliderLabel';
import SliderMarks from './DateSliderParts/SliderMarks';

interface CustomDateSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  marks: Array<{ value: number; label: string }>;
  isMonthly?: boolean;
}

const CustomDateSlider: FC<CustomDateSliderProps> = ({
  value,
  onChange,
  min,
  max,
  marks,
  isMonthly,
}) => {
  const effectiveMin = isMonthly ? 1 : min;
  const effectiveMax = isMonthly ? 12 : max;

  // Local state for immediate UI feedback while dragging
  const [displayValue, setDisplayValue] = useState(value);
  const pendingValueRef = useRef<number | null>(null);

  // Sync display value when prop value changes (from parent's debounced state)
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleMove = useCallback(
    ({ x }: { x: number }) => {
      const rawValue = x * (effectiveMax - effectiveMin) + effectiveMin;
      const nextValue = Math.round(rawValue);
      const clampedValue = clamp(nextValue, effectiveMin, effectiveMax);

      // Update display immediately for smooth UI
      setDisplayValue(clampedValue);
      // Store the value but don't trigger onChange yet
      pendingValueRef.current = clampedValue;
    },
    [effectiveMin, effectiveMax]
  );

  const handleMoveEnd = useCallback(() => {
    // Only trigger onChange when dragging ends
    if (pendingValueRef.current !== null && pendingValueRef.current !== value) {
      onChange(pendingValueRef.current);
      pendingValueRef.current = null;
    }
  }, [onChange, value]);

  const { ref } = useMove(handleMove, { onScrubEnd: handleMoveEnd });

  // calculate position as percentage using display value for smooth animation
  const position = isMonthly
    ? ((displayValue - 1) / 11) * 100
    : ((displayValue - min) / (max - min)) * 100;

  return (
    <div className="w-full px-8">
      {/* track container with draggable elements */}
      <SliderTrack trackRef={ref}>
        <SliderThumb position={position} />
        <SliderLabel
          value={displayValue}
          position={position}
          isMonthly={isMonthly}
        />
      </SliderTrack>

      {/* month marks below track */}
      <SliderMarks marks={marks} min={effectiveMin} max={effectiveMax} />
    </div>
  );
};

export default CustomDateSlider;
