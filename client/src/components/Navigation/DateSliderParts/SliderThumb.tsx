import type { FC } from 'react';
import { IconGripVertical } from '@tabler/icons-react';
import { SLIDER_THUMB_WIDTH } from '@/const';

interface SliderThumbProps {
  position: number;
}

const SliderThumb: FC<SliderThumbProps> = ({ position }) => {
  return (
    <div
      className="absolute z-20 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:shadow-xl"
      style={{
        left: `calc(${position}% - ${SLIDER_THUMB_WIDTH / 2}px)`,
        color: 'white',
      }}
    >
      <IconGripVertical size={20} stroke={1.5} />
    </div>
  );
};

export default SliderThumb;
