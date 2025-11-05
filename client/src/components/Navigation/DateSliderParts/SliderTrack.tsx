import { FC, ReactNode } from 'react';
import { appColors } from '@/theme';
import { useAppStore } from '@/stores/useAppStore';
import { MapTheme } from '@/types/mapTypes';

interface SliderTrackProps {
  trackRef: (instance: HTMLDivElement | null) => void;
  children?: ReactNode;
}

const SliderTrack: FC<SliderTrackProps> = ({ trackRef, children }) => {
  const theme = useAppStore((state) => state.theme);
  const isLightMode = theme === MapTheme.Light;
  const trackColor = isLightMode ? appColors.tertiaryLight : appColors.tertiaryDark;
  return (
    <div className="relative h-2 cursor-pointer" ref={trackRef}>
      {/* slider track background with 80% opacity */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: `${trackColor}CC` }}
      />
      {children}
    </div>
  );
};

export default SliderTrack;
