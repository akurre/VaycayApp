import { useQuery } from '@apollo/client/react';
import { useState, useEffect } from 'react';
import { WeatherData } from '@/types/cityWeatherDataType';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { GET_WEATHER_BY_DATE } from '../queries';
import { useCityDataCacheStore } from '@/stores/useCityDataCacheStore';

interface UseWeatherDataForCityParams {
  cityName: string | null;
  lat?: number | null;
  long?: number | null;
  selectedDate: string;
}

interface WeatherByDateResponse {
  weatherByDate: WeatherData[];
}

interface WeatherByDateVars {
  monthDay: string;
}

/**
 * Hook to fetch weather data for a specific city on a specific date
 * Uses the weatherByDate query and filters for the specific city on the client side
 */
function useWeatherDataForCity({ 
  cityName, 
  lat, 
  long, 
  selectedDate 
}: UseWeatherDataForCityParams) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  
  // Get cache functions from the store
  const { getFromCache, addToCache } = useCityDataCacheStore();

  // Format the date for the query (remove any dashes)
  const formattedDate = selectedDate ? selectedDate.replaceAll('-', '') : '';

  // Generate a unique cache key for this city and date
  const cacheKey = cityName && formattedDate 
    ? `weather-${cityName.toLowerCase()}-${lat || 0}-${long || 0}-${formattedDate}` 
    : '';

  // Check cache first
  useEffect(() => {
    if (cacheKey) {
      const cachedData = getFromCache(cacheKey);
      if (cachedData && cachedData.weatherData) {
        setWeatherData(cachedData.weatherData);
      }
    }
  }, [cacheKey, getFromCache]);

  // Fetch weather data for the date if not in cache
  const {
    data: weatherResponse,
    loading: weatherLoading,
    error: weatherError,
  } = useQuery<WeatherByDateResponse, WeatherByDateVars>(GET_WEATHER_BY_DATE, {
    variables: { monthDay: formattedDate },
    skip: !formattedDate || formattedDate.length !== 4 || !cityName || !!weatherData,
    fetchPolicy: 'network-only', // Always fetch fresh data when needed
  });

  // Process weather data when it's loaded
  useEffect(() => {
    if (weatherResponse?.weatherByDate && weatherResponse.weatherByDate.length > 0 && cityName) {
      // Find the weather data for the exact city
      const cityWeather = weatherResponse.weatherByDate.find(
        (w) => w.city.toLowerCase() === cityName.toLowerCase()
      );

      if (cityWeather) {
        setWeatherData(cityWeather);

        // Update cache
        if (cacheKey) {
          addToCache(cacheKey, cityWeather, null);
        }
      }
    }
  }, [weatherResponse, cityName, cacheKey, addToCache]);

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
