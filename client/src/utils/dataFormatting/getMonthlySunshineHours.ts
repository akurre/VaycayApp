import type { SunshineData } from '@/types/sunshineDataType';

const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const satisfies ReadonlyArray<keyof SunshineData>;

// Look up monthly sunshine hours for a 1-based month (1=Jan, 12=Dec). Returns
// null when the month is out of range or the field isn't a number — narrows
// the wider `keyof SunshineData` access at the call site.
export function getMonthlySunshineHours(
  data: SunshineData | null | undefined,
  month: number
): number | null {
  if (!data) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  const value = data[MONTH_KEYS[month - 1]];
  return typeof value === 'number' ? value : null;
}
