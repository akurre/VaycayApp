import { SunshineData } from '@/types/sunshineDataType';

/**
 * Transforms sunshine data into a format suitable for the heatmap layer
 * Extracts sunshine hours for the specified month and uses it as the weight
 */
export const transformToSunshineHeatmapData = (
  cities: SunshineData[],
  month: number
): { position: [number, number]; weight: number }[] => {
  // Map of month numbers to property names
  const monthFields: Record<number, keyof SunshineData> = {
    // todo move to const
    1: 'jan',
    2: 'feb',
    3: 'mar',
    4: 'apr',
    5: 'may',
    6: 'jun',
    7: 'jul',
    8: 'aug',
    9: 'sep',
    10: 'oct',
    11: 'nov',
    12: 'dec',
  };

  // Get the property name for the selected month
  const monthField = monthFields[month];

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
