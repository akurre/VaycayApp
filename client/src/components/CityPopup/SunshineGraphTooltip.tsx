import { Text } from '@mantine/core';

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
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-white p-2 border border-gray-300 rounded shadow-md">
      <Text size="sm" fw={600}>
        {data.month}
      </Text>
      <Text size="sm">{data.hours !== null ? `${data.hours.toFixed(1)} hours` : 'No data'}</Text>
    </div>
  );
}

export default SunshineGraphTooltip;
