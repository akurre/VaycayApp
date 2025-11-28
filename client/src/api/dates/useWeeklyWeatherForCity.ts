import { useQuery } from '@apollo/client/react';
import { useEffect, useMemo } from 'react';

import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { useCityDataCacheStore } from '@/stores/useCityDataCacheStore';
import { GET_WEEKLY_WEATHER_BY_CITY } from '../queries';

import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';

interface UseWeeklyWeatherForCityParams {
  cityName: string | null;
  lat?: number | null;
  long?: number | null;
  skipFetch?: boolean;
}

/**
 * Hook to fetch weekly aggregated weather data for a specific city (52 weeks)
 * Uses city-specific query with LRU caching (max 30 cities)
 */
function useWeeklyWeatherForCity({
  cityName,
  lat,
  long,
  skipFetch = false,
}: UseWeeklyWeatherForCityParams) {
  const { getFromCache, addToCache, markAsRecentlyUsed } =
    useCityDataCacheStore();

  // Generate cache key
  const cacheKey = useMemo(() => {
    if (cityName && lat != null && long != null) {
      return `weekly-weather-${cityName.toLowerCase()}-${lat}-${long}`;
    }
    return null;
  }, [cityName, lat, long]);

  // Check cache
  const cachedData = cacheKey ? getFromCache(cacheKey) : null;

  // Fetch data
  const { data, loading, error } = useQuery<
    { weeklyWeatherByCity: CityWeeklyWeather | null },
    { city: string; lat?: number | null; long?: number | null }
  >(GET_WEEKLY_WEATHER_BY_CITY, {
    variables: {
      city: cityName || '',
      lat: lat ?? undefined,
      long: long ?? undefined,
    },
    skip:
      skipFetch || !cityName || !cacheKey || !!cachedData?.weeklyWeatherData,
    fetchPolicy: 'network-only',
  });

  // Update cache when data is fetched
  useEffect(() => {
    if (data?.weeklyWeatherByCity && cacheKey) {
      // Store weekly weather in cache
      addToCache(cacheKey, null, null, data.weeklyWeatherByCity);
    }
  }, [data, cacheKey, addToCache]);

  // Mark as recently used
  useEffect(() => {
    if (cacheKey && cachedData?.weeklyWeatherData) {
      markAsRecentlyUsed(cacheKey);
    }
  }, [cacheKey, cachedData, markAsRecentlyUsed]);

  // Handle errors
  useEffect(() => {
    if (error) {
      const context = cityName ? ` for ${cityName}` : '';
      parseErrorAndNotify(
        error,
        `failed to load weekly weather data${context}`
      );
    }
  }, [error, cityName]);

  const weeklyWeatherData =
    cachedData?.weeklyWeatherData || data?.weeklyWeatherByCity || null;

  return {
    weeklyWeatherData,
    loading,
    error: !!error,
  };
}

export default useWeeklyWeatherForCity;
