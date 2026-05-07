import type { ColorCacheEntry } from '@/const';
import { MONTH_FIELDS } from '@/const';
import { DataType } from '@/types/mapTypes';
import type { ValidMarkerData } from '@/types/cityWeatherDataType';
import type { ValidSunshineMarkerData } from '@/utils/typeGuards';
import { calculateTheoreticalMaxSunshine } from '@/utils/dataFormatting/calculateTheoreticalMaxSunshine';
import { getMarkerColor } from './getMarkerColor';
import getSunshineMarkerColor from './getSunshineMarkerColor';

/**
 * Calculates the marker color for a city based on data type and selected month.
 * This is a shared utility to avoid duplication across useColorCache and useHomeLocationLayers.
 *
 * For temperature data, the selectedMonth parameter is optional and unused.
 * For sunshine data, selectedMonth is required to determine which month's data
 * to use; the city's latitude is used to convert raw monthly hours into a
 * percent-of-theoretical-max so high-latitude cities aren't favored in summer.
 *
 * @param city - The city data with valid coordinates and data values
 * @param dataType - Whether to show temperature or sunshine data
 * @param selectedMonth - The selected month (1-12) for sunshine data; optional for temperature
 * @returns RGBA color array [r, g, b, a]
 */
export function getColorForCity(
  city: ValidMarkerData | ValidSunshineMarkerData,
  dataType: DataType,
  selectedMonth?: number
): ColorCacheEntry {
  if (dataType === DataType.Temperature) {
    const weatherCity = city as ValidMarkerData;
    const [r, g, b] = getMarkerColor(weatherCity.avgTemperature);
    return [r, g, b, 255];
  }

  if (dataType === DataType.Sunshine) {
    const sunshineCity = city as ValidSunshineMarkerData;
    const month = selectedMonth ?? 1;
    const monthField = MONTH_FIELDS[month];
    const sunshineHours = sunshineCity[monthField] as number;
    const max = calculateTheoreticalMaxSunshine(sunshineCity.lat, month);
    const percent = max > 0 ? (sunshineHours / max) * 100 : 0;
    const [r, g, b] = getSunshineMarkerColor(percent);
    return [r, g, b, 255];
  }

  return [255, 255, 255, 255];
}
