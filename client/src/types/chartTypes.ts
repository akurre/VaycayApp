import type { ReactElement } from 'react';

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
  dot?: boolean | ((props: Record<string, unknown>) => ReactElement);
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
