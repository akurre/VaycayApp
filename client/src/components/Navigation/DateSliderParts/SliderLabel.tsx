import { FC } from 'react';
import { formatSliderLabel } from '@/utils/dateFormatting/formatSliderLabel';

interface SliderLabelProps {
  value: number;
  position: number;
}

const SliderLabel: FC<SliderLabelProps> = ({ value, position }) => {
  return (
    <div
      className="absolute -top-8 -translate-x-1/2 text-sm text-gray-200 bg-gray-800 rounded-md font-medium whitespace-nowrap"
      style={{
        left: `${position}%`,
      }}
    >
      {formatSliderLabel(value)}
    </div>
  );
};

export default SliderLabel;
