import { useMemo, memo, useRef, useEffect, type ReactElement } from 'react';
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
import {
  SUNSHINE_CHART_GRID_COLOR,
  SUNSHINE_CHART_AXIS_COLOR,
} from '@/const';

// Generic data point type - charts can add extra fields
export interface ChartDataPoint {
  [key: string]: string | number | null | undefined;
}

// Line configuration for a single line on the chart
export interface LineConfig {
  dataKey: string;
  name: string;
  stroke: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  dot?: boolean | ((props: any) => ReactElement);
  connectNulls?: boolean;
}

// Reference line configuration
export interface ReferenceLineConfig {
  x?: string | number;
  y?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  label?: string;
}

export interface RechartsLineGraphProps<T extends ChartDataPoint> {
  // Data
  data: T[];

  // City identification for animation control
  cityKey: string;

  // Axis configuration
  xAxisDataKey: string;
  xAxisLabel?: string;
  yAxisLabel: string;

  // Line configurations
  lines: LineConfig[];

  // Optional reference lines
  referenceLines?: ReferenceLineConfig[];

  // Custom tooltip component
  tooltipContent?: ReactElement;

  // Animation settings
  animationDuration?: number;
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';

  // Chart margins
  margin?: { top?: number; right?: number; bottom?: number; left?: number };

  // Legend configuration
  showLegend?: boolean;
  legendLayout?: 'horizontal' | 'vertical';
  legendVerticalAlign?: 'top' | 'middle' | 'bottom';
  legendAlign?: 'left' | 'center' | 'right';
}

function RechartsLineGraph<T extends ChartDataPoint>({
  data,
  cityKey,
  xAxisDataKey,
  xAxisLabel,
  yAxisLabel,
  lines,
  referenceLines = [],
  tooltipContent,
  animationDuration = 800,
  animationEasing = 'ease-in-out',
  margin = { top: 5, right: 10, left: -20, bottom: 5 },
  showLegend = true,
  legendLayout = 'vertical',
  legendVerticalAlign = 'middle',
  legendAlign = 'right',
}: RechartsLineGraphProps<T>) {
  // Track previous city for animation control
  const previousCityRef = useRef<string | null>(null);
  const shouldAnimate = previousCityRef.current !== cityKey;

  useEffect(() => {
    previousCityRef.current = cityKey;
  }, [cityKey]);

  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => data, [data]);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke={SUNSHINE_CHART_GRID_COLOR} />

          {/* X Axis */}
          <XAxis
            dataKey={xAxisDataKey}
            tick={{ fontSize: 12 }}
            stroke={SUNSHINE_CHART_AXIS_COLOR}
            label={
              xAxisLabel
                ? { value: xAxisLabel, position: 'insideBottom', offset: -5, style: { fontSize: 12 } }
                : undefined
            }
          />

          {/* Y Axis */}
          <YAxis
            tick={{ fontSize: 12 }}
            stroke={SUNSHINE_CHART_AXIS_COLOR}
            label={{
              value: yAxisLabel,
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12 },
            }}
          />

          {/* Tooltip */}
          {tooltipContent ? (
            <Tooltip content={tooltipContent} />
          ) : (
            <Tooltip contentStyle={{ fontSize: 12 }} />
          )}

          {/* Legend */}
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingLeft: '13px' }}
              layout={legendLayout}
              verticalAlign={legendVerticalAlign}
              align={legendAlign}
              iconType="line"
              height={legendLayout === 'vertical' ? 24 : undefined}
              spacing={3}
            />
          )}

          {/* Reference Lines */}
          {referenceLines.map((refLine, index) => (
            <ReferenceLine
              key={`ref-line-${index}`}
              x={refLine.x}
              y={refLine.y}
              stroke={refLine.stroke}
              strokeWidth={refLine.strokeWidth}
              strokeDasharray={refLine.strokeDasharray}
              label={refLine.label}
            />
          ))}

          {/* Data Lines */}
          {lines.map((lineConfig) => (
            <Line
              key={lineConfig.dataKey}
              type="monotone"
              dataKey={lineConfig.dataKey}
              name={lineConfig.name}
              stroke={lineConfig.stroke}
              strokeWidth={lineConfig.strokeWidth ?? 2}
              strokeDasharray={lineConfig.strokeDasharray}
              dot={lineConfig.dot ?? false}
              connectNulls={lineConfig.connectNulls ?? true}
              isAnimationActive={shouldAnimate}
              animationDuration={animationDuration}
              animationEasing={animationEasing}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Export with memo for performance optimization
export default memo(RechartsLineGraph) as typeof RechartsLineGraph;
