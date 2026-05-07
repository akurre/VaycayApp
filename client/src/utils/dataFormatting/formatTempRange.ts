import { EM_DASH_PLACEHOLDER } from '@/const';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import type { TemperatureUnit } from '@/types/mapTypes';

// "5°C–17°C" range string, honouring the user's temperature unit. Returns the
// em-dash placeholder when either endpoint is missing or unformattable.
export function formatTempRange(
  min: number | null | undefined,
  max: number | null | undefined,
  unit: TemperatureUnit
): string {
  if (min === null || min === undefined) return EM_DASH_PLACEHOLDER;
  if (max === null || max === undefined) return EM_DASH_PLACEHOLDER;
  const minLabel = formatTemperature(min, unit);
  const maxLabel = formatTemperature(max, unit);
  if (minLabel === null || maxLabel === null) return EM_DASH_PLACEHOLDER;
  return `${minLabel}–${maxLabel}`;
}
