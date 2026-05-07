import { useMemo, memo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { CategoricalChartFunc } from 'recharts/types/chart/types';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import type { RibbonHoverPayload } from '@/types/cityPopupTypes';
import { useChartColors } from '@/hooks/useChartColors';
import { useAppStore } from '@/stores/useAppStore';
import { dateToWeekOfYear } from '@/utils/dateFormatting/dateToWeekOfYear';
import { normalizeWeekPrecip } from '@/utils/dataFormatting/normalizeWeekPrecip';
import { normalizeRainyDays } from '@/utils/dataFormatting/normalizeRainyDays';
import { formatPrecipitation } from '@/utils/dataFormatting/formatPrecipitation';
import { formatRainyDays } from '@/utils/dataFormatting/formatRainyDays';
import {
  CITY1_PRIMARY_COLOR,
  CITY1_TODAY_COLOR,
  CITY2_PRIMARY_COLOR,
  CITY2_TODAY_COLOR,
} from '@/const';
import RainfallGraphTooltip from './RainfallGraphTooltip';
import { buildTodayDot } from './utils/buildTodayDot';

interface RainfallGraphProps {
  weeklyWeatherData: CityWeeklyWeather | null;
  comparisonWeeklyWeatherData?: CityWeeklyWeather | null;
  selectedDate?: string;
  onHover?: (payload: RibbonHoverPayload | null) => void;
}

const RainfallGraph = ({
  weeklyWeatherData,
  comparisonWeeklyWeatherData,
  selectedDate,
  onHover,
}: RainfallGraphProps) => {
  const chartColors = useChartColors();
  const temperatureUnit = useAppStore((s) => s.temperatureUnit);
  const selectedWeek = useMemo(
    () => dateToWeekOfYear(selectedDate),
    [selectedDate]
  );

  const { chartData, hasMainData, hasCompData } = useMemo(() => {
    const mainData = weeklyWeatherData
      ? weeklyWeatherData.weeklyData
          .filter((w) => w.totalPrecip !== null || w.avgPrecip !== null)
          .map((w) => ({
            week: w.week,
            totalPrecip: normalizeWeekPrecip(w),
            avgPrecip: w.avgPrecip,
            daysWithRain: normalizeRainyDays(w),
          }))
      : [];

    const compData = comparisonWeeklyWeatherData
      ? comparisonWeeklyWeatherData.weeklyData
          .filter((w) => w.totalPrecip !== null || w.avgPrecip !== null)
          .map((w) => ({
            week: w.week,
            totalPrecip: normalizeWeekPrecip(w),
            avgPrecip: w.avgPrecip,
            daysWithRain: normalizeRainyDays(w),
          }))
      : [];

    const baseStructure = mainData.length > 0 ? mainData : compData;
    let finalChartData;

    if (mainData.length > 0 && compData.length > 0) {
      finalChartData = baseStructure.map((b) => {
        const c = compData.find((w) => w.week === b.week);
        return {
          ...b,
          compTotalPrecip: c?.totalPrecip ?? null,
          compAvgPrecip: c?.avgPrecip ?? null,
          compDaysWithRain: c?.daysWithRain ?? null,
        };
      });
    } else if (mainData.length === 0 && compData.length > 0) {
      finalChartData = compData.map((w) => ({
        week: w.week,
        compTotalPrecip: w.totalPrecip,
        compAvgPrecip: w.avgPrecip,
        compDaysWithRain: w.daysWithRain,
      }));
    } else {
      finalChartData = baseStructure;
    }

    return {
      chartData: finalChartData,
      hasMainData: mainData.length > 0,
      hasCompData: compData.length > 0,
    };
  }, [weeklyWeatherData, comparisonWeeklyWeatherData]);

  const baseData = weeklyWeatherData ?? comparisonWeeklyWeatherData;

  const todayDots = useMemo(() => {
    if (selectedWeek === null) return [];
    const point = chartData.find((p) => p.week === selectedWeek);
    if (!point) return [];
    const dots = [];
    const main =
      'totalPrecip' in point && point.totalPrecip != null
        ? point.totalPrecip
        : null;
    const comp =
      'compTotalPrecip' in point && point.compTotalPrecip != null
        ? point.compTotalPrecip
        : null;
    const isComparing = hasMainData && hasCompData;
    if (hasMainData && main !== null) {
      dots.push(
        buildTodayDot(
          selectedWeek,
          main,
          isComparing ? CITY1_TODAY_COLOR : undefined
        )
      );
    }
    if (hasCompData && comp !== null) {
      dots.push(
        buildTodayDot(
          selectedWeek,
          comp,
          isComparing ? CITY2_TODAY_COLOR : undefined
        )
      );
    }
    return dots;
  }, [selectedWeek, chartData, hasMainData, hasCompData]);

  const handleMouseMove: CategoricalChartFunc = useCallback(
    (state) => {
      if (!onHover) return;
      const idx = state.activeTooltipIndex;
      if (idx === undefined || idx === null || typeof idx === 'string') {
        onHover(null);
        return;
      }
      const point = chartData[idx];
      if (!point) {
        onHover(null);
        return;
      }
      const c1 = 'totalPrecip' in point ? (point.totalPrecip ?? null) : null;
      const c2 =
        'compTotalPrecip' in point ? (point.compTotalPrecip ?? null) : null;
      const days1 =
        'daysWithRain' in point ? (point.daysWithRain ?? null) : null;
      const days2 =
        'compDaysWithRain' in point ? (point.compDaysWithRain ?? null) : null;
      onHover({
        label: `Week ${point.week}`,
        v1: c1 === null ? null : formatPrecipitation(c1, temperatureUnit),
        v2: c2 === null ? null : formatPrecipitation(c2, temperatureUnit),
        subV1: formatRainyDays(days1),
        subV2: formatRainyDays(days2),
      });
    },
    [chartData, onHover, temperatureUnit]
  );

  const handleMouseLeave = useCallback(() => {
    if (onHover) onHover(null);
  }, [onHover]);

  if (!baseData) return null;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 28, left: 0, bottom: 0 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          barCategoryGap="20%"
        >
          <CartesianGrid
            strokeDasharray="2 4"
            stroke={chartColors.gridColor}
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="week"
            tick={false}
            axisLine={false}
            tickLine={false}
            height={0}
          />
          <YAxis
            orientation="right"
            tick={{
              fontSize: 9,
              fill: chartColors.textColor,
              fontFamily: 'system-ui, sans-serif',
            }}
            axisLine={false}
            tickLine={false}
            width={28}
            tickFormatter={(v) => formatPrecipitation(v, temperatureUnit)}
          />

          <Tooltip
            cursor={{
              fill: 'var(--mantine-color-dimmed)',
              fillOpacity: 0.08,
            }}
            wrapperStyle={{ outline: 'none' }}
            content={({ active, payload, label }) => {
              const weekNum = typeof label === 'number' ? label : undefined;
              const point = weekNum !== undefined ? chartData.find((p) => p.week === weekNum) : undefined;
              const days1 = point && 'daysWithRain' in point ? (point.daysWithRain ?? null) : null;
              const days2 = point && 'compDaysWithRain' in point ? (point.compDaysWithRain ?? null) : null;
              return (
                <RainfallGraphTooltip
                  active={active}
                  payload={payload}
                  label={
                    typeof label === 'string' || typeof label === 'number'
                      ? label
                      : undefined
                  }
                  hasMainData={hasMainData}
                  hasCompData={hasCompData}
                  temperatureUnit={temperatureUnit}
                  rainyDays1={formatRainyDays(days1)}
                  rainyDays2={formatRainyDays(days2)}
                />
              );
            }}
          />

          {selectedWeek !== null && (
            <ReferenceLine
              x={selectedWeek}
              stroke="var(--mantine-color-dimmed)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {hasMainData && (
            <Bar
              dataKey="totalPrecip"
              fill={CITY1_PRIMARY_COLOR}
              fillOpacity={0.85}
              radius={[1, 1, 0, 0]}
              isAnimationActive={false}
            />
          )}
          {hasCompData && (
            <Bar
              dataKey="compTotalPrecip"
              fill={hasMainData ? CITY2_PRIMARY_COLOR : CITY1_PRIMARY_COLOR}
              fillOpacity={0.85}
              radius={[1, 1, 0, 0]}
              isAnimationActive={false}
            />
          )}

          {todayDots.map((d) => (
            <ReferenceDot
              key={`today-${d.x}-${d.stroke}`}
              x={d.x}
              y={d.y}
              r={d.r}
              fill={d.fill}
              stroke={d.stroke}
              strokeWidth={d.strokeWidth}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(RainfallGraph);
