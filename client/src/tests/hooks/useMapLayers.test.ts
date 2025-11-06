import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useMapLayers from '@/hooks/useMapLayers';
import { WeatherData } from '@/types/cityWeatherDataType';
import { ViewMode } from '@/types/mapTypes';
import { HomeLocation } from '@/types/userLocationType';

describe('useMapLayers', () => {
  const mockCities: WeatherData[] = [
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

  it('returns heatmap and marker layers', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockCities,
        viewMode: ViewMode.Markers,
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    expect(result.current).toHaveLength(2);
    expect(result.current[0].id).toBe('temperature-heatmap');
    expect(result.current[1].id).toBe('city-markers');
  });

  it('adds home icon layer when homeLocation is provided', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockCities,
        viewMode: ViewMode.Markers,
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
        cities: mockCities,
        viewMode: ViewMode.Markers,
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
        cities: mockCities,
        viewMode: ViewMode.Heatmap,
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    const heatmapLayer = result.current.find((layer) => layer.id === 'temperature-heatmap');
    expect(heatmapLayer?.props.visible).toBe(true);
  });

  it('marker layer is visible in markers mode', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockCities,
        viewMode: ViewMode.Markers,
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    const markerLayer = result.current.find((layer) => layer.id === 'city-markers');
    expect(markerLayer?.props.visible).toBe(true);
  });

  it('home icon layer is always visible regardless of view mode', () => {
    const { result: resultMarkers } = renderHook(() =>
      useMapLayers({
        cities: mockCities,
        viewMode: ViewMode.Markers,
        isLoadingWeather: false,
        homeLocation: mockHomeLocation,
      })
    );

    const homeLayerMarkers = resultMarkers.current.find((layer) => layer.id === 'home-icon');
    expect(homeLayerMarkers?.props.visible).toBe(true);

    const { result: resultHeatmap } = renderHook(() =>
      useMapLayers({
        cities: mockCities,
        viewMode: ViewMode.Heatmap,
        isLoadingWeather: false,
        homeLocation: mockHomeLocation,
      })
    );

    const homeLayerHeatmap = resultHeatmap.current.find((layer) => layer.id === 'home-icon');
    expect(homeLayerHeatmap?.props.visible).toBe(true);
  });

  it('reduces marker opacity when loading weather', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockCities,
        viewMode: ViewMode.Markers,
        isLoadingWeather: true,
        homeLocation: null,
      })
    );

    const markerLayer = result.current.find((layer) => layer.id === 'city-markers');
    expect(markerLayer?.props.opacity).toBe(0.5);
  });

  it('uses normal marker opacity when not loading', () => {
    const { result } = renderHook(() =>
      useMapLayers({
        cities: mockCities,
        viewMode: ViewMode.Markers,
        isLoadingWeather: false,
        homeLocation: null,
      })
    );

    const markerLayer = result.current.find((layer) => layer.id === 'city-markers');
    expect(markerLayer?.props.opacity).toBe(0.8);
  });
});
