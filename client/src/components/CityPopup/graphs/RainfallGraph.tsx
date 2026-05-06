import { useMemo, memo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { CategoricalChartFunc } from 'recharts/types/chart/types';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import type { RibbonHoverPayload } from '@/types/cityPopupTypes';
import { useChartColors } from '@/hooks/useChartColors';
import { weekRangeLabel } from '@/utils/dateFormatting/weekRangeLabel';
import { dateToWeekOfYear } from '@/utils/dateFormatting/dateToWeekOfYear';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';

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
  const selectedWeek = useMemo(
    () => dateToWeekOfYear(selectedDate),
    [selectedDate]
  );

  const { chartData, hasMainData, hasCompData } = useMemo(() => {
    const normalize = (w: {
      totalPrecip: number | null;
      daysWithData: number;
    }) =>
      w.totalPrecip !== null && w.daysWithData > 0
        ? (w.totalPrecip / w.daysWithData) * 7
        : null;

    const mainData = weeklyWeatherData
      ? weeklyWeatherData.weeklyData
          .filter((w) => w.totalPrecip !== null || w.avgPrecip !== null)
          .map((w) => ({
            week: w.week,
            totalPrecip: normalize(w),
            avgPrecip: w.avgPrecip,
          }))
      : [];

    const compData = comparisonWeeklyWeatherData
      ? comparisonWeeklyWeatherData.weeklyData
          .filter((w) => w.totalPrecip !== null || w.avgPrecip !== null)
          .map((w) => ({
            week: w.week,
            totalPrecip: normalize(w),
            avgPrecip: w.avgPrecip,
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
        };
      });
    } else if (mainData.length === 0 && compData.length > 0) {
      finalChartData = compData.map((w) => ({
        week: w.week,
        compTotalPrecip: w.totalPrecip,
        compAvgPrecip: w.avgPrecip,
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

  const handleMouseMove: CategoricalChartFunc = useCallback(
    (state) => {
      if (!onHover) return;
      const idx = state.activeTooltipIndex;
      if (idx === undefined || idx === null || typeof idx === 'string') {
        onHover(null);
        return;
      }
      const point = chartData[idx] as
        | {
            week: number;
            totalPrecip?: number | null;
            compTotalPrecip?: number | null;
          }
        | undefined;
      if (!point) {
        onHover(null);
        return;
      }
      const c1 = point.totalPrecip ?? null;
      const c2 = point.compTotalPrecip ?? null;
      onHover({
        label: `Week ${point.week}`,
        v1: c1 === null ? null : `${Math.round(c1)}mm`,
        v2: c2 === null ? null : `${Math.round(c2)}mm`,
      });
    },
    [chartData, onHover]
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
            tickFormatter={(v) => `${v}mm`}
          />

          <Tooltip
            cursor={{
              fill: 'var(--mantine-color-dimmed)',
              fillOpacity: 0.08,
            }}
            wrapperStyle={{ outline: 'none' }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;

              const formatValue = (v: unknown) =>
                typeof v === 'number' ? `${Math.round(v)}mm` : String(v);

              interface Item {
                cityRole: 'main' | 'comparison';
                color: string;
                formatted: string;
              }

              const items: Item[] = [];
              for (const p of payload) {
                if (p.value === null || p.value === undefined) continue;
                const key = String(p.dataKey);
                const isComp = key === 'compTotalPrecip';
                if (isComp && !hasCompData) continue;
                if (!isComp && !hasMainData) continue;
                items.push({
                  cityRole: isComp ? 'comparison' : 'main',
                  color:
                    (p.color as string | undefined) ??
                    (isComp ? CITY2_PRIMARY_COLOR : CITY1_PRIMARY_COLOR),
                  formatted: formatValue(p.value),
                });
              }
              if (items.length === 0) return null;

              const main = items.find((i) => i.cityRole === 'main');
              const comp = items.find((i) => i.cityRole === 'comparison');
              const headerLabel =
                typeof label === 'number' ? weekRangeLabel(label) : null;

              return (
                <div className="rounded-md px-2.5 py-1.5 text-[11px] tabular-nums bg-[var(--mantine-color-default-hover)] border border-[var(--mantine-color-default-border)] shadow-md">
                  {headerLabel && (
                    <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--mantine-color-dimmed)] mb-1">
                      {headerLabel}
                    </div>
                  )}
                  <div className="flex items-baseline gap-3">
                    {main && (
                      <span
                        className="font-semibold"
                        style={{ color: main.color }}
                      >
                        {main.formatted}
                      </span>
                    )}
                    {comp && (
                      <span
                        className="font-semibold"
                        style={{ color: comp.color }}
                      >
                        {comp.formatted}
                      </span>
                    )}
                  </div>
                </div>
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
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(RainfallGraph);
