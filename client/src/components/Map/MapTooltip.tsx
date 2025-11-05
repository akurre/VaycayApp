import { appColors } from '@/theme';
import { useAppStore } from '@/stores/useAppStore';
import { MapTheme } from '@/types/mapTypes';

interface MapTooltipProps {
  x: number;
  y: number;
  content: string;
}

const MapTooltip = ({ x, y, content }: MapTooltipProps) => {
  const theme = useAppStore((state) => state.theme);
  const isLightMode = theme === MapTheme.Light;
  
  const backgroundColor = isLightMode ? appColors.light.surface : appColors.dark.surface;
  const borderColor = isLightMode ? appColors.light.border : appColors.dark.border;
  const textColor = isLightMode ? appColors.light.text : appColors.dark.text;

  return (
    <div
      className="pointer-events-none absolute z-50 rounded px-3 py-2 text-sm shadow-lg"
      style={{
        left: x + 10,
        top: y + 10,
        backgroundColor,
        border: `1px solid ${borderColor}`,
        color: textColor,
      }}
    >
      <div className="whitespace-pre-line">{content}</div>
    </div>
  );
};

export default MapTooltip;
