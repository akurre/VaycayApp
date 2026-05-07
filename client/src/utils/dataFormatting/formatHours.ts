import { EM_DASH_PLACEHOLDER } from '@/const';

// Format a number of hours as e.g. "12.3h". `decimals` defaults to 1 (used in
// monthly readouts and chart hovers); pass 0 for annual averages where the
// extra precision adds noise.
export function formatHours(
  n: number | null | undefined,
  decimals: number = 1
): string {
  if (n === null || n === undefined) return EM_DASH_PLACEHOLDER;
  return `${n.toFixed(decimals)}h`;
}
