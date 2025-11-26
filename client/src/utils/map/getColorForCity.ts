import type { ColorCacheEntry } from '@/const';
import { MONTH_FIELDS } from '@/const';
import { DataType } from '@/types/mapTypes';
import type { ValidMarkerData } from '@/types/cityWeatherDataType';
import type { ValidSunshineMarkerData } from '@/utils/typeGuards';
import { getMarkerColor } from './getMarkerColor';
import getSunshineMarkerColor from './getSunshineMarkerColor';

/**
 * Calculates the marker color for a city based on data type and selected month.
 * This is a shared utility to avoid duplication across useColorCache and useHomeLocationLayers.
 *
 * For temperature data, the selectedMonth parameter is optional and unused.
 * For sunshine data, selectedMonth is required to determine which month's data to use.
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
    // Temperature data: avgTemperature is guaranteed non-null via ValidMarkerData type
    const weatherCity = city as ValidMarkerData;
    const [r, g, b] = getMarkerColor(weatherCity.avgTemperature);
    return [r, g, b, 255];
  }

  if (dataType === DataType.Sunshine) {
    // Sunshine data: month field value is guaranteed non-null via ValidSunshineMarkerData type
    const sunshineCity = city as ValidSunshineMarkerData;
    const monthField = MONTH_FIELDS[selectedMonth ?? 1];
    const sunshineHours = sunshineCity[monthField] as number;
    const [r, g, b] = getSunshineMarkerColor(sunshineHours);
    return [r, g, b, 255];
  }

  // Fallback: white color (should never happen with typed inputs)
  return [255, 255, 255, 255];
}
