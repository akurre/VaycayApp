import type { WeatherData } from '../../types/cityWeatherDataType';

export interface HeatmapDataPoint {
  position: [number, number];
  weight: number;
}

/**
 * transforms weather data into format suitable for deck.gl heatmaplayer
 * uses actual temperature values as weights for relative color mapping
 */
export const transformToHeatmapData = (
  cities: WeatherData[]
): HeatmapDataPoint[] => {
  const validCities = cities.filter(
    (city) =>
      city.lat !== null && city.long !== null && city.avgTemperature !== null
  );

  if (validCities.length === 0) {
    return [];
  }

  return validCities.map((city) => ({
    position: [city.long!, city.lat!] as [number, number],
    weight: city.avgTemperature!,
  }));
};
