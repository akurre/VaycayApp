import { appColors } from '@/theme';
import { useAppStore } from '@/stores/useAppStore';
import { MapTheme } from '@/types/mapTypes';

interface MapTooltipProps {
  x: number;
  y: number;
  content: string;
}

const MapTooltip = ({ x, y, content }: MapTooltipProps) => {
  return (
    <div
      className="pointer-events-none absolute z-50 rounded px-3 py-2 text-sm shadow-lg"
      style={{
        left: x + 10,
        top: y + 10,
      }}
    >
      <div className="whitespace-pre-line">{content}</div>
    </div>
  );
};

export default MapTooltip;
