import { useQuery } from '@apollo/client/react';
import { useState, useEffect, useMemo } from 'react';
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
  // Get cache functions from the store
  const { getFromCache, addToCache } = useCityDataCacheStore();

  // Format the date for the query (remove any dashes)
  const formattedDate = useMemo(() => {
    return selectedDate ? selectedDate.replaceAll('-', '') : '';
  }, [selectedDate]);

  // Generate a unique cache key for this city and date
  // Only create key if we have valid coordinates to avoid collisions
  const cacheKey = useMemo(() => {
    if (cityName && formattedDate && lat != null && long != null) {
      return `weather-${cityName.toLowerCase()}-${lat}-${long}-${formattedDate}`;
    }
    return null;
  }, [cityName, lat, long, formattedDate]);

  // Check cache synchronously before query initialization
  const cachedData = useMemo(() => {
    if (cacheKey) {
      return getFromCache(cacheKey);
    }
    return null;
  }, [cacheKey, getFromCache]);

  // Initialize state with cached data if available
  const [weatherData, setWeatherData] = useState<WeatherData | null>(
    cachedData?.weatherData || null
  );

  // Fetch weather data for the specific city and date only if not in cache
  const {
    data: weatherResponse,
    loading: weatherLoading,
    error: weatherError,
  } = useQuery<WeatherByCityAndDateResponse, WeatherByCityAndDateVars>(
    GET_WEATHER_BY_CITY_AND_DATE,
    {
      variables: {
        city: cityName || '',
        lat: lat,
        long: long,
        monthDay: formattedDate,
      },
      skip:
        skipFetch ||
        !formattedDate ||
        formattedDate.length !== 4 ||
        !cityName ||
        !cacheKey ||
        !!cachedData?.weatherData,
      fetchPolicy: 'network-only', // Use custom cache, bypass Apollo cache
    }
  );

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
