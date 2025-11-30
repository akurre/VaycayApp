import { useMemo, memo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import { useChartColors } from '@/hooks/useChartColors';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';
import RainfallGraphTooltip from './RainfallGraphTooltip';

interface RainfallGraphProps {
  weeklyWeatherData: CityWeeklyWeather | null;
  comparisonWeeklyWeatherData?: CityWeeklyWeather | null;
}

const RainfallGraph = ({
  weeklyWeatherData,
  comparisonWeeklyWeatherData,
}: RainfallGraphProps) => {
  // Get theme-aware colors
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

  // Memoize custom tooltip render function
  const renderCustomTooltip = useCallback(
    (props: {
      active?: boolean;
      payload?: ReadonlyArray<{
        payload: Record<string, number | null | undefined>;
      }>;
    }) => (
      <RainfallGraphTooltip
        active={props.active}
        payload={
          props.payload as ReadonlyArray<{
            payload: {
              week: number;
              totalPrecip: number | null;
              avgPrecip: number | null;
              compTotalPrecip?: number | null;
              compAvgPrecip?: number | null;
              daysWithRain: number | null;
              daysWithData: number;
            };
          }>
        }
        cityName={weeklyWeatherData?.city}
        comparisonCityName={comparisonWeeklyWeatherData?.city}
      />
    ),
    [weeklyWeatherData?.city, comparisonWeeklyWeatherData?.city]
  );

  // use whichever data is available for the base chart structure
  const baseData = weeklyWeatherData ?? comparisonWeeklyWeatherData;

  // if neither exists, return null (shouldn't happen due to WeatherDataSection check)
  if (!baseData) return null;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />

          {/* X Axis */}
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12, fill: chartColors.textColor }}
            stroke={chartColors.axisColor}
            label={{
              value: 'Week of Year',
              position: 'insideBottom',
              offset: -5,
              style: { fontSize: 12, fill: chartColors.textColor },
            }}
          />

          {/* Y Axis */}
          <YAxis
            tick={{ fontSize: 12, fill: chartColors.textColor }}
            stroke={chartColors.axisColor}
            label={{
              value: 'Precipitation (mm)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12, fill: chartColors.textColor },
            }}
          />

          {/* Tooltip */}
          <Tooltip content={renderCustomTooltip} />

          {/* Legend */}
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingLeft: '13px' }}
            layout="horizontal"
            verticalAlign="top"
            align="center"
            iconType="rect"
          />

          {/* Bars - City 1 (blue), City 2 (purple) */}
          {hasMainData && (
            <Bar
              dataKey="totalPrecip"
              name={
                hasCompData
                  ? `${weeklyWeatherData!.city} Total Precip`
                  : 'Total Precipitation'
              }
              fill={CITY1_PRIMARY_COLOR}
              radius={[4, 4, 0, 0]}
            />
          )}
          {hasCompData && (
            <Bar
              dataKey="compTotalPrecip"
              name={`${comparisonWeeklyWeatherData!.city} Total Precip`}
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
