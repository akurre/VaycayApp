import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWeatherStore } from '@/stores/useWeatherStore';
import type { WeatherData } from '@/types/cityWeatherDataType';

describe('useWeatherStore', () => {
  beforeEach(() => {
    // reset store state before each test
    const { setState } = useWeatherStore;
    setState({
      displayedWeatherData: null,
      isLoadingWeather: false,
    });
  });

  it('initializes with null data and not loading', () => {
    const { result } = renderHook(() => useWeatherStore());

    expect(result.current.displayedWeatherData).toBeNull();
    expect(result.current.isLoadingWeather).toBe(false);
  });

  it('sets displayed weather data', () => {
    const { result } = renderHook(() => useWeatherStore());

    const mockData: WeatherData[] = [
      {
        cityId: 213,
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
    ];

    act(() => {
      result.current.setDisplayedWeatherData(mockData);
    });

    expect(result.current.displayedWeatherData).toEqual(mockData);
  });

  it('sets loading state to true', () => {
    const { result } = renderHook(() => useWeatherStore());

    act(() => {
      result.current.setIsLoadingWeather(true);
    });

    expect(result.current.isLoadingWeather).toBe(true);
  });

  it('sets loading state to false', () => {
    const { result } = renderHook(() => useWeatherStore());

    act(() => {
      result.current.setIsLoadingWeather(true);
    });

    act(() => {
      result.current.setIsLoadingWeather(false);
    });

    expect(result.current.isLoadingWeather).toBe(false);
  });

  it('clears weather data by setting to null', () => {
    const { result } = renderHook(() => useWeatherStore());

    const mockData: WeatherData[] = [
      {
        cityId: 223,
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

    act(() => {
      result.current.setDisplayedWeatherData(mockData);
    });

    act(() => {
      result.current.setDisplayedWeatherData(null);
    });

    expect(result.current.displayedWeatherData).toBeNull();
  });

  it('handles multiple weather data entries', () => {
    const { result } = renderHook(() => useWeatherStore());

    const mockData: WeatherData[] = [
      {
        cityId: 213,
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
        cityId: 2132,
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

    act(() => {
      result.current.setDisplayedWeatherData(mockData);
    });

    expect(result.current.displayedWeatherData).toHaveLength(2);
    expect(result.current.displayedWeatherData?.[0].city).toBe('Milan');
    expect(result.current.displayedWeatherData?.[1].city).toBe('Rome');
  });
});
