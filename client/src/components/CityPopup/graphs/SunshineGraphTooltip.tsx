import { Text } from '@mantine/core';
import { useChartColors } from '@/hooks/useChartColors';
import CityBadge from './CityBadge';

interface TooltipPayload {
  payload: {
    month: string;
    monthIndex: number;
    hours: number | null;
    theoreticalMax?: number | null;
    baseline?: number;
    comparisonHours?: number | null;
    comparisonTheoreticalMax?: number | null;
  };
}

interface SunshineGraphTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<TooltipPayload>;
  cityName?: string;
  comparisonCityName?: string;
}

const SunshineGraphTooltip = ({
  active,
  payload,
  cityName,
  comparisonCityName,
}: SunshineGraphTooltipProps) => {
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
      <Text size="sm" fw={600} c={chartColors.textColor} mb={4}>
        {data.month}
      </Text>

      {/* Main city sunshine hours */}
      {data.hours !== null && (
        <div className="flex items-center gap-2 mb-1">
          {cityName && <CityBadge cityName={cityName} />}
          <Text size="sm" c={chartColors.textColor}>
            {data.hours.toFixed(1)} hours
          </Text>
        </div>
      )}

      {/* Comparison city sunshine hours */}
      {data.comparisonHours !== null && data.comparisonHours !== undefined && (
        <div className="flex items-center gap-2">
          {comparisonCityName && (
            <CityBadge cityName={comparisonCityName} isComparison />
          )}
          <Text size="sm" c={chartColors.textColor}>
            {data.comparisonHours.toFixed(1)} hours
          </Text>
        </div>
      )}

      {/* Show N/A if no data */}
      {data.hours === null &&
        (data.comparisonHours === null ||
          data.comparisonHours === undefined) && (
          <Text size="sm" c={chartColors.textColor}>
            No data
          </Text>
        )}
    </div>
  );
}

export default SunshineGraphTooltip;
