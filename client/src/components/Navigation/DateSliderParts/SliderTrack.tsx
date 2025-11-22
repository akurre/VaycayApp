import type { FC, ReactNode } from 'react';
import { useComputedColorScheme } from '@mantine/core';
import { appColors } from '@/theme';

interface SliderTrackProps {
  trackRef: (instance: HTMLDivElement | null) => void;
  children?: ReactNode;
}

const SliderTrack: FC<SliderTrackProps> = ({ trackRef, children }) => {
  const colorScheme = useComputedColorScheme('dark');
  const isLightMode = colorScheme === 'light';
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
