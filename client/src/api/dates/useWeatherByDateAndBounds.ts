import { useQuery } from '@apollo/client/react';
import { GET_WEATHER_BY_DATE, GET_WEATHER_BY_DATE_AND_BOUNDS } from '../queries';
import {
  WeatherData,
  WeatherByDateResponse,
  WeatherByDateVars,
} from '../../types/cityWeatherDataType';

/**
 * hook to fetch weather data with automatic query switching based on zoom level.
 * uses global query (weatherByDate) for zoom levels 1-3.
 * uses bounds query (weatherByDateAndBounds) for zoom levels 4+ for better performance.
 */

interface MapBounds {
  minLat: number;
  maxLat: number;
  minLong: number;
  maxLong: number;
}

interface WeatherByDateAndBoundsVars extends WeatherByDateVars {
  minLat: number;
  maxLat: number;
  minLong: number;
  maxLong: number;
}

interface UseWeatherByDateAndBoundsParams {
  date: string;
  bounds: MapBounds | null;
  shouldUseBounds: boolean;
}

function useWeatherByDateAndBounds({
  date,
  bounds,
  shouldUseBounds,
}: UseWeatherByDateAndBoundsParams) {
  // remove any dashes from the date format (e.g., "03-03" -> "0303")
  const formattedDate = date ? date.replaceAll('-', '') : '';

  // global query (zoom levels 1-3)
  const globalQuery = useQuery<WeatherByDateResponse, WeatherByDateVars>(GET_WEATHER_BY_DATE, {
    variables: { monthDay: formattedDate },
    skip: !formattedDate || formattedDate.length !== 4 || shouldUseBounds,
  });

  // bounds query (zoom levels 4+)
  const boundsQuery = useQuery<WeatherByDateResponse, WeatherByDateAndBoundsVars>(
    GET_WEATHER_BY_DATE_AND_BOUNDS,
    {
      variables: {
        monthDay: formattedDate,
        minLat: bounds?.minLat ?? 0,
        maxLat: bounds?.maxLat ?? 0,
        minLong: bounds?.minLong ?? 0,
        maxLong: bounds?.maxLong ?? 0,
      },
      skip: !formattedDate || formattedDate.length !== 4 || !shouldUseBounds || !bounds,
    }
  );

  // use the appropriate query based on zoom level
  const activeQuery = shouldUseBounds ? boundsQuery : globalQuery;

  const weatherData: WeatherData[] | undefined = shouldUseBounds
    ? activeQuery.data?.weatherByDateAndBounds
    : activeQuery.data?.weatherByDate;

  return {
    dataReturned: weatherData,
    isLoading: activeQuery.loading,
    isError: activeQuery.error,
  };
}

export default useWeatherByDateAndBounds;
