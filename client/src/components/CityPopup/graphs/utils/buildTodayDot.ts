import type { ReferenceDotConfig } from '@/types/chartTypes';
import { appColors } from '@/theme';

// Today markers: cream paper fill by default, or a caller-supplied city
// shade when comparison mode is active so each city's today dot reads as
// "its color" rather than two indistinguishable cream discs. Stroke uses
// the theme's default-border color so it stays visible in both modes.
export const buildTodayDot = (
  x: string | number,
  y: number,
  fill?: string
): ReferenceDotConfig => ({
  x,
  y,
  fill: fill ?? appColors.light.paper,
  stroke: 'var(--mantine-color-default-border)',
  strokeWidth: 1.5,
  r: 4,
});
