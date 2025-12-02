import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { DataType } from '@/types/mapTypes';
import useWeatherDataForCity from '@/api/dates/useWeatherDataForCity';
import useSunshineDataForCity from '@/api/dates/useSunshineDataForCity';

/**
 * Fetches and stores weather/sunshine data for the home location in the app store.
 * This ensures the home location always has data available, even if it's not in
 * the filtered cities array.
 * 
 * NOTE: The fetched data for a single city returns ONE weather record (not consolidated).
 * For cities with multiple stations, this will show data from only one station.
 * To get consolidated data (average of all stations), the home city must be visible
 * on the map, where consolidation happens at the map level.
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

  // Track previous data to prevent infinite loops - initialize with undefined, not current values
  const prevWeatherDataRef = useRef<typeof weatherData>(undefined);
  const prevSunshineDataRef = useRef<typeof sunshineData>(undefined);
  const prevDataTypeRef = useRef<DataType | undefined>(undefined);

  // Update store when data changes
  // setHomeCityData is stable (Zustand action) and doesn't need to be in deps
  useEffect(() => {
    if (!homeLocation) {
      setHomeCityData(null);
      return;
    }

    // Only update when:
    // 1. First time setting data (refs are undefined)
    // 2. Data type changed (user toggled)
    // 3. Actual data content changed (compare by city name to avoid object reference issues)
    const isFirstRender = prevDataTypeRef.current === undefined;

    if (dataType === DataType.Temperature) {
      // Check if the actual data content is different (not just object reference)
      const dataContentChanged =
        weatherData?.city !== prevWeatherDataRef.current?.city ||
        weatherData?.date !== prevWeatherDataRef.current?.date;

      if (weatherData && (isFirstRender || dataContentChanged)) {
        setHomeCityData(weatherData);
      } else if (isFirstRender && !weatherData) {
        setHomeCityData(null);
      }
    } else if (dataType === DataType.Sunshine) {
      // Check if the actual data content is different
      const dataContentChanged =
        sunshineData?.city !== prevSunshineDataRef.current?.city ||
        sunshineData?.jan !== prevSunshineDataRef.current?.jan;

      if (sunshineData && (isFirstRender || dataContentChanged)) {
        setHomeCityData(sunshineData);
      } else if (isFirstRender && !sunshineData) {
        setHomeCityData(null);
      }
    }

    // Always update refs after checking
    prevWeatherDataRef.current = weatherData;
    prevSunshineDataRef.current = sunshineData;
    prevDataTypeRef.current = dataType;
  }, [dataType, weatherData, sunshineData, homeLocation, setHomeCityData]);
}
