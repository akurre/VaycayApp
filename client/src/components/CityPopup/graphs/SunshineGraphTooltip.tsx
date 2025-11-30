import { Text } from '@mantine/core';
import { useChartColors } from '@/hooks/useChartColors';

interface TooltipPayload {
  payload: {
    month: string;
    monthIndex: number;
    hours: number | null;
    theoreticalMax?: number | null;
    baseline?: number;
  };
}

interface SunshineGraphTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function SunshineGraphTooltip({ active, payload }: SunshineGraphTooltipProps) {
  const chartColors = useChartColors();

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div
      style={{
        backgroundColor: chartColors.backgroundColor,
        border: `1px solid ${chartColors.gridColor}`,
        color: chartColors.textColor,
      }}
      className="p-2 rounded shadow-md"
    >
      <Text size="sm" fw={600} c={chartColors.textColor}>
        {data.month}
      </Text>
      <Text size="sm" c={chartColors.textColor}>
        {data.hours !== null ? `${data.hours.toFixed(1)} hours` : 'No data'}
      </Text>
    </div>
  );
}

export default SunshineGraphTooltip;
