import { calculateTheoreticalMaxSunshine } from './calculateTheoreticalMaxSunshine';

/**
 * Generate theoretical maximum sunshine data for all 12 months
 *
 * @param latitude - Latitude in degrees (-90 to 90)
 * @returns Array of theoretical max sunshine hours for each month
 */
export function generateTheoreticalMaxSunshineData(latitude: number): number[] {
  return Array.from({ length: 12 }, (_, index) =>
    calculateTheoreticalMaxSunshine(latitude, index + 1)
  );
}
