import type { ReactNode } from 'react';
import type { DataType } from './mapTypes';

export interface RibbonHoverPayload {
  label: string;
  v1: string | null;
  v2: string | null;
  subV1?: string | null;
  subV2?: string | null;
}

export interface RibbonStat {
  label: string;
  v1: ReactNode;
  v2: ReactNode;
}

// Shape of an excluded-from-results city for ComparisonCitySelector. Held
// here so callers (e.g. CityPopup) can construct it without importing the
// component file.
export interface ExcludeCity {
  name: string;
  state: string | null;
  country: string | null;
}

// Per-tab "today" values that drive the readout above the chart. Each tab
// renders at the grain it can display: temperature daily, sunshine monthly,
// precip weekly. `subC*` is an optional sub-line under the headline (e.g.
// rainy-day count under the weekly mm).
export interface TodayValuePair {
  c1: number | null;
  c2: number | null;
  subC1?: number | null;
  subC2?: number | null;
}

export type TodayValuesByTab = Readonly<Record<DataType, TodayValuePair>>;
