import { describe, it, expect } from 'vitest';
import { getColorForCity } from '@/utils/map/getColorForCity';
import { DataType } from '@/types/mapTypes';
import type { ValidMarkerData } from '@/types/cityWeatherDataType';
import type { ValidSunshineMarkerData } from '@/utils/typeGuards';

describe('getColorForCity', () => {
  const temperatureCity: ValidMarkerData = {
    cityId: 1,
    city: 'Paris',
    country: 'France',
    state: null,
    suburb: null,
    date: '0615',
    lat: 48.85,
    long: 2.35,
    population: 2000000,
    avgTemperature: 20,
    minTemperature: 15,
    maxTemperature: 25,
    precipitation: 5,
    snowDepth: null,
    stationName: 'Paris Station',
    submitterId: 'test-1',
  };

  const sunshineCity: ValidSunshineMarkerData = {
    cityId: 2,
    city: 'Lisbon',
    country: 'Portugal',
    lat: 38.71,
    long: -9.14,
    population: 500000,
    jan: 120, feb: 140, mar: 180, apr: 220,
    may: 270, jun: 310, jul: 340, aug: 320,
    sep: 260, oct: 200, nov: 140, dec: 110,
  };

  it('should return a 4-element RGBA array for temperature data', () => {
    const color = getColorForCity(temperatureCity, DataType.Temperature);

    expect(color).toHaveLength(4);
    expect(color[3]).toBe(255);
  });

  it('should return a 4-element RGBA array for sunshine data', () => {
    const color = getColorForCity(sunshineCity, DataType.Sunshine, 6);

    expect(color).toHaveLength(4);
    expect(color[3]).toBe(255);
  });

  it('should use month 1 as default when selectedMonth is not provided for sunshine', () => {
    const colorWithDefault = getColorForCity(sunshineCity, DataType.Sunshine);
    const colorWithMonth1 = getColorForCity(sunshineCity, DataType.Sunshine, 1);

    expect(colorWithDefault).toEqual(colorWithMonth1);
  });

  it('should return white RGBA for unknown data type (fallback)', () => {
    const color = getColorForCity(temperatureCity, 'unknown' as DataType);

    expect(color).toEqual([255, 255, 255, 255]);
  });
});
