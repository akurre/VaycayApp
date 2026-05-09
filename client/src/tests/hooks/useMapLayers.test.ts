import { describe, it, expect, vi, assert, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type * as MantineCore from '@mantine/core';
import useMapLayers from '@/hooks/useMapLayers';
import { useGhostDots } from '@/hooks/useGhostDots';
import type { WeatherData } from '@/types/cityWeatherDataType';
import type { SunshineData } from '@/types/sunshineDataType';
import { DataType, ViewMode } from '@/types/mapTypes';
import { TEMPERATURE_LOADING_COLOR, SUNSHINE_LOADING_COLOR } from '@/const';

let mockColorScheme: 'dark' | 'light' = 'dark';

vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual<typeof MantineCore>('@mantine/core');
  return {
    ...actual,
    useComputedColorScheme: () => mockColorScheme,
  };
});

vi.mock('@/hooks/useGhostDots', () => ({
  useGhostDots: vi.fn(() => []),
}));

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

vi.mock('@/stores/useAppStore', () => ({
  useAppStore: vi.fn().mockImplementation((selector) =>
    selector({
      homeLocation: null,
      homeCityData: null,
    })
  ),
}));

describe('useMapLayers', () => {
  afterEach(() => {
    mockColorScheme = 'dark';
    vi.mocked(useGhostDots).mockReturnValue([]);
  });
  const mockWeatherCities: WeatherData[] = [
    {
      cityId: 213,
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
      cityId: 213,
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

  it('returns heatmap and marker layers for temperature data', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
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
      })
    );

    expect(result.current).toHaveLength(2);
    expect(result.current[0].id).toBe('data-heatmap');
    expect(result.current[1].id).toBe('sunshine-markers');
  });

  it('returns heatmap and marker layers without home location', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
      })
    );

    // Should have 2 layers: heatmap + markers (no home location since store is mocked with null)
    expect(result.current).toHaveLength(2);
    expect(result.current[0].id).toBe('data-heatmap');
    expect(result.current[1].id).toBe('temperature-markers');
  });

  it('does not add home icon layer when homeLocation is null', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
      })
    );

    expect(result.current).toHaveLength(2);
    expect(
      result.current.find((layer) => layer.id === 'home-icon')
    ).toBeUndefined();
  });

  it('heatmap layer is visible in heatmap mode', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Heatmap,
        dataType: DataType.Temperature,
        selectedMonth: 1,
      })
    );

    const heatmapLayer = result.current.find(
      (layer) => layer.id === 'data-heatmap'
    );
    expect(heatmapLayer?.props.visible).toBe(true);
  });

  it('temperature marker layer is visible in markers mode', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
      })
    );

    const markerLayer = result.current.find(
      (layer) => layer.id === 'temperature-markers'
    );
    expect(markerLayer?.props.visible).toBe(true);
  });

  it('sunshine marker layer is visible in markers mode', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockSunshineCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Sunshine,
        selectedMonth: 1,
      })
    );

    const markerLayer = result.current.find(
      (layer) => layer.id === 'sunshine-markers'
    );
    expect(markerLayer?.props.visible).toBe(true);
  });

  it('no home location layers when store has null', () => {
    const { result: resultMarkers } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
      })
    );

    // With null home location in store, should not have home layers
    expect(
      resultMarkers.current.find((layer) => layer.id === 'home-ring')
    ).toBeUndefined();
    expect(
      resultMarkers.current.find((layer) => layer.id === 'home-center')
    ).toBeUndefined();

    const { result: resultHeatmap } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Heatmap,
        dataType: DataType.Temperature,
        selectedMonth: 1,
      })
    );

    expect(
      resultHeatmap.current.find((layer) => layer.id === 'home-ring')
    ).toBeUndefined();
    expect(
      resultHeatmap.current.find((layer) => layer.id === 'home-center')
    ).toBeUndefined();
  });

  it('uses breatheOpacity for temperature marker opacity when provided', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
        breatheOpacity: 0.5,
      })
    );

    const markerLayer = result.current.find(
      (layer) => layer.id === 'temperature-markers'
    );
    expect(markerLayer?.props.opacity).toBe(0.5);
  });

  it('uses default temperature marker opacity when breatheOpacity not provided', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
      })
    );

    const markerLayer = result.current.find(
      (layer) => layer.id === 'temperature-markers'
    );
    expect(markerLayer?.props.opacity).toBe(0.8);
  });

  it('uses breatheOpacity for sunshine marker opacity when provided', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockSunshineCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Sunshine,
        selectedMonth: 1,
        breatheOpacity: 0.5,
      })
    );

    const markerLayer = result.current.find(
      (layer) => layer.id === 'sunshine-markers'
    );
    expect(markerLayer?.props.opacity).toBe(0.5);
  });

  it('uses default sunshine marker opacity when breatheOpacity not provided', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockSunshineCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Sunshine,
        selectedMonth: 1,
      })
    );

    const markerLayer = result.current.find(
      (layer) => layer.id === 'sunshine-markers'
    );
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
      })
    );

    // Get the getFillColor function from the temperature markers layer
    const markerLayer = result.current.find(
      (layer) => layer.id === 'temperature-markers'
    );

    // The function should return the loading color for this invalid city
    if (markerLayer?.props) {
      // Use typed props to access the getFillColor function
      const getFillColor = (markerLayer.props as LayerPropsWithFillColor)
        .getFillColor;
      if (getFillColor) {
        expect(getFillColor(invalidCity)).toEqual(TEMPERATURE_LOADING_COLOR);
      } else {
        assert(false, 'getFillColor function not found');
      }
    } else {
      assert(false, 'Temperature marker layer not found');
    }
  });

  it('creates ghost-heatmap and ghost-markers layers when ghost dots are present', () => {
    vi.mocked(useGhostDots).mockReturnValue([
      { lat: 40, long: -74, color: [200, 100, 50, 128] },
    ]);

    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Heatmap,
        dataType: DataType.Temperature,
        selectedMonth: 1,
        isGhostDotsActive: true,
      })
    );

    expect(result.current).toHaveLength(4);
    expect(result.current.find((l) => l.id === 'ghost-heatmap')).toBeDefined();
    expect(result.current.find((l) => l.id === 'ghost-markers')).toBeDefined();
  });

  it('uses sunshine color range for ghost heatmap when dataType is Sunshine', () => {
    vi.mocked(useGhostDots).mockReturnValue([
      { lat: 40, long: -74, color: [255, 200, 0, 128] },
    ]);

    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockSunshineCities,
        viewMode: ViewMode.Heatmap,
        dataType: DataType.Sunshine,
        selectedMonth: 1,
        isGhostDotsActive: true,
      })
    );

    expect(result.current).toHaveLength(4);
    expect(result.current.find((l) => l.id === 'ghost-heatmap')).toBeDefined();
    expect(result.current.find((l) => l.id === 'ghost-markers')).toBeDefined();
  });

  it('ghost markers are visible only in markers view mode', () => {
    vi.mocked(useGhostDots).mockReturnValue([
      { lat: 40, long: -74, color: [200, 100, 50, 128] },
    ]);

    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
        isGhostDotsActive: true,
      })
    );

    expect(
      result.current.find((l) => l.id === 'ghost-markers')?.props.visible
    ).toBe(true);
    expect(
      result.current.find((l) => l.id === 'ghost-heatmap')?.props.visible
    ).toBe(false);
  });

  it('caps heatmap opacity at 0.6 when breatheOpacity exceeds it', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Heatmap,
        dataType: DataType.Temperature,
        breatheOpacity: 0.9,
      })
    );

    const heatmapLayer = result.current.find((l) => l.id === 'data-heatmap');
    expect(heatmapLayer?.props.opacity).toBe(0.6);
  });

  it('uses breatheOpacity directly for heatmap when below 0.6', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Heatmap,
        dataType: DataType.Temperature,
        breatheOpacity: 0.3,
      })
    );

    const heatmapLayer = result.current.find((l) => l.id === 'data-heatmap');
    expect(heatmapLayer?.props.opacity).toBe(0.3);
  });

  it('defaults heatmap opacity to 0.6 when breatheOpacity is not provided', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Heatmap,
        dataType: DataType.Temperature,
      })
    );

    const heatmapLayer = result.current.find((l) => l.id === 'data-heatmap');
    expect(heatmapLayer?.props.opacity).toBe(0.6);
  });

  it('sets stroked to true on markers in light mode', () => {
    mockColorScheme = 'light';

    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
      })
    );

    const markerLayer = result.current.find(
      (l) => l.id === 'temperature-markers'
    );
    expect(markerLayer?.props.stroked).toBe(true);
  });

  it('sets stroked to false on markers in dark mode', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockWeatherCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Temperature,
        selectedMonth: 1,
      })
    );

    const markerLayer = result.current.find(
      (l) => l.id === 'temperature-markers'
    );
    expect(markerLayer?.props.stroked).toBe(false);
  });

  it('sets stroked to true on sunshine markers in light mode', () => {
    mockColorScheme = 'light';

    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockSunshineCities,
        viewMode: ViewMode.Markers,
        dataType: DataType.Sunshine,
        selectedMonth: 1,
      })
    );

    const markerLayer = result.current.find((l) => l.id === 'sunshine-markers');
    expect(markerLayer?.props.stroked).toBe(true);
  });

  it('uses temperature loading color when no color is cached', () => {
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
      })
    );

    // Get the getFillColor function from the sunshine markers layer
    const markerLayer = result.current.find(
      (layer) => layer.id === 'sunshine-markers'
    );

    // The function should return the loading color for this invalid city
    if (markerLayer?.props) {
      // Use typed props to access the getFillColor function
      const getFillColor = (markerLayer.props as LayerPropsWithFillColor)
        .getFillColor;
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
