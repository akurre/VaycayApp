import { useMemo } from 'react';
import type { ValidMarkerData } from '../types/cityWeatherDataType';
import { DataType } from '@/types/mapTypes';
import type { WeatherDataUnion } from '@/types/mapTypes';
import { MONTH_FIELDS } from '@/const';
import type { ColorCacheEntry } from '@/const';
import { isWeatherData, isSunshineData } from '@/utils/typeGuards';
import type { ValidSunshineMarkerData } from '@/utils/typeGuards';
import { getColorForCity } from '../utils/map/getColorForCity';
import { perfMonitor } from '@/utils/performance/performanceMonitor';

interface ColorCacheResult<T> {
  cache: Map<string, ColorCacheEntry>;
  validCities: T[];
}

/**
 * Manages color caching for temperature markers.
 * Returns both the color cache and the filtered cities array to avoid duplicate filtering.
 */
export function useTemperatureColorCache(
  cities: WeatherDataUnion[],
  dataType: DataType,
  maxCitiesToShow: number
): ColorCacheResult<ValidMarkerData> | null {
  return useMemo(() => {
    if (dataType !== DataType.Temperature) return null;

    perfMonitor.start('temperature-color-cache');

    const cache = new Map<string, ColorCacheEntry>();

    // Only process the first maxCitiesToShow cities that have valid data
    const validCities = cities
      .filter(
        (c): c is ValidMarkerData =>
          isWeatherData(c) &&
          c.lat !== null &&
          c.long !== null &&
          c.avgTemperature !== null
      )
      .slice(0, maxCitiesToShow);

    // Pre-calculate colors for all valid cities
    for (const city of validCities) {
      const color = getColorForCity(city, dataType);
      // Use city ID as key (combination of name and coordinates for uniqueness)
      const key = `${city.city}_${city.lat}_${city.long}`;
      cache.set(key, color);
    }

    perfMonitor.end('temperature-color-cache');

    return { cache, validCities };
  }, [cities, dataType, maxCitiesToShow]);
}

/**
 * Manages color caching for sunshine markers.
 * Returns both the color cache and the filtered cities array to avoid duplicate filtering.
 */
export function useSunshineColorCache(
  cities: WeatherDataUnion[],
  dataType: DataType,
  selectedMonth: number,
  maxCitiesToShow: number
): ColorCacheResult<ValidSunshineMarkerData> | null {
  return useMemo(() => {
    if (dataType !== DataType.Sunshine) return null;

    perfMonitor.start('sunshine-color-cache');

    const cache = new Map<string, ColorCacheEntry>();
    const monthField = MONTH_FIELDS[selectedMonth];

    // Only process the first maxCitiesToShow cities that have valid data
    const validCities = cities
      .filter((c): c is ValidSunshineMarkerData => {
        if (!isSunshineData(c) || c.lat === null || c.long === null)
          return false;
        return c[monthField] !== null;
      })
      .slice(0, maxCitiesToShow);

    // Pre-calculate colors for all valid cities
    for (const city of validCities) {
      const color = getColorForCity(city, dataType, selectedMonth);
      // Use city ID as key (combination of name and coordinates for uniqueness)
      const key = `${city.city}_${city.lat}_${city.long}`;
      cache.set(key, color);
    }

    perfMonitor.end('sunshine-color-cache');

    return { cache, validCities };
  }, [cities, dataType, selectedMonth, maxCitiesToShow]);
}
