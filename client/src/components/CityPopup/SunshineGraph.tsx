import { useMemo } from 'react';
import type { SunshineData } from '@/types/sunshineDataType';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Text } from '@mantine/core';
import { transformSunshineDataForChart } from '@/utils/dataFormatting/transformSunshineDataForChart';
import { calculateAverageSunshine } from '@/utils/dataFormatting/calculateAverageSunshine';
import { generateTheoreticalMaxSunshineData } from '@/utils/dataFormatting/generateTheoreticalMaxSunshineData';
import SunshineGraphTooltip from './SunshineGraphTooltip';
import SunshineGraphDot from './SunshineGraphDot';
import {
  SUNSHINE_CHART_LINE_COLOR,
  SUNSHINE_CHART_GRID_COLOR,
  SUNSHINE_CHART_AXIS_COLOR,
  SUNSHINE_CHART_MAX_LINE_COLOR,
} from '@/const';

interface SunshineGraphProps {
  sunshineData: SunshineData;
  selectedMonth?: number;
}

function SunshineGraph({ sunshineData, selectedMonth }: SunshineGraphProps) {
  const chartData = useMemo(() => transformSunshineDataForChart(sunshineData), [sunshineData]);

  const averageSunshine = useMemo(() => calculateAverageSunshine(chartData), [chartData]);

  // Calculate theoretical maximum sunshine based on latitude (memoized per city)
  const latitude = sunshineData.lat;
  const theoreticalMaxData = useMemo(
    () => (latitude !== null ? generateTheoreticalMaxSunshineData(latitude) : null),
    [latitude]
  );

  // Combine actual data with theoretical max for chart (memoized)
  const combinedChartData = useMemo(
    () =>
      chartData.map((point, index) => ({
        ...point,
        theoreticalMax: theoreticalMaxData ? theoreticalMaxData[index] : null,
        baseline: 0, // 0% sunshine baseline
      })),
    [chartData, theoreticalMaxData]
  );

  return (
    <div className="w-full">
      {averageSunshine !== null && (
        <div className="mb-2">
          <Text size="sm" c="tertiary-purple.4">
            Average Annual Sunshine
          </Text>
          <Text size="md">{averageSunshine.toFixed(1)} hours</Text>
        </div>
      )}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={combinedChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={SUNSHINE_CHART_GRID_COLOR} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={SUNSHINE_CHART_AXIS_COLOR} />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke={SUNSHINE_CHART_AXIS_COLOR}
            label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip content={<SunshineGraphTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
            verticalAlign="bottom"
            height={24}
          />
          {selectedMonth && (
            <ReferenceLine
              x={combinedChartData[selectedMonth - 1]?.month}
              stroke={SUNSHINE_CHART_LINE_COLOR}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
          {/* Theoretical maximum sunshine line (100% sun) */}
          {theoreticalMaxData && (
            <Line
              type="monotone"
              dataKey="theoreticalMax"
              stroke={SUNSHINE_CHART_MAX_LINE_COLOR}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              name="100% Sun"
            />
          )}
          {/* Actual sunshine line */}
          <Line
            type="monotone"
            dataKey="hours"
            stroke={SUNSHINE_CHART_LINE_COLOR}
            strokeWidth={2}
            dot={(props) => <SunshineGraphDot {...props} selectedMonth={selectedMonth} />}
            connectNulls
            name="Actual"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SunshineGraph;
