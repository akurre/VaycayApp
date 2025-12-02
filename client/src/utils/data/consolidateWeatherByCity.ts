import type { WeatherData } from '@/types/cityWeatherDataType';

/**
 * Groups weather records by city and averages numeric fields across all stations.
 *
 * Problem: Multiple weather stations per city create duplicate markers at identical coordinates.
 * Solution: Consolidate all records for the same city+country into a single averaged record.
 *
 * @param weatherData - Array of weather records (may include multiple stations per city)
 * @returns Array with one record per city, with averaged numeric values
 *
 * @example
 * // Input: Berlin with 2 stations
 * [
 *   { city: "Berlin", country: "Germany", avgTemperature: 15.2, stationName: "Station 1" },
 *   { city: "Berlin", country: "Germany", avgTemperature: 14.8, stationName: "Station 2" }
 * ]
 * // Output: Consolidated Berlin with averaged data
 * [
 *   { city: "Berlin", country: "Germany", avgTemperature: 15.0, stationName: "Berlin (2 stations avg)" }
 * ]
 */
export function consolidateWeatherByCity(
  weatherData: WeatherData[]
): WeatherData[] {
  // Group by cityId (most reliable way to identify same city location)
  // Multiple weather stations can share the same cityId
  const grouped = new Map<number, WeatherData[]>();

  for (const record of weatherData) {
    const existing = grouped.get(record.cityId);
    if (existing) {
      existing.push(record);
    } else {
      grouped.set(record.cityId, [record]);
    }
  }

  // Consolidate each group
  const consolidated: WeatherData[] = [];

  for (const records of grouped.values()) {
    if (records.length === 1) {
      // Single station - use as-is
      consolidated.push(records[0]);
      continue;
    }

    // Multiple stations - average numeric fields
    const base = records[0];

    // Helper to average non-null values
    const average = (values: (number | null)[]): number | null => {
      const nonNull = values.filter((v): v is number => v !== null);
      if (nonNull.length === 0) return null;
      return nonNull.reduce((sum, val) => sum + val, 0) / nonNull.length;
    };

    const consolidated_record: WeatherData = {
      // Preserve metadata from first record
      cityId: base.cityId,
      city: base.city,
      country: base.country,
      state: base.state,
      suburb: base.suburb,
      date: base.date,
      lat: base.lat,
      long: base.long,
      population: base.population,
      submitterId: base.submitterId,

      // Average numeric fields across all stations
      avgTemperature: average(records.map((r) => r.avgTemperature)),
      maxTemperature: average(records.map((r) => r.maxTemperature)),
      minTemperature: average(records.map((r) => r.minTemperature)),
      precipitation: average(records.map((r) => r.precipitation)),
      snowDepth: average(records.map((r) => r.snowDepth)),

      // Update station name to indicate consolidation
      stationName: `${base.city} (${records.length} stations avg)`,
    };

    consolidated.push(consolidated_record);
  }

  return consolidated;
}
