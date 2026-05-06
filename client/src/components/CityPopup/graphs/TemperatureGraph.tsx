import { useMemo, memo, useCallback } from 'react';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import type { ChartHoverState } from '@/types/chartTypes';
import type { RibbonHoverPayload } from '@/types/cityPopupTypes';

import RechartsLineGraph, { type LineConfig } from './RechartsLineGraph';
import { useAppStore } from '@/stores/useAppStore';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import {
  CITY1_PRIMARY_COLOR,
  CITY1_MAX_COLOR,
  CITY1_MIN_COLOR,
  CITY2_PRIMARY_COLOR,
  CITY2_MAX_COLOR,
  CITY2_MIN_COLOR,
} from '@/const';

interface TemperatureGraphProps {
  weeklyWeatherData: CityWeeklyWeather;
  comparisonWeeklyWeatherData?: CityWeeklyWeather | null;
  onHover?: (payload: RibbonHoverPayload | null) => void;
}

const TemperatureGraph = ({
  weeklyWeatherData,
  comparisonWeeklyWeatherData,
  onHover,
}: TemperatureGraphProps) => {
  const temperatureUnit = useAppStore((state) => state.temperatureUnit);

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

  // Configure temperature lines. The ribbon header carries city names and the
  // readout carries values, so per-line "Max/Avg/Min" suffixes (which only
  // existed for the legend) are dropped — distinct strokes still distinguish
  // them on hover via the underlying tooltip.
  const lines: LineConfig[] = useMemo(() => {
    const mainCityName = weeklyWeatherData.city;
    const compCityName = comparisonWeeklyWeatherData?.city ?? '';

    const baseLines: LineConfig[] = [
      {
        dataKey: 'maxTemp',
        name: mainCityName,
        stroke: CITY1_MAX_COLOR,
        strokeWidth: 2,
        dot: false,
        connectNulls: true,
      },
      {
        dataKey: 'avgTemp',
        name: mainCityName,
        stroke: CITY1_PRIMARY_COLOR,
        strokeWidth: 2.5,
        dot: false,
        connectNulls: true,
      },
      {
        dataKey: 'minTemp',
        name: mainCityName,
        stroke: CITY1_MIN_COLOR,
        strokeWidth: 2,
        dot: false,
        connectNulls: true,
      },
    ];

    if (comparisonWeeklyWeatherData) {
      baseLines.push(
        {
          dataKey: 'compMaxTemp',
          name: compCityName,
          stroke: CITY2_MAX_COLOR,
          strokeWidth: 2,
          dot: false,
          connectNulls: true,
        },
        {
          dataKey: 'compAvgTemp',
          name: compCityName,
          stroke: CITY2_PRIMARY_COLOR,
          strokeWidth: 2.5,
          dot: false,
          connectNulls: true,
        },
        {
          dataKey: 'compMinTemp',
          name: compCityName,
          stroke: CITY2_MIN_COLOR,
          strokeWidth: 2,
          dot: false,
          connectNulls: true,
        }
      );
    }

    return baseLines;
  }, [weeklyWeatherData.city, comparisonWeeklyWeatherData]);

  const handleHover = useCallback(
    (state: ChartHoverState | null) => {
      if (!onHover) return;
      if (!state) {
        onHover(null);
        return;
      }
      const point = chartData[state.activeIndex] as
        | {
            week: number;
            avgTemp: number | null;
            compAvgTemp?: number | null;
          }
        | undefined;
      if (!point) {
        onHover(null);
        return;
      }
      const compAvg = point.compAvgTemp ?? null;
      onHover({
        label: `Week ${point.week}`,
        v1:
          point.avgTemp == null
            ? null
            : (formatTemperature(point.avgTemp, temperatureUnit) ?? null),
        v2:
          compAvg == null
            ? null
            : (formatTemperature(compAvg, temperatureUnit) ?? null),
      });
    },
    [chartData, onHover, temperatureUnit]
  );

  return (
    <RechartsLineGraph
      data={chartData}
      cityKey={cityKey}
      xAxisDataKey="week"
      lines={lines}
      referenceLines={[]}
      showLegend={false}
      margin={{ left: 0, bottom: 5 }}
      onHover={handleHover}
    />
  );
};

export default memo(TemperatureGraph);
