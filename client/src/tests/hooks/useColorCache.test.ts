import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useTemperatureColorCache,
  useSunshineColorCache,
} from '@/hooks/useColorCache';
import { DataType } from '@/types/mapTypes';
import { createMockWeatherData, createMockSunshineData } from '@/test-utils';

// mock getColorForCity to return predictable colors
vi.mock('@/utils/map/getColorForCity', () => ({
  getColorForCity: vi.fn((city, dataType, month) => {
    // return different colors based on data type for testing
    if (dataType === DataType.Temperature) {
      return [255, 0, 0, 255]; // red for temperature
    }
    if (dataType === DataType.Sunshine) {
      return [0, 255, 0, 255]; // green for sunshine
    }
    return [0, 0, 255, 255]; // blue fallback
  }),
}));

describe('useTemperatureColorCache', () => {
  describe('when dataType is not Temperature', () => {
    it('returns null for Sunshine data type', () => {
      const cities = [createMockWeatherData()];
      const { result } = renderHook(() =>
        useTemperatureColorCache(cities, DataType.Sunshine, 300)
      );

      expect(result.current).toBeNull();
    });
  });

  describe('when dataType is Temperature', () => {
    it('returns cache and validCities for valid data', () => {
      const cities = [
        createMockWeatherData({
          city: 'City1',
          lat: 40.7128,
          long: -74.006,
          avgTemperature: 20,
        }),
        createMockWeatherData({
          city: 'City2',
          lat: 51.5074,
          long: -0.1278,
          avgTemperature: 15,
        }),
      ];

      const { result } = renderHook(() =>
        useTemperatureColorCache(cities, DataType.Temperature, 300)
      );

      expect(result.current).not.toBeNull();
      expect(result.current?.cache).toBeInstanceOf(Map);
      expect(result.current?.validCities).toHaveLength(2);
    });

    it('filters out cities with null coordinates', () => {
      const cities = [
        createMockWeatherData({
          city: 'ValidCity',
          lat: 40.7128,
          long: -74.006,
          avgTemperature: 20,
        }),
        createMockWeatherData({
          city: 'InvalidCity',
          lat: null,
          long: -74.006,
          avgTemperature: 20,
        }),
      ];

      const { result } = renderHook(() =>
        useTemperatureColorCache(cities, DataType.Temperature, 300)
      );

      expect(result.current?.validCities).toHaveLength(1);
      expect(result.current?.validCities[0].city).toBe('ValidCity');
    });

    it('filters out cities with null temperature', () => {
      const cities = [
        createMockWeatherData({
          city: 'ValidCity',
          lat: 40.7128,
          long: -74.006,
          avgTemperature: 20,
        }),
        createMockWeatherData({
          city: 'InvalidCity',
          lat: 40.7128,
          long: -74.006,
          avgTemperature: null,
        }),
      ];

      const { result } = renderHook(() =>
        useTemperatureColorCache(cities, DataType.Temperature, 300)
      );

      expect(result.current?.validCities).toHaveLength(1);
      expect(result.current?.validCities[0].city).toBe('ValidCity');
    });

    it('respects maxCitiesToShow limit', () => {
      const cities = Array.from({ length: 500 }, (_, i) =>
        createMockWeatherData({
          city: `City${i}`,
          lat: 40 + i * 0.01,
          long: -74 + i * 0.01,
          avgTemperature: 20,
        })
      );

      const { result } = renderHook(() =>
        useTemperatureColorCache(cities, DataType.Temperature, 300)
      );

      expect(result.current?.validCities).toHaveLength(300);
      expect(result.current?.cache.size).toBe(300);
    });

    it('creates cache entries with correct keys', () => {
      const city = createMockWeatherData({
        city: 'TestCity',
        lat: 40.7128,
        long: -74.006,
        avgTemperature: 20,
      });

      const { result } = renderHook(() =>
        useTemperatureColorCache([city], DataType.Temperature, 300)
      );

      const expectedKey = `${city.city}_${city.lat}_${city.long}`;
      expect(result.current?.cache.has(expectedKey)).toBe(true);
    });

    it('stores correct color values in cache', () => {
      const city = createMockWeatherData({
        city: 'TestCity',
        lat: 40.7128,
        long: -74.006,
        avgTemperature: 20,
      });

      const { result } = renderHook(() =>
        useTemperatureColorCache([city], DataType.Temperature, 300)
      );

      const key = `${city.city}_${city.lat}_${city.long}`;
      const color = result.current?.cache.get(key);

      // mocked getColorForCity returns [255, 0, 0, 255] for temperature
      expect(color).toEqual([255, 0, 0, 255]);
    });

    it('filters out sunshine data when mixed with weather data', () => {
      const cities = [
        createMockWeatherData({
          city: 'WeatherCity',
          lat: 40.7128,
          long: -74.006,
          avgTemperature: 20,
        }),
        createMockSunshineData({
          city: 'SunshineCity',
          lat: 51.5074,
          long: -0.1278,
        }),
      ];

      const { result } = renderHook(() =>
        useTemperatureColorCache(cities, DataType.Temperature, 300)
      );

      // should only include weather data
      expect(result.current?.validCities).toHaveLength(1);
      expect(result.current?.validCities[0].city).toBe('WeatherCity');
    });

    it('memoizes result when dependencies do not change', () => {
      const cities = [
        createMockWeatherData({
          city: 'City1',
          lat: 40.7128,
          long: -74.006,
          avgTemperature: 20,
        }),
      ];

      const { result, rerender } = renderHook(() =>
        useTemperatureColorCache(cities, DataType.Temperature, 300)
      );

      const firstResult = result.current;
      rerender();

      // should return same reference when dependencies haven't changed
      expect(result.current).toBe(firstResult);
    });

    it('recalculates when cities change', () => {
      const initialCities = [
        createMockWeatherData({
          city: 'City1',
          lat: 40.7128,
          long: -74.006,
          avgTemperature: 20,
        }),
      ];

      const { result, rerender } = renderHook(
        ({ cities }) => useTemperatureColorCache(cities, DataType.Temperature, 300),
        { initialProps: { cities: initialCities } }
      );

      const firstResult = result.current;

      const newCities = [
        createMockWeatherData({
          city: 'City2',
          lat: 51.5074,
          long: -0.1278,
          avgTemperature: 15,
        }),
      ];

      rerender({ cities: newCities });

      // should return new reference when cities change
      expect(result.current).not.toBe(firstResult);
      expect(result.current?.validCities[0].city).toBe('City2');
    });

    it('recalculates when maxCitiesToShow changes', () => {
      const cities = Array.from({ length: 500 }, (_, i) =>
        createMockWeatherData({
          city: `City${i}`,
          lat: 40 + i * 0.01,
          long: -74 + i * 0.01,
          avgTemperature: 20,
        })
      );

      const { result, rerender } = renderHook(
        ({ max }) => useTemperatureColorCache(cities, DataType.Temperature, max),
        { initialProps: { max: 300 } }
      );

      expect(result.current?.validCities).toHaveLength(300);

      rerender({ max: 100 });

      expect(result.current?.validCities).toHaveLength(100);
    });

    it('handles empty cities array', () => {
      const { result } = renderHook(() =>
        useTemperatureColorCache([], DataType.Temperature, 300)
      );

      expect(result.current?.validCities).toHaveLength(0);
      expect(result.current?.cache.size).toBe(0);
    });
  });
});

describe('useSunshineColorCache', () => {
  describe('when dataType is not Sunshine', () => {
    it('returns null for Temperature data type', () => {
      const cities = [createMockSunshineData()];
      const { result } = renderHook(() =>
        useSunshineColorCache(cities, DataType.Temperature, 1, 300)
      );

      expect(result.current).toBeNull();
    });
  });

  describe('when dataType is Sunshine', () => {
    it('returns cache and validCities for valid data', () => {
      const cities = [
        createMockSunshineData({
          city: 'City1',
          lat: 40.7128,
          long: -74.006,
          jan: 150,
        }),
        createMockSunshineData({
          city: 'City2',
          lat: 51.5074,
          long: -0.1278,
          jan: 140,
        }),
      ];

      const { result } = renderHook(() =>
        useSunshineColorCache(cities, DataType.Sunshine, 1, 300)
      );

      expect(result.current).not.toBeNull();
      expect(result.current?.cache).toBeInstanceOf(Map);
      expect(result.current?.validCities).toHaveLength(2);
    });

    it('filters out cities with null coordinates', () => {
      const cities = [
        createMockSunshineData({
          city: 'ValidCity',
          lat: 40.7128,
          long: -74.006,
          jan: 150,
        }),
        createMockSunshineData({
          city: 'InvalidCity',
          lat: null,
          long: -74.006,
          jan: 150,
        }),
      ];

      const { result } = renderHook(() =>
        useSunshineColorCache(cities, DataType.Sunshine, 1, 300)
      );

      expect(result.current?.validCities).toHaveLength(1);
      expect(result.current?.validCities[0].city).toBe('ValidCity');
    });

    it('filters out cities with null sunshine value for selected month', () => {
      const cities = [
        createMockSunshineData({
          city: 'ValidCity',
          lat: 40.7128,
          long: -74.006,
          jan: 150,
        }),
        createMockSunshineData({
          city: 'InvalidCity',
          lat: 40.7128,
          long: -74.006,
          jan: null,
        }),
      ];

      const { result } = renderHook(() =>
        useSunshineColorCache(cities, DataType.Sunshine, 1, 300)
      );

      expect(result.current?.validCities).toHaveLength(1);
      expect(result.current?.validCities[0].city).toBe('ValidCity');
    });

    it('respects maxCitiesToShow limit', () => {
      const cities = Array.from({ length: 500 }, (_, i) =>
        createMockSunshineData({
          city: `City${i}`,
          lat: 40 + i * 0.01,
          long: -74 + i * 0.01,
          jan: 150,
        })
      );

      const { result } = renderHook(() =>
        useSunshineColorCache(cities, DataType.Sunshine, 1, 300)
      );

      expect(result.current?.validCities).toHaveLength(300);
      expect(result.current?.cache.size).toBe(300);
    });

    it('creates cache entries with correct keys', () => {
      const city = createMockSunshineData({
        city: 'TestCity',
        lat: 40.7128,
        long: -74.006,
        jan: 150,
      });

      const { result } = renderHook(() =>
        useSunshineColorCache([city], DataType.Sunshine, 1, 300)
      );

      const expectedKey = `${city.city}_${city.lat}_${city.long}`;
      expect(result.current?.cache.has(expectedKey)).toBe(true);
    });

    it('stores correct color values in cache', () => {
      const city = createMockSunshineData({
        city: 'TestCity',
        lat: 40.7128,
        long: -74.006,
        jan: 150,
      });

      const { result } = renderHook(() =>
        useSunshineColorCache([city], DataType.Sunshine, 1, 300)
      );

      const key = `${city.city}_${city.lat}_${city.long}`;
      const color = result.current?.cache.get(key);

      // mocked getColorForCity returns [0, 255, 0, 255] for sunshine
      expect(color).toEqual([0, 255, 0, 255]);
    });

    it('uses correct month field for filtering', () => {
      const cities = [
        createMockSunshineData({
          city: 'City1',
          lat: 40.7128,
          long: -74.006,
          jan: 150,
          jul: null, // july is null
        }),
      ];

      // should include city when filtering by january
      const { result: janResult } = renderHook(() =>
        useSunshineColorCache(cities, DataType.Sunshine, 1, 300)
      );
      expect(janResult.current?.validCities).toHaveLength(1);

      // should exclude city when filtering by july
      const { result: julResult } = renderHook(() =>
        useSunshineColorCache(cities, DataType.Sunshine, 7, 300)
      );
      expect(julResult.current?.validCities).toHaveLength(0);
    });

    it('filters out weather data when mixed with sunshine data', () => {
      const cities = [
        createMockSunshineData({
          city: 'SunshineCity',
          lat: 40.7128,
          long: -74.006,
          jan: 150,
        }),
        createMockWeatherData({
          city: 'WeatherCity',
          lat: 51.5074,
          long: -0.1278,
          avgTemperature: 20,
        }),
      ];

      const { result } = renderHook(() =>
        useSunshineColorCache(cities, DataType.Sunshine, 1, 300)
      );

      // should only include sunshine data
      expect(result.current?.validCities).toHaveLength(1);
      expect(result.current?.validCities[0].city).toBe('SunshineCity');
    });

    it('memoizes result when dependencies do not change', () => {
      const cities = [
        createMockSunshineData({
          city: 'City1',
          lat: 40.7128,
          long: -74.006,
          jan: 150,
        }),
      ];

      const { result, rerender } = renderHook(() =>
        useSunshineColorCache(cities, DataType.Sunshine, 1, 300)
      );

      const firstResult = result.current;
      rerender();

      // should return same reference when dependencies haven't changed
      expect(result.current).toBe(firstResult);
    });

    it('recalculates when selectedMonth changes', () => {
      const cities = [
        createMockSunshineData({
          city: 'City1',
          lat: 40.7128,
          long: -74.006,
          jan: 150,
          jul: 250,
        }),
      ];

      const { result, rerender } = renderHook(
        ({ month }) => useSunshineColorCache(cities, DataType.Sunshine, month, 300),
        { initialProps: { month: 1 } }
      );

      const firstResult = result.current;

      rerender({ month: 7 });

      // should return new reference when month changes
      expect(result.current).not.toBe(firstResult);
    });

    it('recalculates when cities change', () => {
      const initialCities = [
        createMockSunshineData({
          city: 'City1',
          lat: 40.7128,
          long: -74.006,
          jan: 150,
        }),
      ];

      const { result, rerender } = renderHook(
        ({ cities }) => useSunshineColorCache(cities, DataType.Sunshine, 1, 300),
        { initialProps: { cities: initialCities } }
      );

      const firstResult = result.current;

      const newCities = [
        createMockSunshineData({
          city: 'City2',
          lat: 51.5074,
          long: -0.1278,
          jan: 140,
        }),
      ];

      rerender({ cities: newCities });

      // should return new reference when cities change
      expect(result.current).not.toBe(firstResult);
      expect(result.current?.validCities[0].city).toBe('City2');
    });

    it('recalculates when maxCitiesToShow changes', () => {
      const cities = Array.from({ length: 500 }, (_, i) =>
        createMockSunshineData({
          city: `City${i}`,
          lat: 40 + i * 0.01,
          long: -74 + i * 0.01,
          jan: 150,
        })
      );

      const { result, rerender } = renderHook(
        ({ max }) => useSunshineColorCache(cities, DataType.Sunshine, 1, max),
        { initialProps: { max: 300 } }
      );

      expect(result.current?.validCities).toHaveLength(300);

      rerender({ max: 100 });

      expect(result.current?.validCities).toHaveLength(100);
    });

    it('handles empty cities array', () => {
      const { result } = renderHook(() =>
        useSunshineColorCache([], DataType.Sunshine, 1, 300)
      );

      expect(result.current?.validCities).toHaveLength(0);
      expect(result.current?.cache.size).toBe(0);
    });

    it('handles all 12 months correctly', () => {
      const city = createMockSunshineData({
        city: 'TestCity',
        lat: 40.7128,
        long: -74.006,
        jan: 150,
        feb: 140,
        mar: 180,
        apr: 200,
        may: 220,
        jun: 240,
        jul: 260,
        aug: 250,
        sep: 210,
        oct: 180,
        nov: 150,
        dec: 140,
      });

      // test each month
      for (let month = 1; month <= 12; month++) {
        const { result } = renderHook(() =>
          useSunshineColorCache([city], DataType.Sunshine, month, 300)
        );

        expect(result.current?.validCities).toHaveLength(1);
        expect(result.current?.cache.size).toBe(1);
      }
    });
  });
});
