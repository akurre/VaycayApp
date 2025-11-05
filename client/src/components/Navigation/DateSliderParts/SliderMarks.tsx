import { FC } from 'react';

interface SliderMarksProps {
  marks: Array<{ value: number; label: string }>;
  min: number;
  max: number;
}

const SliderMarks: FC<SliderMarksProps> = ({ marks, min, max }) => {
  return (
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
  );
};

export default SliderMarks;
