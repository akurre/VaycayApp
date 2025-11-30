import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@mantine/hooks';
import useWeatherByDateAndBounds from '../api/dates/useWeatherByDateAndBounds';
import useSunshineByMonthAndBounds from '../api/dates/useSunshineByMonthAndBounds';
import WorldMap from '../components/Map/WorldMap';
import MapViewToggle from '../components/Map/MapViewToggle';
import MapThemeToggle from '../components/Map/MapThemeToggle';
import MapDataToggle from '../components/Map/MapDataToggle';
import HomeLocationSelector from '../components/Navigation/HomeLocationSelector';
import FeedbackButton from '../components/Navigation/FeedbackButton';
import { getTodayAsMMDD } from '@/utils/dateFormatting/getTodayAsMMDD';
import { useWeatherStore } from '../stores/useWeatherStore';
import { useSunshineStore } from '../stores/useSunshineStore';
import DateSliderWrapper from '@/components/Navigation/DateSliderWrapper';
import { DataType, ViewMode } from '@/types/mapTypes';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { INITIAL_VIEW_STATE, ZOOM_THRESHOLD } from '@/const';

interface MapBounds {
  minLat: number;
  maxLat: number;
  minLong: number;
  maxLong: number;
}

const MapPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDate = searchParams.get('date');

  // initialize with today's date or url date
  const [selectedDate, setSelectedDate] = useState<string>(
    urlDate || getTodayAsMMDD()
  );
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Markers);
  const [dataType, setDataType] = useState<DataType>(DataType.Temperature);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [shouldUseBounds, setShouldUseBounds] = useState(
    INITIAL_VIEW_STATE.zoom >= ZOOM_THRESHOLD
  );

  // debounce the date to avoid excessive api calls while dragging slider
  const [debouncedDate] = useDebouncedValue(selectedDate, 300);

  const isSunshineSelected = dataType === DataType.Sunshine;
  const monthFromDate = Number.parseInt(selectedDate.substring(0, 2), 10);

  // use bounds-aware query hooks
  const {
    dataReturned: weatherData,
    isError,
    isLoading,
  } = useWeatherByDateAndBounds({
    date: isSunshineSelected ? '' : debouncedDate,
    bounds,
    shouldUseBounds,
  });

  const {
    dataReturned: sunshineData,
    isLoading: isSunshineLoading,
    isError: sunshineError,
  } = useSunshineByMonthAndBounds({
    month: isSunshineSelected ? monthFromDate : 0,
    bounds,
    shouldUseBounds,
  });

  // zustand stores for persisting displayed data
  const { displayedWeatherData, setDisplayedWeatherData, setIsLoadingWeather } =
    useWeatherStore();
  const {
    displayedSunshineData,
    setDisplayedSunshineData,
    setIsLoadingSunshine,
  } = useSunshineStore();

  // Get the appropriate data based on the selected data type
  const displayedData = isSunshineSelected
    ? displayedSunshineData
    : displayedWeatherData;

  // update url when date or theme changes (for bookmarking/sharing)
  useEffect(() => {
    setSearchParams({ date: selectedDate }, { replace: true });
  }, [selectedDate, setSearchParams]);

  // update store when data changes based on selected data type
  useEffect(() => {
    if (isSunshineSelected) {
      setIsLoadingSunshine(isSunshineLoading);

      if (sunshineData && !isSunshineLoading) {
        setDisplayedSunshineData(sunshineData);
      }
    } else {
      setIsLoadingWeather(isLoading);

      if (weatherData && !isLoading) {
        setDisplayedWeatherData(weatherData);
      }
    }
  }, [
    weatherData,
    sunshineData,
    isLoading,
    isSunshineLoading,
    isSunshineSelected,
    setDisplayedWeatherData,
    setDisplayedSunshineData,
    setIsLoadingWeather,
    setIsLoadingSunshine,
  ]);

  // handle errors with toast notifications
  useEffect(() => {
    if (isError) {
      parseErrorAndNotify(isError, 'failed to load weather data');
    }

    if (sunshineError) {
      parseErrorAndNotify(sunshineError, 'failed to load sunshine data');
    }
  }, [isError, sunshineError]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
  };

  // handle bounds changes from map zoom/pan
  const handleBoundsChange = useCallback(
    (newBounds: MapBounds | null, useBounds: boolean) => {
      setBounds(newBounds);
      setShouldUseBounds(useBounds);
    },
    []
  );

  return (
    <div className="relative w-full h-screen">
      {/* navigation panel */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <HomeLocationSelector />
        <FeedbackButton />
      </div>
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <MapViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        <MapDataToggle dataType={dataType} onDataTypeChange={setDataType} />
      </div>
      <div className="absolute bottom-4 left-4 z-10 flex gap-2">
        <MapThemeToggle />
      </div>
      <div
        className="absolute top-12 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
        style={{ width: 'calc(100% - 16rem)', maxWidth: '52rem' }}
      >
        <DateSliderWrapper
          currentDate={selectedDate}
          onDateChange={handleDateChange}
          isMonthly={dataType === DataType.Sunshine}
        />
      </div>

      {/* map */}
      <div className="h-full w-full">
        {displayedData && (
          <WorldMap
            cities={displayedData}
            viewMode={viewMode}
            dataType={dataType}
            onBoundsChange={handleBoundsChange}
            selectedMonth={monthFromDate}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </div>
  );
};

export default MapPage;
