import { Text } from '@mantine/core';
import { useChartColors } from '@/hooks/useChartColors';
import { getWeekDateRange } from '@/utils/dateFormatting/getWeekDateRange';
import CityBadge from './CityBadge';

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
        <div className="flex items-center gap-2 mb-1">
          {cityName && <CityBadge cityName={cityName} />}
          <Text size="sm" c={chartColors.textColor}>
            {data.totalPrecip.toFixed(2)} mm
          </Text>
        </div>
      )}

      {/* Comparison city precipitation */}
      {data.compTotalPrecip !== null && data.compTotalPrecip !== undefined && (
        <div className="flex items-center gap-2">
          {comparisonCityName && (
            <CityBadge cityName={comparisonCityName} isComparison />
          )}
          <Text size="sm" c={chartColors.textColor}>
            {data.compTotalPrecip.toFixed(2)} mm
          </Text>
        </div>
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
