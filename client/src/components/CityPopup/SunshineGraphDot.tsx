import { SUNSHINE_CHART_LINE_COLOR } from '@/const';

interface SunshineGraphDotProps {
  cx?: number;
  cy?: number;
  payload?: {
    monthIndex: number;
    hours: number | null;
  };
  selectedMonth?: number;
}

function SunshineGraphDot({ cx, cy, payload, selectedMonth }: SunshineGraphDotProps) {
  if (!cx || !cy || !payload || !selectedMonth) {
    return null;
  }

  if (payload.monthIndex === selectedMonth) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={SUNSHINE_CHART_LINE_COLOR}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  }

  return null;
}

export default SunshineGraphDot;
