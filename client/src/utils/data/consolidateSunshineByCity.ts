import type { SunshineData } from '@/types/sunshineDataType';

/**
 * Groups sunshine records by city and averages monthly sunshine hours across all stations.
 *
 * Problem: Multiple weather stations per city create duplicate markers at identical coordinates.
 * Solution: Consolidate all records for the same city+country into a single averaged record.
 *
 * @param sunshineData - Array of sunshine records (may include multiple stations per city)
 * @returns Array with one record per city, with averaged monthly values
 *
 * @example
 * // Input: Paris with 2 stations
 * [
 *   { city: "Paris", country: "France", jan: 62, feb: 71, stationName: "Station 1" },
 *   { city: "Paris", country: "France", jan: 58, feb: 69, stationName: "Station 2" }
 * ]
 * // Output: Consolidated Paris with averaged data
 * [
 *   { city: "Paris", country: "France", jan: 60, feb: 70, stationName: "Paris (2 stations avg)" }
 * ]
 */
export function consolidateSunshineByCity(
  sunshineData: SunshineData[]
): SunshineData[] {
  // Group by city+country (city names can repeat across countries)
  const grouped = new Map<string, SunshineData[]>();

  for (const record of sunshineData) {
    const key = `${record.city}|${record.country || 'unknown'}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(record);
    } else {
      grouped.set(key, [record]);
    }
  }

  // Consolidate each group
  const consolidated: SunshineData[] = [];

  for (const records of grouped.values()) {
    if (records.length === 1) {
      // Single station - use as-is
      consolidated.push(records[0]);
      continue;
    }

    // Multiple stations - average monthly sunshine hours
    const base = records[0];

    // Helper to average non-null values
    const average = (values: (number | null)[]): number | null => {
      const nonNull = values.filter((v): v is number => v !== null);
      if (nonNull.length === 0) return null;
      return nonNull.reduce((sum, val) => sum + val, 0) / nonNull.length;
    };

    const consolidated_record: SunshineData = {
      // Preserve metadata from first record
      city: base.city,
      country: base.country,
      state: base.state,
      suburb: base.suburb,
      lat: base.lat,
      long: base.long,
      population: base.population,

      // Average monthly sunshine hours across all stations
      jan: average(records.map((r) => r.jan)),
      feb: average(records.map((r) => r.feb)),
      mar: average(records.map((r) => r.mar)),
      apr: average(records.map((r) => r.apr)),
      may: average(records.map((r) => r.may)),
      jun: average(records.map((r) => r.jun)),
      jul: average(records.map((r) => r.jul)),
      aug: average(records.map((r) => r.aug)),
      sep: average(records.map((r) => r.sep)),
      oct: average(records.map((r) => r.oct)),
      nov: average(records.map((r) => r.nov)),
      dec: average(records.map((r) => r.dec)),

      // Update station name to indicate consolidation
      stationName: `${base.city} (${records.length} stations avg)`,
    };

    consolidated.push(consolidated_record);
  }

  return consolidated;
}
