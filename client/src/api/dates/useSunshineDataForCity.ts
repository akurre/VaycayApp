import { useQuery } from '@apollo/client/react';
import { useState, useEffect } from 'react';
import { SunshineData } from '@/types/sunshineDataType';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { GET_SUNSHINE_BY_CITY } from '../queries';
import { useCityDataCacheStore } from '@/stores/useCityDataCacheStore';

interface UseSunshineDataForCityParams {
  cityName: string | null;
  lat?: number | null;
  long?: number | null;
  selectedMonth: number;
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
  selectedMonth,
  skipFetch = false,
}: UseSunshineDataForCityParams) {
  const [sunshineData, setSunshineData] = useState<SunshineData | null>(null);

  // Get cache functions from the store
  const { getFromCache, addToCache } = useCityDataCacheStore();

  // Generate a unique cache key for this city (sunshine data includes all months)
  const cacheKey = cityName ? `sunshine-${cityName.toLowerCase()}-${lat || 0}-${long || 0}` : '';

  // Check cache first
  useEffect(() => {
    if (cacheKey) {
      const cachedData = getFromCache(cacheKey);
      if (cachedData && cachedData.sunshineData) {
        setSunshineData(cachedData.sunshineData);
      }
    }
  }, [cacheKey, getFromCache]);

  // Fetch sunshine data for the specific city
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
    skip: skipFetch || !cityName || !!sunshineData, // Skip if we have cached data
    fetchPolicy: 'cache-first', // Use Apollo cache first, then network
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
