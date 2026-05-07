import type { SunshineData } from '@/types/sunshineDataType';
import { getMonthlySunshineHours } from './getMonthlySunshineHours';
import { calculateTheoreticalMaxSunshine } from './calculateTheoreticalMaxSunshine';

// Ratio of actual monthly sunshine hours to the theoretical max for that
// latitude/month, expressed as a 0-100 percent. Returns null when any input is
// missing or the theoretical max is non-positive (degenerate latitudes).
export function getSunshinePercent(
  data: SunshineData | null | undefined,
  month: number,
  latitude: number | null | undefined
): number | null {
  if (latitude === null || latitude === undefined) return null;
  if (!Number.isFinite(latitude)) return null;
  const actual = getMonthlySunshineHours(data, month);
  if (actual === null) return null;
  const max = calculateTheoreticalMaxSunshine(latitude, month);
  if (!Number.isFinite(max) || max <= 0) return null;
  return (actual / max) * 100;
}
