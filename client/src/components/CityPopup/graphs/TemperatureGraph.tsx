import { useMemo, memo } from 'react';

import RechartsLineGraph, { type LineConfig } from './RechartsLineGraph';
import { useChartColors } from '@/hooks/useChartColors';
import {
  CITY1_PRIMARY_COLOR,
  CITY1_MAX_COLOR,
  CITY1_MIN_COLOR,
  CITY2_PRIMARY_COLOR,
  CITY2_MAX_COLOR,
  CITY2_MIN_COLOR,
} from '@/const';

import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';

interface TemperatureGraphProps {
  weeklyWeatherData: CityWeeklyWeather;
  comparisonWeeklyWeatherData?: CityWeeklyWeather | null;
}

const TemperatureGraph = ({
  weeklyWeatherData,
  comparisonWeeklyWeatherData,
}: TemperatureGraphProps) => {
  // Get theme-aware colors
  const chartColors = useChartColors();

  // Generate unique city key for animation control
  const cityKey = `${weeklyWeatherData.city}-${weeklyWeatherData.lat}-${weeklyWeatherData.long}`;

  // Transform weekly weather data for chart - filter out weeks with no temperature data
  // Merge main city data with comparison city data
  const chartData = useMemo(() => {
    const mainData = weeklyWeatherData.weeklyData
      .filter(
        (week) =>
          week.avgTemp !== null ||
          week.maxTemp !== null ||
          week.minTemp !== null
      )
      .map((week) => ({
        week: week.week,
        avgTemp: week.avgTemp,
        maxTemp: week.maxTemp,
        minTemp: week.minTemp,
        daysWithData: week.daysWithData,
      }));

    // If we have comparison data, merge it
    if (comparisonWeeklyWeatherData) {
      return mainData.map((mainWeek) => {
        const compWeek = comparisonWeeklyWeatherData.weeklyData.find(
          (w) => w.week === mainWeek.week
        );
        return {
          ...mainWeek,
          compAvgTemp: compWeek?.avgTemp ?? null,
          compMaxTemp: compWeek?.maxTemp ?? null,
          compMinTemp: compWeek?.minTemp ?? null,
        };
      });
    }

    return mainData;
  }, [weeklyWeatherData.weeklyData, comparisonWeeklyWeatherData]);

  // Configure temperature lines
  const lines: LineConfig[] = useMemo(() => {
    const mainCityName = comparisonWeeklyWeatherData
      ? weeklyWeatherData.city.substring(0, 3) + '.'
      : weeklyWeatherData.city;
    const compCityName =
      comparisonWeeklyWeatherData?.city.substring(0, 3) + '.';

    // City 1 (main): Blue shades
    const baseLines: LineConfig[] = [
      {
        dataKey: 'maxTemp',
        name: `${mainCityName} Max`,
        stroke: CITY1_MAX_COLOR,
        strokeWidth: 2,
        dot: false,
        connectNulls: true,
      },
      {
        dataKey: 'avgTemp',
        name: `${mainCityName} Avg`,
        stroke: CITY1_PRIMARY_COLOR,
        strokeWidth: 2.5,
        dot: false,
        connectNulls: true,
      },
      {
        dataKey: 'minTemp',
        name: `${mainCityName} Min`,
        stroke: CITY1_MIN_COLOR,
        strokeWidth: 2,
        dot: false,
        connectNulls: true,
      },
    ];

    // City 2 (comparison): Purple shades
    if (comparisonWeeklyWeatherData) {
      baseLines.push(
        {
          dataKey: 'compMaxTemp',
          name: `${compCityName} Max`,
          stroke: CITY2_MAX_COLOR,
          strokeWidth: 2,
          dot: false,
          connectNulls: true,
        },
        {
          dataKey: 'compAvgTemp',
          name: `${compCityName} Avg`,
          stroke: CITY2_PRIMARY_COLOR,
          strokeWidth: 2.5,
          dot: false,
          connectNulls: true,
        },
        {
          dataKey: 'compMinTemp',
          name: `${compCityName} Min`,
          stroke: CITY2_MIN_COLOR,
          strokeWidth: 2,
          dot: false,
          connectNulls: true,
        }
      );
    }

    return baseLines;
  }, [chartColors, weeklyWeatherData.city, comparisonWeeklyWeatherData]);

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
      margin={{ left: 0, bottom: 5 }}
    />
  );
};

export default memo(TemperatureGraph);
