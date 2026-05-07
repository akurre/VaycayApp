import { MONTH_FIELDS } from '@/const';
import type { SunshineData } from '@/types/sunshineDataType';

/**
 * Transforms sunshine data into a format suitable for the heatmap layer
 * Extracts sunshine hours for the specified month and uses it as the weight
 */
export const transformToSunshineHeatmapData = (
  cities: SunshineData[],
  month: number
): { position: [number, number]; weight: number }[] => {
  const monthField = MONTH_FIELDS[month];

  if (!monthField) {
    console.warn(`Invalid month: ${month}`);
    return [];
  }

  // Filter out cities with null coordinates or sunshine data
  // and transform to heatmap format
  return cities
    .filter(
      (city): city is SunshineData & { lat: number; long: number } =>
        city.lat !== null && city.long !== null && city[monthField] !== null
    )
    .map((city) => ({
      position: [city.long, city.lat],
      weight: city[monthField] as number,
    }));
};
