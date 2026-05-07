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
  Tooltip,
} from 'recharts';
import type { CategoricalChartFunc } from 'recharts/types/chart/types';
import type { ReactNode } from 'react';

import { useChartColors } from '@/hooks/useChartColors';
import type {
  AreaConfig,
  ChartDataPoint,
  ReferenceDotConfig,
  RechartsLineGraphProps,
} from '@/types/chartTypes';
import RechartsLineTooltip from './RechartsLineTooltip';

type YDomainBound =
  | number
  | 'auto'
  | 'dataMin'
  | 'dataMax'
  | ((value: number) => number);

interface ExtendedProps<
  T extends ChartDataPoint,
> extends RechartsLineGraphProps<T> {
  areas?: AreaConfig[];
  referenceDots?: ReferenceDotConfig[];
  yTickFormatter?: (value: number) => string;
  // Hide Y-axis entirely (used by Sunshine where caller draws its own scale)
  hideYAxis?: boolean;
  // Which side the Y-axis renders on. Defaults to 'right' to match the
  // popover's traditional layout; pass 'left' when an in-chart overlay
  // (legend, etc.) needs the right gutter.
  yAxisOrientation?: 'left' | 'right';
  // Optional Y-axis domain — defaults to recharts' auto-scaling. Pass a tight
  // [floor-1, ceil+1] pair when the default leaves an awkward bottom gap.
  yDomain?: [YDomainBound, YDomainBound];
  // Slot for in-chart legend (drawn in upper-right by caller via SVG/HTML)
  overlay?: ReactNode;
  // Formats the tooltip header label. Recharts hands us the raw activeLabel
  // (e.g. a week-of-year integer); the caller decides how to render it.
  formatTooltipLabel?: (raw: string | number) => string;
  // Optional render-prop for an extra row appended below the metric grid in
  // the in-chart tooltip. Receives the active data row so callers can derive
  // values (e.g. sunshine % vs. theoretical max).
  renderTooltipExtras?: (row: T) => ReactNode;
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
  yAxisOrientation = 'right',
  yDomain,
  margin = { top: 8, right: 28, left: 0, bottom: 0 },
  onHover,
  overlay,
  formatTooltipLabel,
  renderTooltipExtras,
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
              orientation={yAxisOrientation}
              tick={{
                fontSize: 9,
                fill: chartColors.textColor,
                fontFamily: 'system-ui, sans-serif',
              }}
              axisLine={false}
              tickLine={false}
              width={28}
              tickFormatter={yTickFormatter}
              domain={yDomain}
            />
          )}

          {/* Filled areas (drawn under lines); tuple dataKeys render as min/max bands. */}
          {areas.map((a) => (
            <Area
              key={`area-${a.dataKey}`}
              type="monotone"
              dataKey={a.dataKey}
              fill={a.fill}
              fillOpacity={a.fillOpacity ?? 0.2}
              stroke={a.stroke ?? 'none'}
              strokeWidth={a.strokeWidth ?? 0}
              strokeOpacity={a.strokeOpacity ?? 1}
              strokeDasharray={a.strokeDasharray}
              isAnimationActive={false}
              connectNulls
              activeDot={false}
            />
          ))}

          {/* Hairline + value popover; dedupes Area/Line on shared dataKeys, drops dashed refs. */}
          <Tooltip
            cursor={{
              stroke: 'var(--mantine-color-dimmed)',
              strokeWidth: 1,
              strokeOpacity: 0.4,
              strokeDasharray: '3 3',
            }}
            wrapperStyle={{ outline: 'none' }}
            content={({ active, payload, label }) => (
              <RechartsLineTooltip<T>
                active={active}
                payload={payload}
                label={
                  typeof label === 'string' || typeof label === 'number'
                    ? label
                    : undefined
                }
                lines={lines}
                yTickFormatter={yTickFormatter}
                formatTooltipLabel={formatTooltipLabel}
                renderExtras={renderTooltipExtras}
              />
            )}
          />

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
          {lines.map((lineConfig) => {
            // Dashed reference lines (ceilings, etc.) skip the active hover dot.
            const isDashed = !!lineConfig.strokeDasharray;
            const activeDot = isDashed
              ? false
              : {
                  r: 4,
                  stroke: 'var(--mantine-color-body)',
                  strokeWidth: 1.5,
                  fill: lineConfig.stroke,
                };
            return (
              <Line
                key={lineConfig.dataKey}
                type="monotone"
                dataKey={lineConfig.dataKey}
                name={lineConfig.name}
                stroke={lineConfig.stroke}
                strokeWidth={lineConfig.strokeWidth ?? 2}
                strokeOpacity={lineConfig.strokeOpacity ?? 1}
                strokeDasharray={lineConfig.strokeDasharray}
                dot={lineConfig.dot ?? false}
                activeDot={activeDot}
                connectNulls={lineConfig.connectNulls ?? true}
                isAnimationActive
                animationDuration={300}
                animationEasing="ease-in-out"
              />
            );
          })}

          {/* Today dots — Recharts' default ReferenceDot zIndex (600) already
              beats Line (400) and ReferenceLine (400). */}
          {referenceDots.map((d) => (
            <ReferenceDot
              key={`dot-${d.x}-${d.y}-${d.fill}`}
              x={d.x}
              y={d.y}
              r={d.r ?? 3.5}
              fill={d.fill}
              stroke={d.stroke ?? 'transparent'}
              strokeWidth={d.strokeWidth ?? 1.5}
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
