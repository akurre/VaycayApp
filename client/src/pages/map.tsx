import { FC, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@mantine/hooks';
import { Alert } from '@mantine/core';
import useWeatherByDateAndBounds from '../api/dates/useWeatherByDateAndBounds';
import WorldMap from '../components/Map/WorldMap';
import MapViewToggle from '../components/Map/MapViewToggle';
import MapThemeToggle from '../components/Map/MapThemeToggle';
import { getTodayAsMMDD } from '@/utils/dateFormatting/getTodayAsMMDD';
import { useWeatherStore } from '../stores/useWeatherStore';
import { useAppStore } from '../stores/useAppStore';
import DateSliderWrapper from '@/components/Navigation/DateSliderWrapper';
import { ViewMode, MapTheme } from '@/types/mapTypes';

interface MapBounds {
  minLat: number;
  maxLat: number;
  minLong: number;
  maxLong: number;
}

const MapPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDate = searchParams.get('date');
  const urlTheme = searchParams.get('theme');

  // initialize with today's date or url date
  const [selectedDate, setSelectedDate] = useState<string>(urlDate || getTodayAsMMDD());
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Markers);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [shouldUseBounds, setShouldUseBounds] = useState(false);

  // use app store for theme
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  // initialize theme from URL on mount
  useEffect(() => {
    if (urlTheme === MapTheme.Light || urlTheme === MapTheme.Dark) {
      setTheme(urlTheme);
    }
  }, [urlTheme, setTheme]);

  // debounce the date to avoid excessive api calls while dragging slider
  const [debouncedDate] = useDebouncedValue(selectedDate, 300);

  // use bounds-aware query hook
  const {
    dataReturned: weatherData,
    isError,
    isLoading,
  } = useWeatherByDateAndBounds({
    date: debouncedDate,
    bounds,
    shouldUseBounds,
  });

  // zustand store for persisting displayed data
  const { displayedWeatherData, setDisplayedWeatherData, setIsLoadingWeather } = useWeatherStore();

  // update url when date or theme changes (for bookmarking/sharing)
  useEffect(() => {
    setSearchParams({ date: selectedDate, theme }, { replace: true });
  }, [selectedDate, theme, setSearchParams]);

  // update store when weather data changes
  useEffect(() => {
    setIsLoadingWeather(isLoading);

    if (weatherData && !isLoading) {
      setDisplayedWeatherData(weatherData);
    }
  }, [weatherData, isLoading, setDisplayedWeatherData, setIsLoadingWeather]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
  };

  // handle bounds changes from map zoom/pan
  const handleBoundsChange = useCallback((newBounds: MapBounds | null, useBounds: boolean) => {
    setBounds(newBounds);
    setShouldUseBounds(useBounds);
  }, []);

  if (isError) {
    // todo handle errors better
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Alert color="red" title="Error">
          Failed to load weather data.
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {/* navigation panel */}
      <div className="absolute top-8 left-4 z-20">
        <MapViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>
      <div className="absolute top-8 right-4 z-20">
        <MapThemeToggle />
      </div>
      <div
        className="absolute top-12 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
        style={{ width: 'calc(100% - 16rem)', maxWidth: '56rem' }}
      >
        <DateSliderWrapper currentDate={selectedDate} onDateChange={handleDateChange} />
      </div>

      {/* map */}
      <div className="h-full w-full">
        {displayedWeatherData && (
          <WorldMap
            cities={displayedWeatherData}
            viewMode={viewMode}
            onBoundsChange={handleBoundsChange}
          />
        )}
      </div>
    </div>
  );
};

export default MapPage;
