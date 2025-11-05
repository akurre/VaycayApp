import { FC } from 'react';
import { IconGripVertical } from '@tabler/icons-react';
import { Loader } from '@mantine/core';
import { appColors } from '@/theme';
import { SLIDER_THUMB_WIDTH } from '@/constants';

interface SliderThumbProps {
  position: number;
  isLoading?: boolean;
}

const SliderThumb: FC<SliderThumbProps> = ({ position, isLoading }) => {
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow hover:shadow-xl"
      style={{
        left: `calc(${position}% - ${SLIDER_THUMB_WIDTH / 2}px)`,
        color: 'white',
        background: appColors.primaryDark,
      }}
    >
      {isLoading ? <Loader size={20} /> : <IconGripVertical size={20} stroke={1.5} />}
    </div>
  );
};

export default SliderThumb;
