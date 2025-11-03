import { FC } from 'react';
import { IconGripVertical } from '@tabler/icons-react';
import { clamp, useMove } from '@mantine/hooks';
import { appColors } from '@/theme';
import { Loader } from '@mantine/core';
import { formatSliderLabel } from '@/utils/dateFormatting/formatSliderLabel';

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

  // thumb dimensions for positioning calculations
  const thumbWidth = 32; // 8 * 4 (w-8 in tailwind)

  return (
    <div className="w-full">
      {/* track container */}
      <div className="relative h-2 cursor-pointer" ref={ref}>
        {/* semi-transparent track background */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: `${appColors.primary}33` }}
        />

        {/* draggable thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow hover:shadow-xl"
          style={{
            left: `calc(${position}% - ${thumbWidth / 2}px)`,
            color: 'white',
            background: appColors.primaryDark,
          }}
        >
          {isLoading ? <Loader size={20} /> : <IconGripVertical size={20} stroke={1.5} />}
        </div>

        {/* date label above thumb */}
        <div
          className="absolute -top-8 -translate-x-1/2 text-sm text-gray-200 bg-gray-800 rounded-md font-medium whitespace-nowrap"
          style={{
            left: `${position}%`,
            // color: appColors.primary,
          }}
        >
          {formatSliderLabel(value)}
        </div>
      </div>

      {/* month marks below track */}
      <div className="relative mt-2">
        {marks.map((mark) => {
          const markPosition = ((mark.value - min) / (max - min)) * 100;
          return (
            <div
              key={mark.value}
              className="absolute bg-gray-800 rounded-md -translate-x-1/2 text-xs text-gray-200 font-medium"
              style={{ left: `${markPosition}%` }}
            >
              {mark.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomDateSlider;
