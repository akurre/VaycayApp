import type { SunshineData } from '@/types/sunshineDataType';
import { getMonthlySunshineHours } from './getMonthlySunshineHours';

// True when SunshineData contains at least one numeric monthly value. A row
// can come back populated with all-null months for stations with no readings —
// that should count as "no data" for tab visibility.
export function hasSunshineData(
  data: SunshineData | null | undefined
): boolean {
  if (!data) return false;
  for (let month = 1; month <= 12; month++) {
    if (getMonthlySunshineHours(data, month) !== null) return true;
  }
  return false;
}
