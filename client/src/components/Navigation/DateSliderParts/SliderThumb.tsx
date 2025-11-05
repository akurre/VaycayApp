import { FC } from 'react';
import { IconGripVertical } from '@tabler/icons-react';
import { SLIDER_THUMB_WIDTH } from '@/constants';
import CustomLoader from '@/components/Shared/CustomLoader';

interface SliderThumbProps {
  position: number;
  isLoading?: boolean;
}

const SliderThumb: FC<SliderThumbProps> = ({ position, isLoading }) => {

  return (
    <div
      className="absolute z-20 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow hover:shadow-xl"
      style={{
        left: `calc(${position}% - ${SLIDER_THUMB_WIDTH / 2}px)`,
        color: 'white',
      }}
    >
      {isLoading ? <CustomLoader /> : <IconGripVertical size={20} stroke={1.5} />}
    </div>
  );
};

export default SliderThumb;
