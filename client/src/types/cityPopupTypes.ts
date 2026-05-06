import type { ReactNode } from 'react';

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
