import { useQuery } from '@apollo/client/react';
import { useState, useEffect } from 'react';
import { WeatherData } from '@/types/cityWeatherDataType';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { GET_WEATHER_BY_CITY_AND_DATE } from '../queries';
import { useCityDataCacheStore } from '@/stores/useCityDataCacheStore';

interface UseWeatherDataForCityParams {
  cityName: string | null;
  lat?: number | null;
  long?: number | null;
  selectedDate: string;
  skipFetch?: boolean;
}

interface WeatherByCityAndDateResponse {
  weatherByCityAndDate: WeatherData | null;
}

interface WeatherByCityAndDateVars {
  city: string;
  lat?: number | null;
  long?: number | null;
  monthDay: string;
}

/**
 * Hook to fetch weather data for a specific city on a specific date
 * Uses city-specific query with LRU caching (max 30 cities)
 */
function useWeatherDataForCity({
  cityName,
  lat,
  long,
  selectedDate,
  skipFetch = false,
}: UseWeatherDataForCityParams) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  // Get cache functions from the store
  const { getFromCache, addToCache } = useCityDataCacheStore();

  // Format the date for the query (remove any dashes)
  const formattedDate = selectedDate ? selectedDate.replaceAll('-', '') : '';

  // Generate a unique cache key for this city and date
  const cacheKey =
    cityName && formattedDate
      ? `weather-${cityName.toLowerCase()}-${lat || 0}-${long || 0}-${formattedDate}`
      : '';

  // Check cache first and initialize weatherData
  useEffect(() => {
    if (cacheKey) {
      const cachedData = getFromCache(cacheKey);
      if (cachedData && cachedData.weatherData) {
        setWeatherData(cachedData.weatherData);
      }
    }
  }, [cacheKey, getFromCache]);

  // Fetch weather data for the specific city and date
  const {
    data: weatherResponse,
    loading: weatherLoading,
    error: weatherError,
  } = useQuery<WeatherByCityAndDateResponse, WeatherByCityAndDateVars>(GET_WEATHER_BY_CITY_AND_DATE, {
    variables: { 
      city: cityName || '',
      lat: lat,
      long: long,
      monthDay: formattedDate 
    },
    skip: skipFetch || !formattedDate || formattedDate.length !== 4 || !cityName || !!weatherData,
    fetchPolicy: 'cache-first', // Use Apollo cache first, then network
  });

  // Process weather data when it's loaded
  useEffect(() => {
    if (weatherResponse?.weatherByCityAndDate) {
      const cityWeather = weatherResponse.weatherByCityAndDate;
      setWeatherData(cityWeather);

      // Update cache
      if (cacheKey) {
        addToCache(cacheKey, cityWeather, null);
      }
    }
  }, [weatherResponse, cacheKey, addToCache]);

  // Handle errors
  useEffect(() => {
    if (weatherError) {
      parseErrorAndNotify(weatherError, 'failed to load weather data for city');
    }
  }, [weatherError]);

  return {
    weatherData,
    weatherLoading,
    weatherError: !!weatherError,
  };
}

export default useWeatherDataForCity;
