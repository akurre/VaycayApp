import { Text } from '@mantine/core';
import { useChartColors } from '@/hooks/useChartColors';
import { getWeekDateRange } from '@/utils/dateFormatting/getWeekDateRange';
import CityBadge from './CityBadge';

interface TooltipPayload {
  payload: {
    week: number;
    avgTemp: number | null;
    maxTemp: number | null;
    minTemp: number | null;
    compAvgTemp?: number | null;
    compMaxTemp?: number | null;
    compMinTemp?: number | null;
    daysWithData: number;
  };
}

interface TemperatureGraphTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<TooltipPayload>;
  cityName?: string;
  comparisonCityName?: string;
}

const TemperatureGraphTooltip = ({
  active,
  payload,
  cityName,
  comparisonCityName,
}: TemperatureGraphTooltipProps) => {
  const chartColors = useChartColors();

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;
  const dateRange = getWeekDateRange(data.week);

  const hasMainData =
    data.avgTemp !== null || data.maxTemp !== null || data.minTemp !== null;
  const hasCompData =
    (data.compAvgTemp !== null && data.compAvgTemp !== undefined) ||
    (data.compMaxTemp !== null && data.compMaxTemp !== undefined) ||
    (data.compMinTemp !== null && data.compMinTemp !== undefined);

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

      {/* Two column layout */}
      {(hasMainData || hasCompData) && (
        <div className="flex gap-4">
          {/* Column 1: Main city temperatures */}
          {hasMainData && (
            <div className="flex-1">
              {cityName && <CityBadge cityName={cityName} mb={2} />}
              {data.maxTemp !== null && (
                <Text size="sm" c={chartColors.textColor}>
                  Max: {data.maxTemp.toFixed(1)}°C
                </Text>
              )}
              {data.avgTemp !== null && (
                <Text size="sm" c={chartColors.textColor}>
                  Avg: {data.avgTemp.toFixed(1)}°C
                </Text>
              )}
              {data.minTemp !== null && (
                <Text size="sm" c={chartColors.textColor}>
                  Min: {data.minTemp.toFixed(1)}°C
                </Text>
              )}
            </div>
          )}

          {/* Column 2: Comparison city temperatures */}
          {hasCompData && (
            <div className="flex-1">
              {comparisonCityName && (
                <CityBadge cityName={comparisonCityName} isComparison mb={2} />
              )}
              {data.compMaxTemp !== null && data.compMaxTemp !== undefined && (
                <Text size="sm" c={chartColors.textColor}>
                  Max: {data.compMaxTemp.toFixed(1)}°C
                </Text>
              )}
              {data.compAvgTemp !== null && data.compAvgTemp !== undefined && (
                <Text size="sm" c={chartColors.textColor}>
                  Avg: {data.compAvgTemp.toFixed(1)}°C
                </Text>
              )}
              {data.compMinTemp !== null && data.compMinTemp !== undefined && (
                <Text size="sm" c={chartColors.textColor}>
                  Min: {data.compMinTemp.toFixed(1)}°C
                </Text>
              )}
            </div>
          )}
        </div>
      )}

      {/* Show N/A if no data */}
      {!hasMainData && !hasCompData && (
        <Text size="sm" c={chartColors.textColor}>
          No data
        </Text>
      )}
    </div>
  );
};

export default TemperatureGraphTooltip;
