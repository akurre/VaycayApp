import { describe, it, expect } from 'vitest';
import { transformToHeatmapData } from '@/utils/map/transformToHeatmapData';
import type { WeatherData } from '@/types/cityWeatherDataType';

describe('transformToHeatmapData', () => {
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

  it('transforms valid city data correctly', () => {
    const cities = [createMockCity()];
    const result = transformToHeatmapData(cities);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      position: [9.19, 45.4642],
      weight: 25.5,
    });
  });

  it('transforms multiple cities correctly', () => {
    const cities = [
      createMockCity({
        city: 'Milan',
        lat: 45.4642,
        long: 9.19,
        avgTemperature: 25.5,
      }),
      createMockCity({
        city: 'Rome',
        lat: 41.9028,
        long: 12.4964,
        avgTemperature: 28.0,
      }),
      createMockCity({
        city: 'Venice',
        lat: 45.4408,
        long: 12.3155,
        avgTemperature: 24.0,
      }),
    ];
    const result = transformToHeatmapData(cities);

    expect(result).toHaveLength(3);
    expect(result[0].position).toEqual([9.19, 45.4642]);
    expect(result[0].weight).toBe(25.5);
    expect(result[1].position).toEqual([12.4964, 41.9028]);
    expect(result[1].weight).toBe(28.0);
    expect(result[2].position).toEqual([12.3155, 45.4408]);
    expect(result[2].weight).toBe(24.0);
  });

  it('filters out cities with null latitude', () => {
    const cities = [
      createMockCity({ lat: null }),
      createMockCity({ lat: 45.4642 }),
    ];
    const result = transformToHeatmapData(cities);

    expect(result).toHaveLength(1);
    expect(result[0].position[1]).toBe(45.4642);
  });

  it('filters out cities with null longitude', () => {
    const cities = [
      createMockCity({ long: null }),
      createMockCity({ long: 9.19 }),
    ];
    const result = transformToHeatmapData(cities);

    expect(result).toHaveLength(1);
    expect(result[0].position[0]).toBe(9.19);
  });

  it('filters out cities with null avgTemperature', () => {
    const cities = [
      createMockCity({ avgTemperature: null }),
      createMockCity({ avgTemperature: 25.5 }),
    ];
    const result = transformToHeatmapData(cities);

    expect(result).toHaveLength(1);
    expect(result[0].weight).toBe(25.5);
  });

  it('filters out cities with multiple null values', () => {
    const cities = [
      createMockCity({ lat: null, long: null }),
      createMockCity({ lat: null, avgTemperature: null }),
      createMockCity({ long: null, avgTemperature: null }),
      createMockCity({ lat: 45.4642, long: 9.19, avgTemperature: 25.5 }),
    ];
    const result = transformToHeatmapData(cities);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      position: [9.19, 45.4642],
      weight: 25.5,
    });
  });

  it('returns empty array when input is empty', () => {
    const result = transformToHeatmapData([]);

    expect(result).toEqual([]);
  });

  it('returns empty array when all cities have null coordinates', () => {
    const cities = [
      createMockCity({ lat: null }),
      createMockCity({ long: null }),
      createMockCity({ lat: null, long: null }),
    ];
    const result = transformToHeatmapData(cities);

    expect(result).toEqual([]);
  });

  it('returns empty array when all cities have null temperature', () => {
    const cities = [
      createMockCity({ avgTemperature: null }),
      createMockCity({ avgTemperature: null }),
    ];
    const result = transformToHeatmapData(cities);

    expect(result).toEqual([]);
  });

  it('handles negative temperatures correctly', () => {
    const cities = [createMockCity({ avgTemperature: -10.5 })];
    const result = transformToHeatmapData(cities);

    expect(result[0].weight).toBe(-10.5);
  });

  it('handles zero temperature correctly', () => {
    const cities = [createMockCity({ avgTemperature: 0 })];
    const result = transformToHeatmapData(cities);

    expect(result[0].weight).toBe(0);
  });

  it('handles negative coordinates correctly', () => {
    const cities = [createMockCity({ lat: -33.8688, long: -151.2093 })];
    const result = transformToHeatmapData(cities);

    expect(result[0].position).toEqual([-151.2093, -33.8688]);
  });

  it('preserves position format as tuple', () => {
    const cities = [createMockCity()];
    const result = transformToHeatmapData(cities);

    expect(Array.isArray(result[0].position)).toBe(true);
    expect(result[0].position).toHaveLength(2);
  });
});
