import { EM_DASH_PLACEHOLDER } from '@/const';

// Format a number of millimeters as e.g. "42mm" (rounded to integer). All
// rainfall readouts in the popup share this rounding so the chart, hover, and
// stat rail line up.
export function formatMm(n: number | null | undefined): string {
  if (n === null || n === undefined) return EM_DASH_PLACEHOLDER;
  return `${Math.round(n)}mm`;
}
