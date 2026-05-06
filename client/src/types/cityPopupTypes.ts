import type { ReactNode } from 'react';

export enum ClimateZone {
  Tropical = 'tropical',
  Subtropical = 'subtropical',
  Temperate = 'temperate',
  Continental = 'continental',
  Polar = 'polar',
  Equatorial = 'equatorial',
}

export interface ClimateZoneLabel {
  zone: ClimateZone;
  latLabel: string;
}

export interface RibbonHoverPayload {
  label: string;
  v1: string | null;
  v2: string | null;
}

export interface RibbonStat {
  label: string;
  v1: ReactNode;
  v2: ReactNode;
}
