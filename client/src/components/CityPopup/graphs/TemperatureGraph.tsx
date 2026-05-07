import { useMemo, memo, useCallback } from 'react';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import type { ChartHoverState } from '@/types/chartTypes';
import type { RibbonHoverPayload } from '@/types/cityPopupTypes';

import RechartsLineGraph, {
  type LineConfig,
  type AreaConfig,
} from './RechartsLineGraph';
import type { ReferenceLineConfig } from '@/types/chartTypes';
import { useAppStore } from '@/stores/useAppStore';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import { weekRangeLabel } from '@/utils/dateFormatting/weekRangeLabel';
import { dateToWeekOfYear } from '@/utils/dateFormatting/dateToWeekOfYear';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';

interface TemperatureGraphProps {
  weeklyWeatherData: CityWeeklyWeather;
  comparisonWeeklyWeatherData?: CityWeeklyWeather | null;
  selectedDate?: string;
  onHover?: (payload: RibbonHoverPayload | null) => void;
}

interface TemperatureChartRow {
  week: number;
  avgTemp: number | null;
  maxTemp: number | null;
  minTemp: number | null;
  tempRange: [number, number] | null;
  compAvgTemp: number | null;
  compMaxTemp: number | null;
  compMinTemp: number | null;
  compTempRange: [number, number] | null;
  [key: string]: string | number | [number, number] | null | undefined;
}

const TemperatureGraph = ({
  weeklyWeatherData,
  comparisonWeeklyWeatherData,
  selectedDate,
  onHover,
}: TemperatureGraphProps) => {
  const temperatureUnit = useAppStore((state) => state.temperatureUnit);

  const chartData = useMemo<TemperatureChartRow[]>(() => {
    const toRange = (
      minTemp: number | null,
      maxTemp: number | null
    ): [number, number] | null =>
      minTemp !== null && maxTemp !== null ? [minTemp, maxTemp] : null;

    return weeklyWeatherData.weeklyData
      .filter(
        (w) => w.avgTemp !== null || w.maxTemp !== null || w.minTemp !== null
      )
      .map((w) => {
        const c = comparisonWeeklyWeatherData?.weeklyData.find(
          (cc) => cc.week === w.week
        );
        const compMin = c?.minTemp ?? null;
        const compMax = c?.maxTemp ?? null;
        return {
          week: w.week,
          avgTemp: w.avgTemp,
          maxTemp: w.maxTemp,
          minTemp: w.minTemp,
          tempRange: toRange(w.minTemp, w.maxTemp),
          compAvgTemp: c?.avgTemp ?? null,
          compMaxTemp: compMax,
          compMinTemp: compMin,
          compTempRange: toRange(compMin, compMax),
        };
      });
  }, [weeklyWeatherData.weeklyData, comparisonWeeklyWeatherData]);

  // Areas: subtle filled envelope per city under the max/min strokes. Uses
  // tuple-valued data fields so recharts draws baseline=min, top=max natively.
  const areas: AreaConfig[] = useMemo(() => {
    const list: AreaConfig[] = [
      {
        dataKey: 'tempRange',
        fill: CITY1_PRIMARY_COLOR,
        fillOpacity: 0.12,
      },
    ];
    if (comparisonWeeklyWeatherData) {
      list.push({
        dataKey: 'compTempRange',
        fill: CITY2_PRIMARY_COLOR,
        fillOpacity: 0.12,
      });
    }
    return list;
  }, [comparisonWeeklyWeatherData]);

  // Three lines per city — max and min as thin envelope strokes, avg as the
  // heavier focal line. All three populate the hover popover, ordered
  // Max -> Avg -> Min so the popover rows render top-down high-to-low.
  const lines: LineConfig[] = useMemo(() => {
    const cityName = weeklyWeatherData.city;
    const list: LineConfig[] = [
      {
        dataKey: 'maxTemp',
        name: cityName,
        stroke: CITY1_PRIMARY_COLOR,
        strokeWidth: 1,
        strokeOpacity: 0.55,
        dot: false,
        connectNulls: true,
        cityRole: 'main',
        metricLabel: 'Max',
      },
      {
        dataKey: 'avgTemp',
        name: cityName,
        stroke: CITY1_PRIMARY_COLOR,
        strokeWidth: 2,
        dot: false,
        connectNulls: true,
        cityRole: 'main',
        metricLabel: 'Avg',
      },
      {
        dataKey: 'minTemp',
        name: cityName,
        stroke: CITY1_PRIMARY_COLOR,
        strokeWidth: 1,
        strokeOpacity: 0.55,
        dot: false,
        connectNulls: true,
        cityRole: 'main',
        metricLabel: 'Min',
      },
    ];
    if (comparisonWeeklyWeatherData) {
      const compName = comparisonWeeklyWeatherData.city;
      list.push(
        {
          dataKey: 'compMaxTemp',
          name: compName,
          stroke: CITY2_PRIMARY_COLOR,
          strokeWidth: 1,
          strokeOpacity: 0.55,
          dot: false,
          connectNulls: true,
          cityRole: 'comparison',
          metricLabel: 'Max',
        },
        {
          dataKey: 'compAvgTemp',
          name: compName,
          stroke: CITY2_PRIMARY_COLOR,
          strokeWidth: 2,
          dot: false,
          connectNulls: true,
          cityRole: 'comparison',
          metricLabel: 'Avg',
        },
        {
          dataKey: 'compMinTemp',
          name: compName,
          stroke: CITY2_PRIMARY_COLOR,
          strokeWidth: 1,
          strokeOpacity: 0.55,
          dot: false,
          connectNulls: true,
          cityRole: 'comparison',
          metricLabel: 'Min',
        }
      );
    }
    return list;
  }, [weeklyWeatherData.city, comparisonWeeklyWeatherData]);

  const referenceLines: ReferenceLineConfig[] = useMemo(() => {
    const week = dateToWeekOfYear(selectedDate);
    if (week === null) return [];
    return [
      {
        x: week,
        stroke: 'var(--mantine-color-dimmed)',
        strokeWidth: 1,
        strokeDasharray: '3 3',
      },
    ];
  }, [selectedDate]);

  const handleHover = useCallback(
    (state: ChartHoverState | null) => {
      if (!onHover) return;
      if (!state) {
        onHover(null);
        return;
      }
      const point = chartData[state.activeIndex];
      if (!point) {
        onHover(null);
        return;
      }
      const compAvg = point.compAvgTemp;
      onHover({
        label: weekRangeLabel(point.week),
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
      xAxisDataKey="week"
      lines={lines}
      areas={areas}
      referenceLines={referenceLines}
      yTickFormatter={(v) => `${v}°`}
      yDomain={[
        (dataMin: number) => Math.floor(dataMin) - 1,
        (dataMax: number) => Math.ceil(dataMax) + 1,
      ]}
      formatTooltipLabel={(raw) =>
        typeof raw === 'number' ? weekRangeLabel(raw) : String(raw)
      }
      onHover={handleHover}
    />
  );
};

export default memo(TemperatureGraph);
