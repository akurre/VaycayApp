import { Text } from '@mantine/core';
import { useChartColors } from '@/hooks/useChartColors';
import { getWeekDateRange } from '@/utils/dateFormatting/getWeekDateRange';
import CityBadge from './CityBadge';
import { useAppStore } from '@/stores/useAppStore';
import {
  convertTemperature,
  getTemperatureUnitSymbol,
} from '@/utils/tempFormatting/convertTemperature';

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
  const temperatureUnit = useAppStore((state) => state.temperatureUnit);
  const unitSymbol = getTemperatureUnitSymbol(temperatureUnit);

  // Defensive check: ensure we have valid payload data
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0]?.payload;

  // Additional safety check: ensure data object exists
  if (!data) {
    return null;
  }

  const dateRange = getWeekDateRange(data.week);

  const hasMainData =
    typeof data.avgTemp === 'number' ||
    typeof data.maxTemp === 'number' ||
    typeof data.minTemp === 'number';
  const hasCompData =
    typeof data.compAvgTemp === 'number' ||
    typeof data.compMaxTemp === 'number' ||
    typeof data.compMinTemp === 'number';

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
              {typeof data.maxTemp === 'number' && (
                <Text size="sm" c={chartColors.textColor}>
                  Max:{' '}
                  {convertTemperature(data.maxTemp, temperatureUnit).toFixed(1)}
                  {unitSymbol}
                </Text>
              )}
              {typeof data.avgTemp === 'number' && (
                <Text size="sm" c={chartColors.textColor}>
                  Avg:{' '}
                  {convertTemperature(data.avgTemp, temperatureUnit).toFixed(1)}
                  {unitSymbol}
                </Text>
              )}
              {typeof data.minTemp === 'number' && (
                <Text size="sm" c={chartColors.textColor}>
                  Min:{' '}
                  {convertTemperature(data.minTemp, temperatureUnit).toFixed(1)}
                  {unitSymbol}
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
              {typeof data.compMaxTemp === 'number' && (
                <Text size="sm" c={chartColors.textColor}>
                  Max:{' '}
                  {convertTemperature(
                    data.compMaxTemp,
                    temperatureUnit
                  ).toFixed(1)}
                  {unitSymbol}
                </Text>
              )}
              {typeof data.compAvgTemp === 'number' && (
                <Text size="sm" c={chartColors.textColor}>
                  Avg:{' '}
                  {convertTemperature(
                    data.compAvgTemp,
                    temperatureUnit
                  ).toFixed(1)}
                  {unitSymbol}
                </Text>
              )}
              {typeof data.compMinTemp === 'number' && (
                <Text size="sm" c={chartColors.textColor}>
                  Min:{' '}
                  {convertTemperature(
                    data.compMinTemp,
                    temperatureUnit
                  ).toFixed(1)}
                  {unitSymbol}
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
