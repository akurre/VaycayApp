import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSunshineAndRainfallData } from '@/components/CityPopup/hooks/useSunshineAndRainfallData';
import { createMockSunshineData, createMockWeeklyWeather } from '@/test-utils';

describe('useSunshineAndRainfallData', () => {
  it('returns null for all values when inputs are null', () => {
    const { result } = renderHook(() =>
      useSunshineAndRainfallData({
        displaySunshineData: null,
        weeklyWeatherData: null,
      })
    );

    expect(result.current.averageSunshine).toBeNull();
    expect(result.current.comparisonAverageSunshine).toBeNull();
    expect(result.current.averageRainfall).toBeNull();
    expect(result.current.comparisonAverageRainfall).toBeNull();
  });

  it('returns averageSunshine when displaySunshineData is provided', () => {
    const sunshineData = createMockSunshineData({
      jan: 120, feb: 140, mar: 180, apr: 220,
      may: 270, jun: 310, jul: 340, aug: 320,
      sep: 260, oct: 200, nov: 140, dec: 110,
    });

    const { result } = renderHook(() =>
      useSunshineAndRainfallData({
        displaySunshineData: sunshineData,
        weeklyWeatherData: null,
      })
    );

    expect(result.current.averageSunshine).not.toBeNull();
    expect(typeof result.current.averageSunshine).toBe('number');
  });

  it('returns comparisonAverageSunshine when comparisonSunshineData is provided', () => {
    const comparisonData = createMockSunshineData({
      jan: 100, feb: 120, mar: 160, apr: 200,
      may: 250, jun: 290, jul: 320, aug: 300,
      sep: 240, oct: 180, nov: 120, dec: 90,
    });

    const { result } = renderHook(() =>
      useSunshineAndRainfallData({
        displaySunshineData: null,
        weeklyWeatherData: null,
        comparisonSunshineData: comparisonData,
      })
    );

    expect(result.current.comparisonAverageSunshine).not.toBeNull();
    expect(typeof result.current.comparisonAverageSunshine).toBe('number');
  });

  it('returns averageRainfall when weeklyWeatherData is provided', () => {
    const weeklyData = createMockWeeklyWeather();

    const { result } = renderHook(() =>
      useSunshineAndRainfallData({
        displaySunshineData: null,
        weeklyWeatherData: weeklyData.weeklyData,
      })
    );

    expect(result.current.averageRainfall).not.toBeNull();
  });

  it('returns comparisonAverageRainfall when comparisonWeeklyWeatherData is provided', () => {
    const weeklyData = createMockWeeklyWeather();

    const { result } = renderHook(() =>
      useSunshineAndRainfallData({
        displaySunshineData: null,
        weeklyWeatherData: null,
        comparisonWeeklyWeatherData: weeklyData.weeklyData,
      })
    );

    expect(result.current.comparisonAverageRainfall).not.toBeNull();
  });
});
