import type { WeatherData } from '@/types/cityWeatherDataType';
import type { SunshineData } from '@/types/sunshineDataType';
import type { WeatherDataUnion } from '@/types/mapTypes';

/**
 * Type guard to check if data is WeatherData
 */
export const isWeatherData = (data: WeatherDataUnion): data is WeatherData => {
  return 'avgTemperature' in data;
};

/**
 * Type guard to check if data is SunshineData
 */
export const isSunshineData = (
  data: WeatherDataUnion
): data is SunshineData => {
  return 'jan' in data;
};

/**
 * Type guard for valid marker data with coordinates and temperature
 */
export interface ValidWeatherMarkerData extends WeatherData {
  lat: number;
  long: number;
  avgTemperature: number;
}

export const isValidWeatherMarkerData = (
  data: WeatherDataUnion
): data is ValidWeatherMarkerData => {
  return (
    isWeatherData(data) &&
    data.lat !== null &&
    data.long !== null &&
    data.avgTemperature !== null
  );
};

/**
 * Type guard for valid sunshine marker data with coordinates
 */
export interface ValidSunshineMarkerData extends SunshineData {
  lat: number;
  long: number;
}

export const isValidSunshineMarkerData = (
  data: WeatherDataUnion
): data is ValidSunshineMarkerData => {
  return isSunshineData(data) && data.lat !== null && data.long !== null;
};
