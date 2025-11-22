import { useQuery } from '@apollo/client/react';
import { useEffect, useMemo } from 'react';
import type { WeatherData } from '@/types/cityWeatherDataType';
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
  const { getFromCache, addToCache, markAsRecentlyUsed } = useCityDataCacheStore();

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

  // Check cache directly - getFromCache is already memoized by zustand
  const cachedData = cacheKey ? getFromCache(cacheKey) : null;

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

  // Update cache when new data is fetched
  useEffect(() => {
    if (weatherResponse?.weatherByCityAndDate && cacheKey) {
      addToCache(cacheKey, weatherResponse.weatherByCityAndDate, null);
    }
  }, [weatherResponse, cacheKey, addToCache]);

  // Mark cache as recently used when accessed
  useEffect(() => {
    if (cacheKey && cachedData) {
      markAsRecentlyUsed(cacheKey);
    }
  }, [cacheKey, cachedData, markAsRecentlyUsed]);

  // Handle errors with context
  useEffect(() => {
    if (weatherError) {
      const context = cityName ? ` for ${cityName}` : '';
      parseErrorAndNotify(weatherError, `failed to load weather data${context}`);
    }
  }, [weatherError, cityName]);

  // Derive data from cache or query response
  const weatherData = cachedData?.weatherData || weatherResponse?.weatherByCityAndDate || null;

  return {
    weatherData,
    weatherLoading,
    weatherError: !!weatherError,
  };
}

export default useWeatherDataForCity;
