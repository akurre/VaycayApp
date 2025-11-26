import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { DataType } from '@/types/mapTypes';
import useWeatherDataForCity from '@/api/dates/useWeatherDataForCity';
import useSunshineDataForCity from '@/api/dates/useSunshineDataForCity';

/**
 * Fetches and stores weather/sunshine data for the home location in the app store.
 * This ensures the home location always has data available, even if it's not in
 * the filtered cities array.
 */
export function useHomeCityData(dataType: DataType, selectedDate?: string) {
  const homeLocation = useAppStore((state) => state.homeLocation);
  const setHomeCityData = useAppStore((state) => state.setHomeCityData);

  // Fetch weather data for home city
  const { weatherData } = useWeatherDataForCity({
    cityName: homeLocation?.cityName ?? null,
    lat: homeLocation?.coordinates.lat ?? null,
    long: homeLocation?.coordinates.long ?? null,
    selectedDate: selectedDate ?? '',
    skipFetch: dataType !== DataType.Temperature || !homeLocation,
  });

  // Fetch sunshine data for home city
  const { sunshineData } = useSunshineDataForCity({
    cityName: homeLocation?.cityName ?? null,
    lat: homeLocation?.coordinates.lat ?? null,
    long: homeLocation?.coordinates.long ?? null,
    skipFetch: dataType !== DataType.Sunshine || !homeLocation,
  });

  // Update store when data changes
  // setHomeCityData is stable (Zustand action) and doesn't need to be in deps
  useEffect(() => {
    if (!homeLocation) {
      setHomeCityData(null);
      return;
    }

    if (dataType === DataType.Temperature && weatherData) {
      setHomeCityData(weatherData);
    } else if (dataType === DataType.Sunshine && sunshineData) {
      setHomeCityData(sunshineData);
    }
  }, [dataType, weatherData, sunshineData, homeLocation, setHomeCityData]);
}
