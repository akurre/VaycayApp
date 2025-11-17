import { describe, it, expect, vi, assert } from 'vitest';
import { renderHook } from '@testing-library/react';
import useMapLayers from '@/hooks/useMapLayers';
import { WeatherData } from '@/types/cityWeatherDataType';
import { SunshineData } from '@/types/sunshineDataType';
import { DataType, ViewMode } from '@/types/mapTypes';
import { HomeLocation } from '@/types/userLocationType';
import { TEMPERATURE_LOADING_COLOR, SUNSHINE_LOADING_COLOR } from '@/constants';

// Define a type for layer props with getFillColor function
interface LayerPropsWithFillColor {
  getFillColor?: (d: WeatherData | SunshineData) => number[];
  [key: string]: unknown;
}

// Mock the stores
vi.mock('@/stores/useWeatherStore', () => ({
  useWeatherStore: vi.fn().mockImplementation((selector) =>
    selector({
      maxCitiesToShow: 300,
      isLoadingWeather: false,
    })
  ),
}));

vi.mock('@/stores/useSunshineStore', () => ({
  useSunshineStore: vi.fn().mockImplementation((selector) =>
    selector({
      maxCitiesToShow: 300,
      isLoadingSunshine: false,
    })
  ),
}));

describe('useMapLayers', () => {
  const mockWeatherCities: WeatherData[] = [
    {
      city: 'New York',
      country: 'USA',
      state: 'NY',
      suburb: null,
      date: '2024-01-15',
      lat: 40.7128,
      long: -74.006,
      population: 8000000,
      precipitation: 0,
      snowDepth: 0,
      avgTemperature: 5,
      maxTemperature: 8,
      minTemperature: 2,
      stationName: 'NYC Station',
      submitterId: null,
    },
  ];

  const mockSunshineCities: SunshineData[] = [
    {
      city: 'New York',
      country: 'USA',
      state: 'NY',
      suburb: undefined,
      lat: 40.7128,
      long: -74.006,
      population: 8000000,
      jan: 120,
      feb: 130,
      mar: 150,
      apr: 180,
      may: 210,
      jun: 240,
      jul: 260,
      aug: 240,
      sep: 210,
      oct: 180,
      nov: 150,
      dec: 120,
      stationName: 'NYC Station',
    },
  ];

  const mockHomeLocation: HomeLocation = {
    cityId: 1,
    cityName: 'San Francisco',
    country: 'USA',
    state: 'CA',
    coordinates: {
      lat: 37.7749,
      long: -122.4194,
    },
    source: 'manual',
  };

  it('returns heatmap and marker layers for temperature data', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    expect(result.current).toHaveLength(2);
    expect(result.current[0].id).toBe('data-heatmap');
    expect(result.current[1].id).toBe('temperature-markers');
  });

  it('returns heatmap and marker layers for sunshine data', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockSunshineCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Sunshine,
        selectedMonth: 1,
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    expect(result.current).toHaveLength(2);
    expect(result.current[0].id).toBe('data-heatmap');
    expect(result.current[1].id).toBe('sunshine-markers');
  });

  it('adds home icon layer when homeLocation is provided', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
        isLoadingWeather: false,
        homeLocation: mockHomeLocation,
      })
    );

    expect(result.current).toHaveLength(3);
    expect(result.current[2].id).toBe('home-icon');
  });

  it('does not add home icon layer when homeLocation is null', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    expect(result.current).toHaveLength(2);
    expect(result.current.find((layer) => layer.id === 'home-icon')).toBeUndefined();
  });

  it('heatmap layer is visible in heatmap mode', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Heatmap,
        dataType: DataType.Temperature,
        selectedMonth: 1,
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    const heatmapLayer = result.current.find((layer) => layer.id === 'data-heatmap');
    expect(heatmapLayer?.props.visible).toBe(true);
  });

  it('temperature marker layer is visible in markers mode', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    const markerLayer = result.current.find((layer) => layer.id === 'temperature-markers');
    expect(markerLayer?.props.visible).toBe(true);
  });

  it('sunshine marker layer is visible in markers mode', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockSunshineCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Sunshine,
        selectedMonth: 1,
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    const markerLayer = result.current.find((layer) => layer.id === 'sunshine-markers');
    expect(markerLayer?.props.visible).toBe(true);
  });

  it('home icon layer is always visible regardless of view mode', () => {
    const { result: resultMarkers } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
        isLoadingWeather: false,
        homeLocation: mockHomeLocation,
      })
    );

    const homeLayerMarkers = resultMarkers.current.find((layer) => layer.id === 'home-icon');
    expect(homeLayerMarkers?.props.visible).toBe(true);

    const { result: resultHeatmap } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Heatmap,
        dataType: DataType.Temperature,
        selectedMonth: 1,
        isLoadingWeather: false,
        homeLocation: mockHomeLocation,
      })
    );

    const homeLayerHeatmap = resultHeatmap.current.find((layer) => layer.id === 'home-icon');
    expect(homeLayerHeatmap?.props.visible).toBe(true);
  });

  it('reduces temperature marker opacity when loading weather', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
        isLoadingWeather: true,
        homeLocation: null,
      })
    );

    const markerLayer = result.current.find((layer) => layer.id === 'temperature-markers');
    expect(markerLayer?.props.opacity).toBe(0.5);
  });

  it('uses normal temperature marker opacity when not loading', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    const markerLayer = result.current.find((layer) => layer.id === 'temperature-markers');
    expect(markerLayer?.props.opacity).toBe(0.8);
  });

  it('reduces sunshine marker opacity when loading weather', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockSunshineCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Sunshine,
        selectedMonth: 1,
        isLoadingWeather: true,
        homeLocation: null,
      })
    );

    const markerLayer = result.current.find((layer) => layer.id === 'sunshine-markers');
    expect(markerLayer?.props.opacity).toBe(0.5);
  });

  it('uses normal sunshine marker opacity when not loading', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockSunshineCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Sunshine,
        selectedMonth: 1,
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    const markerLayer = result.current.find((layer) => layer.id === 'sunshine-markers');
    expect(markerLayer?.props.opacity).toBe(0.8);
  });

  it('uses temperature loading color when no color is cached', () => {
    // Create a city without valid temperature data
    const invalidCity: WeatherData = {
      ...mockWeatherCities[0],
      avgTemperature: null,
    };

    const { result } = renderHook(() =>
      useMapLayers({
        cities: [invalidCity],
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    // Get the getFillColor function from the temperature markers layer
    const markerLayer = result.current.find((layer) => layer.id === 'temperature-markers');

    // The function should return the loading color for this invalid city
    if (markerLayer?.props) {
      // Use typed props to access the getFillColor function
      const getFillColor = (markerLayer.props as LayerPropsWithFillColor).getFillColor;
      if (getFillColor) {
        expect(getFillColor(invalidCity)).toEqual(TEMPERATURE_LOADING_COLOR);
      } else {
        assert(false, 'getFillColor function not found');
      }
    } else {
      assert(false, 'Temperature marker layer not found');
    }
  });

  it('uses sunshine loading color when no color is cached', () => {
    // Create a city without valid sunshine data for the selected month
    const invalidCity: SunshineData = {
      ...mockSunshineCities[0],
      jan: null,
    };

    const { result } = renderHook(() =>
      useMapLayers({
        cities: [invalidCity],
        viewMode: ViewMode.Markers,
        dataType: DataType.Sunshine,
        selectedMonth: 1, // January
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    // Get the getFillColor function from the sunshine markers layer
    const markerLayer = result.current.find((layer) => layer.id === 'sunshine-markers');

    // The function should return the loading color for this invalid city
    if (markerLayer?.props) {
      // Use typed props to access the getFillColor function
      const getFillColor = (markerLayer.props as LayerPropsWithFillColor).getFillColor;
      if (getFillColor) {
        expect(getFillColor(invalidCity)).toEqual(SUNSHINE_LOADING_COLOR);
      } else {
        assert(false, 'getFillColor function not found');
      }
    } else {
      assert(false, 'Sunshine marker layer not found');
    }
  });
});
