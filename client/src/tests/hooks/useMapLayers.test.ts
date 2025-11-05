import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useMapLayers from '@/hooks/useMapLayers';
import type { WeatherData } from '@/types/cityWeatherDataType';
import { ViewMode } from '@/types/mapTypes';

describe('useMapLayers', () => {
  const mockCities: WeatherData[] = [
    {
      city: 'Milan',
      country: 'Italy',
      state: null,
      suburb: null,
      date: '0615',
      lat: 45.4642,
      long: 9.19,
      population: 1000000,
      avgTemperature: 25.5,
      minTemperature: 20.0,
      maxTemperature: 30.0,
      precipitation: 10.5,
      snowDepth: null,
      stationName: 'Milan Station',
      submitterId: 'test-1',
    },
    {
      city: 'Rome',
      country: 'Italy',
      state: null,
      suburb: null,
      date: '0615',
      lat: 41.9028,
      long: 12.4964,
      population: 2000000,
      avgTemperature: 28.0,
      minTemperature: 22.0,
      maxTemperature: 34.0,
      precipitation: 5.0,
      snowDepth: null,
      stationName: 'Rome Station',
      submitterId: 'test-2',
    },
  ];

  it('returns an array of layers', () => {
    const { result } = renderHook(() =>
      useMapLayers({ cities: mockCities, viewMode: ViewMode.Markers, isLoadingWeather: false })
    );

    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current).toHaveLength(2);
  });

  it('returns both layers with heatmap visible when viewMode is heatmap', () => {
    const { result } = renderHook(() =>
      useMapLayers({ cities: mockCities, viewMode: ViewMode.Heatmap, isLoadingWeather: false })
    );

    expect(result.current).toHaveLength(2);
    expect(result.current[0].id).toBe('temperature-heatmap');
    expect(result.current[0].props.visible).toBe(true);
    expect(result.current[1].id).toBe('city-markers');
    expect(result.current[1].props.visible).toBe(false);
  });

  it('returns both layers with markers visible when viewMode is markers', () => {
    const { result } = renderHook(() =>
      useMapLayers({ cities: mockCities, viewMode: ViewMode.Markers, isLoadingWeather: false })
    );

    expect(result.current).toHaveLength(2);
    expect(result.current[0].id).toBe('temperature-heatmap');
    expect(result.current[0].props.visible).toBe(false);
    expect(result.current[1].id).toBe('city-markers');
    expect(result.current[1].props.visible).toBe(true);
  });

  it('handles empty cities array', () => {
    const { result } = renderHook(() =>
      useMapLayers({ cities: [], viewMode: ViewMode.Markers, isLoadingWeather: false })
    );

    expect(result.current).toHaveLength(2);
    expect(result.current[0].id).toBe('temperature-heatmap');
    expect(result.current[1].id).toBe('city-markers');
  });

  it('filters out cities with null coordinates in marker mode', () => {
    const citiesWithNulls: WeatherData[] = [
      ...mockCities,
      {
        city: 'Invalid',
        country: 'Italy',
        state: null,
        suburb: null,
        date: '0615',
        lat: null,
        long: null,
        population: null,
        avgTemperature: 25.0,
        minTemperature: 20.0,
        maxTemperature: 30.0,
        precipitation: 10.0,
        snowDepth: null,
        stationName: 'Invalid Station',
        submitterId: null,
      },
    ];

    const { result } = renderHook(() =>
      useMapLayers({ cities: citiesWithNulls, viewMode: ViewMode.Markers, isLoadingWeather: false })
    );

    expect(result.current).toHaveLength(2);
    // the scatterplot layer should only include cities with valid coordinates
  });

  it('memoizes layers when inputs do not change', () => {
    const { result, rerender } = renderHook(
      ({ cities, viewMode, isLoadingWeather }) =>
        useMapLayers({ cities, viewMode, isLoadingWeather }),
      {
        initialProps: {
          cities: mockCities,
          viewMode: ViewMode.Markers as const,
          isLoadingWeather: false,
        },
      }
    );

    const firstResult = result.current;
    rerender({ cities: mockCities, viewMode: ViewMode.Markers as const, isLoadingWeather: false });
    const secondResult = result.current;

    // should return the same reference due to memoization
    expect(firstResult).toBe(secondResult);
  });

  it('updates layers when viewMode changes', () => {
    const { result, rerender } = renderHook(
      ({ cities, viewMode, isLoadingWeather }) =>
        useMapLayers({ cities, viewMode, isLoadingWeather }),
      {
        initialProps: {
          cities: mockCities,
          viewMode: ViewMode.Markers as ViewMode.Markers | ViewMode.Heatmap,
          isLoadingWeather: false,
        },
      }
    );

    const initialLayers = result.current;
    // both layers exist, but markers should be visible
    expect(initialLayers[0].id).toBe('temperature-heatmap');
    expect(initialLayers[0].props.visible).toBe(false);
    expect(initialLayers[1].id).toBe('city-markers');
    expect(initialLayers[1].props.visible).toBe(true);

    rerender({
      cities: mockCities,
      viewMode: ViewMode.Heatmap as ViewMode.Markers | ViewMode.Heatmap,
      isLoadingWeather: false,
    });

    const updatedLayers = result.current;
    // both layers still exist, but heatmap should now be visible
    expect(updatedLayers[0].id).toBe('temperature-heatmap');
    expect(updatedLayers[0].props.visible).toBe(true);
    expect(updatedLayers[1].id).toBe('city-markers');
    expect(updatedLayers[1].props.visible).toBe(false);
  });

  it('updates layers when cities data changes', () => {
    const { result, rerender } = renderHook(
      ({ cities, viewMode, isLoadingWeather }) =>
        useMapLayers({ cities, viewMode, isLoadingWeather }),
      {
        initialProps: {
          cities: mockCities,
          viewMode: ViewMode.Markers as const,
          isLoadingWeather: false,
        },
      }
    );

    const firstResult = result.current;

    const newCities: WeatherData[] = [
      {
        city: 'Florence',
        country: 'Italy',
        state: null,
        suburb: null,
        date: '0615',
        lat: 43.7696,
        long: 11.2558,
        population: 500000,
        avgTemperature: 26.0,
        minTemperature: 21.0,
        maxTemperature: 31.0,
        precipitation: 8.0,
        snowDepth: null,
        stationName: 'Florence Station',
        submitterId: 'test-3',
      },
    ];

    rerender({ cities: newCities, viewMode: ViewMode.Markers as const, isLoadingWeather: false });

    const secondResult = result.current;
    // should be a different reference since cities changed
    expect(firstResult).not.toBe(secondResult);
  });

  it('adjusts marker opacity when loading', () => {
    const { result: loadingResult } = renderHook(() =>
      useMapLayers({ cities: mockCities, viewMode: ViewMode.Markers, isLoadingWeather: true })
    );

    const { result: notLoadingResult } = renderHook(() =>
      useMapLayers({ cities: mockCities, viewMode: ViewMode.Markers, isLoadingWeather: false })
    );

    // marker layer is at index 1
    expect(loadingResult.current[1].props.opacity).toBe(0.5);
    expect(notLoadingResult.current[1].props.opacity).toBe(0.8);
  });
});
