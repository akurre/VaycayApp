import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRibbonStats } from '@/components/CityPopup/hooks/useRibbonStats';
import { TemperatureUnit } from '@/types/mapTypes';
import { useAppStore } from '@/stores/useAppStore';
import {
  render,
  createMockWeatherData,
  createMockSunshineData,
  createMockWeeklyWeather,
  createMockWeekDataPoint,
} from '@/test-utils';
import type { ReactNode } from 'react';

const placeholder = '—';

const renderToText = (node: ReactNode): string => {
  // Wrap in a marked div so we read only the rendered node's text, not the
  // Mantine theme <style> tags injected at the provider level.
  const { container, unmount } = render(
    <div data-testid="render-to-text-root">{node}</div>
  );
  const root = container.querySelector('[data-testid="render-to-text-root"]');
  const text = root?.textContent ?? '';
  unmount();
  return text;
};

describe('useRibbonStats', () => {
  beforeEach(() => {
    useAppStore.setState({ temperatureUnit: TemperatureUnit.Celsius });
  });

  it('returns five stats in the expected order', () => {
    const { result } = renderHook(() =>
      useRibbonStats({
        basePopulation: 1000,
        comparisonPopulation: null,
        baseLat: null,
        baseLong: null,
        comparisonLat: null,
        comparisonLong: null,
        displayWeatherData: null,
        comparisonWeatherData: null,
        displaySunshineData: null,
        comparisonSunshineData: null,
        weeklyWeatherData: null,
        comparisonWeeklyWeatherData: null,
      })
    );

    const labels = result.current.map((s) => s.label);
    expect(labels).toEqual([
      'Sun / yr',
      'Rain / yr',
      "Today's range",
      'From home',
      'Population',
    ]);
  });

  it('renders placeholders when there is no data', () => {
    const { result } = renderHook(() =>
      useRibbonStats({
        basePopulation: null,
        comparisonPopulation: null,
        baseLat: null,
        baseLong: null,
        comparisonLat: null,
        comparisonLong: null,
        displayWeatherData: null,
        comparisonWeatherData: null,
        displaySunshineData: null,
        comparisonSunshineData: null,
        weeklyWeatherData: null,
        comparisonWeeklyWeatherData: null,
      })
    );

    result.current.forEach((stat) => {
      // Sun / yr renders a JSX node; everything else is a plain string.
      const v1Text =
        typeof stat.v1 === 'string' ? stat.v1 : renderToText(stat.v1);
      const v2Text =
        typeof stat.v2 === 'string' ? stat.v2 : renderToText(stat.v2);
      expect(v1Text).toBe(placeholder);
      expect(v2Text).toBe(placeholder);
    });
  });

  it('formats annual sunshine as hours', () => {
    const { result } = renderHook(() =>
      useRibbonStats({
        basePopulation: null,
        comparisonPopulation: null,
        baseLat: null,
        baseLong: null,
        comparisonLat: null,
        comparisonLong: null,
        displayWeatherData: null,
        comparisonWeatherData: null,
        displaySunshineData: createMockSunshineData({
          jan: 100,
          feb: 110,
          mar: 120,
          apr: 130,
          may: 140,
          jun: 150,
          jul: 160,
          aug: 170,
          sep: 180,
          oct: 190,
          nov: 200,
          dec: 210,
        }),
        comparisonSunshineData: null,
        weeklyWeatherData: null,
        comparisonWeeklyWeatherData: null,
      })
    );

    const sun = result.current.find((s) => s.label === 'Sun / yr');
    // Sun / yr renders a JSX node — extract its text content. With no latitude
    // there is no percentage, only the hours line.
    const text = renderToText(sun?.v1);
    expect(text).toMatch(/^\d+h$/);
  });

  it('formats today range using the user’s temperature unit', () => {
    useAppStore.setState({ temperatureUnit: TemperatureUnit.Fahrenheit });

    const { result } = renderHook(() =>
      useRibbonStats({
        basePopulation: null,
        comparisonPopulation: null,
        baseLat: null,
        baseLong: null,
        comparisonLat: null,
        comparisonLong: null,
        displayWeatherData: createMockWeatherData({
          minTemperature: 0,
          maxTemperature: 10,
        }),
        comparisonWeatherData: null,
        displaySunshineData: null,
        comparisonSunshineData: null,
        weeklyWeatherData: null,
        comparisonWeeklyWeatherData: null,
      })
    );

    const range = result.current.find((s) => s.label === "Today's range");
    // 0°C → 32°F, 10°C → 50°F
    expect(range?.v1).toBe('32.0°F–50.0°F');
  });

  it('formats Population with locale separators', () => {
    const { result } = renderHook(() =>
      useRibbonStats({
        basePopulation: 1234567,
        comparisonPopulation: null,
        baseLat: null,
        baseLong: null,
        comparisonLat: null,
        comparisonLong: null,
        displayWeatherData: null,
        comparisonWeatherData: null,
        displaySunshineData: null,
        comparisonSunshineData: null,
        weeklyWeatherData: null,
        comparisonWeeklyWeatherData: null,
      })
    );

    const pop = result.current.find((s) => s.label === 'Population');
    expect(typeof pop?.v1).toBe('string');
    expect(pop?.v1).toMatch(/1[,.\s]234[,.\s]567/);
  });

  it('formats annual rainfall as mm', () => {
    const { result } = renderHook(() =>
      useRibbonStats({
        basePopulation: null,
        comparisonPopulation: null,
        baseLat: null,
        baseLong: null,
        comparisonLat: null,
        comparisonLong: null,
        displayWeatherData: null,
        comparisonWeatherData: null,
        displaySunshineData: null,
        comparisonSunshineData: null,
        weeklyWeatherData: createMockWeeklyWeather({
          weeklyData: Array.from({ length: 52 }, (_, i) =>
            createMockWeekDataPoint({
              week: i + 1,
              totalPrecip: 14,
              daysWithData: 7,
            })
          ),
        }),
        comparisonWeeklyWeatherData: null,
      })
    );

    const rain = result.current.find((s) => s.label === 'Rain / yr');
    expect(rain?.v1).toMatch(/^\d+mm$/);
  });
});
