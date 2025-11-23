import { useChartColors } from '@/hooks/useChartColors';

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
  const chartColors = useChartColors();

  if (!cx || !cy || !payload || !selectedMonth) {
    return null;
  }

  if (payload.monthIndex === selectedMonth) {
    return (
      <circle cx={cx} cy={cy} r={6} fill={chartColors.lineColor} stroke="#fff" strokeWidth={2} />
    );
  }

  return null;
}

export default SunshineGraphDot;
