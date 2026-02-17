import { useRef, useState, useLayoutEffect } from 'react';
import { useComputedColorScheme } from '@mantine/core';
import { appColors } from '@/theme';

interface MapTooltipProps {
  x: number;
  y: number;
  content: string;
}

const MapTooltip = ({ x, y, content }: MapTooltipProps) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x + 10, top: y + 10 });

  const colorScheme = useComputedColorScheme('dark');
  const isLightMode = colorScheme === 'light';
  const backgroundColor = isLightMode
    ? appColors.light.background
    : appColors.dark.surface;
  const textColor = isLightMode ? appColors.light.text : appColors.dark.text;

  useLayoutEffect(() => {
    if (!tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newLeft = x + 10;
    let newTop = y + 10;
    if (newLeft + rect.width > viewportWidth) {
      newLeft = x - rect.width - 10;
    }
    if (newTop + rect.height > viewportHeight) {
      newTop = y - rect.height - 10;
    }

    setPosition({ left: newLeft, top: newTop });
  }, [x, y]);

  return (
    <div
      ref={tooltipRef}
      className="pointer-events-none absolute z-50 rounded px-3 py-2 text-sm shadow-lg"
      style={{
        left: position.left,
        top: position.top,
        backgroundColor,
        color: textColor,
      }}
    >
      <div className="whitespace-pre-line">{content}</div>
    </div>
  );
};

export default MapTooltip;
