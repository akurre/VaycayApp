import { describe, it, expect } from 'vitest';
import {
  isWeatherData,
  isSunshineData,
  isValidWeatherMarkerData,
  isValidSunshineMarkerData,
} from '@/utils/typeGuards';
import type { WeatherDataUnion } from '@/types/mapTypes';

const weatherData: WeatherDataUnion = {
  cityId: 1,
  city: 'Berlin',
  country: 'Germany',
  state: null,
  suburb: null,
  date: '0615',
  lat: 52.52,
  long: 13.41,
  population: 3700000,
  avgTemperature: 20,
  minTemperature: 15,
  maxTemperature: 25,
  precipitation: 5,
  snowDepth: null,
  stationName: 'Berlin Station',
  submitterId: 'test-1',
};

const sunshineData: WeatherDataUnion = {
  cityId: 2,
  city: 'Barcelona',
  country: 'Spain',
  lat: 41.38,
  long: 2.17,
  population: 1620000,
  jan: 149,
  feb: 163,
  mar: 200,
  apr: 220,
  may: 258,
  jun: 285,
  jul: 310,
  aug: 282,
  sep: 219,
  oct: 180,
  nov: 146,
  dec: 138,
};

describe('isWeatherData', () => {
  it('should return true for WeatherData', () => {
    expect(isWeatherData(weatherData)).toBe(true);
  });

  it('should return false for SunshineData', () => {
    expect(isWeatherData(sunshineData)).toBe(false);
  });
});

describe('isSunshineData', () => {
  it('should return true for SunshineData', () => {
    expect(isSunshineData(sunshineData)).toBe(true);
  });

  it('should return false for WeatherData', () => {
    expect(isSunshineData(weatherData)).toBe(false);
  });
});

describe('isValidWeatherMarkerData', () => {
  it('should return true when lat, long, and avgTemperature are all non-null', () => {
    expect(isValidWeatherMarkerData(weatherData)).toBe(true);
  });

  it('should return false for sunshine data', () => {
    expect(isValidWeatherMarkerData(sunshineData)).toBe(false);
  });

  it('should return false when lat is null', () => {
    const city = { ...weatherData, lat: null } as unknown as WeatherDataUnion;
    expect(isValidWeatherMarkerData(city)).toBe(false);
  });

  it('should return false when long is null', () => {
    const city = { ...weatherData, long: null } as unknown as WeatherDataUnion;
    expect(isValidWeatherMarkerData(city)).toBe(false);
  });

  it('should return false when avgTemperature is null', () => {
    const city = {
      ...weatherData,
      avgTemperature: null,
    } as unknown as WeatherDataUnion;
    expect(isValidWeatherMarkerData(city)).toBe(false);
  });
});

describe('isValidSunshineMarkerData', () => {
  it('should return true when lat and long are non-null', () => {
    expect(isValidSunshineMarkerData(sunshineData)).toBe(true);
  });

  it('should return false for weather data', () => {
    expect(isValidSunshineMarkerData(weatherData)).toBe(false);
  });

  it('should return false when lat is null', () => {
    const city = { ...sunshineData, lat: null } as unknown as WeatherDataUnion;
    expect(isValidSunshineMarkerData(city)).toBe(false);
  });

  it('should return false when long is null', () => {
    const city = { ...sunshineData, long: null } as unknown as WeatherDataUnion;
    expect(isValidSunshineMarkerData(city)).toBe(false);
  });
});
