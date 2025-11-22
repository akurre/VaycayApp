import { useQuery } from '@apollo/client/react';
import { useState, useEffect, useMemo } from 'react';
import { SunshineData } from '@/types/sunshineDataType';
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
  const { getFromCache, addToCache } = useCityDataCacheStore();

  // Generate a unique cache key for this city (sunshine data includes all months)
  // Only create key if we have valid coordinates to avoid collisions
  const cacheKey = useMemo(() => {
    if (cityName && lat != null && long != null) {
      return `sunshine-${cityName.toLowerCase()}-${lat}-${long}`;
    }
    return null;
  }, [cityName, lat, long]);

  // Check cache synchronously before query initialization
  const cachedData = useMemo(() => {
    if (cacheKey) {
      return getFromCache(cacheKey);
    }
    return null;
  }, [cacheKey, getFromCache]);

  // Initialize state with cached data if available
  const [sunshineData, setSunshineData] = useState<SunshineData | null>(
    cachedData?.sunshineData || null
  );

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

  // Process sunshine data when it's loaded
  useEffect(() => {
    if (sunshineResponse?.sunshineByCity) {
      const citySunshine = sunshineResponse.sunshineByCity;
      setSunshineData(citySunshine);

      // Update cache
      if (cacheKey) {
        addToCache(cacheKey, null, citySunshine);
      }
    }
  }, [sunshineResponse, cacheKey, addToCache]);

  // Handle errors
  useEffect(() => {
    if (sunshineError) {
      parseErrorAndNotify(sunshineError, 'failed to load sunshine data for city');
    }
  }, [sunshineError]);

  return {
    sunshineData,
    sunshineLoading,
    sunshineError: !!sunshineError,
  };
}

export default useSunshineDataForCity;
