import { useQuery } from '@apollo/client/react';
import { useState, useEffect } from 'react';
import { SunshineData } from '@/types/sunshineDataType';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { GET_SUNSHINE_FOR_POPUP } from '../queries';
import { useCityDataCacheStore } from '@/stores/useCityDataCacheStore';

interface UseSunshineDataForCityParams {
  cityName: string | null;
  lat?: number | null;
  long?: number | null;
  selectedMonth: number;
  skipFetch?: boolean;
}

interface SunshineByMonthResponse {
  sunshineByMonth: SunshineData[];
}

/**
 * Hook to fetch sunshine data for a specific city in a specific month
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

  // Generate a unique cache key for this city and month
  const cacheKey = cityName
    ? `sunshine-${cityName.toLowerCase()}-${lat || 0}-${long || 0}-${selectedMonth}`
    : '';

  // Check cache first
  useEffect(() => {
    if (cacheKey) {
      const cachedData = getFromCache(cacheKey);
      if (cachedData && cachedData.sunshineData) {
        setSunshineData(cachedData.sunshineData);
      }
    }
  }, [cacheKey, getFromCache]);

  // Fetch sunshine data for the month if not in cache
  const {
    data: sunshineResponse,
    loading: sunshineLoading,
    error: sunshineError,
  } = useQuery<SunshineByMonthResponse>(GET_SUNSHINE_FOR_POPUP, {
    variables: { month: selectedMonth },
    skip: skipFetch || !selectedMonth || !cityName || !!sunshineData, // Skip if we have cached data
    fetchPolicy: 'network-only', // Always fetch fresh data when needed
  });

  // Process sunshine data when it's loaded
  useEffect(() => {
    if (
      sunshineResponse?.sunshineByMonth &&
      sunshineResponse.sunshineByMonth.length > 0 &&
      cityName
    ) {
      // Find the sunshine data for the exact city
      // We need to match by both name and coordinates since there might be multiple cities with the same name
      const citySunshine = sunshineResponse.sunshineByMonth.find((s) => {
        const nameMatch = s.city.toLowerCase() === cityName.toLowerCase();

        // If we have coordinates, use them for more precise matching
        if (lat !== undefined && lat !== null && long !== undefined && long !== null) {
          const coordMatch =
            s.lat !== null &&
            s.long !== null &&
            Math.abs(s.lat - lat) < 0.01 &&
            Math.abs(s.long - long) < 0.01;

          return nameMatch && coordMatch;
        }

        return nameMatch;
      });

      if (citySunshine) {
        setSunshineData(citySunshine);

        // Update cache
        if (cacheKey) {
          addToCache(cacheKey, null, citySunshine);
        }
      }
    }
  }, [sunshineResponse, cityName, lat, long, cacheKey, addToCache]);

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
