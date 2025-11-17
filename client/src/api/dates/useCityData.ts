import { useQuery } from '@apollo/client/react';
import { useState, useEffect } from 'react';
import { WeatherData } from '@/types/cityWeatherDataType';
import { SunshineData } from '@/types/sunshineDataType';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { getTodayAsMMDD } from '@/utils/dateFormatting/getTodayAsMMDD';
import { GET_WEATHER_BY_CITY_NAME, GET_SUNSHINE_BY_MONTH } from '../queries';

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
 */
function useCityData({ cityName, lat, long, selectedMonth }: UseCityDataParams) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [sunshineData, setSunshineData] = useState<SunshineData | null>(null);
  
  // Default to current month if not provided
  const month = selectedMonth || parseInt(getTodayAsMMDD().substring(0, 2), 10);

  // Fetch weather data for the city
  const {
    data: weatherResponse,
    loading: weatherLoading,
    error: weatherError
  } = useQuery<WeatherByCityResponse>(GET_WEATHER_BY_CITY_NAME, {
    variables: { city: cityName },
    skip: !cityName,
    fetchPolicy: 'cache-and-network'
  });

  // Fetch sunshine data for the month
  const {
    data: sunshineResponse,
    loading: sunshineLoading,
    error: sunshineError
  } = useQuery<SunshineByMonthResponse>(GET_SUNSHINE_BY_MONTH, {
    variables: { month },
    skip: !month,
    fetchPolicy: 'cache-and-network'
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
      }
    }
  }, [weatherResponse, cityName]);

  // Process sunshine data when it's loaded
  useEffect(() => {
    if (sunshineResponse?.sunshineByMonth && sunshineResponse.sunshineByMonth.length > 0) {
      // Find the sunshine data for the exact city
      // We need to match by both name and coordinates since there might be multiple cities with the same name
      const citySunshine = sunshineResponse.sunshineByMonth.find(
        (s) => {
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
        }
      );
      
      if (citySunshine) {
        setSunshineData(citySunshine);
      }
    }
  }, [sunshineResponse, cityName, lat, long]);

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
    isLoading: weatherLoading || sunshineLoading,
    hasError: !!weatherError || !!sunshineError
  };
}

export default useCityData;
