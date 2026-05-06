import { Fragment, memo } from 'react';
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
  // Formats the tooltip header label. Recharts hands us the raw activeLabel
  // (e.g. a week-of-year integer); the caller decides how to render it.
  formatTooltipLabel?: (raw: string | number) => string;
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
  formatTooltipLabel,
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

          {/* Hover affordance: vertical hairline + grid-laid-out value
              popover. Each row is a metric (Max/Avg/Min); each column is
              a city (main vs comparison). Areas duplicating a Line's
              dataKey are deduped; dashed reference lines (sun ceilings)
              are dropped. */}
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

              const formatValue = (v: unknown): string => {
                if (typeof v !== 'number') return String(v);
                const rounded = Number(v.toFixed(1));
                return yTickFormatter
                  ? yTickFormatter(rounded)
                  : rounded.toFixed(1);
              };

              interface Item {
                dataKey: string;
                metricLabel: string | undefined;
                cityRole: 'main' | 'comparison';
                color: string;
                formatted: string;
              }

              const seen = new Set<string>();
              const items: Item[] = [];
              for (const p of payload) {
                if (p.value === null || p.value === undefined) continue;
                const key = String(p.dataKey);
                if (seen.has(key)) continue;
                const cfg = lines.find((l) => l.dataKey === key);
                if (!cfg || cfg.strokeDasharray) continue;
                seen.add(key);
                items.push({
                  dataKey: key,
                  metricLabel: cfg.metricLabel,
                  cityRole: cfg.cityRole ?? 'main',
                  color: (p.color as string | undefined) ?? cfg.stroke,
                  formatted: formatValue(p.value),
                });
              }
              if (items.length === 0) return null;

              // Group by metricLabel, preserving first-seen order.
              const metricOrder: string[] = [];
              const grouped = new Map<
                string,
                { main?: Item; comparison?: Item }
              >();
              for (const it of items) {
                const key = it.metricLabel ?? '';
                if (!grouped.has(key)) {
                  grouped.set(key, {});
                  metricOrder.push(key);
                }
                const slot = grouped.get(key);
                if (!slot) continue;
                if (it.cityRole === 'comparison') slot.comparison = it;
                else slot.main = it;
              }

              const hasComparison = items.some(
                (i) => i.cityRole === 'comparison'
              );
              const hasLabels = items.some((i) => i.metricLabel);

              const cols = [
                hasLabels ? 'auto' : null,
                'auto',
                hasComparison ? 'auto' : null,
              ]
                .filter(Boolean)
                .join(' ');

              const headerLabel =
                label === undefined || label === null
                  ? null
                  : formatTooltipLabel
                    ? formatTooltipLabel(label as string | number)
                    : String(label);

              return (
                <div className="rounded-md px-2.5 py-1.5 text-[11px] tabular-nums bg-[var(--mantine-color-default-hover)] border border-[var(--mantine-color-default-border)] shadow-md">
                  {headerLabel && (
                    <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--mantine-color-dimmed)] mb-1">
                      {headerLabel}
                    </div>
                  )}
                  <div
                    className="grid gap-x-3 gap-y-0.5 items-baseline"
                    style={{ gridTemplateColumns: cols }}
                  >
                    {metricOrder.map((m) => {
                      const slot = grouped.get(m);
                      if (!slot) return null;
                      return (
                        <Fragment key={m || 'metric'}>
                          {hasLabels && (
                            <span className="text-[9px] uppercase tracking-[0.08em] text-[var(--mantine-color-dimmed)] font-semibold">
                              {m}
                            </span>
                          )}
                          <span
                            className="font-semibold"
                            style={{ color: slot.main?.color }}
                          >
                            {slot.main ? slot.main.formatted : '—'}
                          </span>
                          {hasComparison && (
                            <span
                              className="font-semibold"
                              style={{ color: slot.comparison?.color }}
                            >
                              {slot.comparison ? slot.comparison.formatted : '—'}
                            </span>
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
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
