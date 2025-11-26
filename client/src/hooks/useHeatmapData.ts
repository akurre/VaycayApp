import { useMemo } from 'react';
import type { WeatherData } from '../types/cityWeatherDataType';
import type { SunshineData } from '@/types/sunshineDataType';
import { transformToHeatmapData } from '../utils/map/transformToHeatmapData';
import { transformToSunshineHeatmapData } from '../utils/map/transformToSunshineHeatmapData';
import { DataType } from '@/types/mapTypes';
import type { WeatherDataUnion } from '@/types/mapTypes';
import { isWeatherData, isSunshineData } from '@/utils/typeGuards';

/**
 * Transforms city data into heatmap format based on data type
 */
export function useHeatmapData(
  cities: WeatherDataUnion[],
  dataType: DataType,
  selectedMonth: number
) {
  return useMemo(() => {
    if (dataType === DataType.Temperature) {
      // Filter to only WeatherData objects
      const weatherCities = cities.filter(isWeatherData) as WeatherData[];
      return transformToHeatmapData(weatherCities);
    } else {
      // Filter to only SunshineData objects
      const sunshineCities = cities.filter(isSunshineData) as SunshineData[];
      return transformToSunshineHeatmapData(sunshineCities, selectedMonth);
    }
  }, [cities, dataType, selectedMonth]);
}
