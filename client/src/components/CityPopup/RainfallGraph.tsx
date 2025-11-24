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

interface RainfallGraphProps {
  weeklyWeatherData: CityWeeklyWeather;
}

const RainfallGraph = ({ weeklyWeatherData }: RainfallGraphProps) => {
  // Get theme-aware colors
  const chartColors = useChartColors();

  // Transform weekly weather data for chart - filter out weeks with no precipitation data
  // to prevent displaying zero values where no measurements exist
  const chartData = useMemo(
    () =>
      weeklyWeatherData.weeklyData
        .filter((week) => week.totalPrecip !== null || week.avgPrecip !== null)
        .map((week) => ({
          week: week.week,
          totalPrecip: week.totalPrecip,
          avgPrecip: week.avgPrecip,
          daysWithRain: week.daysWithRain,
          daysWithData: week.daysWithData,
        })),
    [weeklyWeatherData.weeklyData]
  );

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 30, right: 20, left: 0, bottom: 5 }}
        >
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

          {/* Bars */}
          <Bar
            dataKey="totalPrecip"
            name="Total Precipitation"
            fill={chartColors.lineColor || '#3b82f6'}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(RainfallGraph);
