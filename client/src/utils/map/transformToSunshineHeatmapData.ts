import { MONTH_FIELDS } from '@/const';
import type { SunshineData } from '@/types/sunshineDataType';
import { calculateTheoreticalMaxSunshine } from '@/utils/dataFormatting/calculateTheoreticalMaxSunshine';

// Builds heatmap input weighted by sunshine percent (actual hours / theoretical
// max for the city's latitude in that month) rather than raw hours. Raw hours
// would over-weight high-latitude cities in summer simply for having longer
// days regardless of cloud cover.
export const transformToSunshineHeatmapData = (
  cities: SunshineData[],
  month: number
): { position: [number, number]; weight: number }[] => {
  const monthField = MONTH_FIELDS[month];

  if (!monthField) {
    console.warn(`Invalid month: ${month}`);
    return [];
  }

  return cities
    .filter(
      (city): city is SunshineData & { lat: number; long: number } =>
        city.lat !== null && city.long !== null && city[monthField] !== null
    )
    .map((city) => {
      const hours = city[monthField] as number;
      const max = calculateTheoreticalMaxSunshine(city.lat, month);
      const percent = max > 0 ? (hours / max) * 100 : 0;
      return {
        position: [city.long, city.lat] as [number, number],
        weight: percent,
      };
    });
};
