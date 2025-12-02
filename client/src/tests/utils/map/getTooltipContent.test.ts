import { describe, it, expect } from 'vitest';
import { getTooltipContent } from '@/utils/map/getTooltipContent';
import type { WeatherData } from '@/types/cityWeatherDataType';
import { DataType } from '@/types/mapTypes';
import { createMockSunshineData } from '@/test-utils';

describe('getTooltipContent', () => {
  const createMockCity = (overrides?: Partial<WeatherData>): WeatherData => ({
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
    ...overrides,
  });

  it('returns tooltip content for exact coordinate match', () => {
    const cities = [createMockCity()];
    const result = getTooltipContent(cities, 9.19, 45.4642);

    expect(result).toBe('Milan, Italy\n25.5°C');
  });

  it('returns tooltip content for coordinates within tolerance', () => {
    const cities = [createMockCity({ lat: 45.4642, long: 9.19 })];
    // within 0.5 degree tolerance
    const result = getTooltipContent(cities, 9.3, 45.6);

    expect(result).toBe('Milan, Italy\n25.5°C');
  });

  it('returns null for coordinates outside tolerance', () => {
    const cities = [createMockCity({ lat: 45.4642, long: 9.19 })];
    // outside 0.5 degree tolerance
    const result = getTooltipContent(cities, 10.0, 46.0);

    expect(result).toBeNull();
  });

  it('returns null when no cities match', () => {
    const cities = [createMockCity({ lat: 45.4642, long: 9.19 })];
    const result = getTooltipContent(cities, 0, 0);

    expect(result).toBeNull();
  });

  it('returns null for empty cities array', () => {
    const result = getTooltipContent([], 9.19, 45.4642);

    expect(result).toBeNull();
  });

  it('returns null when city has null latitude', () => {
    const cities = [createMockCity({ lat: null })];
    const result = getTooltipContent(cities, 9.19, 45.4642);

    expect(result).toBeNull();
  });

  it('returns null when city has null longitude', () => {
    const cities = [createMockCity({ long: null })];
    const result = getTooltipContent(cities, 9.19, 45.4642);

    expect(result).toBeNull();
  });

  it('returns null when city has null avgTemperature', () => {
    const cities = [createMockCity({ avgTemperature: null })];
    const result = getTooltipContent(cities, 9.19, 45.4642);

    expect(result).toBeNull();
  });

  it('finds first matching city when multiple cities are within tolerance', () => {
    const cities = [
      createMockCity({
        city: 'Milan',
        lat: 45.4642,
        long: 9.19,
        avgTemperature: 25.5,
      }),
      createMockCity({
        city: 'Nearby City',
        lat: 45.5,
        long: 9.2,
        avgTemperature: 26.0,
      }),
    ];
    const result = getTooltipContent(cities, 9.19, 45.4642);

    expect(result).toBe('Milan, Italy\n25.5°C');
  });

  it('handles city with null country', () => {
    const cities = [createMockCity({ country: null })];
    const result = getTooltipContent(cities, 9.19, 45.4642);

    expect(result).toBe('Milan, Unknown\n25.5°C');
  });

  it('handles negative temperatures', () => {
    const cities = [createMockCity({ avgTemperature: -10.5 })];
    const result = getTooltipContent(cities, 9.19, 45.4642);

    expect(result).toBe('Milan, Italy\n-10.5°C');
  });

  it('handles zero temperature', () => {
    const cities = [createMockCity({ avgTemperature: 0 })];
    const result = getTooltipContent(cities, 9.19, 45.4642);

    expect(result).toBe('Milan, Italy\n0.0°C');
  });

  it('handles negative coordinates', () => {
    const cities = [createMockCity({ lat: -33.8688, long: -151.2093 })];
    const result = getTooltipContent(cities, -151.2093, -33.8688);

    expect(result).toBe('Milan, Italy\n25.5°C');
  });

  it('checks latitude tolerance correctly', () => {
    const cities = [createMockCity({ lat: 45.4642, long: 9.19 })];

    // within tolerance (0.5 degrees)
    expect(getTooltipContent(cities, 9.19, 45.9)).toBe('Milan, Italy\n25.5°C');
    expect(getTooltipContent(cities, 9.19, 45.0)).toBe('Milan, Italy\n25.5°C');

    // outside tolerance
    expect(getTooltipContent(cities, 9.19, 46.0)).toBeNull();
    expect(getTooltipContent(cities, 9.19, 44.9)).toBeNull();
  });

  it('checks longitude tolerance correctly', () => {
    const cities = [createMockCity({ lat: 45.4642, long: 9.19 })];

    // within tolerance (0.5 degrees)
    expect(getTooltipContent(cities, 9.6, 45.4642)).toBe(
      'Milan, Italy\n25.5°C'
    );
    expect(getTooltipContent(cities, 8.7, 45.4642)).toBe(
      'Milan, Italy\n25.5°C'
    );

    // outside tolerance
    expect(getTooltipContent(cities, 9.7, 45.4642)).toBeNull();
    expect(getTooltipContent(cities, 8.6, 45.4642)).toBeNull();
  });

  it('formats temperature with decimal places', () => {
    const cities = [createMockCity({ avgTemperature: 25.567 })];
    const result = getTooltipContent(cities, 9.19, 45.4642);

    expect(result).toBe('Milan, Italy\n25.6°C');
  });

  it('skips cities with invalid coordinates when searching', () => {
    const cities = [
      createMockCity({ city: 'Invalid City', lat: null, long: null }),
      createMockCity({
        city: 'Milan',
        lat: 45.4642,
        long: 9.19,
        avgTemperature: 25.5,
      }),
    ];
    const result = getTooltipContent(cities, 9.19, 45.4642);

    expect(result).toBe('Milan, Italy\n25.5°C');
  });

  describe('Sunshine data', () => {
    it('returns sunshine tooltip for matching city with selected month', () => {
      const cities = [
        createMockSunshineData({
          city: 'Barcelona',
          country: 'Spain',
          lat: 41.3851,
          long: 2.1734,
          jul: 310,
        }),
      ];

      const result = getTooltipContent(
        cities,
        2.1734,
        41.3851,
        DataType.Sunshine,
        7
      );

      expect(result).toBe('Barcelona, Spain\n310.0 hours');
    });

    it('returns null when selectedMonth is not provided for sunshine data', () => {
      const cities = [
        createMockSunshineData({
          city: 'Barcelona',
          lat: 41.3851,
          long: 2.1734,
          jul: 310,
        }),
      ];

      const result = getTooltipContent(
        cities,
        2.1734,
        41.3851,
        DataType.Sunshine
      );

      expect(result).toBeNull();
    });

    it('returns null when sunshine hours is null for selected month', () => {
      const cities = [
        createMockSunshineData({
          city: 'Barcelona',
          lat: 41.3851,
          long: 2.1734,
          jul: null,
        }),
      ];

      const result = getTooltipContent(
        cities,
        2.1734,
        41.3851,
        DataType.Sunshine,
        7
      );

      expect(result).toBeNull();
    });

    it('handles different months correctly', () => {
      const cities = [
        createMockSunshineData({
          city: 'Barcelona',
          country: 'Spain',
          lat: 41.3851,
          long: 2.1734,
          jan: 149,
          jul: 310,
        }),
      ];

      // Test January
      let result = getTooltipContent(
        cities,
        2.1734,
        41.3851,
        DataType.Sunshine,
        1
      );
      expect(result).toBe('Barcelona, Spain\n149.0 hours');

      // Test July
      result = getTooltipContent(cities, 2.1734, 41.3851, DataType.Sunshine, 7);
      expect(result).toBe('Barcelona, Spain\n310.0 hours');
    });

    it('returns null when month is out of range', () => {
      const cities = [
        createMockSunshineData({
          city: 'Barcelona',
          lat: 41.3851,
          long: 2.1734,
        }),
      ];

      expect(
        getTooltipContent(cities, 2.1734, 41.3851, DataType.Sunshine, 0)
      ).toBeNull();
      expect(
        getTooltipContent(cities, 2.1734, 41.3851, DataType.Sunshine, 13)
      ).toBeNull();
    });

    it('formats sunshine hours with decimal places', () => {
      const cities = [
        createMockSunshineData({
          city: 'Barcelona',
          country: 'Spain',
          lat: 41.3851,
          long: 2.1734,
          jul: 310.567,
        }),
      ];

      const result = getTooltipContent(
        cities,
        2.1734,
        41.3851,
        DataType.Sunshine,
        7
      );

      expect(result).toBe('Barcelona, Spain\n310.6 hours');
    });

    it('finds sunshine city within tolerance', () => {
      const cities = [
        createMockSunshineData({
          city: 'Barcelona',
          country: 'Spain',
          lat: 41.3851,
          long: 2.1734,
          jul: 310,
        }),
      ];

      const result = getTooltipContent(cities, 2.2, 41.4, DataType.Sunshine, 7);

      expect(result).toBe('Barcelona, Spain\n310.0 hours');
    });
  });
});
