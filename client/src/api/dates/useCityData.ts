import { useQuery } from '@apollo/client/react';
import { useState, useEffect } from 'react';
import { WeatherData } from '@/types/cityWeatherDataType';
import { SunshineData } from '@/types/sunshineDataType';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { getTodayAsMMDD } from '@/utils/dateFormatting/getTodayAsMMDD';
import { GET_WEATHER_FOR_POPUP, GET_SUNSHINE_FOR_POPUP } from '../queries';
import { useCityDataCacheStore } from '@/stores/useCityDataCacheStore';

interface UseCityDataParams {
  cityName: string | null;
  lat?: number | null;
  long?: number | null;
  selectedMonth?: number;
}

interface WeatherByCityResponse {
  weatherByCity: WeatherData[];
}

interface SunshineByMonthResponse {
  sunshineByMonth: SunshineData[];
}

/**
 * Hook to fetch both weather and sunshine data for a specific city
 * This allows the CityPopup to display both types of data regardless of the active data mode
 * Uses a cache to store recently viewed cities and reduce API calls
 */
function useCityData({ cityName, lat, long, selectedMonth }: UseCityDataParams) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [sunshineData, setSunshineData] = useState<SunshineData | null>(null);

  // Get cache functions from the store
  const { getFromCache, addToCache } = useCityDataCacheStore();

  // Default to current month if not provided
  const month = selectedMonth || parseInt(getTodayAsMMDD().substring(0, 2), 10);

  // Generate a unique cache key for this city
  // Include coordinates for more precise matching if available
  const cacheKey = cityName ? `${cityName.toLowerCase()}-${lat || 0}-${long || 0}-${month}` : '';

  // Check cache first
  useEffect(() => {
    if (cacheKey) {
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        // Use cached data
        setWeatherData(cachedData.weatherData);
        setSunshineData(cachedData.sunshineData);
      }
    }
  }, [cacheKey, getFromCache]);

  // Fetch weather data for the city if not in cache
  const {
    data: weatherResponse,
    loading: weatherLoading,
    error: weatherError,
  } = useQuery<WeatherByCityResponse>(GET_WEATHER_FOR_POPUP, {
    variables: { city: cityName },
    skip: !cityName || !!weatherData, // Skip if we have cached data
    fetchPolicy: 'network-only', // Always fetch fresh data when needed
  });

  // Fetch sunshine data for the month if not in cache
  const {
    data: sunshineResponse,
    loading: sunshineLoading,
    error: sunshineError,
  } = useQuery<SunshineByMonthResponse>(GET_SUNSHINE_FOR_POPUP, {
    variables: { month },
    skip: !month || !!sunshineData, // Skip if we have cached data
    fetchPolicy: 'network-only', // Always fetch fresh data when needed
  });

  // Process weather data when it's loaded
  useEffect(() => {
    if (weatherResponse?.weatherByCity && weatherResponse.weatherByCity.length > 0) {
      // Find the weather data for the exact city
      const cityWeather = weatherResponse.weatherByCity.find(
        (w) => w.city.toLowerCase() === cityName?.toLowerCase()
      );

      if (cityWeather) {
        setWeatherData(cityWeather);

        // Update cache if we have both weather and sunshine data
        if (cacheKey && sunshineData) {
          addToCache(cacheKey, cityWeather, sunshineData);
        }
      }
    }
  }, [weatherResponse, cityName, cacheKey, sunshineData, addToCache]);

  // Process sunshine data when it's loaded
  useEffect(() => {
    if (sunshineResponse?.sunshineByMonth && sunshineResponse.sunshineByMonth.length > 0) {
      // Find the sunshine data for the exact city
      // We need to match by both name and coordinates since there might be multiple cities with the same name
      const citySunshine = sunshineResponse.sunshineByMonth.find((s) => {
        const nameMatch = s.city.toLowerCase() === cityName?.toLowerCase();

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

        // Update cache if we have both weather and sunshine data
        if (cacheKey && weatherData) {
          addToCache(cacheKey, weatherData, citySunshine);
        }
      }
    }
  }, [sunshineResponse, cityName, lat, long, cacheKey, weatherData, addToCache]);

  // Handle errors
  useEffect(() => {
    if (weatherError) {
      parseErrorAndNotify(weatherError, 'failed to load weather data for city');
    }
  }, [weatherError]);

  useEffect(() => {
    if (sunshineError) {
      parseErrorAndNotify(sunshineError, 'failed to load sunshine data for city');
    }
  }, [sunshineError]);

  return {
    weatherData,
    sunshineData,
    isLoading: weatherLoading || sunshineLoading, // todo decouple loading states
    hasError: !!weatherError || !!sunshineError, // todo decouple error states
  };
}

export default useCityData;
