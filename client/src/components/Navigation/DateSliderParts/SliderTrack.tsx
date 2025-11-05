import { FC, ReactNode } from 'react';
import { appColors } from '@/theme';

interface SliderTrackProps {
  trackRef: (instance: HTMLDivElement | null) => void;
  children?: ReactNode;
}

const SliderTrack: FC<SliderTrackProps> = ({ trackRef, children }) => {
  return (
    <div className="relative h-2 cursor-pointer" ref={trackRef}>
      {/* slider track background with 80% opacity */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: `${appColors.primary}CC` }}
      />
      {children}
    </div>
  );
};

export default SliderTrack;
