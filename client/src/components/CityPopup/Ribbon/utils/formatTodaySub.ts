import { DataType } from '@/types/mapTypes';
import { formatRainyDays } from '@/utils/dataFormatting/formatRainyDays';

// Optional sub-line under the today-readout headline. Only the precip tab
// has one today (rainy-day count); other tabs return null so the caller
// omits the slot entirely.
export function formatTodaySub(
  tab: DataType,
  value: number | null
): string | null {
  if (value === null) return null;
  if (tab === DataType.Precip) return formatRainyDays(value);
  return null;
}
