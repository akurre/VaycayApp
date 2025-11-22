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
} from 'recharts';
import { Text } from '@mantine/core';
import { transformSunshineDataForChart } from '@/utils/dataFormatting/transformSunshineDataForChart';
import { calculateAverageSunshine } from '@/utils/dataFormatting/calculateAverageSunshine';
import SunshineGraphTooltip from './SunshineGraphTooltip';
import SunshineGraphDot from './SunshineGraphDot';
import {
  SUNSHINE_CHART_LINE_COLOR,
  SUNSHINE_CHART_GRID_COLOR,
  SUNSHINE_CHART_AXIS_COLOR,
} from '@/const';

interface SunshineGraphProps {
  sunshineData: SunshineData;
  selectedMonth?: number;
}

function SunshineGraph({ sunshineData, selectedMonth }: SunshineGraphProps) {
  const chartData = transformSunshineDataForChart(sunshineData);
  const averageSunshine = calculateAverageSunshine(chartData);

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
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={SUNSHINE_CHART_GRID_COLOR} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={SUNSHINE_CHART_AXIS_COLOR} />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke={SUNSHINE_CHART_AXIS_COLOR}
            label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip content={<SunshineGraphTooltip />} />
          {selectedMonth && (
            <ReferenceLine
              x={chartData[selectedMonth - 1]?.month}
              stroke={SUNSHINE_CHART_LINE_COLOR}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
          <Line
            type="monotone"
            dataKey="hours"
            stroke={SUNSHINE_CHART_LINE_COLOR}
            strokeWidth={2}
            dot={(props) => <SunshineGraphDot {...props} selectedMonth={selectedMonth} />}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SunshineGraph;
