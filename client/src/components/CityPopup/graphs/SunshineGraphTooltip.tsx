import { Text } from '@mantine/core';
import { useChartColors } from '@/hooks/useChartColors';
import SunshineTooltipCityData from './SunshineTooltipCityData';

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

  // Defensive check: ensure we have valid payload data
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0]?.payload;

  // Additional safety check: ensure data object exists
  if (!data) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: chartColors.backgroundColor,
        border: `1px solid ${chartColors.gridColor}`,
        color: chartColors.textColor,
      }}
      className="p-2 rounded shadow-md"
    >
      <Text size="sm" fw={600} c={chartColors.textColor} mb={1}>
        {data.month}
      </Text>

      {/* Main city sunshine hours with percentage */}
      {typeof data.hours === 'number' && (
        <SunshineTooltipCityData
          cityName={cityName}
          hours={data.hours}
          theoreticalMax={data.theoreticalMax}
          textColor={chartColors.textColor}
          hasComparisonData={typeof data.comparisonHours === 'number'}
        />
      )}

      {/* Comparison city sunshine hours with percentage */}
      {typeof data.comparisonHours === 'number' && (
        <SunshineTooltipCityData
          cityName={comparisonCityName}
          hours={data.comparisonHours}
          theoreticalMax={data.comparisonTheoreticalMax}
          textColor={chartColors.textColor}
          isComparison
          hasComparisonData
        />
      )}

      {/* Show N/A if no data */}
      {typeof data.hours !== 'number' &&
        typeof data.comparisonHours !== 'number' && (
          <Text size="sm" c={chartColors.textColor}>
            No data
          </Text>
        )}
    </div>
  );
};

export default SunshineGraphTooltip;
