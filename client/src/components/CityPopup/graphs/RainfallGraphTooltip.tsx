import { Text } from '@mantine/core';
import { useChartColors } from '@/hooks/useChartColors';
import { getWeekDateRange } from '@/utils/dateFormatting/getWeekDateRange';

interface TooltipPayload {
  payload: {
    week: number;
    totalPrecip: number | null;
    avgPrecip: number | null;
    compTotalPrecip?: number | null;
    compAvgPrecip?: number | null;
    daysWithRain: number | null;
    daysWithData: number;
  };
}

interface RainfallGraphTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<TooltipPayload>;
  cityName?: string;
  comparisonCityName?: string;
}

const RainfallGraphTooltip = ({
  active,
  payload,
  cityName,
  comparisonCityName,
}: RainfallGraphTooltipProps) => {
  const chartColors = useChartColors();

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;
  const dateRange = getWeekDateRange(data.week);

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
        {dateRange}
      </Text>

      {/* Main city precipitation */}
      {data.totalPrecip !== null && (
        <Text size="sm" c={chartColors.textColor}>
          {cityName ? `${cityName}: ` : ''}
          {data.totalPrecip.toFixed(2)} mm
        </Text>
      )}

      {/* Comparison city precipitation */}
      {data.compTotalPrecip !== null && data.compTotalPrecip !== undefined && (
        <Text size="sm" c={chartColors.textColor}>
          {comparisonCityName ? `${comparisonCityName}: ` : ''}
          {data.compTotalPrecip.toFixed(2)} mm
        </Text>
      )}

      {/* Show N/A if no data */}
      {data.totalPrecip === null &&
        (data.compTotalPrecip === null ||
          data.compTotalPrecip === undefined) && (
          <Text size="sm" c={chartColors.textColor}>
            No data
          </Text>
        )}
    </div>
  );
};

export default RainfallGraphTooltip;
