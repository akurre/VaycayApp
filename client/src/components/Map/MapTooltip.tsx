import { useComputedColorScheme } from '@mantine/core';
import { appColors } from '@/theme';

interface MapTooltipProps {
  x: number;
  y: number;
  content: string;
}

const MapTooltip = ({ x, y, content }: MapTooltipProps) => {
  const colorScheme = useComputedColorScheme('dark');
  const isLightMode = colorScheme === 'light';

  const backgroundColor = isLightMode
    ? appColors.light.background
    : appColors.dark.surface;
  const textColor = isLightMode ? appColors.light.text : appColors.dark.text;

  return (
    <div
      className="pointer-events-none absolute z-50 rounded px-3 py-2 text-sm shadow-lg"
      style={{
        left: x + 10,
        top: y + 10,
        backgroundColor,
        color: textColor,
      }}
    >
      <div className="whitespace-pre-line">{content}</div>
    </div>
  );
};

export default MapTooltip;
