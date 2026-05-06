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
              type="basis"
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

          {/* Hover affordance: vertical hairline + compact value chip near
              cursor. Reference lines (dashed strokes) are filtered out. */}
          <Tooltip
            cursor={{
              stroke: 'var(--mantine-color-dimmed)',
              strokeWidth: 1,
              strokeOpacity: 0.4,
              strokeDasharray: '3 3',
            }}
            wrapperStyle={{ outline: 'none' }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const visible = payload.filter((p) => {
                if (p.value === null || p.value === undefined) return false;
                const cfg = lines.find((l) => l.dataKey === p.dataKey);
                return cfg ? !cfg.strokeDasharray : true;
              });
              if (visible.length === 0) return null;
              return (
                <div className="rounded-md px-2 py-1 text-[11px] tabular-nums bg-[var(--mantine-color-default-hover)] border border-[var(--mantine-color-default-border)] shadow-md">
                  {label !== undefined && (
                    <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--mantine-color-dimmed)] mb-0.5">
                      {label}
                    </div>
                  )}
                  {visible.map((p) => {
                    const rounded =
                      typeof p.value === 'number'
                        ? Number(p.value.toFixed(1))
                        : p.value;
                    const formatted =
                      typeof rounded === 'number' && yTickFormatter
                        ? yTickFormatter(rounded)
                        : typeof rounded === 'number'
                          ? rounded.toFixed(1)
                          : String(rounded);
                    return (
                      <div
                        key={String(p.dataKey)}
                        className="flex items-center gap-1.5 leading-tight"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: p.color }}
                        />
                        <span
                          style={{ color: p.color }}
                          className="font-semibold"
                        >
                          {formatted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
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
            // Reference lines (dashed ceilings, etc.) shouldn't get an
            // active hover dot — those aren't data points the readout cares
            // about. Solid lines do.
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
                type="basis"
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
              zIndex={1}
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
