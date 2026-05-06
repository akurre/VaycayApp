import { memo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import type { CategoricalChartFunc } from 'recharts/types/chart/types';
import type { ReactNode } from 'react';

import { useChartColors } from '@/hooks/useChartColors';
import type {
  ChartDataPoint,
  LineConfig,
  ReferenceLineConfig,
  RechartsLineGraphProps,
} from '@/types/chartTypes';

export type { ChartDataPoint, LineConfig, ReferenceLineConfig };

// Extra series config used by graphs that need filled envelopes (temp band,
// sun-vs-ceiling). Kept narrow on purpose — anything fancier should go inline
// via a children render prop, not through here.
export interface AreaConfig {
  dataKey: string;
  baseDataKey?: string; // optional — when set, area is drawn baseLine=baseDataKey…dataKey
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokeDasharray?: string;
}

export interface ReferenceDotConfig {
  x: string | number;
  y: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  r?: number;
}

interface ExtendedProps<T extends ChartDataPoint>
  extends RechartsLineGraphProps<T> {
  areas?: AreaConfig[];
  referenceDots?: ReferenceDotConfig[];
  yTickFormatter?: (value: number) => string;
  // Hide Y-axis entirely (used by Sunshine where caller draws its own scale)
  hideYAxis?: boolean;
  // Slot for in-chart legend (drawn in upper-right by caller via SVG/HTML)
  overlay?: ReactNode;
}

const RechartsLineGraphComponent = <T extends ChartDataPoint>({
  data,
  xAxisDataKey,
  lines,
  areas = [],
  referenceLines = [],
  referenceDots = [],
  yTickFormatter,
  hideYAxis = false,
  margin = { top: 8, right: 28, left: 0, bottom: 0 },
  onHover,
  overlay,
}: ExtendedProps<T>) => {
  const chartColors = useChartColors();

  const handleMouseMove: CategoricalChartFunc = (state) => {
    if (!onHover) return;
    const { activeLabel, activeTooltipIndex } = state;
    if (
      activeLabel === undefined ||
      activeTooltipIndex === undefined ||
      activeTooltipIndex === null ||
      typeof activeTooltipIndex === 'string'
    ) {
      onHover(null);
      return;
    }
    onHover({ activeLabel, activeIndex: activeTooltipIndex });
  };

  const handleMouseLeave = () => {
    if (onHover) onHover(null);
  };

  return (
    <div className="w-full h-full relative">
      {overlay && (
        <div className="absolute top-2 right-8 z-10 pointer-events-none">
          {overlay}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={margin}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <CartesianGrid
            strokeDasharray="2 4"
            stroke={chartColors.gridColor}
            strokeOpacity={0.4}
            vertical={false}
          />

          <XAxis
            dataKey={xAxisDataKey}
            tick={false}
            axisLine={false}
            tickLine={false}
            height={0}
          />

          {!hideYAxis && (
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
              tickFormatter={yTickFormatter}
            />
          )}

          {/* Filled areas (drawn under lines) */}
          {areas.map((a) => (
            <Area
              key={`area-${a.dataKey}-${a.baseDataKey ?? ''}`}
              type="monotone"
              dataKey={a.dataKey}
              {...(a.baseDataKey ? { baseLine: a.baseDataKey as never } : {})}
              fill={a.fill}
              fillOpacity={a.fillOpacity ?? 0.2}
              stroke={a.stroke ?? 'none'}
              strokeWidth={a.strokeWidth ?? 0}
              strokeOpacity={a.strokeOpacity ?? 1}
              strokeDasharray={a.strokeDasharray}
              isAnimationActive={false}
              connectNulls
            />
          ))}

          {/* Reference lines (today, selected month, etc.) */}
          {referenceLines.map((refLine) => (
            <ReferenceLine
              key={`ref-${refLine.x ?? ''}-${refLine.y ?? ''}-${refLine.label ?? ''}`}
              x={refLine.x}
              y={refLine.y}
              stroke={refLine.stroke}
              strokeWidth={refLine.strokeWidth}
              strokeDasharray={refLine.strokeDasharray}
              label={refLine.label}
            />
          ))}

          {/* Lines */}
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
              isAnimationActive
              animationDuration={300}
              animationEasing="ease-in-out"
            />
          ))}

          {/* Today / hover dots */}
          {referenceDots.map((d, i) => (
            <ReferenceDot
              key={`dot-${i}-${d.x}-${d.y}`}
              x={d.x}
              y={d.y}
              r={d.r ?? 3.5}
              fill={d.fill}
              stroke={d.stroke ?? 'transparent'}
              strokeWidth={d.strokeWidth ?? 1.5}
              isFront
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

const RechartsLineGraph = memo(
  RechartsLineGraphComponent
) as typeof RechartsLineGraphComponent;
export default RechartsLineGraph;
