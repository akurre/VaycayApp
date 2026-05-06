import { useMemo, memo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import type { CategoricalChartFunc } from 'recharts/types/chart/types';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import type { RibbonHoverPayload } from '@/types/cityPopupTypes';
import { useChartColors } from '@/hooks/useChartColors';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';

interface RainfallGraphProps {
  weeklyWeatherData: CityWeeklyWeather | null;
  comparisonWeeklyWeatherData?: CityWeeklyWeather | null;
  onHover?: (payload: RibbonHoverPayload | null) => void;
}

const RainfallGraph = ({
  weeklyWeatherData,
  comparisonWeeklyWeatherData,
  onHover,
}: RainfallGraphProps) => {
  const chartColors = useChartColors();

  // Transform weekly weather data for chart - filter out weeks with no precipitation data
  // to prevent displaying zero values where no measurements exist
  // Merge main city data with comparison city data
  const { chartData, hasMainData, hasCompData } = useMemo(() => {
    // process main city data if it exists
    const mainData = weeklyWeatherData
      ? weeklyWeatherData.weeklyData
          .filter(
            (week) => week.totalPrecip !== null || week.avgPrecip !== null
          )
          .map((week) => {
            // normalize totalPrecip to get average weekly precipitation
            const normalizedTotalPrecip =
              week.totalPrecip !== null && week.daysWithData > 0
                ? (week.totalPrecip / week.daysWithData) * 7
                : null;

            return {
              week: week.week,
              totalPrecip: normalizedTotalPrecip,
              avgPrecip: week.avgPrecip,
              daysWithRain: week.daysWithRain,
              daysWithData: week.daysWithData,
            };
          })
      : [];

    // process comparison city data if it exists
    const compData = comparisonWeeklyWeatherData
      ? comparisonWeeklyWeatherData.weeklyData
          .filter(
            (week) => week.totalPrecip !== null || week.avgPrecip !== null
          )
          .map((week) => {
            const normalizedTotalPrecip =
              week.totalPrecip !== null && week.daysWithData > 0
                ? (week.totalPrecip / week.daysWithData) * 7
                : null;

            return {
              week: week.week,
              totalPrecip: normalizedTotalPrecip,
              avgPrecip: week.avgPrecip,
              daysWithRain: week.daysWithRain,
              daysWithData: week.daysWithData,
            };
          })
      : [];

    // use base data structure from whichever city has data
    const baseStructure = mainData.length > 0 ? mainData : compData;

    // determine final chart data based on what data exists
    let finalChartData;

    // if we have both datasets with actual data, merge them
    if (mainData.length > 0 && compData.length > 0) {
      finalChartData = baseStructure.map((baseWeek) => {
        const compWeek = compData.find((w) => w.week === baseWeek.week);

        return {
          ...baseWeek,
          compTotalPrecip: compWeek?.totalPrecip ?? null,
          compAvgPrecip: compWeek?.avgPrecip ?? null,
        };
      });
    }
    // if only comparison data exists, use comparison data directly
    // don't include totalPrecip field at all to avoid duplicate rendering
    else if (mainData.length === 0 && compData.length > 0) {
      finalChartData = compData.map((week) => ({
        week: week.week,
        compTotalPrecip: week.totalPrecip,
        compAvgPrecip: week.avgPrecip,
        daysWithRain: week.daysWithRain,
        daysWithData: week.daysWithData,
      }));
    }
    // fallback: only main data exists
    else {
      finalChartData = baseStructure;
    }

    return {
      chartData: finalChartData,
      hasMainData: mainData.length > 0,
      hasCompData: compData.length > 0,
    };
  }, [weeklyWeatherData, comparisonWeeklyWeatherData]);

  // use whichever data is available for the base chart structure
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

  // if neither exists, return null (shouldn't happen due to WeatherDataSection check)
  if (!baseData) return null;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />

          <XAxis
            dataKey="week"
            tick={false}
            stroke={chartColors.axisColor}
          />

          <YAxis
            orientation="right"
            tick={{ fontSize: 12, fill: chartColors.textColor }}
            stroke={chartColors.axisColor}
          />

          {hasMainData && (
            <Bar
              dataKey="totalPrecip"
              name={
                hasCompData && weeklyWeatherData
                  ? weeklyWeatherData.city
                  : 'Total Precipitation'
              }
              fill={CITY1_PRIMARY_COLOR}
              radius={[4, 4, 0, 0]}
            />
          )}
          {hasCompData && (
            <Bar
              dataKey="compTotalPrecip"
              name={comparisonWeeklyWeatherData?.city ?? ''}
              fill={hasMainData ? CITY2_PRIMARY_COLOR : CITY1_PRIMARY_COLOR}
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(RainfallGraph);
