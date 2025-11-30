import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';

/**
 * checks if a city has any actual precipitation data
 * returns false if all weeks have null precipitation values
 */
export function hasPrecipitationData(
  weeklyWeatherData: CityWeeklyWeather | null | undefined
): boolean {
  if (!weeklyWeatherData) return false;

  return weeklyWeatherData.weeklyData.some(
    (week) => week.totalPrecip !== null || week.avgPrecip !== null
  );
}
