import { useMemo, memo, useCallback } from 'react';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import type { ChartHoverState } from '@/types/chartTypes';
import type { RibbonHoverPayload } from '@/types/cityPopupTypes';

import RechartsLineGraph, {
  type LineConfig,
  type AreaConfig,
} from './RechartsLineGraph';
import { useAppStore } from '@/stores/useAppStore';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';

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

  const chartData = useMemo(() => {
    const main = weeklyWeatherData.weeklyData
      .filter(
        (w) =>
          w.avgTemp !== null || w.maxTemp !== null || w.minTemp !== null
      )
      .map((w) => ({
        week: w.week,
        avgTemp: w.avgTemp,
        maxTemp: w.maxTemp,
        minTemp: w.minTemp,
      }));

    if (!comparisonWeeklyWeatherData) return main;

    return main.map((m) => {
      const c = comparisonWeeklyWeatherData.weeklyData.find(
        (cc) => cc.week === m.week
      );
      return {
        ...m,
        compAvgTemp: c?.avgTemp ?? null,
        compMaxTemp: c?.maxTemp ?? null,
        compMinTemp: c?.minTemp ?? null,
      };
    });
  }, [weeklyWeatherData.weeklyData, comparisonWeeklyWeatherData]);

  // Areas: subtle filled envelope per city under the max/min strokes.
  const areas: AreaConfig[] = useMemo(() => {
    const list: AreaConfig[] = [
      {
        dataKey: 'maxTemp',
        baseDataKey: 'minTemp',
        fill: CITY1_PRIMARY_COLOR,
        fillOpacity: 0.12,
      },
    ];
    if (comparisonWeeklyWeatherData) {
      list.push({
        dataKey: 'compMaxTemp',
        baseDataKey: 'compMinTemp',
        fill: CITY2_PRIMARY_COLOR,
        fillOpacity: 0.12,
      });
    }
    return list;
  }, [comparisonWeeklyWeatherData]);

  // Three lines per city — max and min as thin envelope strokes, avg as the
  // heavier focal line. All three populate the hover popover.
  const lines: LineConfig[] = useMemo(() => {
    const cityName = weeklyWeatherData.city;
    const list: LineConfig[] = [
      {
        dataKey: 'maxTemp',
        name: `${cityName} max`,
        stroke: CITY1_PRIMARY_COLOR,
        strokeWidth: 1,
        strokeOpacity: 0.55,
        dot: false,
        connectNulls: true,
      },
      {
        dataKey: 'minTemp',
        name: `${cityName} min`,
        stroke: CITY1_PRIMARY_COLOR,
        strokeWidth: 1,
        strokeOpacity: 0.55,
        dot: false,
        connectNulls: true,
      },
      {
        dataKey: 'avgTemp',
        name: cityName,
        stroke: CITY1_PRIMARY_COLOR,
        strokeWidth: 2,
        dot: false,
        connectNulls: true,
      },
    ];
    if (comparisonWeeklyWeatherData) {
      const compName = comparisonWeeklyWeatherData.city;
      list.push(
        {
          dataKey: 'compMaxTemp',
          name: `${compName} max`,
          stroke: CITY2_PRIMARY_COLOR,
          strokeWidth: 1,
          strokeOpacity: 0.55,
          dot: false,
          connectNulls: true,
        },
        {
          dataKey: 'compMinTemp',
          name: `${compName} min`,
          stroke: CITY2_PRIMARY_COLOR,
          strokeWidth: 1,
          strokeOpacity: 0.55,
          dot: false,
          connectNulls: true,
        },
        {
          dataKey: 'compAvgTemp',
          name: compName,
          stroke: CITY2_PRIMARY_COLOR,
          strokeWidth: 2,
          dot: false,
          connectNulls: true,
        }
      );
    }
    return list;
  }, [weeklyWeatherData.city, comparisonWeeklyWeatherData]);

  const cityKey = `${weeklyWeatherData.city}-${weeklyWeatherData.lat}-${weeklyWeatherData.long}`;

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
      areas={areas}
      referenceLines={[]}
      showLegend={false}
      yTickFormatter={(v) => `${v}°`}
      onHover={handleHover}
    />
  );
};

export default memo(TemperatureGraph);
