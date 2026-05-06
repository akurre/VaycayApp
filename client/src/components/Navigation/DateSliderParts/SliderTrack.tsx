import type { FC, ReactNode } from 'react';
import useGlassTokens from '@/hooks/useGlassTokens';

interface SliderTrackProps {
  trackRef: (instance: HTMLDivElement | null) => void;
  children?: ReactNode;
}

const SliderTrack: FC<SliderTrackProps> = ({ trackRef, children }) => {
  const glass = useGlassTokens();

  return (
    <div className="relative h-1.5 cursor-pointer" ref={trackRef}>
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: glass.divider }}
      />
      {children}
    </div>
  );
};

export default SliderTrack;
