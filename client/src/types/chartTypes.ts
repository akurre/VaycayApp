import type { ReactElement } from 'react';

// Generic data point type - charts can add extra fields. Tuple values are
// allowed for recharts <Area> min/max envelope ranges (e.g. [min, max]).
export interface ChartDataPoint {
  [key: string]: string | number | [number, number] | null | undefined;
}

export interface ChartHoverState {
  activeLabel: string | number;
  activeIndex: number;
}

// Line configuration for a single line on the chart
export interface LineConfig {
  dataKey: string;
  name: string;
  stroke: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokeDasharray?: string;
  dot?: boolean | ((props: Record<string, unknown>) => ReactElement);
  connectNulls?: boolean;
  // Hover-popover grouping: which city column this line belongs to and the
  // optional metric label (e.g. 'Max', 'Avg', 'Min') for its row.
  cityRole?: 'main' | 'comparison';
  metricLabel?: string;
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

// Extra series config used by graphs that need filled envelopes (temp band,
// sun-vs-ceiling). Kept narrow on purpose — anything fancier should go inline
// via a children render prop, not through here. For min/max bands, set
// dataKey to a tuple field on the data row (e.g. tempRange: [min, max]).
export interface AreaConfig {
  dataKey: string;
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

// Row shape for the temperature graph's transformed weekly data. Index
// signature is required because the graph passes rows through generic
// recharts components that look up dataKeys at runtime.
export interface TemperatureChartRow {
  week: number;
  avgTemp: number | null;
  maxTemp: number | null;
  minTemp: number | null;
  tempRange: [number, number] | null;
  compAvgTemp: number | null;
  compMaxTemp: number | null;
  compMinTemp: number | null;
  compTempRange: [number, number] | null;
  [key: string]: string | number | [number, number] | null | undefined;
}

export interface RechartsLineGraphProps<T extends ChartDataPoint> {
  data: T[];
  xAxisDataKey: string;
  lines: LineConfig[];
  referenceLines?: ReferenceLineConfig[];
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  // Raw hover state propagation. Wrapping graphs translate this into a
  // RibbonHoverPayload before forwarding to the panel.
  onHover?: (state: ChartHoverState | null) => void;
}
