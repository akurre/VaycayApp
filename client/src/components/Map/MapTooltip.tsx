import { useRef, useState, useLayoutEffect } from 'react';
import { ActionIcon, useComputedColorScheme } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { appColors } from '@/theme';

interface MapTooltipProps {
  x: number;
  y: number;
  content: string;
  /** When provided, renders an inline "+" button that opens the city drawer. */
  onView?: () => void;
}

const MapTooltip = ({ x, y, content, onView }: MapTooltipProps) => {
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

  const interactive = Boolean(onView);

  return (
    <div
      ref={tooltipRef}
      className={`absolute z-50 flex items-center gap-2 rounded px-3 py-2 text-sm shadow-lg ${
        interactive ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      style={{
        left: position.left,
        top: position.top,
        backgroundColor,
        color: textColor,
      }}
    >
      <div className="whitespace-pre-line">{content}</div>
      {onView && (
        <ActionIcon
          variant="subtle"
          size="sm"
          aria-label="Open city details"
          onClick={onView}
        >
          <IconPlus size={16} />
        </ActionIcon>
      )}
    </div>
  );
};

export default MapTooltip;
