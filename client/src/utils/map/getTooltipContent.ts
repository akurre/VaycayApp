import { WeatherData } from '../../types/cityWeatherDataType';
import { SunshineData } from '@/types/sunshineDataType';
import { formatTemperature } from '../tempFormatting/formatTemperature';
import { DataType, WeatherDataUnion } from '@/types/mapTypes';
import { MONTH_FIELDS } from '@/constants';

/**
 * Determines if a data object is a WeatherData object
 */
const isWeatherData = (data: WeatherDataUnion): data is WeatherData => {
  return 'avgTemperature' in data;
};

/**
 * Determines if a data object is a SunshineData object
 */
const isSunshineData = (data: WeatherDataUnion): data is SunshineData => {
  return 'jan' in data;
};

/**
 * Gets the sunshine hours value for a specific month from SunshineData
 */
const getSunshineHoursForMonth = (data: SunshineData, month: number): number | null => {
  if (!month || month < 1 || month > 12) return null;

  const field = MONTH_FIELDS[month];
  return data[field] as number | null;
};

/**
 * Formats sunshine hours for display
 */
const formatSunshineHours = (hours: number | null): string => {
  if (hours === null) return 'No data';
  return `${hours.toFixed(1)} hours`;
};

/**
 * Finds the city data for a given coordinate position
 * Used for displaying tooltip information on hover
 */
export const getTooltipContent = (
  cities: WeatherDataUnion[],
  longitude: number,
  latitude: number,
  dataType: DataType = DataType.Temperature,
  selectedMonth?: number
): string | null => {
  // Find city within a small radius (approximately 50km at equator)
  const TOLERANCE = 0.5;

  const city = cities.find(
    (c) =>
      c.lat !== null &&
      c.long !== null &&
      Math.abs(c.lat - latitude) < TOLERANCE &&
      Math.abs(c.long - longitude) < TOLERANCE
  );

  if (!city) {
    return null;
  }

  const locationInfo = `${city.city}, ${city.country || 'Unknown'}`;

  if (dataType === DataType.Temperature && isWeatherData(city)) {
    if (city.avgTemperature === null) {
      return null;
    }
    return `${locationInfo}
${formatTemperature(city.avgTemperature)}`;
  } else if (dataType === DataType.Sunshine && isSunshineData(city) && selectedMonth) {
    const sunshineHours = getSunshineHoursForMonth(city, selectedMonth);
    if (sunshineHours === null) {
      return null;
    }
    return `${locationInfo}
${formatSunshineHours(sunshineHours)}`;
  }

  return null;
};
