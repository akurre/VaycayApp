import { useMemo, memo } from 'react';
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

interface RainfallGraphProps {
  weeklyWeatherData: CityWeeklyWeather;
  comparisonWeeklyWeatherData?: CityWeeklyWeather | null;
}

const RainfallGraph = ({ weeklyWeatherData, comparisonWeeklyWeatherData }: RainfallGraphProps) => {
  // Get theme-aware colors
  const chartColors = useChartColors();

  // Transform weekly weather data for chart - filter out weeks with no precipitation data
  // to prevent displaying zero values where no measurements exist
  // Merge main city data with comparison city data
  const chartData = useMemo(() => {
    const mainData = weeklyWeatherData.weeklyData
      .filter((week) => week.totalPrecip !== null || week.avgPrecip !== null)
      .map((week) => {
        // Normalize totalPrecip to get average weekly precipitation
        // This accounts for cities having different amounts of historical data
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
      });

    // If we have comparison data, merge it
    if (comparisonWeeklyWeatherData) {
      return mainData.map((mainWeek) => {
        const compWeek = comparisonWeeklyWeatherData.weeklyData.find(
          (w) => w.week === mainWeek.week
        );

        // Normalize comparison city's totalPrecip as well
        const normalizedCompTotalPrecip =
          compWeek?.totalPrecip !== null &&
          compWeek?.daysWithData !== undefined &&
          compWeek.daysWithData > 0
            ? (compWeek.totalPrecip / compWeek.daysWithData) * 7
            : null;

        return {
          ...mainWeek,
          compTotalPrecip: normalizedCompTotalPrecip,
          compAvgPrecip: compWeek?.avgPrecip ?? null,
        };
      });
    }

    return mainData;
  }, [weeklyWeatherData.weeklyData, comparisonWeeklyWeatherData]);

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
          <Tooltip
            contentStyle={{
              fontSize: 12,
              backgroundColor: chartColors.gridColor,
              borderColor: chartColors.axisColor,
            }}
            formatter={(value: string | number | (string | number)[]) => {
              // handle null/undefined values
              if (value === null || value === undefined) return 'N/A';
              // handle array values (shouldn't happen in this chart but type-safe)
              if (Array.isArray(value)) return 'N/A';
              // handle string values
              if (typeof value === 'string') return value;
              // handle number values
              return `${value.toFixed(2)} mm`;
            }}
          />

          {/* Legend */}
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingLeft: '13px' }}
            layout="horizontal"
            verticalAlign="top"
            align="center"
            iconType="rect"
          />

          {/* Bars - City 1 (blue), City 2 (purple) */}
          <Bar
            dataKey="totalPrecip"
            name={
              comparisonWeeklyWeatherData
                ? `${weeklyWeatherData.city} Total Precip`
                : 'Total Precipitation'
            }
            fill={CITY1_PRIMARY_COLOR}
            radius={[4, 4, 0, 0]}
          />
          {comparisonWeeklyWeatherData && (
            <Bar
              dataKey="compTotalPrecip"
              name={`${comparisonWeeklyWeatherData.city} Total Precip`}
              fill={CITY2_PRIMARY_COLOR}
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(RainfallGraph);
