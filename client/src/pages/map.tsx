import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@mantine/hooks';
import useWeatherByDateAndBounds from '../api/dates/useWeatherByDateAndBounds';
import useSunshineByMonthAndBounds from '../api/dates/useSunshineByMonthAndBounds';
import WorldMap from '../components/Map/WorldMap';
import FeedbackButton from '../components/Navigation/FeedbackButton';
import TopCommandBar from '../components/Navigation/TopCommandBar';
import { getTodayAsMMDD } from '@/utils/dateFormatting/getTodayAsMMDD';
import { useWeatherStore } from '../stores/useWeatherStore';
import { useSunshineStore } from '../stores/useSunshineStore';
import { useAppStore } from '../stores/useAppStore';
import { DataType, ViewMode } from '@/types/mapTypes';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { INITIAL_VIEW_STATE, ZOOM_THRESHOLD } from '@/const';
import ComponentErrorBoundary from '../components/ErrorBoundary/ComponentErrorBoundary';
import MapColorLegend from '../components/Map/MapColorLegend';
import MapDataLoader from '../components/Map/MapDataLoader';
import { consolidateWeatherByCity } from '@/utils/data/consolidateWeatherByCity';
import { consolidateSunshineByCity } from '@/utils/data/consolidateSunshineByCity';

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
  const displayedWeatherData = useWeatherStore(
    (state) => state.displayedWeatherData
  );
  const setDisplayedWeatherData = useWeatherStore(
    (state) => state.setDisplayedWeatherData
  );
  const setIsLoadingWeather = useWeatherStore(
    (state) => state.setIsLoadingWeather
  );
  const displayedSunshineData = useSunshineStore(
    (state) => state.displayedSunshineData
  );
  const setDisplayedSunshineData = useSunshineStore(
    (state) => state.setDisplayedSunshineData
  );
  const setIsLoadingSunshine = useSunshineStore(
    (state) => state.setIsLoadingSunshine
  );
  const temperatureUnit = useAppStore((state) => state.temperatureUnit);
  const setTemperatureUnit = useAppStore((state) => state.setTemperatureUnit);
  const isGesturing = useAppStore((state) => state.isGesturing);

  // Get the appropriate data based on the selected data type
  const displayedData = isSunshineSelected
    ? displayedSunshineData
    : displayedWeatherData;

  // update url when date or theme changes (for bookmarking/sharing)
  useEffect(() => {
    setSearchParams({ date: selectedDate }, { replace: true });
  }, [selectedDate, setSearchParams]);

  // Defer displayed-data writes while gesturing so the layer rebuild can't
  // stall the pan; loading flags pass through for accurate tier detection.
  useEffect(() => {
    if (isSunshineSelected) {
      setIsLoadingSunshine(isSunshineLoading);

      if (sunshineData && !isSunshineLoading && !isGesturing) {
        const consolidated = consolidateSunshineByCity(sunshineData);
        setDisplayedSunshineData(consolidated);
      }
    } else {
      setIsLoadingWeather(isLoading);

      if (weatherData && !isLoading && !isGesturing) {
        const consolidated = consolidateWeatherByCity(weatherData);
        setDisplayedWeatherData(consolidated);
      }
    }
  }, [
    weatherData,
    sunshineData,
    isLoading,
    isSunshineLoading,
    isSunshineSelected,
    isGesturing,
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
      <div className="absolute top-4 left-4 z-20">
        <MapColorLegend dataType={dataType} />
      </div>

      <MapDataLoader dataType={dataType} />

      <TopCommandBar
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        dataType={dataType}
        onDataTypeChange={setDataType}
        temperatureUnit={temperatureUnit}
        onTemperatureUnitChange={setTemperatureUnit}
        isMonthly={dataType === DataType.Sunshine}
      />

      <div className="absolute bottom-4 right-4 z-20">
        <FeedbackButton />
      </div>

      {/* map */}
      <div className="h-full w-full">
        <ComponentErrorBoundary componentName="WorldMap">
          <WorldMap
            cities={displayedData ?? []}
            viewMode={viewMode}
            dataType={dataType}
            onBoundsChange={handleBoundsChange}
            selectedMonth={monthFromDate}
            selectedDate={selectedDate}
            debouncedDate={debouncedDate}
          />
        </ComponentErrorBoundary>
      </div>
    </div>
  );
};

export default MapPage;
