import { useQuery } from '@apollo/client/react';
import { GET_WEATHER_BY_DATE } from '../queries';
import type {
  WeatherData,
  WeatherByDateResponse,
  WeatherByDateVars,
} from '../../types/cityWeatherDataType';

export function useWeatherByDate(date: string) {
  // Remove any dashes from the date format (e.g., "03-03" -> "0303")
  const formattedDate = date ? date.replaceAll('-', '') : '';

  const { data, loading, error } = useQuery<
    WeatherByDateResponse,
    WeatherByDateVars
  >(GET_WEATHER_BY_DATE, {
    variables: { monthDay: formattedDate },
    skip: !formattedDate || formattedDate.length !== 4,
  });

  const weatherData: WeatherData[] | undefined = data?.weatherByDate;

  return {
    dataReturned: weatherData,
    isLoading: loading,
    isError: error,
  };
}
