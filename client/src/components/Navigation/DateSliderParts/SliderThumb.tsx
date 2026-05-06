import type { FC } from 'react';
import { SLIDER_THUMB_WIDTH } from '@/const';
import { appColors } from '@/theme';
import useGlassTokens from '@/hooks/useGlassTokens';

interface SliderThumbProps {
  position: number;
}

const SliderThumb: FC<SliderThumbProps> = ({ position }) => {
  const glass = useGlassTokens();

  return (
    <div
      className="absolute z-20 top-1/2 -translate-y-1/2 rounded-full cursor-grab active:cursor-grabbing"
      style={{
        left: `calc(${position}% - ${SLIDER_THUMB_WIDTH / 2}px)`,
        width: SLIDER_THUMB_WIDTH,
        height: SLIDER_THUMB_WIDTH,
        background: appColors.primary,
        boxShadow: `0 0 0 4px ${glass.triggerOpenBg}, 0 2px 6px rgba(0,0,0,0.4)`,
      }}
    />
  );
};

export default SliderThumb;
