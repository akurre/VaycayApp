import { useMemo, memo } from 'react';

import RechartsLineGraph, { type LineConfig } from './RechartsLineGraph';
import { useChartColors } from '@/hooks/useChartColors';

import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';

interface TemperatureGraphProps {
  weeklyWeatherData: CityWeeklyWeather;
}

const TemperatureGraph = ({ weeklyWeatherData }: TemperatureGraphProps) => {
  // Get theme-aware colors
  const chartColors = useChartColors();

  // Generate unique city key for animation control
  const cityKey = `${weeklyWeatherData.city}-${weeklyWeatherData.lat}-${weeklyWeatherData.long}`;

  // Transform weekly weather data for chart - filter out weeks with no temperature data
  const chartData = useMemo(
    () =>
      weeklyWeatherData.weeklyData
        .filter((week) => week.avgTemp !== null || week.maxTemp !== null || week.minTemp !== null)
        .map((week) => ({
          week: week.week,
          avgTemp: week.avgTemp,
          maxTemp: week.maxTemp,
          minTemp: week.minTemp,
          daysWithData: week.daysWithData,
        })),
    [weeklyWeatherData.weeklyData]
  );

  // Configure temperature lines
  const lines: LineConfig[] = useMemo(
    () => [
      {
        dataKey: 'maxTemp',
        name: 'Max Temp',
        stroke: chartColors.maxLineColor || '#ef4444', // red
        strokeWidth: 2,
        dot: false,
        connectNulls: true,
      },
      {
        dataKey: 'avgTemp',
        name: 'Avg Temp',
        stroke: chartColors.lineColor || '#3b82f6', // blue
        strokeWidth: 2.5,
        dot: false,
        connectNulls: true,
      },
      {
        dataKey: 'minTemp',
        name: 'Min Temp',
        stroke: chartColors.textColor || '#06b6d4', // cyan
        strokeWidth: 2,
        dot: false,
        connectNulls: true,
      },
    ],
    [chartColors]
  );

  return (
    <RechartsLineGraph
      data={chartData}
      cityKey={cityKey}
      xAxisDataKey="week"
      xAxisLabel="Week of Year"
      yAxisLabel="Temperature (°C)"
      lines={lines}
      referenceLines={[]}
      showLegend={true}
      legendLayout="horizontal"
      legendVerticalAlign="top"
      legendAlign="center"
      margin={{ left: 0 }}
    />
  );
};

export default memo(TemperatureGraph);
