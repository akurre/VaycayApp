import { useQuery } from '@apollo/client/react';
import { useEffect, useMemo } from 'react';
import type { SunshineData } from '@/types/sunshineDataType';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { GET_SUNSHINE_BY_CITY } from '../queries';
import { useCityDataCacheStore } from '@/stores/useCityDataCacheStore';

interface UseSunshineDataForCityParams {
  cityName: string | null;
  lat?: number | null;
  long?: number | null;
  skipFetch?: boolean;
}

interface SunshineByCityResponse {
  sunshineByCity: SunshineData | null;
}

interface SunshineByCityVars {
  city: string;
  lat?: number | null;
  long?: number | null;
}

/**
 * Hook to fetch sunshine data for a specific city (all 12 months)
 * Uses city-specific query with LRU caching (max 30 cities)
 */
function useSunshineDataForCity({
  cityName,
  lat,
  long,
  skipFetch = false,
}: UseSunshineDataForCityParams) {
  // Get cache functions from the store
  const { getFromCache, addToCache, markAsRecentlyUsed } = useCityDataCacheStore();

  // Generate a unique cache key for this city (sunshine data includes all months)
  // Only create key if we have valid coordinates to avoid collisions
  const cacheKey = useMemo(() => {
    if (cityName && lat != null && long != null) {
      return `sunshine-${cityName.toLowerCase()}-${lat}-${long}`;
    }
    return null;
  }, [cityName, lat, long]);

  // Check cache directly - getFromCache is already memoized by zustand
  const cachedData = cacheKey ? getFromCache(cacheKey) : null;

  // Fetch sunshine data for the specific city only if not in cache
  const {
    data: sunshineResponse,
    loading: sunshineLoading,
    error: sunshineError,
  } = useQuery<SunshineByCityResponse, SunshineByCityVars>(GET_SUNSHINE_BY_CITY, {
    variables: {
      city: cityName || '',
      lat: lat,
      long: long,
    },
    skip: skipFetch || !cityName || !cacheKey || !!cachedData?.sunshineData,
    fetchPolicy: 'network-only', // Use custom cache, bypass Apollo cache
  });

  // Update cache when new data is fetched
  useEffect(() => {
    if (sunshineResponse?.sunshineByCity && cacheKey) {
      addToCache(cacheKey, null, sunshineResponse.sunshineByCity);
    }
  }, [sunshineResponse, cacheKey, addToCache]);

  // Mark cache as recently used when accessed
  useEffect(() => {
    if (cacheKey && cachedData) {
      markAsRecentlyUsed(cacheKey);
    }
  }, [cacheKey, cachedData, markAsRecentlyUsed]);

  // Handle errors with context
  useEffect(() => {
    if (sunshineError) {
      const context = cityName ? ` for ${cityName}` : '';
      parseErrorAndNotify(sunshineError, `failed to load sunshine data${context}`);
    }
  }, [sunshineError, cityName]);

  // Derive data from cache or query response
  const sunshineData = cachedData?.sunshineData || sunshineResponse?.sunshineByCity || null;

  return {
    sunshineData,
    sunshineLoading,
    sunshineError: !!sunshineError,
  };
}

export default useSunshineDataForCity;
