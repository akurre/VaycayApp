import { useState, useEffect } from 'react';
import { BREATHE_MIN_OPACITY, BREATHE_MAX_OPACITY, BREATHE_CYCLE_MS } from '@/const';

export interface UseBreatheAnimationProps {
  isActive: boolean;
  minOpacity?: number;
  maxOpacity?: number;
  cycleDurationMs?: number;
}

export interface UseBreatheAnimationReturn {
  opacity: number;
}

export function useBreatheAnimation({
  isActive,
  minOpacity = BREATHE_MIN_OPACITY,
  maxOpacity = BREATHE_MAX_OPACITY,
  cycleDurationMs = BREATHE_CYCLE_MS,
}: UseBreatheAnimationProps): UseBreatheAnimationReturn {
  const [opacity, setOpacity] = useState<number>(maxOpacity);

  useEffect(() => {
    if (!isActive) {
      setOpacity(maxOpacity);
      return;
    }

    setOpacity(minOpacity);
    let atMin = true;

    const interval = setInterval(() => {
      atMin = !atMin;
      setOpacity(atMin ? minOpacity : maxOpacity);
    }, cycleDurationMs / 2);

    return () => clearInterval(interval);
  }, [isActive, minOpacity, maxOpacity, cycleDurationMs]);

  return { opacity };
}
