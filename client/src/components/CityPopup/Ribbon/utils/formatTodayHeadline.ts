import { DataType } from '@/types/mapTypes';
import type { TemperatureUnit } from '@/types/mapTypes';
import { EM_DASH_PLACEHOLDER } from '@/const';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import { formatMm } from '@/utils/dataFormatting/formatMm';

// Today-readout headline string for the active tab. Branches per-tab because
// each metric carries its own units/rounding.
export function formatTodayHeadline(
  tab: DataType,
  value: number | null,
  unit: TemperatureUnit
): string {
  if (value === null) return EM_DASH_PLACEHOLDER;
  if (tab === DataType.Temperature) {
    return formatTemperature(value, unit) ?? EM_DASH_PLACEHOLDER;
  }
  if (tab === DataType.Sunshine) return `${Math.round(value)}% sun`;
  return formatMm(value);
}
